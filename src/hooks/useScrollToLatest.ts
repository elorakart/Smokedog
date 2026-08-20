"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_NEAR_BOTTOM_PX = 48;

type Options<T extends { id: string }> = {
  /** Reset pin/unread when this changes (e.g. chat channel). */
  resetKey?: string | number | null;
  /** Viewer id — own items force scroll even when unpinned. */
  selfId?: string | null;
  getOwnerId?: (item: T) => string | undefined;
  nearBottomPx?: number;
};

/**
 * Keeps a scrollable list pinned to the bottom unless the user scrolls up.
 * When new items arrive while scrolled up, increments `unread` for a jump pill.
 */
export function useScrollToLatest<T extends { id: string }>(
  items: T[],
  options: Options<T> = {}
) {
  const {
    resetKey,
    selfId = null,
    getOwnerId,
    nearBottomPx = DEFAULT_NEAR_BOTTOM_PX,
  } = options;

  const listRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef(true);
  const lastIdRef = useRef<string | null>(null);
  const [unread, setUnread] = useState(0);

  const isNearBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight <= nearBottomPx;
  }, [nearBottomPx]);

  const scrollToLatest = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    pinnedRef.current = true;
    setUnread(0);
  }, []);

  const onListScroll = useCallback(() => {
    const near = isNearBottom();
    pinnedRef.current = near;
    if (near) setUnread(0);
  }, [isNearBottom]);

  useEffect(() => {
    pinnedRef.current = true;
    setUnread(0);
    lastIdRef.current = null;
    requestAnimationFrame(() => scrollToLatest());
  }, [resetKey, scrollToLatest]);

  useEffect(() => {
    const latest = items[items.length - 1];
    const latestId = latest?.id ?? null;
    if (latestId === lastIdRef.current) return;

    const prevId = lastIdRef.current;
    lastIdRef.current = latestId;
    if (!prevId || !latest) {
      if (pinnedRef.current) requestAnimationFrame(() => scrollToLatest());
      return;
    }

    const prevIndex = items.findIndex((item) => item.id === prevId);
    const arrived =
      prevIndex >= 0 ? items.slice(prevIndex + 1) : items.slice(-1);

    const ownerId = getOwnerId?.(latest);
    const fromSelf = !!selfId && ownerId === selfId;
    if (pinnedRef.current || fromSelf) {
      requestAnimationFrame(() => scrollToLatest());
      return;
    }

    const fromOthers = getOwnerId
      ? arrived.filter((item) => getOwnerId(item) !== selfId)
      : arrived;

    if (fromOthers.length > 0) {
      setUnread((n) => n + fromOthers.length);
    }
  }, [items, selfId, getOwnerId, scrollToLatest]);

  return {
    listRef,
    unread,
    onListScroll,
    scrollToLatest,
    markPinned: () => {
      pinnedRef.current = true;
    },
  };
}
