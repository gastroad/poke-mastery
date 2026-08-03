import { Pokeball } from "@/client/ui/Pokeball";

/**
 * The full-screen Poké Ball torn open along its seam: the red top half framing
 * the top of the screen, the white bottom half framing the bottom, with a dark
 * gap between them for the wheel picker. On mount the halves animate from closed
 * to this open position (see `.frame-half-*` in globals.css). Decorative.
 */
export function PokeballFrame() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div
        className="frame-half frame-half-top absolute inset-0 flex items-center justify-center"
        style={{ clipPath: "inset(0 0 50% 0)" }}
      >
        <Pokeball hideButton className="h-[var(--poke-ball-size)] w-[var(--poke-ball-size)]" />
      </div>
      <div
        className="frame-half frame-half-bottom absolute inset-0 flex items-center justify-center"
        style={{ clipPath: "inset(50% 0 0 0)" }}
      >
        <Pokeball hideButton className="h-[var(--poke-ball-size)] w-[var(--poke-ball-size)]" />
      </div>
      {/* Dark middle band that seats the wheel and fades the halves' inner edges. */}
      <div className="frame-scrim absolute inset-0" />
    </div>
  );
}
