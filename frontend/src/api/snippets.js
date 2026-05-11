const API_BASE = "/api/snippets";

export async function createSnippet(payload) {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to create snippet");
  }

  const data = await response.json();

  return {
    shortId: data.shortId,
    url: data.url || data.viewerUrl,
    rawUrl: data.rawUrl,
    manageUrl: data.manageUrl
  };
}

export async function getSnippet(shortId) {
  const response = await fetch(`${API_BASE}/${shortId}`);

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));

    if (response.status === 404) {
      throw new Error(data.message || "Snippet not found");
    }

    if (response.status === 410) {
      throw new Error(data.message || "Snippet expired");
    }

    throw new Error(data.message || "Failed to fetch snippet");
  }

  return response.json();
}

export async function verifySnippet(shortId, password) {
  const response = await fetch(`${API_BASE}/${shortId}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password })
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
      throw new Error("Invalid password");
    }

    if (response.status === 404) {
      throw new Error(data.message || "Snippet not found");
    }

    if (response.status === 410) {
      throw new Error(data.message || "Snippet expired");
    }

    throw new Error(data.message || "Failed to verify password");
  }

  return response.json();
}

export async function getManagedSnippet(token) {
  const response = await fetch(`${API_BASE}/manage/${token}`);

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to fetch snippet");
  }

  return response.json();
}

export async function deleteManagedSnippet(token) {
  const response = await fetch(`${API_BASE}/manage/${token}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to delete snippet");
  }

  return response.json();
}

export function setSnippetLinks(shortId, links) {
  sessionStorage.setItem(`snippet-links:${shortId}`, JSON.stringify(links));
}

export function getSnippetLinks(shortId) {
  const raw = sessionStorage.getItem(`snippet-links:${shortId}`);
  return raw ? JSON.parse(raw) : null;
}
