const {
  createSnippet,
  getSnippetByShortId,
  incrementViewCountByShortId,
  getSnippetByManageToken,
  deleteSnippetByManageToken,
  isExpired,
  verifySnippetPassword,
  ensureDestroyedSnippetsTable,
  destroySnippetByShortId,
  isSnippetDestroyed
} = require("../services/snippetService");

function getCookie(req, name) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map(c => c.trim().split("="));
  const match = cookies.find(([k]) => k === name);
  return match ? decodeURIComponent(match[1]) : null;
}

function normalizeBaseUrl(url) {
  return url ? url.replace(/\/+$/, "") : "";
}

function getViewerIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const forwardedIp = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const rawIp = (forwardedIp || req.socket.remoteAddress || "").toString().split(",")[0].trim();
  return rawIp;
}

function maskViewerIp(ip) {
  if (!ip || ip === "::1" || ip === "127.0.0.1" || ip.includes(":")) {
    return "Unknown";
  }

  const parts = ip.split(".");
  if (parts.length !== 4) {
    return "Unknown";
  }

  return `${parts[0]}.${parts[1]}.x.x`;
}

function formatWatermarkTimestamp(now = new Date()) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = String(now.getDate()).padStart(2, "0");
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  const hours24 = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const suffix = hours24 >= 12 ? "PM" : "AM";
  const hours12 = String(hours24 % 12 || 12).padStart(2, "0");

  return `${day} ${month} ${year}, ${hours12}:${minutes}:${seconds} ${suffix}`;
}

async function createSnippetHandler(req, res, next) {
  try {
    const { content, language, title, note, expiry, password, burnAfterRead, downloadEnabled } = req.body;
    const frontendBaseUrl = normalizeBaseUrl(process.env.FRONTEND_BASE_URL || req.headers.origin || "");
    const backendBaseUrl = normalizeBaseUrl(
      process.env.BACKEND_BASE_URL || `${req.protocol}://${req.get("host")}`
    );
    const viewerBaseUrl = frontendBaseUrl || backendBaseUrl;
    const expiryHours = expiry === "never" || expiry === null || expiry === undefined ? "never" : Number(expiry);

    if (!content || !language) {
      return res.status(400).json({ message: "content and language are required" });
    }

    if (expiryHours !== "never" && (!Number.isFinite(expiryHours) || expiryHours <= 0)) {
      return res.status(400).json({ message: "expiry must be a positive number (hours) or 'never'" });
    }

    if (burnAfterRead !== undefined && typeof burnAfterRead !== "boolean") {
      return res.status(400).json({ message: "burnAfterRead must be a boolean" });
    }

    if (downloadEnabled !== undefined && typeof downloadEnabled !== "boolean") {
      return res.status(400).json({ message: "downloadEnabled must be a boolean" });
    }

    const { shortId, manageToken } = await createSnippet({
      content,
      language,
      title,
      note,
      expiryHours: expiryHours === "never" ? null : expiryHours,
      password,
      burnAfterRead,
      downloadEnabled
    });
    return res.status(201).json({
      shortId,
      viewerUrl: `${viewerBaseUrl}/${shortId}`,
      rawUrl: `${backendBaseUrl}/api/snippets/${shortId}/raw`,
      manageUrl: `${viewerBaseUrl}/manage/${manageToken}`
    });
  } catch (err) {
    return next(err);
  }
}

async function getSnippetHandler(req, res, next) {
  try {
    await ensureDestroyedSnippetsTable();
    const snippet = await getSnippetByShortId(req.params.shortId);

    if (!snippet) {
      if (await isSnippetDestroyed(req.params.shortId)) {
        return res.status(410).json({ message: "This snippet has been destroyed" });
      }
      return res.status(404).json({ message: "Snippet not found" });
    }

    if (isExpired(snippet)) {
      return res.status(410).json({ message: "Snippet expired" });
    }

    if (snippet.password_hash) {
      const isCookieVerified = getCookie(req, `verified_${req.params.shortId}`) === "true";
      if (!isCookieVerified) {
        return res.json({ protected: true });
      }
    }

    const responseBody = {
      content: snippet.content,
      language: snippet.language,
      created_at: snippet.created_at,
      expiry_at: snippet.expiry_at,
      download_enabled: snippet.download_enabled
    };

    if (snippet.burn_after_read) {
      responseBody.watermark_ip = maskViewerIp(getViewerIp(req));
      responseBody.watermark_time = formatWatermarkTimestamp();
    }

    await incrementViewCountByShortId(req.params.shortId);

    if (snippet.burn_after_read) {
      await destroySnippetByShortId(req.params.shortId);
    }

    return res.json(responseBody);
  } catch (err) {
    return next(err);
  }
}

async function getRawSnippetHandler(req, res, next) {
  try {
    res.type("text/plain");
    const snippet = await getSnippetByShortId(req.params.shortId);

    if (!snippet) {
      if (await isSnippetDestroyed(req.params.shortId)) {
        return res.status(410).send("This snippet has been destroyed");
      }
      return res.status(404).send("Snippet not found");
    }

    if (isExpired(snippet)) {
      return res.status(410).send("Snippet expired");
    }

    if (snippet.password_hash) {
      const isCookieVerified = getCookie(req, `verified_${req.params.shortId}`) === "true";
      const passwordInput = req.query.password || req.headers["x-snippet-password"];
      
      let isPasswordValid = false;
      if (passwordInput) {
        isPasswordValid = await verifySnippetPassword(passwordInput, snippet.password_hash);
      }
      
      if (!isCookieVerified && !isPasswordValid) {
        return res.status(401).send("Password required");
      }
    }

    await incrementViewCountByShortId(req.params.shortId);

    if (snippet.burn_after_read) {
      await destroySnippetByShortId(req.params.shortId);
    }

    return res.send(snippet.content);
  } catch (err) {
    return next(err);
  }
}

async function verifySnippetHandler(req, res, next) {
  try {
    await ensureDestroyedSnippetsTable();
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "password is required" });
    }

    const snippet = await getSnippetByShortId(req.params.shortId);

    if (!snippet) {
      if (await isSnippetDestroyed(req.params.shortId)) {
        return res.status(410).json({ message: "This snippet has been destroyed" });
      }
      return res.status(404).json({ message: "Snippet not found" });
    }

    if (isExpired(snippet)) {
      return res.status(410).json({ message: "Snippet expired" });
    }

    const isValidPassword = await verifySnippetPassword(password, snippet.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid password" });
    }

    res.setHeader(
      "Set-Cookie",
      `verified_${req.params.shortId}=true; Path=/; Max-Age=3600; HttpOnly; SameSite=Lax`
    );

    const responseBody = {
      content: snippet.content,
      language: snippet.language,
      created_at: snippet.created_at,
      expiry_at: snippet.expiry_at,
      download_enabled: snippet.download_enabled
    };

    await incrementViewCountByShortId(req.params.shortId);

    if (snippet.burn_after_read) {
      await destroySnippetByShortId(req.params.shortId);
    }

    return res.json(responseBody);
  } catch (err) {
    return next(err);
  }
}

async function getManageSnippetHandler(req, res, next) {
  try {
    const snippet = await getSnippetByManageToken(req.params.token);

    if (!snippet) {
      return res.status(404).json({ message: "Snippet not found" });
    }

    return res.json({
      shortId: snippet.short_id,
      content: snippet.content,
      created_at: snippet.created_at,
      expiry_at: snippet.expiry_at,
      view_count: snippet.view_count
    });
  } catch (err) {
    return next(err);
  }
}

async function deleteManageSnippetHandler(req, res, next) {
  try {
    const deletedSnippet = await deleteSnippetByManageToken(req.params.token);

    if (!deletedSnippet) {
      return res.status(404).json({ message: "Snippet not found" });
    }

    return res.json({ message: "Snippet deleted" });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createSnippetHandler,
  getSnippetHandler,
  getRawSnippetHandler,
  verifySnippetHandler,
  getManageSnippetHandler,
  deleteManageSnippetHandler
};
