"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { POKEMON } from "@/client/game/pokemonDataset";
import { TYPE_NAME_KO } from "@/domain/pokemon/typeNames";
import type { Pokemon } from "@/domain/pokemon/types";
import { SPRITE_META, spritePath, type SpriteVariant } from "@/shared/sprites";

/**
 * THROWAWAY dev page (route /dev/pokemon): everything the app holds about ONE
 * Pokémon, laid out at once — every stored field and every sprite variant —
 * plus what it deliberately does NOT hold, so a new game mode can be designed
 * against reality instead of guesses. Delete this and its route when done.
 */

const VARIANTS = Object.keys(SPRITE_META) as SpriteVariant[];

const VARIANT_NOTE: Record<SpriteVariant, string> = {
  pixel: "도트 앞",
  "pixel-back": "도트 뒤",
  "pixel-female": "암컷 앞",
  "pixel-back-female": "암컷 뒤",
};

/** What PokéAPI offers that this project never synced — the ceiling for ideas. */
const NOT_STORED = [
  "종족값·능력치",
  "특성",
  "진화 계열·진화 조건",
  "키·몸무게",
  "알 그룹",
  "도감 색상 / 서식지",
  "도감 설명문",
  "기술 목록",
  "울음소리",
  "리전폼·메가진화 등 다른 폼",
];

/**
 * Mirrors what the sync script downloads (`variantsFor`): gen 1 gets every
 * variant, later generations get the pixel sprite plus the male/female pair when
 * the species has a gender difference. Computed rather than probed, so a missing
 * file never renders as a broken image.
 */
function isAvailable(mon: Pokemon, variant: SpriteVariant): boolean {
  const gendered = mon.genderDiff !== undefined;
  if (variant === "pixel") return true;
  if (variant === "pixel-back-female") return gendered && mon.genderDiff?.back != null;
  return gendered;
}

const PRESETS = [25, 6, 3, 133, 592, 906];

export function PokemonInspector() {
  const [id, setId] = useState(25);
  const byId = useMemo(() => new Map(POKEMON.map((p) => [p.id, p])), []);
  const mon = byId.get(id);

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col gap-4 bg-zinc-950 px-5 py-8 text-zinc-100">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-black tracking-tight">
          포켓몬 정보 전체 보기 <span className="text-poke-500">dev</span>
        </h1>
        <p className="text-sm text-zinc-400">
          한 포켓몬에 대해 이 앱이 가진 모든 것. 새 모드는 여기 있는 재료로만 만들 수 있습니다.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-zinc-900 p-4">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-zinc-500">도감 번호</span>
          <input
            type="number"
            min={1}
            max={1025}
            value={id}
            onChange={(e) => setId(Number(e.target.value))}
            className="w-24 rounded-lg bg-zinc-800 px-3 py-1.5 outline-none focus:ring-2 focus:ring-poke-500/40"
          />
        </label>
        <div className="flex flex-wrap gap-1">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setId(p)}
              className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                p === id
                  ? "bg-zinc-100 text-zinc-900"
                  : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {byId.get(p)?.nameKo ?? p}
            </button>
          ))}
        </div>
      </div>

      {!mon ? (
        <p className="rounded-xl bg-zinc-900 p-6 text-center text-zinc-400">
          그 번호의 포켓몬이 없습니다.
        </p>
      ) : (
        <>
          <Section title="1. 저장된 데이터" hint="src/data/pokemon.json">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="도감 번호">#{mon.id}</Field>
              <Field label="세대">{mon.generation}세대</Field>
              <Field label="한글 이름">{mon.nameKo}</Field>
              <Field label="영문 슬러그">
                <span className="font-mono text-sm">{mon.nameEn}</span>
              </Field>
              <Field label="타입">
                <span className="flex gap-1.5">
                  {mon.types.map((t) => (
                    <span key={t} className="rounded-full bg-poke-500/15 px-2.5 py-0.5 text-sm font-bold text-poke-400">
                      {TYPE_NAME_KO[t]}
                    </span>
                  ))}
                </span>
              </Field>
              <Field label="정답 인정 문자열">
                <span className="flex flex-wrap gap-1.5">
                  {mon.acceptedAnswers.map((a) => (
                    <code key={a} className="rounded bg-zinc-800 px-2 py-0.5 text-sm">{a}</code>
                  ))}
                </span>
              </Field>
            </div>
          </Section>

          <Section
            title="2. 암수 차이"
            hint={mon.genderDiff ? "동기화 때 픽셀 단위로 측정" : "이 포켓몬은 암수가 같습니다"}
          >
            {mon.genderDiff ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="앞모습">
                  {mon.genderDiff.front.pixels}px 다름 · 영역 {mon.genderDiff.front.box.size}px
                  <span className="ml-1 text-zinc-500">
                    (x{mon.genderDiff.front.box.x}, y{mon.genderDiff.front.box.y})
                  </span>
                </Field>
                <Field label="뒷모습">
                  {mon.genderDiff.back
                    ? `${mon.genderDiff.back.pixels}px 다름 · 영역 ${mon.genderDiff.back.box.size}px`
                    : "암컷 뒷모습 파일 없음"}
                </Field>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">암수 구별 모드에 출제되지 않습니다.</p>
            )}
          </Section>

          <Section title="3. 이미지" hint="도트 앞모습은 전 세대, 나머지는 암수 차이가 있는 종만">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {VARIANTS.map((variant) => {
                const meta = SPRITE_META[variant];
                const available = isAvailable(mon, variant);
                return (
                  <figure
                    key={variant}
                    className={`flex flex-col gap-2 rounded-xl p-3 ${available ? "bg-zinc-800/60" : "bg-zinc-900/60"}`}
                  >
                    <div className="flex h-36 items-center justify-center rounded-lg bg-gradient-to-b from-zinc-700/40 to-zinc-900">
                      {available ? (
                        <Image
                          src={spritePath(mon.id, variant)}
                          alt={variant}
                          width={meta.size}
                          height={meta.size}
                          unoptimized
                          className={`max-h-32 w-auto object-contain ${
                            meta.size <= 96 ? "h-28 [image-rendering:pixelated]" : "h-32"
                          }`}
                        />
                      ) : (
                        <span className="text-xs text-zinc-600">파일 없음</span>
                      )}
                    </div>
                    <figcaption className="flex flex-col gap-0.5">
                      <span className="font-mono text-xs font-bold text-poke-400">{variant}</span>
                      <span className="text-xs text-zinc-300">{VARIANT_NOTE[variant]}</span>
                      <span className="text-[11px] text-zinc-500">
                        {meta.size}px · {meta.ext.toUpperCase()}
                      </span>
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          </Section>

          <Section title="4. 없는 정보" hint="PokéAPI에는 있지만 동기화하지 않음 — 쓰려면 스크립트 확장 필요">
            <div className="flex flex-wrap gap-1.5">
              {NOT_STORED.map((x) => (
                <span key={x} className="rounded-full border border-zinc-800 px-2.5 py-1 text-xs text-zinc-500">
                  {x}
                </span>
              ))}
            </div>
          </Section>

          <details className="rounded-xl bg-zinc-900 p-4">
            <summary className="cursor-pointer text-sm font-bold text-zinc-400">
              원본 JSON
            </summary>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-zinc-950 p-3 text-xs text-zinc-300">
              {JSON.stringify(mon, null, 2)}
            </pre>
          </details>
        </>
      )}
    </main>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-zinc-900 p-4">
      <div className="flex flex-wrap items-baseline gap-2">
        <h2 className="font-black">{title}</h2>
        {hint && <span className="text-xs text-zinc-500">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-zinc-800/60 px-3 py-2">
      <span className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</span>
      <span className="text-zinc-100">{children}</span>
    </div>
  );
}
