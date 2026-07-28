/** The signature Poké Ball motif — used as the logo and (spinning) loader.
    `hideButton` drops the center button, leaving clean red/white halves + seam
    (used when the ball is split into a top/bottom frame). */
export function Pokeball({
  className,
  spin = false,
  hideButton = false,
}: {
  className?: string;
  spin?: boolean;
  hideButton?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label="몬스터볼"
      className={`${className ?? ""} ${spin ? "animate-spin" : ""}`}
    >
      <defs>
        <clipPath id="pokeball-clip">
          <circle cx="50" cy="50" r="47" />
        </clipPath>
      </defs>
      <g clipPath="url(#pokeball-clip)">
        <rect x="0" y="0" width="100" height="50" fill="#ee1a24" />
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
