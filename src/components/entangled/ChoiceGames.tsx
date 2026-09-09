import Image from "next/image";
import type { ReactNode, RefObject } from "react";
import type { CardColor, ChoiceOption, Gesture, RoundResult } from "./choice-data";
import { gestures } from "./choice-data";
import { ChoiceOrbit, HandGlyph } from "./ChoiceArtwork";
import styles from "./ChoiceRoomV4.module.css";

type GameProps = {
  bet?: ChoiceOption;
  round: RoundResult | null;
  revealed: boolean;
  busy: boolean;
  canDraw: boolean;
  onDraw: () => void;
  children: ReactNode;
};

export function PokerTable({ bet, round, revealed, busy, canDraw, onDraw, children, cardRef, color, onColor }: GameProps & {
  cardRef: RefObject<HTMLDivElement | null>;
  color: CardColor | null;
  onColor: (color: CardColor) => void;
}) {
  const label = revealed ? `${round?.color === "red" ? "Red card" : "Black card"} · ${round?.rank}${round?.suit}` : "An unrevealed card";
  return <div className={styles.pokerTable} data-game-ui="poker" data-busy={busy}>
    <div className={styles.pokerScene}>
      <span className={styles.sceneOverline}>THE CARD SALON / FORTUNE DECK</span>
      <ChoiceOrbit className={styles.tableOrbit} />
      <div className={styles.pokerDeck}>
        <div className={`${styles.ghostCard} ${styles.ghostLeft}`} data-deck-left aria-hidden="true">✳</div>
        <div className={`${styles.ghostCard} ${styles.ghostRight}`} data-deck-right aria-hidden="true">✳</div>
        <div className={styles.cardSpace}>
          <div ref={cardRef} className={styles.cardRotor} data-testid="choice-card" aria-label={label}>
            <div className={styles.cardBack} aria-hidden={revealed}>
              <ChoiceOrbit className={styles.cardOrbit} /><span className={styles.backCorner}>E♠S</span>
              <span className={styles.cardSeal}>E<i>S</i></span><span className={styles.backFoot}>A LITTLE CHANCE</span>
              {!revealed && <button className={styles.touchCard} type="button" disabled={!canDraw} onClick={onDraw} aria-label="Touch the card to reveal it"><span>{canDraw ? "TURN THE CARD" : "CALL RED OR BLACK"}</span></button>}
            </div>
            <div className={styles.cardFront} data-red={round?.color === "red"} aria-hidden={!revealed}>
              <span className={styles.cardCorner}>{round?.rank}<small>{round?.suit}</small></span>
              <span className={styles.faceSymbol}>{revealed ? round?.suit : "✧"}</span>
              <strong className={styles.faceName}>{revealed ? label : ""}</strong>
              <span className={styles.cardCornerBottom}>{round?.rank}<small>{round?.suit}</small></span>
            </div>
          </div>
        </div>
      </div>
      <span className={styles.sceneFoot}>52 CARDS · TWO COLOURS · YOUR INTUITION</span>
    </div>
    <div className={styles.pokerControls}>
      <p className={styles.gameKicker}>01 / TRUST YOUR INSTINCT</p><h4>Red, or black?</h4>
      <p className={styles.gameDescription}>{bet ? `If the card agrees, today belongs to “${bet.name}.”` : "Wager on the possibility that draws you, then call its colour."}</p>
      <fieldset className={styles.colourChoices} disabled={!bet || busy || !!round}><legend>Call the colour of the next card</legend>
        <button type="button" aria-label="Red card" aria-pressed={color === "red"} onClick={() => onColor("red")}><span aria-hidden="true">♥</span>RED<small>HEARTS & DIAMONDS</small></button>
        <button type="button" aria-label="Black card" aria-pressed={color === "black"} onClick={() => onColor("black")}><span aria-hidden="true">♠</span>BLACK<small>SPADES & CLUBS</small></button>
      </fieldset>
      {!revealed && <button type="button" className={styles.drawButton} disabled={!canDraw} onClick={onDraw}>{busy ? "SHUFFLING THE DECK…" : !bet ? "WAGER ON A POSSIBILITY" : !color ? "CALL RED OR BLACK" : "TURN THE CARD OF FATE"}<span aria-hidden="true">↗</span></button>}
      {children}
    </div>
  </div>;
}

export function RockPaperScissorsArena({ bet, round, revealed, busy, canDraw, onDraw, children, gesture, onGesture, countdown }: GameProps & {
  gesture: Gesture | null;
  onGesture: (gesture: Gesture) => void;
  countdown: number | null;
}) {
  const player = revealed ? round?.player ?? "rock" : busy ? "rock" : gesture ?? "rock";
  const opponent = revealed ? round?.opponent ?? "rock" : "rock";
  const name = (value: Gesture) => gestures.find((item) => item.id === value)?.name;
  return <div className={styles.duelArena} data-game-ui="rps" data-busy={busy}>
    <div className={styles.duelHeading}><p className={styles.gameKicker}>02 / A FAIR FIGHT</p><h4>One hand. One answer.</h4><p>{bet ? `Win this round for “${bet.name}.”` : "Choose an answer, then let one honest duel make its case."}</p></div>
    <div className={styles.duelStage} data-outcome={revealed ? round?.outcome : "pending"}>
      <div className={styles.duelPlayer}><span>YOU</span><div data-duel-hand><HandGlyph gesture={player} /></div><strong>{revealed || gesture ? name(player) : "READY YOUR HAND"}</strong></div>
      <div className={styles.duelVersus}><span aria-hidden="true">{busy && countdown ? countdown : revealed ? round?.outcome === "win" ? "WIN" : round?.outcome === "draw" ? "TIE" : "NEXT" : "VS"}</span><small role="status" aria-live="polite">{busy && countdown ? `${countdown}, ready` : revealed ? "The duel is decided" : "One fair contest"}</small></div>
      <div className={styles.duelOpponent}><span>CHANCE</span><div data-duel-hand><HandGlyph gesture={opponent} /></div><strong>{revealed ? name(opponent) : "AWAITING THE REVEAL"}</strong></div>
    </div>
    <fieldset className={styles.gestureChoices} disabled={!bet || busy || !!round}><legend>Choose your hand</legend>{gestures.map((item) => <button key={item.id} type="button" aria-pressed={gesture === item.id} onClick={() => onGesture(item.id)}><HandGlyph gesture={item.id} /><span>{item.name}</span></button>)}</fieldset>
    {!revealed && <button type="button" className={styles.duelButton} disabled={!canDraw} onClick={onDraw}>{busy ? "ROCK, PAPER, SCISSORS!" : !bet ? "WAGER ON A POSSIBILITY" : !gesture ? "CHOOSE YOUR HAND" : "READY—THROW"}<span aria-hidden="true">→</span></button>}
    <div className={styles.duelResult}>{children}</div>
  </div>;
}

export function DrawLotsRoom({ bet, round, revealed, busy, canDraw, onDraw, children, options, activeIndex, onBet }: GameProps & {
  options: ChoiceOption[];
  activeIndex: number | null;
  onBet: (id: string) => void;
}) {
  return <div className={styles.lotteryRoom} data-game-ui="guess" data-busy={busy}>
    <div className={styles.lotteryHeading}><div><p className={styles.gameKicker}>03 / LETTERS FROM POSSIBILITY</p><h4>Which letter bears the answer?</h4></div><p>Seal your hunch in one envelope, then let chance deliver the correspondence.<br />Every chosen possibility receives an equal invitation.</p></div>
    <div className={styles.envelopeGrid}>{options.map((option, index) => <button key={option.id} type="button" className={styles.envelope} data-ticket-index={index} data-lit={activeIndex === index} data-winner={revealed && round?.drawn.id === option.id} aria-pressed={bet?.id === option.id} disabled={busy || !!round} onClick={() => onBet(option.id)}>
      <span className={styles.envelopeFold} aria-hidden="true" /><small>LETTER {String(index + 1).padStart(2, "0")}</small><span className={styles.waxSeal} aria-hidden="true">{bet?.id === option.id ? "✳" : "ES"}</span><strong>{option.name}</strong><span className={styles.envelopeHint}>{revealed && round?.drawn.id === option.id ? "CHANCE CHOSE THIS LETTER" : bet?.id === option.id ? "MY PRESENTIMENT" : "CHOOSE THIS LETTER"}</span>
    </button>)}</div>
    <div className={styles.lotteryDock}>
      {revealed && round ? <div className={styles.openLetter} data-open-letter>{round.drawn.image && <Image src={round.drawn.image} alt={round.drawn.name} width={160} height={160} unoptimized />}<div><span>CHANCE DELIVERED</span><strong>{round.drawn.name}</strong><p>{round.drawn.detail}</p></div></div> : <p>{bet ? `Your presentiment rests with “${bet.name}.” The correspondence is ready.` : "Choose one letter above and name where you believe the answer waits."}</p>}
      {!revealed && <button type="button" className={styles.lotteryButton} disabled={!canDraw} onClick={onDraw}>{busy ? "THE LETTER IS TRAVELLING…" : !bet ? "NAME YOUR HUNCH" : "LET CHANCE DRAW A LETTER"}<span aria-hidden="true">↗</span></button>}
    </div>
    <div className={styles.lotteryResult}>{children}</div>
  </div>;
}
