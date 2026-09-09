import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

// Run qa-choice-render.mjs first: its code-only compiler prepares these modules.
const compiled = name => pathToFileURL(path.resolve('temp/choice-render-test', name + '.mjs'));
const { PokerTable, RockPaperScissorsArena, DrawLotsRoom } = await import(compiled('ChoiceGames'));
const { choiceCategories, playRound, createLotterySequence } = await import(compiled('choice-data'));
const options = choiceCategories.food.options.slice(0, 4);
let assertions = 0;
for (let length = 2; length <= 28; length++) {
  for (let winner = 0; winner < length; winner++) {
    const sequence = createLotterySequence(length, winner);
    assert.equal(sequence.at(-1), winner);
    assert.ok(sequence.every(index => index >= 0 && index < length));
    assert.ok(sequence.length >= 18);
    assertions += 3;
  }
}
for (const args of [[1, 0], [4, -1], [4, 4], [2.5, 0], [4, NaN]]) {
  assert.throws(() => createLotterySequence(...args)); assertions++;
}
for (const mode of ['poker', 'rps', 'guess']) {
  for (const sample of [0, .4, .9]) {
    const round = playRound({ mode, options, betId: options[0].id, color: 'red', gesture: 'rock' }, () => sample);
    for (const revealed of [false, true]) {
      const Component = mode === 'poker' ? PokerTable : mode === 'rps' ? RockPaperScissorsArena : DrawLotsRoom;
      const props = { bet: options[0], round, revealed, busy: !revealed, canDraw: false, onDraw() {}, children: null, cardRef: { current: null }, color: 'red', onColor() {}, gesture: 'rock', onGesture() {}, countdown: revealed ? null : 3, options, activeIndex: 0, onBet() {} };
      const html = renderToStaticMarkup(React.createElement(Component, props));
      assert.ok(html.includes('data-game-ui="' + mode + '"'));
      assert.equal(html.includes('data-testid="choice-card"'), mode === 'poker');
      assert.equal(html.includes('data-duel-hand'), mode === 'rps');
      assert.equal(html.includes('data-ticket-index'), mode === 'guess');
      if (mode === 'guess') {
        assert.equal((html.match(/data-ticket-index=/g) || []).length, options.length);
        assert.equal(html.includes('data-open-letter'), revealed);
        assert.equal((html.match(/data-winner="true"/g) || []).length, revealed ? 1 : 0);
      }
      if (mode === 'rps' && !revealed) assert.ok(html.includes('3, ready'));
      assertions += 4;
    }
  }
}
console.log('Independent poker / duel / envelope SSR states and lottery sequence passed: ' + assertions + '+ assertions. No browser or visual QA.');
