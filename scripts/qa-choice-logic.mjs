import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";

const source = await readFile(new URL("../src/components/entangled/choice-data.ts", import.meta.url), "utf8");
const logic = await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString("base64")}`);
const { choiceCategories, compareGestures, playRound, createDecision, parseDecisionHistory, randomIndex, getChoiceBatch, createChoiceId } = logic;
let assertions = 0;
function check(fn) { fn(); assertions += 1; }

for (const category of Object.values(choiceCategories)) {
  check(() => assert.equal(category.options.length, 20));
  check(() => assert.equal(new Set(category.options.map((option) => option.id)).size, 20));
  const before = JSON.stringify(category.options);
  const first = getChoiceBatch(category.options, "All", 0);
  const second = getChoiceBatch(category.options, "All", 1);
  check(() => assert.equal(first.length, 10));
  check(() => assert.equal(second.length, 10));
  check(() => assert.equal(new Set([...first, ...second].map(item => item.id)).size, 20));
  check(() => assert.deepEqual(getChoiceBatch(category.options, "All", 2), first));
  check(() => assert.deepEqual(getChoiceBatch(category.options, "All", -1), second));
  check(() => assert.deepEqual(getChoiceBatch(category.options, "not-a-group", 0), []));
  check(() => assert.equal(JSON.stringify(category.options), before));
  for (const group of category.groups) {
    check(() => assert.equal(category.options.filter((option) => option.group === group).length, 5));
    check(() => assert.equal(getChoiceBatch(category.options, group, 0).length, 5));
    check(() => assert.ok(getChoiceBatch(category.options, group, 1).every(item => item.group === group)));
  }
  const extended = [...category.options, { id: 'custom-test', name: 'Personal', detail: 'My own idea', group: 'My Possibilities', custom: true }];
  check(() => assert.equal(getChoiceBatch(extended, 'All', 2).length, 1));
  check(() => assert.equal(getChoiceBatch(extended, 'My Possibilities', 0)[0].id, 'custom-test'));
  for (const option of category.options) {
    check(() => assert.ok(option.name.length > 0 && option.detail.length > 0));
    check(() => assert.equal(option.image, `/entangled/choices-v4/${option.id}.webp`));
    const bytes = await readFile(new URL(`../public${option.image}`, import.meta.url));
    check(() => assert.equal(bytes.subarray(8, 12).toString(), 'WEBP'));
  }
  // A bet from the other batch must remain usable in the cross-batch selection pool.
  const retained = [first[0], second[0]];
  const crossBatch = playRound({ mode: 'guess', options: retained, betId: second[0].id }, () => .75);
  check(() => assert.equal(crossBatch.outcome, 'win'));
}
const options = choiceCategories.food.options.slice(0, 4);
const betId = options[0].id;
check(() => assert.throws(() => playRound({ mode: "guess", options: options.slice(0, 1), betId })));
check(() => assert.throws(() => playRound({ mode: "guess", options, betId: "not-selected" })));
check(() => assert.throws(() => playRound({ mode: "poker", options, betId })));
check(() => assert.throws(() => playRound({ mode: "rps", options, betId })));
check(() => assert.throws(() => randomIndex(0)));
check(() => assert.throws(() => randomIndex(4, () => 1)));
check(() => assert.throws(() => randomIndex(4, () => -0.1)));
check(() => assert.throws(() => randomIndex(4, () => Number.NaN)));

const expected = {
  rock: { rock: "draw", scissors: "win", paper: "lose" },
  scissors: { rock: "lose", scissors: "draw", paper: "win" },
  paper: { rock: "win", scissors: "lose", paper: "draw" },
};
const order = ["rock", "scissors", "paper"];
for (const player of order) {
  for (const [index, opponent] of order.entries()) {
    const result = playRound({ mode: "rps", options, betId, gesture: player }, () => (index + 0.1) / 3);
    check(() => assert.equal(compareGestures(player, opponent), expected[player][opponent]));
    check(() => assert.equal(result.outcome, expected[player][opponent]));
    check(() => assert.equal(result.opponent, opponent));
    if (result.outcome !== "win") check(() => assert.throws(() => createDecision("food", result)));
  }
}
for (let card = 0; card < 52; card += 1) {
  for (const color of ["red", "black"]) {
    const result = playRound({ mode: "poker", options, betId, color }, () => (card + 0.1) / 52);
    check(() => assert.equal(result.outcome, color === (card < 26 ? "red" : "black") ? "win" : "lose"));
    check(() => assert.equal(result.suit, ["♥", "♦", "♠", "♣"][Math.floor(card / 13)]));
    if (result.outcome === "lose") check(() => assert.throws(() => createDecision("food", result)));
  }
}
for (const [index, option] of options.entries()) {
  const result = playRound({ mode: "guess", options, betId }, () => (index + 0.1) / options.length);
  check(() => assert.equal(result.drawn.id, option.id));
  check(() => assert.equal(result.outcome, index === 0 ? "win" : "lose"));
  if (index !== 0) check(() => assert.throws(() => createDecision("food", result)));
}
const win = playRound({ mode: "guess", options, betId }, () => 0);
const decision = createDecision("food", win, new Date("2026-09-07T10:00:00Z"));
check(() => assert.equal(decision.option.id, betId));
check(() => assert.equal(decision.decidedAt, "2026-09-07T10:00:00.000Z"));
check(() => assert.deepEqual(parseDecisionHistory(JSON.stringify([decision])), [decision]));
check(() => assert.deepEqual(parseDecisionHistory("garbage"), []));
check(() => assert.deepEqual(parseDecisionHistory(JSON.stringify([{ ...decision, categoryId: "bogus" }])), []));
check(() => assert.deepEqual(parseDecisionHistory(JSON.stringify([{ ...decision, option: {} }])), []));
const uuidDescriptor = Object.getOwnPropertyDescriptor(globalThis.crypto, 'randomUUID');
try {
  Object.defineProperty(globalThis.crypto, 'randomUUID', { value: undefined, configurable: true });
  const ids = Array.from({ length: 100 }, createChoiceId);
  check(() => assert.equal(new Set(ids).size, 100));
  for (const id of ids) check(() => assert.match(id, /^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/));
  check(() => assert.equal(createDecision('food', win).option.id, betId));
} finally {
  if (uuidDescriptor) Object.defineProperty(globalThis.crypto, 'randomUUID', uuidDescriptor);
  else delete globalThis.crypto.randomUUID;
}
console.log(`Choice Lab logic passed: ${assertions} assertions. All 52 cards × 2 predictions; all 9 RPS outcomes; guesses, guards, and history validated.`);
