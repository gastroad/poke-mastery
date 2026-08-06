import type { PlayRecord } from "@/shared/play";
import { judgeAnswer } from "../answer/judgeAnswer";
import { gradeBingoPlay } from "../bingo/gradeBingo";
import type { PlayOutcome } from "../progress/types";
import { getChallenge } from "./catalog";
import { type ClearStatus, judgeClear } from "./clear";
import { generateQuestions } from "./generateQuestions";
import type { ChallengeRule, Dataset } from "./types";

export interface GradedPlay {
  challengeId: string;
  outcome: PlayOutcome;
  correctCount: number;
  /** How many questions the player actually reached. */
  questionCount: number;
  /**
   * How many the challenge generated (bingo: cells on the board). Accuracy goals
   * divide by THIS, never by `questionCount` — otherwise quitting after one
   * correct answer would grade as a flawless run.
   */
  plannedCount: number;
  /** Bingo only: completed lines. 0 for every other mode. */
  lines: number;
  /** Judged against the challenge's own bars (see domain/challenge/clear). */
  status: ClearStatus;
}

/**
 * Server-side re-grading: from a PlayRecord alone, regenerate the exact
 * questions (deterministic seed) and re-judge the player's raw inputs. Returns
 * null for an unknown challenge. Only the questions the player actually
 * attempted are graded, so quitting early (lives out) isn't penalised as wrong.
 */
export function gradePlay(record: PlayRecord, dataset: Dataset): GradedPlay | null {
  const challenge = getChallenge(record.challengeId);
  if (!challenge) return null;
  if (challenge.rule.mode === "bingo") {
    return gradeBingoRecord(challenge, record, dataset);
  }

  const questions = generateQuestions(challenge.rule, dataset, record.seed);
  const typesById = new Map(dataset.map((p) => [p.id, p.types]));

  const graded = Math.min(questions.length, record.attempts.length);
  const outcome: PlayOutcome = Array.from({ length: graded }, (_, i) => {
    const q = questions[i];
    return {
      types: typesById.get(q.pokemonId) ?? [],
      correct: judgeAnswer(record.attempts[i], q.acceptedAnswers),
    };
  });

  const correctCount = outcome.filter((o) => o.correct).length;
  return {
    challengeId: challenge.id,
    outcome,
    correctCount,
    questionCount: outcome.length,
    // The generator caps at the pool size, so the plan is what it actually
    // produced — not what the rule asked for.
    plannedCount: questions.length,
    lines: 0,
    status: judgeClear(challenge.goals, {
      planned: questions.length,
      attempted: outcome.length,
      correct: correctCount,
      lines: 0,
    }),
  };
}

/**
 * Bingo isn't a list of questions, so it grades through its own module: rebuild
 * the board from the seed, then re-judge `attempts[cellIndex]` against the cell
 * it was dropped into. Illegal placements just leave the cell empty, so a
 * tampered record can only ever score LOWER than an honest one.
 */
function gradeBingoRecord(
  challenge: NonNullable<ReturnType<typeof getChallenge>>,
  record: PlayRecord,
  dataset: Dataset,
): GradedPlay | null {
  const rule: ChallengeRule = challenge.rule;
  const graded = gradeBingoPlay(
    {
      size: rule.boardSize ?? 3,
      minAnswersPerCell: rule.minAnswersPerCell ?? 1,
      attempts: rule.attempts ?? 0,
    },
    dataset,
    record.seed,
    record.attempts,
  );
  if (!graded) return null;

  // Every cell is graded whether or not it was filled, so planned == attempted.
  const cellCount = graded.outcome.length;
  return {
    challengeId: challenge.id,
    outcome: graded.outcome,
    correctCount: graded.filledCount,
    questionCount: cellCount,
    plannedCount: cellCount,
    lines: graded.lines.length,
    status: judgeClear(challenge.goals, {
      planned: cellCount,
      attempted: cellCount,
      correct: graded.filledCount,
      lines: graded.lines.length,
    }),
  };
}
