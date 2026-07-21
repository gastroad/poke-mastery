import type { PlayRecord } from "@/shared/play";
import { judgeAnswer } from "../answer/judgeAnswer";
import type { PlayOutcome } from "../progress/types";
import { getChallenge } from "./catalog";
import { generateQuestions } from "./generateQuestions";
import type { Dataset } from "./types";

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
