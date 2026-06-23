import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import python from "highlight.js/lib/languages/python";
import java from "highlight.js/lib/languages/java";
import sql from "highlight.js/lib/languages/sql";
import bash from "highlight.js/lib/languages/bash";
import "highlight.js/styles/github-dark.css";
import { toast } from "sonner";
import {
  Lock,
  Flame,
  Clock,
  Ghost,
  Copy,
  Check,
  Download,
  FileCode,
  ExternalLink,
  Settings2,
  ShieldAlert,
  ArrowLeft
} from "lucide-react";
import { getSnippet, getSnippetLinks, verifySnippet } from "../api/snippets";
import Footer from "../components/Footer";
import Header from "../components/Header";
import LifespanRail from "../components/LifespanRail";
import { markSnippetHistoryExpired } from "../utils/snippetHistory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

// Map a backend error message to a themed empty-state.
function describeError(message) {
  const lower = (message || "").toLowerCase();
  if (lower.includes("destroyed")) {
    return { icon: Flame, label: "This snippet has been destroyed", hint: "It was burned after its first read. There's nothing left to recover." };
  }
  if (lower.includes("expired")) {
    return { icon: Clock, label: "This snippet has expired", hint: "Its lifespan ran out and it was cleaned from the database." };
  }
  if (lower.includes("not found")) {
    return { icon: Ghost, label: "Snippet not found", hint: "This link is wrong, or the snippet was already deleted." };
  }
  return { icon: ShieldAlert, label: message || "Something went wrong", hint: "Try the link again, or head back and create a new drop." };
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
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopiedCode(false), 1200);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    toast.success("Share link copied");
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

  // ── Error / empty states ──────────────────────────────────────────────
  if (error) {
    const { icon: Icon, label, hint } = describeError(error);
    return (
      <Shell>
        <div className="mx-auto mt-10 max-w-md rounded-lg border border-border bg-card p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
          </div>
          <h1 className="mt-5 font-mono text-lg font-bold tracking-tight">{label}</h1>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">{hint}</p>
          <Button asChild variant="secondary" className="mt-6 font-mono">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              new drop
            </Link>
          </Button>
        </div>
      </Shell>
    );
  }

  // ── Password gate ─────────────────────────────────────────────────────
  if (isProtected) {
    return (
      <Shell center>
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-8">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
              <Lock className="h-6 w-6" />
            </div>
            <h1 className="mt-5 font-mono text-xl font-bold tracking-tight">Locked drop</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This snippet is password protected. Enter it to unlock.
            </p>
          </div>
          <form onSubmit={submitPassword} className="mt-6 space-y-3">
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              autoFocus
              className="font-mono"
            />
            <Button type="submit" disabled={verifying} className="w-full font-mono">
              {verifying ? "UNLOCKING…" : "UNLOCK"}
            </Button>
            {passwordError ? (
              <p className="text-center font-mono text-[12px] text-destructive">{passwordError}</p>
            ) : null}
          </form>
        </div>
      </Shell>
    );
  }

  if (!snippet) {
    return (
      <Shell>
        <p className="mt-16 text-center font-mono text-sm text-muted-foreground">Loading drop…</p>
      </Shell>
    );
  }

  // ── Snippet view ──────────────────────────────────────────────────────
  const lines = snippet.content.split("\n");

  return (
    <Shell>
      <div className="mt-2 grid items-start gap-5 lg:grid-cols-[1fr_300px]">
        {/* Code column */}
        <div className="flex flex-col gap-5">
          <div>
            <h1 className="font-mono text-2xl font-bold tracking-tight">
              {snippet.title ? snippet.title : `/${shortId}`}
            </h1>
            {snippet.note ? (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{snippet.note}</p>
            ) : null}
          </div>

          {isCreatorSession ? (
            <div className="rounded-lg border border-primary/25 bg-primary/[0.06] p-4">
              <Label className="text-primary">Share link · save it now</Label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1 rounded-md border border-border bg-background/60 px-3 py-2.5">
                  <p className="truncate font-mono text-sm text-foreground" title={fullUrl}>
                    {fullUrl}
                  </p>
                </div>
                <Button onClick={copyLink} variant="secondary" className="font-mono">
                  {copiedLink ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                  {copiedLink ? "Copied" : "Copy"}
                </Button>
              </div>
              <p className="mt-2.5 font-mono text-[11px] leading-relaxed text-primary/70">
                Snippets are private and cannot be recovered without this link.
              </p>
            </div>
          ) : null}

          {snippet.watermark_ip && snippet.watermark_time ? (
            <div className="flex items-start gap-2.5 rounded-md border border-primary/30 bg-primary/[0.08] px-4 py-3 font-mono text-[11.5px] leading-relaxed text-primary">
              <Flame className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Burn-after-read · this view was logged.
                <br />
                Watermarked for IP {snippet.watermark_ip} at {snippet.watermark_time}. The snippet
                is now destroyed.
              </span>
            </div>
          ) : null}

          {/* Code surface */}
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <span className="flex items-center gap-2 font-mono text-[12px] text-muted-foreground">
                <FileCode className="h-3.5 w-3.5" />
                {snippet.title || shortId}.{getFileExtension(snippet.language)}
              </span>
              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
              >
                {copiedCode ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedCode ? "copied" : "copy"}
              </button>
            </div>
            <div className="scroll-ink flex overflow-x-auto">
              <div className="select-none border-r border-border py-4 pl-4 pr-3 text-right font-mono text-[13.5px] leading-relaxed text-muted-foreground/40">
                {lines.map((_, index) => (
                  <div key={index}>{index + 1}</div>
                ))}
              </div>
              <pre className="m-0 flex-1 overflow-x-auto bg-transparent p-4">
                <code
                  ref={codeRef}
                  className={`language-${snippet.language || "plaintext"} block bg-transparent font-mono text-[13.5px] leading-relaxed`}
                >
                  {snippet.content}
                </code>
              </pre>
            </div>
          </div>
        </div>

        {/* Status sidebar */}
        <aside className="flex flex-col gap-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <Label className="mb-3 block">Lifespan</Label>
            <LifespanRail
              createdAt={snippet.created_at}
              expiryAt={snippet.expiry_at}
              burnAfterRead={Boolean(snippet.burn_after_read)}
              midLabel={snippet.expiry_at ? expiryLabel : undefined}
            />
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <Label className="mb-3 block">Metadata</Label>
            <dl className="space-y-3 font-mono text-[12px]">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">language</dt>
                <dd className="capitalize text-foreground">{snippet.language || "plaintext"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">created</dt>
                <dd className="text-foreground">{new Date(snippet.created_at).toLocaleDateString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">expiry</dt>
                <dd className="text-foreground">{expiryLabel}</dd>
              </div>
            </dl>
          </div>

          <div className="space-y-2 rounded-lg border border-border bg-card p-5">
            <Label className="mb-1 block">Actions</Label>
            <Button onClick={copyCode} variant="secondary" className="w-full justify-start font-mono">
              <Copy className="h-4 w-4" /> Copy code
            </Button>
            {snippet.download_enabled ? (
              <Button onClick={downloadSnippet} variant="secondary" className="w-full justify-start font-mono">
                <Download className="h-4 w-4" /> Download file
              </Button>
            ) : null}
            <Button asChild variant="secondary" className="w-full justify-start font-mono">
              <a href={rawUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" /> View raw
              </a>
            </Button>
          </div>

          {isCreatorSession && manageUrl ? (
            <div className="rounded-lg border border-primary/25 bg-primary/[0.06] p-5">
              <Label className="mb-2 block text-primary">Creator panel</Label>
              <Button asChild className="w-full font-mono">
                <a href={manageUrl} target="_blank" rel="noreferrer">
                  <Settings2 className="h-4 w-4" /> Manage drop
                </a>
              </Button>
              <p className="mt-2.5 text-center font-mono text-[10.5px] leading-relaxed text-primary/70">
                Private link · track views or delete it for good.
              </p>
            </div>
          ) : null}
        </aside>
      </div>
    </Shell>
  );
}

function Shell({ children, center }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main
        className={`mx-auto w-full max-w-6xl flex-1 px-6 py-10 lg:py-14 ${
          center ? "flex items-center justify-center" : ""
        }`}
      >
        {children}
      </main>
      <Footer />
    </div>
  );
}
