"use client";

import { useId } from "react";

/** The signature Poké Ball motif — used as the logo, the (spinning) loader, and
    the per-game identity icon in the picker.

    `topColor` recolours the upper half, which is how one game is told from
    another: each mode wears a real ball variant (몬스터볼, 슈퍼볼, 하이퍼볼 …)
    rather than an arbitrary swatch. See `client/game/modeBall`.

    `hideButton` drops the center button, leaving clean halves + seam.

    `decorative` takes the ball out of the accessibility tree — use it wherever
    adjacent text already names the thing, so the ball's own name doesn't get
    swept into a button's accessible name ("몬스터볼 실루엣 실루엣만 보고…").
    Note that passing `aria-hidden` from outside would NOT work: TypeScript
    waves hyphenated JSX attributes through, and this component never forwards
    them, so it would be dropped silently. */
export function Pokeball({
  className,
  spin = false,
  hideButton = false,
  topColor = "#ee1a24",
  label = "몬스터볼",
  decorative = false,
}: {
  className?: string;
  spin?: boolean;
  hideButton?: boolean;
  topColor?: string;
  label?: string;
  decorative?: boolean;
}) {
  // The clip is referenced by url(#…), so the id has to be unique per instance —
  // the picker renders six of these at once.
  const clipId = useId();

  return (
    <svg
      viewBox="0 0 100 100"
      role={decorative ? "presentation" : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : label}
      className={`${className ?? ""} ${spin ? "animate-spin" : ""}`}
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx="50" cy="50" r="47" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect x="0" y="0" width="100" height="50" fill={topColor} />
        <rect x="0" y="50" width="100" height="50" fill="#f4f4f5" />
        <rect x="0" y="44" width="100" height="12" fill="#18181b" />
      </g>
      <circle cx="50" cy="50" r="47" fill="none" stroke="#18181b" strokeWidth="4" />
      {!hideButton && (
        <>
          <circle cx="50" cy="50" r="15" fill="#f4f4f5" stroke="#18181b" strokeWidth="5" />
          <circle cx="50" cy="50" r="6" fill="#ffffff" stroke="#18181b" strokeWidth="2.5" />
        </>
      )}
    </svg>
  );
}
