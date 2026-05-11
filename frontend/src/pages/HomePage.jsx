import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createSnippet, setSnippetLinks } from "../api/snippets";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { addSnippetHistoryItem, formatRelativeTime, getSnippetHistory } from "../utils/snippetHistory";

const LANGUAGES = ["javascript", "python", "java", "sql", "bash", "plaintext"];
const EXPIRIES = [
  { label: "1 hour", value: 1 },
  { label: "24 hours", value: 24 },
  { label: "7 days", value: 168 },
  { label: "Custom", value: "custom" }
];

export default function HomePage() {
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [expiry, setExpiry] = useState("24");
  const [customExpiryHours, setCustomExpiryHours] = useState("");
  const [burnAfterRead, setBurnAfterRead] = useState(false);
  const [downloadEnabled, setDownloadEnabled] = useState(true);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [recentSnippets, setRecentSnippets] = useState(() => getSnippetHistory());

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!content.trim()) {
      setError("Please add some code.");
      return;
    }

    if (isPasswordProtected && !password.trim()) {
      setError("Please set a password.");
      return;
    }

    const expiryHours = expiry === "custom" ? Number(customExpiryHours) : Number(expiry);
    if (!Number.isFinite(expiryHours) || expiryHours <= 0) {
      setError("Please set a valid custom expiry in hours.");
      return;
    }

    try {
      setSubmitting(true);
      const expiryAt = Number.isFinite(expiryHours) && expiryHours > 0
        ? new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString()
        : null;

      const data = await createSnippet({
        content,
        language,
        expiry: expiryHours,
        password: isPasswordProtected ? password : undefined,
        burnAfterRead,
        downloadEnabled
      });
      if (data.url || data.rawUrl || data.manageUrl) {
        setSnippetLinks(data.shortId, {
          url: data.url,
          rawUrl: data.rawUrl,
          manageUrl: data.manageUrl
        });
      }
      addSnippetHistoryItem({
        shortId: data.shortId,
        url: data.url,
        created_at: new Date().toISOString()
      });
      setRecentSnippets(getSnippetHistory());
      navigate(`/${data.shortId}`, {
        state: {
          fromCreate: true,
          shortId: data.shortId,
          snippet: {
            content,
            language,
            created_at: new Date().toISOString(),
            expiry_at: expiryAt,
            download_enabled: downloadEnabled
          }
        }
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Header />
      <main className="mx-auto min-h-screen max-w-4xl px-4 py-8">
        <div className="mb-6 space-y-2">
          <h1 className="text-2xl font-semibold text-gray-100 sm:text-3xl">SnipShare</h1>
          <p className="text-sm text-gray-400">Share code instantly. No login. Self-destruct options.</p>
          <p className="text-sm text-gray-500">Create a private, expiring code snippet.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-lg">
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Paste your code here..."
          rows={18}
          className="w-full rounded-xl border border-gray-800 bg-black/40 p-4 font-mono text-sm leading-6 text-gray-100 outline-none transition placeholder:text-gray-600 hover:border-gray-700 focus:border-gray-600 focus:ring-2 focus:ring-gray-800"
        />

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            className="w-full rounded-lg border border-gray-800 bg-gray-800 px-4 py-2 text-sm text-gray-100 outline-none transition hover:bg-gray-700 focus:ring-2 focus:ring-gray-700 lg:w-auto"
          >
            {LANGUAGES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={expiry}
            onChange={(event) => setExpiry(event.target.value)}
            className="w-full rounded-lg border border-gray-800 bg-gray-800 px-4 py-2 text-sm text-gray-100 outline-none transition hover:bg-gray-700 focus:ring-2 focus:ring-gray-700 lg:w-auto"
          >
            {EXPIRIES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.value === "custom" ? "Custom expiry" : `Expires in ${item.label}`}
              </option>
            ))}
          </select>

          {expiry === "custom" ? (
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={customExpiryHours}
              onChange={(event) => setCustomExpiryHours(event.target.value)}
              placeholder="Custom hours"
              className="w-full rounded-lg border border-gray-800 bg-gray-800 px-4 py-2 text-sm text-gray-100 outline-none transition placeholder:text-gray-500 hover:bg-gray-700 focus:ring-2 focus:ring-gray-700 lg:w-40"
            />
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70 lg:ml-auto lg:w-auto"
          >
            {submitting ? "Creating..." : "Create Snippet"}
          </button>
        </div>

        <div className="grid gap-4 border-t border-gray-800 pt-6 sm:grid-cols-3">
          <label className="flex items-center gap-3 text-sm text-gray-200">
            <input
              type="checkbox"
              checked={burnAfterRead}
              onChange={(event) => {
                const isEnabled = event.target.checked;
                setBurnAfterRead(isEnabled);
                if (isEnabled) {
                  setDownloadEnabled(false);
                }
              }}
              className="h-4 w-4 rounded border-gray-700 bg-gray-800"
            />
            <span>Burn after read</span>
          </label>

          <label className="flex items-center gap-3 text-sm text-gray-200">
            <input
              type="checkbox"
              checked={downloadEnabled}
              disabled={burnAfterRead}
              onChange={(event) => setDownloadEnabled(event.target.checked)}
              className="h-4 w-4 rounded border-gray-700 bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <span>Allow download {burnAfterRead ? "(disabled)" : ""}</span>
          </label>

          <label className="flex items-center gap-3 text-sm text-gray-200">
            <input
              type="checkbox"
              checked={isPasswordProtected}
              onChange={(event) => {
                setIsPasswordProtected(event.target.checked);
                if (!event.target.checked) {
                  setPassword("");
                }
              }}
              className="h-4 w-4 rounded border-gray-700 bg-gray-800"
            />
            <span>Password protect</span>
          </label>

          {isPasswordProtected ? (
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Set password"
              className="w-full rounded-lg border border-gray-800 bg-gray-800 px-4 py-2 text-sm text-gray-100 outline-none transition placeholder:text-gray-500 hover:bg-gray-700 focus:ring-2 focus:ring-gray-700 sm:col-span-3"
            />
          ) : null}
        </div>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        </form>

        {recentSnippets.length > 0 ? (
          <section className="mt-6 rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-lg">
            <div className="mb-4">
              <h2 className="text-sm font-medium text-gray-100">Recent Snippets</h2>
              <p className="mt-1 text-sm text-gray-500">Saved in this browser only.</p>
            </div>
            <div className="space-y-3">
              {recentSnippets.slice(0, 10).map((snippet) => (
                <Link
                  key={snippet.shortId}
                  to={`/${snippet.shortId}`}
                  className="flex flex-col gap-2 rounded-lg border border-gray-800 bg-black/30 px-4 py-3 transition hover:border-gray-700 hover:bg-gray-800 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-100">{snippet.shortId}</p>
                    <p className="text-sm text-gray-500">{formatRelativeTime(snippet.created_at)}</p>
                  </div>
                  {snippet.status === "expired" ? (
                    <span className="text-sm text-red-400">Expired</span>
                  ) : (
                    <span className="text-sm text-gray-500">Open</span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <Footer />
    </>
  );
}
