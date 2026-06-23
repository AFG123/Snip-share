import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Flame, Lock, Download, Triangle, ArrowRight } from "lucide-react";
import { createSnippet, setSnippetLinks } from "../api/snippets";
import Footer from "../components/Footer";
import Header from "../components/Header";
import LifespanRail from "../components/LifespanRail";
import { addSnippetHistoryItem, formatRelativeTime, getSnippetHistory } from "../utils/snippetHistory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

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

  const lineCount = content ? content.split("\n").length : 0;
  const charCount = content.length;

  const railMidLabel = burnAfterRead
    ? undefined
    : expiry === "never"
      ? undefined
      : `LIVE · ${EXPIRIES.find((e) => String(e.value) === expiry)?.label ?? "24 hours"}`;

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
            download_enabled: downloadEnabled,
            burn_after_read: burnAfterRead
          }
        }
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleEditorKeyDown(event) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 lg:py-14">
        {/* Hero — the thesis */}
        <section className="max-w-2xl">
          <p className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
            <span className="h-px w-7 bg-primary" />
            No account · No tracking · No ads
          </p>
          <h1 className="mt-5 font-mono text-[clamp(2.2rem,6vw,3.4rem)] font-bold leading-[1.04] tracking-tight">
            Drop the code.
            <br />
            Share one link.
            <br />
            <span className="text-primary">It burns on read.</span>
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            A dead-simple, dead-secure way to hand off code. Set an expiry, lock it with a
            password, or destroy it the instant it's seen —{" "}
            <span className="font-medium text-foreground">then it's gone for good.</span>
          </p>
          <div className="mt-7">
            <LifespanRail burnAfterRead={burnAfterRead} expiryAt={expiry !== "never"} midLabel={railMidLabel} />
          </div>
        </section>

        {/* Editor + settings */}
        <form
          onSubmit={handleSubmit}
          className="mt-10 grid items-start gap-5 lg:grid-cols-[1fr_320px]"
        >
          {/* Editor */}
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-[#FF5F56]" />
                <span className="h-3 w-3 rounded-full bg-[#FFBD2E]" />
                <span className="h-3 w-3 rounded-full bg-[#27C93F]" />
              </div>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={60}
                placeholder="untitled snippet — add a title (optional)"
                className="flex-1 bg-transparent text-center text-sm font-semibold text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground/60"
              />
              <span className="hidden font-mono text-[11px] text-muted-foreground/70 sm:block">
                {lineCount} ln · {charCount} ch
              </span>
            </div>

            <Textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              onKeyDown={handleEditorKeyDown}
              placeholder="// paste or write your code here&#10;// ⌘↵ / Ctrl+↵ to create"
              spellCheck={false}
              rows={14}
              className="scroll-ink h-[44vh] min-h-[260px] resize-none rounded-none border-0 border-b border-border bg-transparent p-4 font-mono text-[13.5px] leading-relaxed focus-visible:ring-0 sm:h-[460px]"
            />

            <div className="flex items-center justify-between px-4 py-2.5 font-mono text-[11px] text-muted-foreground/70">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {language}
              </span>
              <span>UTF-8 · LF · ⌘↵ to create</span>
            </div>
          </div>

          {/* Settings */}
          <div className="flex flex-col gap-4">
            <div className="space-y-4 rounded-lg border border-border bg-card p-5">
              <div className="space-y-2">
                <Label htmlFor="language-trigger">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="language-trigger" className="font-mono capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((item) => (
                      <SelectItem key={item} value={item} className="font-mono capitalize">
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiry-trigger">Self-destruct in</Label>
                <Select value={expiry} onValueChange={setExpiry}>
                  <SelectTrigger id="expiry-trigger" className="font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPIRIES.map((item) => (
                      <SelectItem key={item.value} value={String(item.value)} className="font-mono">
                        {item.value === "custom" ? "Custom…" : item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {expiry === "custom" ? (
                  <Input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={customExpiryHours}
                    onChange={(event) => setCustomExpiryHours(event.target.value)}
                    placeholder="Duration in hours"
                    className="font-mono"
                  />
                ) : null}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-5">
              <Label className="mb-1 block">Security</Label>

              <SettingToggle
                icon={<Flame className="h-3.5 w-3.5" />}
                title="Burn after read"
                desc="delete on first view"
                checked={burnAfterRead}
                onChange={(checked) => {
                  setBurnAfterRead(checked);
                  if (checked) setDownloadEnabled(false);
                }}
              />
              <SettingToggle
                icon={<Lock className="h-3.5 w-3.5" />}
                title="Password lock"
                desc="bcrypt protected"
                checked={isPasswordProtected}
                onChange={(checked) => {
                  setIsPasswordProtected(checked);
                  if (!checked) setPassword("");
                }}
              />
              {isPasswordProtected ? (
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Set a password"
                  className="mt-1 font-mono"
                />
              ) : null}
              <SettingToggle
                icon={<Download className="h-3.5 w-3.5" />}
                title="Allow download"
                desc={burnAfterRead ? "disabled while burn is on" : "viewer can save the file"}
                checked={downloadEnabled}
                onChange={setDownloadEnabled}
                disabled={burnAfterRead}
              />

              {burnAfterRead ? (
                <p className="mt-4 rounded-md border border-primary/25 bg-primary/[0.08] px-3 py-2.5 font-mono text-[10.5px] leading-relaxed text-primary">
                  ⚠ Burn is armed. The first viewer sees it once — watermarked with their IP &amp;
                  timestamp — then it's destroyed.
                </p>
              ) : null}
            </div>

            <Button type="submit" size="lg" disabled={submitting} className="w-full font-mono">
              <Triangle className="h-3.5 w-3.5 fill-current" />
              {submitting ? "CREATING LINK…" : "ARM & CREATE LINK"}
            </Button>
            {error ? (
              <p className="text-center font-mono text-[12px] leading-relaxed text-destructive">{error}</p>
            ) : (
              <p className="text-center font-mono text-[10.5px] text-muted-foreground/70">
                link generated instantly · nothing stored in plaintext
              </p>
            )}
          </div>
        </form>

        {/* Recent drops */}
        {recentSnippets.length > 0 ? (
          <section className="mt-14 border-t border-border pt-8">
            <h2 className="font-mono text-[13px] uppercase tracking-[0.18em] text-muted-foreground">
              Recent drops
            </h2>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Stored locally in this browser only.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {recentSnippets.slice(0, 8).map((snippet) => (
                <Link
                  key={snippet.shortId}
                  to={`/${snippet.shortId}`}
                  className="group flex min-h-[96px] flex-col justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40"
                >
                  <div>
                    <p className="font-mono text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                      /{snippet.shortId}
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground/70">
                      {formatRelativeTime(snippet.created_at)}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    {snippet.status === "expired" ? (
                      <span className="rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-destructive/90">
                        gone
                      </span>
                    ) : (
                      <span className="rounded-full border border-live/30 bg-live/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-live">
                        live
                      </span>
                    )}
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}

function SettingToggle({ icon, title, desc, checked, onChange, disabled }) {
  return (
    <label
      className={`flex items-center justify-between gap-3 border-t border-border py-3 first-of-type:border-t-0 ${
        disabled ? "opacity-45" : "cursor-pointer"
      }`}
    >
      <span className="flex items-center gap-2.5">
        <span className="text-muted-foreground">{icon}</span>
        <span>
          <span className="block text-[13.5px] text-foreground">{title}</span>
          <span className="block font-mono text-[10.5px] text-muted-foreground/70">{desc}</span>
        </span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </label>
  );
}
