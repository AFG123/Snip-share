import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { deleteManagedSnippet, getManagedSnippet } from "../api/snippets";
import Footer from "../components/Footer";
import Header from "../components/Header";

function formatDate(value) {
  if (!value) {
    return "Never";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function ManagePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [snippet, setSnippet] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadSnippet() {
      try {
        const data = await getManagedSnippet(token);
        if (mounted) {
          setSnippet(data);
          setError("");
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
        }
      }
    }

    loadSnippet();
    return () => {
      mounted = false;
    };
  }, [token]);

  const shareUrl = snippet?.shortId ? `${window.location.origin}/${snippet.shortId}` : "";

  async function copyShareLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  async function deleteSnippet() {
    if (!window.confirm("Delete this snippet permanently?")) {
      return;
    }

    try {
      setDeleting(true);
      await deleteManagedSnippet(token);
      navigate("/");
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  if (error) {
    return (
      <>
        <Header />
        <main className="mx-auto min-h-screen max-w-7xl px-6 py-10 lg:py-16">
          <div className="rounded-2xl border border-gray-800 bg-gray-900/40 backdrop-blur-md p-8 text-center space-y-4 shadow-xl">
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

  if (!snippet) {
    return (
      <>
        <Header />
        <main className="mx-auto min-h-screen max-w-7xl px-6 py-10 lg:py-16">
          <p className="text-sm text-gray-400 text-center font-medium">Loading Management Dashboard...</p>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="mx-auto min-h-screen max-w-7xl px-6 py-10 lg:py-16">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-100 via-indigo-200 to-indigo-400 bg-clip-text text-transparent sm:text-4xl">
              Management Dashboard
            </h1>
            <p className="text-sm text-gray-500">
              Verify usage statistics and delete your snippet from our active cluster.
            </p>
          </div>

          <section className="rounded-2xl border border-gray-800/80 bg-gray-900/30 backdrop-blur-md p-6 shadow-xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Share Link</p>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1 rounded-xl border border-gray-800 bg-black/40 px-4 py-3">
                <p className="truncate text-sm text-gray-300 font-mono select-all" title={shareUrl}>{shareUrl}</p>
              </div>
              <button
                type="button"
                onClick={copyShareLink}
                className="rounded-xl bg-gray-800 hover:bg-gray-700 px-5 py-3 text-sm font-semibold text-gray-100 transition duration-200 active:scale-[0.98] whitespace-nowrap"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </section>

          <section className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-800/80 bg-gray-900/40 backdrop-blur-md p-6 shadow-md transition hover:border-gray-700/60 duration-200">
              <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500">Total Views</span>
              <p className="mt-2 text-3xl font-bold text-gray-100 tracking-tight">{snippet.view_count}</p>
            </div>
            <div className="rounded-2xl border border-gray-800/80 bg-gray-900/40 backdrop-blur-md p-6 shadow-md transition hover:border-gray-700/60 duration-200">
              <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500">Creation Date</span>
              <p className="mt-3 text-sm text-gray-200 font-medium">{formatDate(snippet.created_at)}</p>
            </div>
            <div className="rounded-2xl border border-gray-800/80 bg-gray-900/40 backdrop-blur-md p-6 shadow-md transition hover:border-gray-700/60 duration-200">
              <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500">Expiration Time</span>
              <p className="mt-3 text-sm text-gray-200 font-medium">{formatDate(snippet.expiry_at)}</p>
            </div>
          </section>

          <section className="rounded-2xl border border-red-900/45 bg-red-950/5 p-6 shadow-xl">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-red-400">Danger Zone</h2>
                <p className="text-xs text-gray-500 leading-relaxed max-w-lg">
                  Once deleted, snippets are permanently destroyed from the database and cannot be recovered under any circumstances.
                </p>
              </div>
              <button
                type="button"
                onClick={deleteSnippet}
                disabled={deleting}
                className="rounded-xl bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 text-white font-semibold text-sm py-3 px-6 shadow-md shadow-red-950/50 transition active:scale-[0.98] whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Deleting Snippet..." : "Delete Snippet"}
              </button>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
