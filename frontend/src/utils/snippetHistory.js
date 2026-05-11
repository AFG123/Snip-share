const HISTORY_KEY = "snipshare:recent-snippets";
const MAX_HISTORY_ITEMS = 10;

function readHistory() {
  try {
    const value = localStorage.getItem(HISTORY_KEY);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeHistory(items) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, MAX_HISTORY_ITEMS)));
}

export function getSnippetHistory() {
  return readHistory();
}

export function addSnippetHistoryItem(item) {
  const history = readHistory().filter((entry) => entry.shortId !== item.shortId);
  writeHistory([{ status: "active", ...item }, ...history]);
}

export function markSnippetHistoryExpired(shortId) {
  const history = readHistory();
  const nextHistory = history.map((entry) =>
    entry.shortId === shortId ? { ...entry, status: "expired" } : entry
  );
  writeHistory(nextHistory);
}

export function formatRelativeTime(value) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) {
    return "recently";
  }

  const seconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
  const units = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 }
  ];

  for (const unit of units) {
    const count = Math.floor(seconds / unit.seconds);
    if (count >= 1) {
      return `${count} ${unit.label}${count === 1 ? "" : "s"} ago`;
    }
  }

  return "just now";
}
