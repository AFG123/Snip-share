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

const BACKEND_BASE_URL = (import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");

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
        <main className="mx-auto min-h-screen max-w-4xl px-4 py-8">
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-lg">
            <p className="text-sm text-red-400">{error}</p>
            <Link to="/" className="mt-4 inline-block rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-100 transition hover:bg-gray-700">
              Back to home
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
        <main className="flex min-h-screen items-center justify-center px-4 py-8">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-lg">
            <div className="mb-6 space-y-2">
              <h1 className="text-2xl font-semibold text-gray-100">Protected snippet</h1>
              <p className="break-all text-sm text-gray-400">{fullUrl}</p>
            </div>
            <form onSubmit={submitPassword} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                className="w-full rounded-lg border border-gray-800 bg-gray-800 px-4 py-2 text-sm text-gray-100 outline-none transition placeholder:text-gray-500 hover:bg-gray-700 focus:ring-2 focus:ring-gray-700"
              />
              <button
                type="submit"
                disabled={verifying}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              >
                {verifying ? "Verifying..." : "Submit"}
              </button>
              {passwordError ? <p className="text-sm text-red-400">{passwordError}</p> : null}
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
        <main className="mx-auto min-h-screen max-w-4xl px-4 py-8">
          <p className="text-sm text-gray-400">Loading...</p>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="mx-auto min-h-screen max-w-4xl px-4 py-8">
        <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-100">Snippet</h1>

        {isCreatorSession ? (
          <section className="rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-lg">
            <p className="mb-3 text-sm text-gray-400">Share Link</p>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1 rounded-lg border border-gray-800 bg-black/40 px-4 py-2">
                <p className="truncate text-sm text-gray-300" title={fullUrl}>{fullUrl}</p>
              </div>
              <button
                type="button"
                onClick={copyLink}
                className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-100 transition hover:bg-gray-700"
              >
                {copiedLink ? "Copied!" : "Copy Link"}
              </button>
            </div>
            <p className="mt-3 text-sm text-amber-300">
              Save this link. Snippets are not recoverable without it.
            </p>
          </section>
        ) : null}

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>{expiryLabel}</span>
        </div>

        <section className="rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-lg">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={copyCode}
              className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-100 transition hover:bg-gray-700"
            >
              {copiedCode ? "Copied!" : "Copy Code"}
            </button>
            {snippet.download_enabled ? (
              <button
                type="button"
                onClick={downloadSnippet}
                className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-100 transition hover:bg-gray-700"
              >
                Download
              </button>
            ) : null}
            {isCreatorSession ? (
              <>
                <a href={rawUrl} target="_blank" rel="noreferrer" className="rounded-lg bg-gray-800 px-4 py-2 text-center text-sm text-gray-100 transition hover:bg-gray-700">
                  Raw
                </a>
                {manageUrl ? (
                  <a href={manageUrl} target="_blank" rel="noreferrer" className="rounded-lg bg-gray-800 px-4 py-2 text-center text-sm text-gray-100 transition hover:bg-gray-700">
                    Manage
                  </a>
                ) : null}
              </>
            ) : null}
          </div>

          <pre className="overflow-x-auto rounded-xl bg-black/40 p-4">
            <code ref={codeRef} className={`language-${snippet.language || "plaintext"}`}>
              {snippet.content}
            </code>
          </pre>
        </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
