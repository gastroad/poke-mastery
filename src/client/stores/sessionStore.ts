import { create } from "zustand";
import { judgeAnswer } from "@/domain/answer/judgeAnswer";
import { generateQuestions } from "@/domain/challenge/generateQuestions";
import type { ChallengeRule, Dataset, Question } from "@/domain/challenge/types";

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
  results: AnsweredQuestion[];

  // ── actions ──
  start: (challenge: StartChallenge, dataset: Dataset, seed: number) => void;
  setInput: (value: string) => void;
  submit: () => void;
  next: () => void;
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
  results: [] as AnsweredQuestion[],
};

export const useSessionStore = create<SessionState>((set, get) => ({
  ...initialState,

  start: (challenge, dataset, seed) => {
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

  reset: () => set({ ...initialState }),
}));
