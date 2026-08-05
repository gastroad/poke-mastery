import { create } from "zustand";
import { judgeAnswer } from "@/domain/answer/judgeAnswer";
import { cellAt } from "@/domain/bingo/cellAnswers";
import { generateBingoBoard } from "@/domain/bingo/generateBoard";
import { judgePlacement } from "@/domain/bingo/placement";
import type { BingoBoard, BingoRule, Placement } from "@/domain/bingo/types";
import { generateQuestions } from "@/domain/challenge/generateQuestions";
import type { ChallengeRule, Dataset, Question } from "@/domain/challenge/types";
import type { Pokemon, PokemonId } from "@/domain/pokemon/types";

/**
 * Session store = the state of the CURRENT game only (which question, input,
 * combo, lives, status). It holds NO game rules: answer judging and question
 * generation are delegated to pure `domain/` functions, and the store just
 * stores their results. That keeps rules in one place so the server can replay
 * a game from the seed and recompute everything.
 */

export type GameStatus = "idle" | "playing" | "finished";
/** Within a question: still typing, or answered and showing the reveal. */
export type QuestionPhase = "answering" | "revealed";
export type AnswerResult = "correct" | "wrong";

/** What a game is started from: a challenge id (for the PlayRecord) + its rule. */
export interface StartChallenge {
  id: string;
  rule: ChallengeRule;
}

export interface AnsweredQuestion {
  /** Exactly what the player typed (raw), so the server can re-judge from the seed. */
  input: string;
  correct: boolean;
}

/** Wrong answers allowed before game over. */
export const INITIAL_LIVES = 3;

interface SessionState {
  // ── identity: (challenge + seed) fully determines the questions ──
  challenge: StartChallenge | null;
  seed: number;
  questions: Question[];

  // ── progress ──
  currentIndex: number;
  input: string;
  status: GameStatus;
  phase: QuestionPhase;
  lastResult: AnswerResult | null;

  // ── juice / scoring inputs ──
  lives: number;
  combo: number;
  maxCombo: number;
  /** Mode-specific session score (e.g. reveal-rush earliness points). */
  score: number;
  results: AnsweredQuestion[];

  // ── bingo only (see domain/bingo) ──
  board: BingoBoard | null;
  /** What sits in each cell, by index. */
  placed: (PokemonId | null)[];
  /** The raw input accepted into each cell — this array IS the PlayRecord's
      `attempts`, which is how the player's cell CHOICE survives to the server. */
  placedInputs: string[];
  /** The Pokémon the player has picked up but not placed yet. */
  held: Pokemon | null;
  /** Attempts left for the whole board. Only a placement spends one. */
  attemptsLeft: number;
  /** Verdict of the last drop, for the feedback line. */
  lastPlacement: Placement | null;

  // ── actions ──
  start: (challenge: StartChallenge, dataset: Dataset, seed: number) => void;
  setInput: (value: string) => void;
  submit: () => void;
  next: () => void;
  /** time-attack / reveal-rush: record the answer (+optional points) and advance immediately. */
  recordAndAdvance: (correct: boolean, points?: number) => void;
  /** time-attack: end the game (clock ran out). */
  finishNow: () => void;
  /** bingo: pick a Pokémon up (does NOT spend an attempt — placing does). */
  pickUp: (pokemon: Pokemon | null) => void;
  /** bingo: drop the held Pokémon into a cell. A wrong cell costs an attempt. */
  dropHeld: (cellIndex: number, dataset: Dataset) => void;
  reset: () => void;
}

const initialState = {
  challenge: null as StartChallenge | null,
  seed: 0,
  questions: [] as Question[],
  currentIndex: 0,
  input: "",
  status: "idle" as GameStatus,
  phase: "answering" as QuestionPhase,
  lastResult: null as AnswerResult | null,
  lives: INITIAL_LIVES,
  combo: 0,
  maxCombo: 0,
  score: 0,
  results: [] as AnsweredQuestion[],
  board: null as BingoBoard | null,
  placed: [] as (PokemonId | null)[],
  placedInputs: [] as string[],
  held: null as Pokemon | null,
  attemptsLeft: 0,
  lastPlacement: null as Placement | null,
};

/** Pull the bingo knobs out of a challenge rule (catalog fills them in). */
function bingoRuleOf(rule: ChallengeRule): BingoRule {
  return {
    size: rule.boardSize ?? 3,
    minAnswersPerCell: rule.minAnswersPerCell ?? 1,
    attempts: rule.attempts ?? 0,
  };
}

export const useSessionStore = create<SessionState>((set, get) => ({
  ...initialState,

  start: (challenge, dataset, seed) => {
    if (challenge.rule.mode === "bingo") {
      // Bingo has no question list: the board IS the game, and it's rebuilt from
      // this same seed on the server (see gradePlay).
      const rule = bingoRuleOf(challenge.rule);
      const board = generateBingoBoard(rule, dataset, seed);
      const cellCount = board ? board.size * board.size : 0;
      set({
        ...initialState,
        challenge,
        seed,
        board,
        placed: Array(cellCount).fill(null),
        placedInputs: Array(cellCount).fill(""),
        attemptsLeft: rule.attempts,
        status: board ? "playing" : "finished",
      });
      return;
    }
    set({
      ...initialState,
      challenge,
      seed,
      questions: generateQuestions(challenge.rule, dataset, seed),
      status: "playing",
    });
  },

  setInput: (value) => set({ input: value }),

  submit: () => {
    const { status, phase, questions, currentIndex, input, combo, maxCombo, lives, results } = get();
    if (status !== "playing" || phase !== "answering") return;
    const question = questions[currentIndex];
    if (!question) return;

    // Rule lives in domain; store only records the verdict.
    const correct = judgeAnswer(input, question.acceptedAnswers);
    const nextCombo = correct ? combo + 1 : 0;
    set({
      phase: "revealed",
      lastResult: correct ? "correct" : "wrong",
      combo: nextCombo,
      maxCombo: Math.max(maxCombo, nextCombo),
      lives: correct ? lives : lives - 1,
      results: [...results, { input, correct }],
    });
  },

  next: () => {
    const { status, phase, currentIndex, questions, lives } = get();
    if (status !== "playing" || phase !== "revealed") return;

    const isLastQuestion = currentIndex + 1 >= questions.length;
    if (isLastQuestion || lives <= 0) {
      set({ status: "finished" });
      return;
    }
    set({ currentIndex: currentIndex + 1, input: "", phase: "answering", lastResult: null });
  },

  recordAndAdvance: (correct, points = 0) => {
    const { status, questions, currentIndex, input, combo, maxCombo, score, results } = get();
    if (status !== "playing") return;
    const nextCombo = correct ? combo + 1 : 0;
    const nextIndex = currentIndex + 1;
    const isLast = nextIndex >= questions.length;
    set({
      results: [...results, { input, correct }],
      combo: nextCombo,
      maxCombo: Math.max(maxCombo, nextCombo),
      score: score + (correct ? points : 0),
      input: "",
      currentIndex: isLast ? currentIndex : nextIndex,
      status: isLast ? "finished" : "playing",
    });
  },

  finishNow: () => {
    if (get().status === "playing") set({ status: "finished" });
  },

  pickUp: (pokemon) => {
    if (get().status !== "playing") return;
    set({ held: pokemon, lastPlacement: null });
  },

  dropHeld: (cellIndex, dataset) => {
    const { status, board, held, placed, placedInputs, attemptsLeft } = get();
    if (status !== "playing" || !board || !held) return;
    const cell = cellAt(board, cellIndex);
    if (!cell || placed[cellIndex] !== null) return;

    // Rule lives in domain; the store only records the verdict.
    const result = judgePlacement(cell, held.nameKo, dataset, placed);
    const hit = result.kind === "placed";

    const nextPlaced = hit
      ? placed.map((v, i) => (i === cellIndex ? held.id : v))
      : placed;
    const nextInputs = hit
      ? placedInputs.map((v, i) => (i === cellIndex ? held.nameKo : v))
      : placedInputs;
    // Only a placement spends an attempt — a name that never reached a cell
    // (unknown, or already on the board) is rejected before this point.
    const left = hit ? attemptsLeft : attemptsLeft - 1;
    const boardFull = nextPlaced.every((id) => id !== null);

    set({
      placed: nextPlaced,
      placedInputs: nextInputs,
      attemptsLeft: left,
      held: null,
      lastPlacement: result,
      status: left <= 0 || boardFull ? "finished" : "playing",
    });
  },

  reset: () => set({ ...initialState }),
}));
