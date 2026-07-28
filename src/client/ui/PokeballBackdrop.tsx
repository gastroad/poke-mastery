import { Pokeball } from "@/client/ui/Pokeball";

/**
 * A full-viewport Poké Ball laid down as a background. It's the same ball SVG,
 * sized past the screen and clipped into a top (red) and bottom (white) half,
 * each a layer that animates on its own: the halves sweep in from the sides on
 * enter and part vertically (top up / bottom down) on exit. A scrim dims it so
 * the overlaid wordmark and button stay legible. Decorative — hidden from the
 * a11y tree; the wordmark carries the brand for screen readers.
 */
export function PokeballBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      {/* Top red half — clips away the lower hemisphere. The ~2% overlap with the
          bottom half falls inside the black seam band, so no hairline gap shows. */}
      <div
        className="poke-half poke-half-top absolute inset-0 flex items-center justify-center"
        style={{ clipPath: "inset(0 0 49% 0)" }}
      >
        <Pokeball className="h-[130vmax] w-[130vmax]" />
      </div>
      {/* Bottom white half. */}
      <div
        className="poke-half poke-half-bottom absolute inset-0 flex items-center justify-center"
        style={{ clipPath: "inset(49% 0 0 0)" }}
      >
        <Pokeball className="h-[130vmax] w-[130vmax]" />
      </div>
      {/* Dim + center vignette. */}
      <div className="hero-scrim absolute inset-0" />
      {/* Flash of light at the moment the halves snap together. */}
      <div className="hero-flash absolute left-1/2 top-1/2 h-[46vmax] w-[46vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 blur-3xl" />
    </div>
  );
}
