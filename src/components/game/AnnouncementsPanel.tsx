"use client";

import { GlassPanel } from "@/components/ui/primitives";
import { ScrollToLatestPill } from "@/components/ui/ScrollToLatestPill";
import { useScrollToLatest } from "@/hooks/useScrollToLatest";
import type { GameLog } from "@/lib/types";

export function AnnouncementsPanel({
  logs,
  title = "Announcements",
}: {
  logs: GameLog[];
  title?: string;
}) {
  const { listRef, unread, onListScroll, scrollToLatest } =
    useScrollToLatest(logs);

  return (
    <GlassPanel className="relative overflow-hidden p-0">
      <h3 className="border-b border-crimson/20 px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-ink-steel">
        {title}
      </h3>
      <div className="relative">
        <div
          ref={listRef}
          data-lenis-prevent
          onScroll={onListScroll}
          className="max-h-36 space-y-1 overflow-y-auto px-4 py-3"
        >
          {logs.length === 0 ? (
            <p className="text-sm text-ink-steel">No announcements yet.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {logs.map((l) => (
                <li key={l.id} className="text-ink-steel">
                  {l.text}
                </li>
              ))}
            </ul>
          )}
          <div aria-hidden className="h-px w-full" />
        </div>
        <ScrollToLatestPill
          unread={unread}
          onClick={scrollToLatest}
          singular="new announcement"
          plural="new announcements"
        />
      </div>
    </GlassPanel>
  );
}
