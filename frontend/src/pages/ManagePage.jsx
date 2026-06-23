import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Copy, Check, Eye, CalendarClock, Timer, Trash2, ArrowLeft, ExternalLink } from "lucide-react";
import { deleteManagedSnippet, getManagedSnippet } from "../api/snippets";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";

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
    toast.success("Share link copied");
    setTimeout(() => setCopied(false), 1200);
  }

  async function deleteSnippet() {
    try {
      setDeleting(true);
      await deleteManagedSnippet(token);
      toast.success("Snippet destroyed");
      navigate("/");
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  if (error) {
    return (
      <Shell>
        <div className="mx-auto mt-10 max-w-md rounded-lg border border-border bg-card p-8 text-center">
          <h1 className="font-mono text-lg font-bold tracking-tight text-destructive">{error}</h1>
          <Button asChild variant="secondary" className="mt-6 font-mono">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" /> new drop
            </Link>
          </Button>
        </div>
      </Shell>
    );
  }

  if (!snippet) {
    return (
      <Shell>
        <p className="mt-16 text-center font-mono text-sm text-muted-foreground">Loading control panel…</p>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-6">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">Creator control panel</p>
          <h1 className="mt-2 font-mono text-3xl font-bold tracking-tight">
            /{snippet.shortId}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Private stats for your drop. This page is only reachable with your manage link.
          </p>
        </div>

        {/* Share link */}
        <div className="rounded-lg border border-border bg-card p-5">
          <Label className="mb-2 block">Share link</Label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1 rounded-md border border-border bg-background/60 px-3 py-2.5">
              <p className="truncate font-mono text-sm text-foreground" title={shareUrl}>{shareUrl}</p>
            </div>
            <Button onClick={copyShareLink} variant="secondary" className="font-mono">
              {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button asChild variant="secondary" className="font-mono">
              <a href={shareUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" /> Open
              </a>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat icon={<Eye className="h-4 w-4" />} label="Total views">
            <span className="font-mono text-4xl font-bold tracking-tight text-foreground">
              {snippet.view_count}
            </span>
          </Stat>
          <Stat icon={<CalendarClock className="h-4 w-4" />} label="Created">
            <span className="text-sm font-medium text-foreground">{formatDate(snippet.created_at)}</span>
          </Stat>
          <Stat icon={<Timer className="h-4 w-4" />} label="Expires">
            <span className="text-sm font-medium text-foreground">{formatDate(snippet.expiry_at)}</span>
          </Stat>
        </div>

        {/* Danger zone */}
        <div className="rounded-lg border border-destructive/40 bg-destructive/[0.04] p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-destructive">Danger zone</h2>
              <p className="mt-1 max-w-lg text-xs leading-relaxed text-muted-foreground">
                Deleting destroys the snippet from the database permanently. It cannot be recovered.
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" className="font-mono">
                  <Trash2 className="h-4 w-4" /> Delete drop
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete this drop?</DialogTitle>
                  <DialogDescription>
                    Snippet <span className="font-mono text-foreground">/{snippet.shortId}</span> will be
                    permanently destroyed. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="secondary" className="font-mono">Cancel</Button>
                  </DialogClose>
                  <Button variant="destructive" onClick={deleteSnippet} disabled={deleting} className="font-mono">
                    {deleting ? "Destroying…" : "Yes, destroy it"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function Stat({ icon, label, children }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
        {icon}
        {label}
      </span>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Shell({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 lg:py-14">{children}</main>
      <Footer />
    </div>
  );
}
