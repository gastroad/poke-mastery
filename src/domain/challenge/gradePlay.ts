import type { PlayRecord } from "@/shared/play";
import { judgeAnswer } from "../answer/judgeAnswer";
import { gradeBingoPlay } from "../bingo/gradeBingo";
import type { PlayOutcome } from "../progress/types";
import { getChallenge } from "./catalog";
import { generateQuestions } from "./generateQuestions";
import type { ChallengeRule, Dataset } from "./types";

export interface GradedPlay {
  challengeId: string;
  outcome: PlayOutcome;
  correctCount: number;
  questionCount: number;
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
    return gradeBingoRecord(challenge.id, challenge.rule, record, dataset);
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

  return {
    challengeId: challenge.id,
    outcome,
    correctCount: outcome.filter((o) => o.correct).length,
    questionCount: outcome.length,
  };
}

/**
 * Bingo isn't a list of questions, so it grades through its own module: rebuild
 * the board from the seed, then re-judge `attempts[cellIndex]` against the cell
 * it was dropped into. Illegal placements just leave the cell empty, so a
 * tampered record can only ever score LOWER than an honest one.
 */
function gradeBingoRecord(
  challengeId: string,
  rule: ChallengeRule,
  record: PlayRecord,
  dataset: Dataset,
): GradedPlay | null {
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

  return {
    challengeId,
    outcome: graded.outcome,
    correctCount: graded.filledCount,
    questionCount: graded.outcome.length,
  };
}
