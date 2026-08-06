/**
 * Did this game count as a win?
 *
 * Two bars per difficulty: `clear` is "you can do this", `perfect` is the
 * ceiling. Both are DATA in the catalog and judged here by a pure function —
 * the same rule badges follow, so a threshold never ends up buried in a
 * component where nobody can find it.
 */
export type ClearGoal =
  /** correct / planned ≥ min. */
  | { kind: "accuracy"; min: number }
  /** At least this many right, regardless of how many were asked. */
  | { kind: "correctCount"; min: number }
  /** Bingo: at least this many completed lines. */
  | { kind: "bingoLines"; min: number }
  /** Everything attempted was right (and something was attempted). */
  | { kind: "noMistakes" };

/**
 * Everything a goal may look at, pulled out of a graded play.
 *
 * `planned` vs `attempted` is the pair that matters: accuracy divides by
 * PLANNED, never by what the player got round to. Otherwise quitting one
 * question in — with that one question right — would read as 100%, which is
 * both a clear and a perfect. Quitting early has to cost you.
 */
export interface ClearFacts {
  /** Questions the challenge actually generated (bingo: cells on the board). */
  planned: number;
  /** Questions the player actually reached. */
  attempted: number;
  correct: number;
  /** Bingo only: completed lines. 0 for every other mode. */
  lines: number;
}

export interface ClearGoals {
  clear: ClearGoal;
  perfect: ClearGoal;
}

export interface ClearStatus {
  cleared: boolean;
  perfect: boolean;
}

export function meetsGoal(goal: ClearGoal, facts: ClearFacts): boolean {
  switch (goal.kind) {
    case "accuracy":
      return facts.planned > 0 && facts.correct / facts.planned >= goal.min;
    case "correctCount":
      return facts.correct >= goal.min;
    case "bingoLines":
      return facts.lines >= goal.min;
    case "noMistakes":
      return facts.attempted > 0 && facts.correct === facts.attempted;
  }
}

/**
 * Judge a finished game against its challenge's two bars.
 *
 * Perfect implies cleared — you cannot ace a challenge you did not pass. That
 * matters for time-attack, whose perfect goal ("no mistakes") is otherwise
 * satisfied by answering one question correctly and stopping.
 */
export function judgeClear(goals: ClearGoals, facts: ClearFacts): ClearStatus {
  const cleared = meetsGoal(goals.clear, facts);
  return { cleared, perfect: cleared && meetsGoal(goals.perfect, facts) };
}
