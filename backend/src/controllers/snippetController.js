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

function normalizeBaseUrl(url) {
  return url ? url.replace(/\/+$/, "") : "";
}

async function createSnippetHandler(req, res, next) {
  try {
    const { content, language, expiry, password, burnAfterRead, downloadEnabled } = req.body;
    const frontendBaseUrl = normalizeBaseUrl(process.env.FRONTEND_BASE_URL);
    const backendBaseUrl = normalizeBaseUrl(process.env.BACKEND_BASE_URL);
    const expiryHours = Number(expiry);

    if (!content || !language) {
      return res.status(400).json({ message: "content and language are required" });
    }

    if (!Number.isFinite(expiryHours) || expiryHours <= 0) {
      return res.status(400).json({ message: "expiry must be a positive number (hours)" });
    }

    if (burnAfterRead !== undefined && typeof burnAfterRead !== "boolean") {
      return res.status(400).json({ message: "burnAfterRead must be a boolean" });
    }

    if (downloadEnabled !== undefined && typeof downloadEnabled !== "boolean") {
      return res.status(400).json({ message: "downloadEnabled must be a boolean" });
    }

    if (!frontendBaseUrl || !backendBaseUrl) {
      return res.status(500).json({
        message: "FRONTEND_BASE_URL and BACKEND_BASE_URL must be set"
      });
    }

    const { shortId, manageToken } = await createSnippet({
      content,
      language,
      expiryHours,
      password,
      burnAfterRead,
      downloadEnabled
    });
    return res.status(201).json({
      shortId,
      viewerUrl: `${frontendBaseUrl}/${shortId}`,
      rawUrl: `${backendBaseUrl}/api/snippets/${shortId}/raw`,
      manageUrl: `${frontendBaseUrl}/manage/${manageToken}`
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
      return res.json({ protected: true });
    }

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

async function getRawSnippetHandler(req, res, next) {
  try {
    res.type("text/plain");
    const snippet = await getSnippetByShortId(req.params.shortId);

    if (!snippet) {
      return res.status(404).send("Snippet not found");
    }

    if (isExpired(snippet)) {
      return res.status(410).send("Snippet expired");
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
