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
  { label: "Never", value: "never" },
  { label: "Custom", value: "custom" }
];

export default function HomePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
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

    if (title.length > 60) {
      setError("Title must be 60 characters or less.");
      return;
    }

    if (note.length > 140) {
      setError("Note must be 140 characters or less.");
      return;
    }

    if (isPasswordProtected && !password.trim()) {
      setError("Please set a password.");
      return;
    }

    let expiryHours;
    if (expiry === "never") {
      expiryHours = "never";
    } else if (expiry === "custom") {
      expiryHours = Number(customExpiryHours);
      if (!Number.isFinite(expiryHours) || expiryHours <= 0) {
        setError("Please set a valid custom expiry in hours.");
        return;
      }
    } else {
      expiryHours = Number(expiry);
    }

    try {
      setSubmitting(true);
      const expiryAt = Number.isFinite(expiryHours) && expiryHours > 0
        ? new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString()
        : null;

      const data = await createSnippet({
        content,
        language,
        title: title.trim() || undefined,
        note: note.trim() || undefined,
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
            title: title.trim() || null,
            note: note.trim() || null,
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
      <main className="mx-auto min-h-screen max-w-7xl px-6 py-10 lg:py-16">
        <div className="mb-10 space-y-3">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-100 via-indigo-200 to-indigo-400 bg-clip-text text-transparent sm:text-4xl">
            SnipShare Workspace
          </h1>
          <p className="text-sm text-gray-400 sm:text-base">
            Create private, secure, and expiring code snippets in seconds. No account required.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-12 items-start bg-transparent border-0 p-0 shadow-none">
          {/* LEFT COLUMN: Workspace Editor */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6 rounded-2xl border border-gray-800/80 bg-gray-900/30 backdrop-blur-md p-6 shadow-xl">
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={60}
                placeholder="Snippet Title (optional)"
                className="w-full rounded-xl border border-gray-800 bg-black/45 p-3 text-sm text-gray-100 outline-none transition placeholder:text-gray-600 hover:border-gray-700/80 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30"
              />
              <input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={140}
                placeholder="Description / Short Note (optional)"
                className="w-full rounded-xl border border-gray-800 bg-black/45 p-3 text-sm text-gray-100 outline-none transition placeholder:text-gray-600 hover:border-gray-700/80 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30"
              />
            </div>

            <div className="relative">
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Paste or write your code here..."
                rows={20}
                className="w-full rounded-xl border border-gray-800 bg-black/40 p-4 font-mono text-sm leading-6 text-gray-100 outline-none transition placeholder:text-gray-600 hover:border-gray-700/80 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 scrollbar-thin scrollbar-thumb-gray-800"
              />
            </div>
          </div>

          {/* RIGHT COLUMN: Settings Sidebar */}
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6 rounded-2xl border border-gray-800/80 bg-gray-900/40 backdrop-blur-md p-6 shadow-xl h-fit">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Language
              </label>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className="w-full rounded-xl border border-gray-800 bg-black/40 px-4 py-3 text-sm text-gray-100 outline-none transition hover:bg-gray-800 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 cursor-pointer capitalize"
              >
                {LANGUAGES.map((item) => (
                  <option key={item} value={item} className="bg-gray-900 capitalize text-gray-100">
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Expiration
              </label>
              <select
                value={expiry}
                onChange={(event) => setExpiry(event.target.value)}
                className="w-full rounded-xl border border-gray-800 bg-black/40 px-4 py-3 text-sm text-gray-100 outline-none transition hover:bg-gray-800 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 cursor-pointer"
              >
                {EXPIRIES.map((item) => (
                  <option key={item.value} value={item.value} className="bg-gray-900 text-gray-100">
                    {item.value === "custom" ? "Custom expiry..." : `Expires in ${item.label}`}
                  </option>
                ))}
              </select>

              {expiry === "custom" ? (
                <div className="mt-3">
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={customExpiryHours}
                    onChange={(event) => setCustomExpiryHours(event.target.value)}
                    placeholder="Duration in hours"
                    className="w-full rounded-xl border border-gray-800 bg-black/40 px-4 py-3 text-sm text-gray-100 outline-none transition placeholder:text-gray-600 hover:border-gray-700/80 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30"
                  />
                </div>
              ) : null}
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-800/80">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Security & Behavior
              </label>
              
              <label className="flex items-center gap-3 text-sm text-gray-200 cursor-pointer select-none group">
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
                  className="h-4 w-4 rounded border-gray-800 bg-black/40 text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <span className="group-hover:text-gray-100 transition">Burn after read</span>
              </label>

              <label className={`flex items-center gap-3 text-sm text-gray-200 cursor-pointer select-none group ${burnAfterRead ? "opacity-40 cursor-not-allowed" : ""}`}>
                <input
                  type="checkbox"
                  checked={downloadEnabled}
                  disabled={burnAfterRead}
                  onChange={(event) => setDownloadEnabled(event.target.checked)}
                  className="h-4 w-4 rounded border-gray-800 bg-black/40 text-indigo-600 focus:ring-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <span className="group-hover:text-gray-100 transition">
                  Allow downloading
                </span>
              </label>

              <label className="flex items-center gap-3 text-sm text-gray-200 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={isPasswordProtected}
                  onChange={(event) => {
                    setIsPasswordProtected(event.target.checked);
                    if (!event.target.checked) {
                      setPassword("");
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-800 bg-black/40 text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <span className="group-hover:text-gray-100 transition">Password protection</span>
              </label>

              {isPasswordProtected ? (
                <div className="mt-3">
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Set password"
                    className="w-full rounded-xl border border-gray-800 bg-black/40 px-4 py-3 text-sm text-gray-100 outline-none transition placeholder:text-gray-600 hover:border-gray-700/80 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30"
                  />
                </div>
              ) : null}
            </div>

            <div className="pt-4 border-t border-gray-800/80 space-y-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-sm py-3 px-4 shadow-lg shadow-indigo-900/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {submitting ? "Creating Snippet..." : "Create Snippet"}
              </button>
              
              {error ? <p className="text-xs text-red-400 text-center font-medium leading-relaxed">{error}</p> : null}
            </div>
          </div>
        </form>

        {/* BOTTOM: Recent Snippets Card Grid */}
        {recentSnippets.length > 0 ? (
          <section className="mt-12 pt-8 border-t border-gray-800/80">
            <div className="mb-6">
              <h2 className="text-lg font-semibold tracking-tight text-gray-100">Recent Snippets</h2>
              <p className="mt-1 text-sm text-gray-500">Stored locally in your active browser session.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {recentSnippets.slice(0, 8).map((snippet) => (
                <Link
                  key={snippet.shortId}
                  to={`/${snippet.shortId}`}
                  className="group relative flex flex-col justify-between min-h-[100px] rounded-2xl border border-gray-800 bg-gray-900/20 p-4 transition-all duration-200 hover:border-indigo-500/40 hover:bg-gray-900/45 shadow-md"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold tracking-wide text-gray-200 group-hover:text-indigo-400 transition">
                      /{snippet.shortId}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">{formatRelativeTime(snippet.created_at)}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    {snippet.status === "expired" ? (
                      <span className="text-xs font-semibold text-red-500/80 bg-red-950/20 px-2.5 py-0.5 rounded-full border border-red-900/30">Expired</span>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-500/80 bg-emerald-950/20 px-2.5 py-0.5 rounded-full border border-emerald-900/30">Active</span>
                    )}
                    <span className="text-xs text-gray-600 group-hover:text-indigo-500/80 transition-all font-semibold inline-flex items-center gap-1">
                      Open →
                    </span>
                  </div>
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
