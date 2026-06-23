import { Flame, Infinity as InfinityIcon } from "lucide-react";

// The signature element: a snippet's life rendered as a fuse.
// CREATED ──● LIVE / ARMED ●── SELF-DESTRUCT / EXPIRES / PERMANENT
export default function LifespanRail({ createdAt, expiryAt, burnAfterRead, midLabel }) {
  const never = !expiryAt && !burnAfterRead;

  let mid;
  let endLabel;
  let armed = false;

  if (burnAfterRead) {
    mid = midLabel || "ARMED · burns on first read";
    endLabel = "SELF-DESTRUCT";
    armed = true;
  } else if (never) {
    mid = midLabel || "PERSISTENT";
    endLabel = "NO EXPIRY";
  } else {
    mid = midLabel || "LIVE";
    endLabel = "EXPIRES";
  }

  return (
    <div className="flex items-center gap-0 font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground/70 select-none">
      <span className="whitespace-nowrap">created</span>
      <span className="mx-3 h-[2px] flex-1 rounded-full bg-primary" />
      <span
        className={`flex items-center gap-1.5 whitespace-nowrap ${
          armed ? "text-primary animate-fuse-pulse" : never ? "text-live" : "text-primary"
        }`}
      >
        {armed ? <Flame className="h-3 w-3" /> : never ? <InfinityIcon className="h-3 w-3" /> : null}
        {mid}
      </span>
      <span
        className={`mx-3 h-[2px] flex-1 rounded-full ${never ? "bg-live/40" : "bg-border"}`}
      />
      <span className={`whitespace-nowrap ${armed ? "text-primary/80" : ""}`}>{endLabel}</span>
    </div>
  );
}
