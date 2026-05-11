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
        <main className="mx-auto min-h-screen max-w-4xl px-4 py-8">
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-lg">
            <p className="text-sm text-red-400">{error}</p>
            <Link to="/" className="mt-4 inline-block rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-100 transition hover:bg-gray-700">
              Back home
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
        <main className="mx-auto min-h-screen max-w-4xl px-4 py-8">
          <p className="text-sm text-gray-500">Loading...</p>
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
        <h1 className="text-2xl font-semibold text-gray-100">Manage Snippet</h1>

        <section className="rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-lg">
          <p className="mb-3 text-sm text-gray-400">Share Link</p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1 rounded-lg border border-gray-800 bg-black/40 px-4 py-2">
              <p className="truncate text-sm text-gray-300" title={shareUrl}>{shareUrl}</p>
            </div>
            <button
              type="button"
              onClick={copyShareLink}
              className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-100 transition hover:bg-gray-700"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </section>

        <section className="grid gap-4 rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-lg sm:grid-cols-3">
          <div>
            <p className="text-sm text-gray-400">Views</p>
            <p className="mt-1 text-lg font-semibold text-gray-100">{snippet.view_count}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Created</p>
            <p className="mt-1 text-sm text-gray-300">{formatDate(snippet.created_at)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Expiry</p>
            <p className="mt-1 text-sm text-gray-300">{formatDate(snippet.expiry_at)}</p>
          </div>
        </section>

        <section className="rounded-2xl border border-red-900/60 bg-gray-900 p-6 shadow-lg">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-medium text-red-300">Danger Section</h2>
              <p className="mt-1 text-sm text-gray-500">Delete this snippet permanently.</p>
            </div>
            <button
              type="button"
              onClick={deleteSnippet}
              disabled={deleting}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {deleting ? "Deleting..." : "Delete Snippet"}
            </button>
          </div>
        </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
