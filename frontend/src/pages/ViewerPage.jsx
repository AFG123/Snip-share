import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import python from "highlight.js/lib/languages/python";
import java from "highlight.js/lib/languages/java";
import sql from "highlight.js/lib/languages/sql";
import bash from "highlight.js/lib/languages/bash";
import "highlight.js/styles/github-dark.css";
import { getSnippet, getSnippetLinks, verifySnippet } from "../api/snippets";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { markSnippetHistoryExpired } from "../utils/snippetHistory";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("java", java);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("plaintext", () => ({}));

const BACKEND_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_BASE_URL ||
  "http://localhost:3000"
).replace(/\/+$/, "");

function getExpiryLabel(expiryAt) {
  if (!expiryAt) {
    return "Never expires";
  }

  const expiresAtMs = new Date(expiryAt).getTime();
  const remainingMs = expiresAtMs - Date.now();
  if (remainingMs <= 0) {
    return "Expired";
  }

  const remainingMinutes = Math.ceil(remainingMs / (1000 * 60));
  const hours = Math.floor(remainingMinutes / 60);
  const minutes = remainingMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours} hr ${minutes} min left`;
  }

  if (hours > 0) {
    return `${hours} hr left`;
  }

  return `${minutes} min left`;
}

function getFileExtension(language) {
  const map = {
    javascript: "js",
    python: "py",
    java: "java",
    sql: "sql",
    bash: "sh",
    plaintext: "txt"
  };

  return map[language] || "txt";
}

export default function ViewerPage() {
  const { shortId } = useParams();
  const location = useLocation();
  const creatorSnippet =
    location.state?.fromCreate && location.state?.shortId === shortId ? location.state.snippet : null;
  const [snippet, setSnippet] = useState(creatorSnippet || null);
  const [isProtected, setIsProtected] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const codeRef = useRef(null);
  const [links, setLinks] = useState(() => getSnippetLinks(shortId));

  useEffect(() => {
    let mounted = true;

    async function loadSnippet() {
      if (creatorSnippet) {
        if (mounted) {
          setSnippet(creatorSnippet);
          setIsProtected(false);
          setError("");
          setPasswordError("");
        }
        return;
      }

      try {
        const data = await getSnippet(shortId);
        if (mounted) {
          if (data.protected) {
            setIsProtected(true);
            setSnippet(null);
          } else {
            setIsProtected(false);
            setSnippet(data);
          }
          setError("");
          setPasswordError("");
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
          markSnippetHistoryExpired(shortId);
        }
      }
    }

    loadSnippet();
    return () => {
      mounted = false;
    };
  }, [shortId, creatorSnippet]);

  useEffect(() => {
    if (snippet && codeRef.current) {
      hljs.highlightElement(codeRef.current);
    }
  }, [snippet]);

  useEffect(() => {
    setLinks(getSnippetLinks(shortId));
    setSnippet(creatorSnippet || null);
    setPassword("");
    setPasswordError("");
    setIsProtected(false);
  }, [shortId, creatorSnippet]);

  const fullUrl = links?.url || `${window.location.origin}/${shortId}`;
  const rawUrl = links?.rawUrl || `${BACKEND_BASE_URL}/api/snippets/${shortId}/raw`;
  const manageUrl = links?.manageUrl;
  const expiryLabel = getExpiryLabel(snippet?.expiry_at);
  const isCreatorSession = Boolean(creatorSnippet);

  async function copyCode() {
    if (!snippet) return;
    await navigator.clipboard.writeText(snippet.content);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1200);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1200);
  }

  function downloadSnippet() {
    if (!snippet) return;
    const extension = getFileExtension(snippet.language);
    const fileName = `snippet-${shortId}.${extension}`;
    const blob = new Blob([snippet.content], { type: "text/plain;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(objectUrl);
  }

  async function submitPassword(event) {
    event.preventDefault();
    setPasswordError("");

    if (!password.trim()) {
      setPasswordError("Password is required");
      return;
    }

    try {
      setVerifying(true);
      const data = await verifySnippet(shortId, password);
      setSnippet(data);
      setIsProtected(false);
      setPassword("");
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setVerifying(false);
    }
  }

  if (error) {
    return (
      <>
        <Header />
        <main className="mx-auto min-h-screen max-w-7xl px-6 py-10 lg:py-16">
          <div className="rounded-2xl border border-gray-800 bg-gray-900/40 backdrop-blur-md p-8 shadow-xl text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-950/40 border border-red-900/50 flex items-center justify-center text-red-400 text-xl font-bold">!</div>
            <p className="text-sm font-medium text-red-400">{error}</p>
            <Link to="/" className="mt-4 inline-block rounded-xl bg-gray-800 hover:bg-gray-700 px-5 py-2.5 text-sm font-semibold text-gray-100 transition duration-200">
              Back to Workspace
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (isProtected) {
    return (
      <>
        <Header />
        <main className="flex min-h-screen items-center justify-center px-6 py-10 lg:py-16">
          <div className="w-full max-w-md rounded-2xl border border-gray-800/80 bg-gray-900/40 backdrop-blur-md p-8 shadow-2xl space-y-6">
            <div className="space-y-2 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-indigo-950/40 border border-indigo-900/50 flex items-center justify-center text-indigo-400 mb-4 text-xl">🔒</div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-100">Protected Snippet</h1>
              <p className="text-sm text-gray-500">This snippet requires a password to unlock.</p>
            </div>
            <form onSubmit={submitPassword} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                className="w-full rounded-xl border border-gray-800 bg-black/45 px-4 py-3 text-sm text-gray-100 outline-none transition placeholder:text-gray-600 hover:border-gray-700/80 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30"
              />
              <button
                type="submit"
                disabled={verifying}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-sm py-3.5 px-4 shadow-lg shadow-indigo-900/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200"
              >
                {verifying ? "Verifying..." : "Unlock Snippet"}
              </button>
              {passwordError ? <p className="text-xs text-red-400 text-center font-medium leading-relaxed">{passwordError}</p> : null}
            </form>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!snippet) {
    return (
      <>
        <Header />
        <main className="mx-auto min-h-screen max-w-7xl px-6 py-10 lg:py-16">
          <p className="text-sm text-gray-400 text-center">Loading Snippet...</p>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="mx-auto min-h-screen max-w-7xl px-6 py-10 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          {/* LEFT COLUMN: Code Focus Area */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-gray-100 sm:text-3xl">
                {snippet.title ? snippet.title : `Snippet /${shortId}`}
              </h1>
              {snippet.note ? <p className="text-sm text-gray-400 leading-relaxed">{snippet.note}</p> : null}
            </div>

            {isCreatorSession ? (
              <section className="rounded-2xl border border-gray-800/80 bg-gray-900/30 backdrop-blur-md p-6 shadow-xl">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Share Link</p>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1 rounded-xl border border-gray-800 bg-black/40 px-4 py-3">
                    <p className="truncate text-sm text-gray-300 font-mono select-all" title={fullUrl}>{fullUrl}</p>
                  </div>
                  <button
                    type="button"
                    onClick={copyLink}
                    className="rounded-xl bg-gray-800 hover:bg-gray-700 px-5 py-3 text-sm font-semibold text-gray-100 transition active:scale-[0.98] whitespace-nowrap"
                  >
                    {copiedLink ? "Copied!" : "Copy Link"}
                  </button>
                </div>
                <p className="mt-3 text-xs text-amber-300/80">
                  Save this URL. Snippets are completely private and cannot be recovered without it.
                </p>
              </section>
            ) : null}

            <section className="rounded-2xl border border-gray-800/80 bg-gray-900/30 backdrop-blur-md p-6 shadow-xl">
              {snippet.watermark_ip && snippet.watermark_time ? (
                <div className="mb-4 rounded-xl border border-indigo-900/35 bg-indigo-950/20 px-4 py-3 text-xs text-indigo-300/80 font-mono leading-relaxed">
                  <p>🛡️ Burn-After-Read Watermark:</p>
                  <p className="mt-1">Viewed by IP: {snippet.watermark_ip} at {snippet.watermark_time}</p>
                </div>
              ) : null}

              <div className="flex overflow-x-auto rounded-xl bg-black/40 p-4 font-mono text-sm leading-6 border border-gray-800/60 shadow-inner">
                <div className="select-none pr-4 text-right text-gray-600 border-r border-gray-800/80 font-mono text-sm leading-6">
                  {snippet.content.split("\n").map((_, index) => (
                    <div key={index}>{index + 1}</div>
                  ))}
                </div>
                <pre className="flex-1 pl-4 overflow-x-auto m-0 p-0 bg-transparent scrollbar-thin scrollbar-thumb-gray-800">
                  <code ref={codeRef} className={`language-${snippet.language || "plaintext"} block font-mono text-sm leading-6`}>
                    {snippet.content}
                  </code>
                </pre>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: Sidebar Status Panel */}
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6 rounded-2xl border border-gray-800/80 bg-gray-900/40 backdrop-blur-md p-6 shadow-xl h-fit">
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Snippet Expiration
              </span>
              <p className="text-sm font-semibold text-indigo-300 bg-indigo-950/30 px-4 py-3 border border-indigo-900/30 rounded-xl text-center shadow-sm">
                {expiryLabel}
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-800/80">
              <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                Metadata
              </span>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] font-semibold text-gray-500 uppercase">Language</span>
                  <p className="text-sm text-gray-200 capitalize font-medium mt-0.5">{snippet.language || "plaintext"}</p>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold text-gray-500 uppercase">Created On</span>
                  <p className="text-sm text-gray-200 font-medium mt-0.5">{new Date(snippet.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-800/80">
              <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Actions
              </span>
              <button
                type="button"
                onClick={copyCode}
                className="w-full rounded-xl bg-gray-800 hover:bg-gray-750 text-gray-100 py-3 px-4 font-semibold text-sm transition-all duration-200 active:scale-[0.98]"
              >
                {copiedCode ? "Copied!" : "Copy Code"}
              </button>
              {snippet.download_enabled ? (
                <button
                  type="button"
                  onClick={downloadSnippet}
                  className="w-full rounded-xl bg-gray-800 hover:bg-gray-750 text-gray-100 py-3 px-4 font-semibold text-sm transition-all duration-200 active:scale-[0.98]"
                >
                  Download Snippet
                </button>
              ) : null}
              <a
                href={rawUrl}
                target="_blank"
                rel="noreferrer"
                className="block w-full text-center rounded-xl bg-gray-800 hover:bg-gray-750 text-gray-100 py-3 px-4 font-semibold text-sm transition-all duration-200"
              >
                View Raw Text
              </a>
            </div>

            {isCreatorSession && manageUrl ? (
              <div className="pt-4 border-t border-gray-800/80 space-y-3">
                <span className="block text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
                  Creator Panel
                </span>
                <a
                  href={manageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full text-center rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white py-3 px-4 font-semibold text-sm shadow-md transition-all duration-200 active:scale-[0.98]"
                >
                  Manage Snippet
                </a>
                <p className="text-[11px] text-amber-300/70 text-center leading-relaxed font-medium">
                  Use this private button to check real-time views or delete the snippet permanently.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
