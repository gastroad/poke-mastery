"use client";

import { Lock } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

/** Layout height of one row (px). The focused row scales up *visually* via a
    transform, so the layout height — and thus the snap math — stays constant. */
const ITEM_HEIGHT = 64;
/** Spacer rows above/below the list so the first and last items can center. */
const PAD_ROWS = 2;

export interface WheelItem {
  id: string;
  label: string;
  sublabel?: string;
  locked?: boolean;
}

/**
 * A vertical, one-row-per-item snap-scroll picker (an iOS-style wheel). The
 * centered item is the "focused" one — enlarged and sharp — while neighbours
 * shrink and fade toward the edges. Tap a neighbour to scroll it to center; tap
 * the focused item (or press Enter) to confirm. Locked items can be scrolled
 * past but not confirmed. Keyboard + listbox semantics included.
 *
 * Centering tweens `scrollTop` by hand (native smooth scrolling is a no-op in
 * some environments) with snap momentarily disabled so it can't fight it.
 */
export function WheelPicker({
  items,
  onConfirm,
  ariaLabel,
  initialIndex = 0,
}: {
  items: WheelItem[];
  onConfirm: (item: WheelItem, index: number) => void;
  ariaLabel: string;
  initialIndex?: number;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [focused, setFocused] = useState(initialIndex);
  const [shakeIndex, setShakeIndex] = useState<number | null>(null);

  // Center the initial item without animation whenever the wheel (re)mounts.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = initialIndex * ITEM_HEIGHT;
    setFocused(initialIndex);
  }, [initialIndex]);

  // Clean up the pending scroll frame on unmount.
  useEffect(
    () => () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  const onScroll = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const el = scrollerRef.current;
      if (!el) return;
      const i = Math.round(el.scrollTop / ITEM_HEIGHT);
      setFocused(Math.max(0, Math.min(items.length - 1, i)));
    });
  }, [items.length]);

  const centerOn = useCallback((i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    // Direct assignment guarantees the position updates in every environment;
    // the scroller's `scroll-smooth` class animates it when the browser can, and
    // its `motion-reduce:scroll-auto` respects reduced-motion. (Both native
    // smooth scrolling and rAF are no-ops while a tab is backgrounded.)
    el.scrollTop = i * ITEM_HEIGHT;
  }, []);

  const confirm = useCallback(
    (i: number) => {
      const item = items[i];
      if (!item) return;
      if (item.locked) {
        setShakeIndex(i);
        window.setTimeout(() => setShakeIndex(null), 320);
        return;
      }
      onConfirm(item, i);
    },
    [items, onConfirm],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      centerOn(Math.min(items.length - 1, focused + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      centerOn(Math.max(0, focused - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      confirm(focused);
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <div
        ref={scrollerRef}
        role="listbox"
        aria-label={ariaLabel}
        aria-activedescendant={`wheel-opt-${items[focused]?.id}`}
        tabIndex={0}
        onScroll={onScroll}
        onKeyDown={onKeyDown}
        className="no-scrollbar relative w-full snap-y snap-mandatory scroll-smooth overflow-y-auto outline-none focus-visible:ring-2 focus-visible:ring-poke-500/40 motion-reduce:scroll-auto"
        style={{ height: `${(2 * PAD_ROWS + 1) * ITEM_HEIGHT}px` }}
      >
        <div aria-hidden style={{ height: `${PAD_ROWS * ITEM_HEIGHT}px` }} />
        {items.map((item, i) => {
          const dist = Math.abs(i - focused);
          const isFocused = i === focused;
          const scale = isFocused ? 1.3 : dist === 1 ? 0.9 : 0.78;
          const opacity = isFocused ? 1 : dist === 1 ? 0.5 : dist === 2 ? 0.28 : 0.14;
          return (
            <div
              key={item.id}
              id={`wheel-opt-${item.id}`}
              role="option"
              aria-selected={isFocused}
              aria-disabled={item.locked || undefined}
              onClick={() => (isFocused ? confirm(i) : centerOn(i))}
              className={`flex cursor-pointer select-none snap-center snap-always items-center justify-center ${
                shakeIndex === i ? "wheel-shake" : ""
              }`}
              style={{ height: `${ITEM_HEIGHT}px` }}
            >
              <div
                className="wheel-label flex flex-col items-center gap-0.5"
                style={{ transform: `scale(${scale})`, opacity }}
              >
                <span className="flex items-center gap-2">
                  {item.locked && <Lock className="h-4 w-4 shrink-0 text-zinc-500" />}
                  <span
                    className={`whitespace-nowrap text-2xl font-black tracking-tight ${
                      item.locked ? "text-zinc-500" : isFocused ? "text-zinc-50" : "text-zinc-300"
                    }`}
                  >
                    {item.label}
                  </span>
                </span>
                {item.sublabel && isFocused && (
                  <span className="whitespace-nowrap text-xs text-zinc-400">{item.sublabel}</span>
                )}
              </div>
            </div>
          );
        })}
        <div aria-hidden style={{ height: `${PAD_ROWS * ITEM_HEIGHT}px` }} />
      </div>

      {/* Focus window — marks where the centered (selectable) item sits. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-xl border-y border-poke-500/30"
        style={{ height: `${ITEM_HEIGHT}px` }}
      />
    </div>
  );
}
