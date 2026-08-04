"use client";

import { Lock } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/** Row height used until the real one is read from `--wheel-row` (see globals.css).
    Only matters for the very first paint; every measurement after that is live. */
const FALLBACK_ROW = 64;
/** How far a pointer may travel and still count as a tap rather than a drag. */
const TAP_SLOP = 8;
/** Scroll movement between press and release that means "the player was scrolling". */
const SCROLL_SLOP = 2;

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
 * Sizing: the wheel fills whatever height its parent gives it, and the row
 * height comes from `--wheel-row`, so the picker scales with the screen instead
 * of being a fixed-px widget stranded in the middle of a monitor. The top and
 * bottom spacers are `50% - row/2` so the first and last items can still reach
 * the center — which is what keeps `scrollTop === index * row` exact.
 *
 * Centering tweens `scrollTop` by hand (native smooth scrolling is a no-op in
 * some environments) with `scroll-smooth` doing the animation.
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

  // Row height lives in a ref, not state: nothing in the markup reads it (the
  // rows and spacers size themselves off `--wheel-row` in CSS) — only the scroll
  // math does. Keeping it out of state avoids a re-render per measurement.
  const rowRef = useRef(FALLBACK_ROW);
  // Mirrors `focused` for callbacks that must not be rebuilt when it changes.
  const focusedRef = useRef(initialIndex);
  useEffect(() => {
    focusedRef.current = focused;
  }, [focused]);

  /** Snap straight to a row with no animation (mount, breakpoint change). */
  const jumpTo = useCallback((i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const previous = el.style.scrollBehavior;
    el.style.scrollBehavior = "auto";
    el.scrollTop = i * rowRef.current;
    el.style.scrollBehavior = previous;
  }, []);

  // Track the live row height — it changes at the width breakpoints that restyle
  // `--wheel-row`, and every scroll calculation below depends on it. When it does
  // change, the old scrollTop points at the wrong row, so re-center the focused
  // one (not `initialIndex` — the player's own choice must survive a resize).
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const sync = () => {
      const px = Number.parseFloat(getComputedStyle(el).getPropertyValue("--wheel-row"));
      if (!Number.isFinite(px) || px <= 0 || px === rowRef.current) return;
      rowRef.current = px;
      jumpTo(focusedRef.current);
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  }, [jumpTo]);

  // Caller handed the wheel a different starting row. Adjusting state during
  // render (React's documented pattern) instead of in an effect, which would
  // paint the stale row first and cascade a second render.
  const [seenInitial, setSeenInitial] = useState(initialIndex);
  if (seenInitial !== initialIndex) {
    setSeenInitial(initialIndex);
    setFocused(initialIndex);
  }

  // Put the scroller on that row.
  useLayoutEffect(() => {
    jumpTo(initialIndex);
  }, [initialIndex, jumpTo]);

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
      const i = Math.round(el.scrollTop / rowRef.current);
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
    el.scrollTop = i * rowRef.current;
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

  /**
   * Tap-vs-drag. A row's click handler must not fire when the player was really
   * flicking the wheel — otherwise `centerOn` yanks `scrollTop` back mid-gesture
   * and the list appears to fight them. A gesture counts as a drag if the pointer
   * travelled, the wheel scrolled under it, or the browser claimed the gesture
   * for scrolling (pointercancel — the usual signal on touch).
   */
  const gestureRef = useRef({ y: 0, top: 0, down: false, dragged: false });

  const onPointerDown = (e: React.PointerEvent) => {
    gestureRef.current = {
      y: e.clientY,
      top: scrollerRef.current?.scrollTop ?? 0,
      down: true,
      dragged: false,
    };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const g = gestureRef.current;
    if (g.down && Math.abs(e.clientY - g.y) > TAP_SLOP) g.dragged = true;
  };
  const endGesture = (dragged: boolean) => {
    const g = gestureRef.current;
    g.down = false;
    if (dragged) g.dragged = true;
  };

  const wasDrag = () => {
    const g = gestureRef.current;
    const moved = Math.abs((scrollerRef.current?.scrollTop ?? 0) - g.top) > SCROLL_SLOP;
    return g.dragged || moved;
  };

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
    <div className="relative h-full w-full">
      <div
        ref={scrollerRef}
        role="listbox"
        aria-label={ariaLabel}
        aria-activedescendant={`wheel-opt-${items[focused]?.id}`}
        tabIndex={0}
        onScroll={onScroll}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => endGesture(false)}
        onPointerCancel={() => endGesture(true)}
        className="wheel-scroller no-scrollbar relative h-full w-full touch-pan-y snap-y snap-mandatory scroll-smooth overflow-y-auto overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-poke-500/40 motion-reduce:scroll-auto"
      >
        {/* Half the scroller minus half a row, so item 0 can sit dead center —
            this is what makes `scrollTop === index * row` hold. */}
        <div aria-hidden className="h-[calc(50%-var(--wheel-row)/2)]" />
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
              onClick={() => {
                if (wasDrag()) return;
                if (isFocused) confirm(i);
                else centerOn(i);
              }}
              className={`flex h-[var(--wheel-row)] cursor-pointer select-none snap-center snap-always items-center justify-center ${
                shakeIndex === i ? "wheel-shake" : ""
              }`}
            >
              <div
                className="wheel-label flex flex-col items-center gap-0.5"
                style={{ transform: `scale(${scale})`, opacity }}
              >
                <span className="flex items-center gap-2">
                  {item.locked && <Lock className="h-4 w-4 shrink-0 text-zinc-500" />}
                  <span
                    className={`whitespace-nowrap text-2xl font-black tracking-tight md:text-3xl ${
                      item.locked ? "text-zinc-500" : isFocused ? "text-zinc-50" : "text-zinc-300"
                    }`}
                  >
                    {item.label}
                  </span>
                </span>
                {item.sublabel && isFocused && (
                  <span className="whitespace-nowrap text-xs text-zinc-400 md:text-sm">
                    {item.sublabel}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        <div aria-hidden className="h-[calc(50%-var(--wheel-row)/2)]" />
      </div>

      {/* Focus window — marks where the centered (selectable) item sits. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 h-[var(--wheel-row)] -translate-y-1/2 rounded-xl border-y border-poke-500/30"
      />
    </div>
  );
}
