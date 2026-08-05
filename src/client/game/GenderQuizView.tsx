"use client";

import { Heart } from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";
import { INITIAL_LIVES, useSessionStore } from "@/client/stores/sessionStore";
import { GENDER_ANSWER } from "@/domain/challenge/generateGenderQuestions";
import type { GenderDiffView } from "@/domain/pokemon/types";
import { spritePath } from "@/shared/sprites";
import { POKEMON } from "./pokemonDataset";

/**
 * "Male or female?" — the front AND back sprites of one gender, two buttons.
 *
 * Both views are shown because a fair few species (브이젤, 스라크…) are identical
 * from the front and only differ from behind. After answering, the two genders
 * are put side by side so the difference is actually learned, not just scored.
 *
 * This drives the ordinary quiz flow in the store (lives, combo, reveal→next);
 * a tap just fills in the answer the same way typing would.
 */
export function GenderQuizView() {
  const questions = useSessionStore((s) => s.questions);
  const currentIndex = useSessionStore((s) => s.currentIndex);
  const phase = useSessionStore((s) => s.phase);
  const lastResult = useSessionStore((s) => s.lastResult);
  const lives = useSessionStore((s) => s.lives);
  const combo = useSessionStore((s) => s.combo);
  const setInput = useSessionStore((s) => s.setInput);
  const submit = useSessionStore((s) => s.submit);
  const next = useSessionStore((s) => s.next);

  const byId = useMemo(() => new Map(POKEMON.map((p) => [p.id, p])), []);
  const question = questions[currentIndex];
  const mon = question ? byId.get(question.pokemonId) : undefined;
  if (!question || !mon) return null;

  const revealed = phase === "revealed";
  const isLast = currentIndex + 1 >= questions.length;
  const shown = question.gender ?? "male";
  const hasBack = mon.genderDiff?.back !== null && mon.genderDiff?.back !== undefined;

  function answer(gender: "male" | "female") {
    if (revealed) return;
    setInput(GENDER_ANSWER[gender]);
    submit();
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col gap-4 bg-zinc-950 px-4 py-5 text-zinc-100">
      <header className="flex items-center justify-between text-sm">
        <span className="font-black">
          {currentIndex + 1}
          <span className="text-zinc-500"> / {questions.length}</span>
        </span>
        <div className="flex items-center gap-3">
          {combo > 1 && <span className="font-bold text-amber-400">{combo} 연속</span>}
          <span className="flex gap-0.5">
            {Array.from({ length: INITIAL_LIVES }, (_, i) => (
              <Heart
                key={i}
                className={`h-4 w-4 ${i < lives ? "fill-poke-500 text-poke-500" : "text-zinc-700"}`}
              />
            ))}
          </span>
        </div>
      </header>

      <p className="text-center text-lg font-black">이 포켓몬은 암컷일까요, 수컷일까요?</p>

      {/* The question: one gender, front and back. The name is shown — this asks
          about the gender, not about identifying the Pokémon. */}
      <div className="flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 py-4">
        <Sprite
          id={mon.id}
          gender={shown}
          back={false}
          alt={`${mon.nameKo} 앞모습`}
          label="앞모습"
        />
        {hasBack && (
          <Sprite id={mon.id} gender={shown} back alt={`${mon.nameKo} 뒷모습`} label="뒷모습" />
        )}
      </div>
      <p className="text-center text-sm text-zinc-400">{mon.nameKo}</p>

      {revealed ? (
        <div className="flex flex-col gap-3">
          <p
            className={`text-center text-xl font-black ${
              lastResult === "correct" ? "text-emerald-400" : "text-poke-500"
            }`}
          >
            {lastResult === "correct" ? "정답!" : `아쉬워요 — ${question.answer}`}
          </p>
          {/* The learning moment: both genders side by side, plus a zoom on the
              part that actually differs — often a few pixels on a face or tail,
              which is impossible to spot at sprite size. */}
          <DiffRow
            id={mon.id}
            back={false}
            view={mon.genderDiff?.front}
            caption="앞모습에서 다른 곳"
          />
          {hasBack && (
            <DiffRow
              id={mon.id}
              back
              view={mon.genderDiff?.back ?? undefined}
              caption="뒷모습에서 다른 곳"
            />
          )}
          <button
            type="button"
            onClick={next}
            autoFocus
            className="rounded-xl bg-poke-500 px-4 py-3 text-lg font-bold text-white transition hover:bg-poke-400 active:scale-[0.98]"
          >
            {isLast || lives <= 0 ? "결과 보기" : "다음"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => answer("female")}
            className="rounded-xl bg-pink-500/20 px-4 py-5 text-xl font-black text-pink-300 transition hover:bg-pink-500/30 active:scale-[0.98]"
          >
            암컷 ♀
          </button>
          <button
            type="button"
            onClick={() => answer("male")}
            className="rounded-xl bg-sky-500/20 px-4 py-5 text-xl font-black text-sky-300 transition hover:bg-sky-500/30 active:scale-[0.98]"
          >
            수컷 ♂
          </button>
        </div>
      )}
    </main>
  );
}

/**
 * One view (front or back) at reveal time: both genders full-size, and — when
 * the difference is localized enough to be worth pointing at — the same crop of
 * both, blown up side by side.
 */
function DiffRow({
  id,
  back,
  view,
  caption,
}: {
  id: number;
  back: boolean;
  view?: GenderDiffView;
  caption: string;
}) {
  // A difference spanning most of the sprite (a whole-body recolour like
  // 히포포타스) is already obvious; zooming it in would just show the same thing.
  const worthZooming = view !== undefined && view.pixels > 0 && view.box.size <= 56;

  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-zinc-900 py-4">
      <div className="flex items-stretch justify-center gap-2">
        <Sprite
          id={id}
          gender="male"
          back={back}
          alt="수컷"
          label="수컷"
          big
          spot={worthZooming ? view.box : undefined}
        />
        <Sprite
          id={id}
          gender="female"
          back={back}
          alt="암컷"
          label="암컷"
          big
          spot={worthZooming ? view.box : undefined}
        />
      </div>
      {worthZooming && (
        <>
          <p className="text-center text-xs font-bold text-poke-400">{caption}</p>
          <div className="flex justify-center">
            <BlinkZoom id={id} back={back} box={view.box} />
          </div>
          <p className="text-center text-[11px] text-zinc-500">
            <span className="font-bold text-sky-400">수컷</span>
            {" ⇄ "}
            <span className="font-bold text-pink-400">암컷</span> · 깜빡이는 곳이 다릅니다
          </p>
        </>
      )}
    </div>
  );
}

const ZOOM_WINDOW = 132;

/** One magnified crop. Pure CSS: the sprite is scaled up inside a fixed window
    and offset so the requested box lands in view. */
function ZoomLayer({
  id,
  gender,
  back,
  box,
  className = "",
}: {
  id: number;
  gender: "male" | "female";
  back: boolean;
  box: { x: number; y: number; size: number };
  className?: string;
}) {
  const scale = ZOOM_WINDOW / box.size;
  return (
    <Image
      src={spritePath(id, spriteVariant(gender, back))}
      alt={gender === "male" ? "수컷" : "암컷"}
      width={96}
      height={96}
      unoptimized
      className={`absolute max-w-none [image-rendering:pixelated] ${className}`}
      style={{
        width: 96 * scale,
        height: 96 * scale,
        left: -box.x * scale,
        top: -box.y * scale,
      }}
    />
  );
}

/**
 * The differing region, magnified, with the two genders swapping in place.
 *
 * Zooming alone isn't enough — a 7px difference stays a 7px difference, just
 * bigger — so the two crops alternate on a timer. Everything identical sits
 * perfectly still while the difference flickers, which is far easier to notice
 * than any static marker could make it. The frame colour tracks which gender is
 * currently up, so the flicker also teaches which one is which.
 */
function BlinkZoom({
  id,
  back,
  box,
}: {
  id: number;
  back: boolean;
  box: { x: number; y: number; size: number };
}) {
  const frame = "relative overflow-hidden rounded-xl border-2";
  const size = { width: ZOOM_WINDOW, height: ZOOM_WINDOW };
  return (
    <>
      <div className={`gender-blink-stack gender-blink-frame ${frame}`} style={size}>
        <ZoomLayer id={id} gender="male" back={back} box={box} className="gender-blink-male" />
        <ZoomLayer id={id} gender="female" back={back} box={box} className="gender-blink-female" />
      </div>
      {/* Reduced motion can't rely on the flicker, so it gets both at once. */}
      <div className="gender-blink-pair gap-2">
        {(["male", "female"] as const).map((gender) => (
          <figure key={gender} className="flex flex-col items-center gap-1">
            <div
              className={`${frame} ${gender === "male" ? "border-sky-400" : "border-pink-400"}`}
              style={size}
            >
              <ZoomLayer id={id} gender={gender} back={back} box={box} />
            </div>
            <figcaption className="text-xs text-zinc-500">
              {gender === "male" ? "수컷" : "암컷"}
            </figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}

function spriteVariant(gender: "male" | "female", back: boolean) {
  if (back) return gender === "female" ? "pixel-back-female" : "pixel-back";
  return gender === "female" ? "pixel-female" : "pixel";
}

function Sprite({
  id,
  gender,
  back,
  alt,
  label,
  big = false,
  spot,
}: {
  id: number;
  gender: "male" | "female";
  back: boolean;
  alt: string;
  label: string;
  big?: boolean;
  /** When given, dim the sprite and light only this region of it. */
  spot?: { x: number; y: number; size: number };
}) {
  const size = big ? "h-28 w-28 sm:h-36 sm:w-36" : "h-32 w-32 sm:h-44 sm:w-44";
  const src = spritePath(id, spriteVariant(gender, back));
  const pct = (n: number) => `${(n / 96) * 100}%`;
  const aperture = spot
    ? ({
        "--spot-x": pct(spot.x + spot.size / 2),
        "--spot-y": pct(spot.y + spot.size / 2),
        "--spot-r": pct(spot.size * 0.55),
      } as React.CSSProperties)
    : undefined;

  return (
    <figure className="flex flex-col items-center gap-1">
      <div className={`relative ${size}`}>
        <Image
          src={src}
          alt={alt}
          width={96}
          height={96}
          unoptimized
          className={`${size} [image-rendering:pixelated] ${spot ? "gender-spot-dim" : ""}`}
        />
        {/* The same sprite again at full strength, showing only through the
            aperture — that contrast is the spotlight. */}
        {spot && (
          <Image
            src={src}
            alt=""
            aria-hidden
            width={96}
            height={96}
            unoptimized
            className={`gender-spot absolute inset-0 ${size} [image-rendering:pixelated]`}
            style={aperture}
          />
        )}
      </div>
      <figcaption className="text-xs text-zinc-500">{label}</figcaption>
    </figure>
  );
}
