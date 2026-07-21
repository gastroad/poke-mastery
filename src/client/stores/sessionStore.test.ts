import { beforeEach, describe, expect, it } from "vitest";
import { INITIAL_LIVES, useSessionStore } from "./sessionStore";
import type { ChallengeRule } from "@/domain/challenge/types";
import type { Pokemon } from "@/domain/pokemon/types";

const dataset: Pokemon[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  nameKo: `포켓몬${i + 1}`,
  nameEn: `pokemon${i + 1}`,
  generation: 1,
  types: ["normal"],
  acceptedAnswers: [`포켓몬${i + 1}`],
}));

const challenge = {
  id: "test-challenge",
  rule: { mode: "quiz", pool: { generations: [1] }, questionCount: 5 } as ChallengeRule,
};

const store = () => useSessionStore.getState();
const answerCurrent = (correct: boolean) => {
  const q = store().questions[store().currentIndex];
  store().setInput(correct ? q.answer : "완전히틀린답");
  store().submit();
};

beforeEach(() => store().reset());

describe("sessionStore", () => {
  it("start() generates the question set and begins playing", () => {
    store().start(challenge, dataset, 777);
    expect(store().status).toBe("playing");
    expect(store().questions).toHaveLength(5);
    expect(store().currentIndex).toBe(0);
    expect(store().lives).toBe(INITIAL_LIVES);
  });

  it("start() is deterministic for the same seed", () => {
    store().start(challenge, dataset, 777);
    const first = store().questions.map((q) => q.pokemonId);
    store().start(challenge, dataset, 777);
    expect(store().questions.map((q) => q.pokemonId)).toEqual(first);
  });

  it("a correct submit reveals the answer and grows the combo", () => {
    store().start(challenge, dataset, 1);
    answerCurrent(true);
    expect(store().phase).toBe("revealed");
    expect(store().lastResult).toBe("correct");
    expect(store().combo).toBe(1);
    expect(store().lives).toBe(INITIAL_LIVES);
    expect(store().results).toEqual([{ input: store().questions[0].answer, correct: true }]);
  });

  it("a wrong submit loses a life and resets the combo", () => {
    store().start(challenge, dataset, 1);
    answerCurrent(true);
    store().next();
    answerCurrent(false);
    expect(store().lastResult).toBe("wrong");
    expect(store().combo).toBe(0);
    expect(store().maxCombo).toBe(1);
    expect(store().lives).toBe(INITIAL_LIVES - 1);
  });

  it("next() advances to the next question and clears input", () => {
    store().start(challenge, dataset, 1);
    answerCurrent(true);
    store().next();
    expect(store().currentIndex).toBe(1);
    expect(store().input).toBe("");
    expect(store().phase).toBe("answering");
    expect(store().lastResult).toBeNull();
  });

  it("finishes after the last question", () => {
    store().start(challenge, dataset, 1);
    for (let i = 0; i < 5; i++) {
      answerCurrent(true);
      store().next();
    }
    expect(store().status).toBe("finished");
    expect(store().results).toHaveLength(5);
    expect(store().maxCombo).toBe(5);
  });

  it("ends early (game over) when lives run out", () => {
    store().start(challenge, dataset, 1);
    for (let i = 0; i < INITIAL_LIVES; i++) {
      answerCurrent(false);
      store().next();
    }
    expect(store().status).toBe("finished");
    expect(store().lives).toBe(0);
    expect(store().currentIndex).toBe(INITIAL_LIVES - 1); // never reached question 5
  });

  it("submit is ignored after the answer is already revealed", () => {
    store().start(challenge, dataset, 1);
    answerCurrent(true);
    const snapshot = store().results.length;
    store().submit(); // phase is "revealed" -> no-op
    expect(store().results).toHaveLength(snapshot);
  });

  it("recordAndAdvance (time-attack) records and advances without a reveal", () => {
    store().start(challenge, dataset, 1);
    const answer = store().questions[0].answer;
    store().setInput(answer);
    store().recordAndAdvance(true);
    expect(store().results).toEqual([{ input: answer, correct: true }]);
    expect(store().currentIndex).toBe(1);
    expect(store().phase).toBe("answering"); // never entered reveal
    expect(store().combo).toBe(1);
  });

  it("recordAndAdvance(false) records a miss and resets the combo", () => {
    store().start(challenge, dataset, 1);
    store().setInput(store().questions[0].answer);
    store().recordAndAdvance(true);
    store().setInput("몰라");
    store().recordAndAdvance(false);
    expect(store().combo).toBe(0);
    expect(store().results).toHaveLength(2);
    expect(store().results[1]).toEqual({ input: "몰라", correct: false });
  });

  it("finishNow ends the game", () => {
    store().start(challenge, dataset, 1);
    store().finishNow();
    expect(store().status).toBe("finished");
  });

  it("recordAndAdvance adds points to the score only on a correct answer", () => {
    store().start(challenge, dataset, 1);
    store().setInput(store().questions[0].answer);
    store().recordAndAdvance(true, 80);
    expect(store().score).toBe(80);
    store().setInput("몰라");
    store().recordAndAdvance(false, 80);
    expect(store().score).toBe(80); // a miss adds nothing
  });
});
