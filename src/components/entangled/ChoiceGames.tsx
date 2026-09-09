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
  const label = revealed ? `${round?.color === "red" ? "红牌" : "黑牌"} · ${round?.rank}${round?.suit}` : "尚未揭晓的牌";
  return <div className={styles.pokerTable} data-game-ui="poker" data-busy={busy}>
    <div className={styles.pokerScene}>
      <span className={styles.sceneOverline}>THE CARD SALON / 命运扑克</span>
      <ChoiceOrbit className={styles.tableOrbit} />
      <div className={styles.pokerDeck}>
        <div className={`${styles.ghostCard} ${styles.ghostLeft}`} data-deck-left aria-hidden="true">✳</div>
        <div className={`${styles.ghostCard} ${styles.ghostRight}`} data-deck-right aria-hidden="true">✳</div>
        <div className={styles.cardSpace}>
          <div ref={cardRef} className={styles.cardRotor} data-testid="choice-card" aria-label={label}>
            <div className={styles.cardBack} aria-hidden={revealed}>
              <ChoiceOrbit className={styles.cardOrbit} /><span className={styles.backCorner}>E♠S</span>
              <span className={styles.cardSeal}>E<i>S</i></span><span className={styles.backFoot}>A LITTLE CHANCE</span>
              {!revealed && <button className={styles.touchCard} type="button" disabled={!canDraw} onClick={onDraw} aria-label="轻触牌背揭晓"><span>{canDraw ? "轻触翻牌" : "先猜红或黑"}</span></button>}
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
      <p className={styles.gameKicker}>01 / TRUST YOUR INSTINCT</p><h4>红，还是黑？</h4>
      <p className={styles.gameDescription}>{bet ? `如果猜对，今天就选「${bet.name}」。` : "先在上方押一个心动的候选，再猜牌色。"}</p>
      <fieldset className={styles.colourChoices} disabled={!bet || busy || !!round}><legend>猜下一张牌的颜色</legend>
        <button type="button" aria-label="红牌" aria-pressed={color === "red"} onClick={() => onColor("red")}><span aria-hidden="true">♥</span>红牌<small>HEARTS & DIAMONDS</small></button>
        <button type="button" aria-label="黑牌" aria-pressed={color === "black"} onClick={() => onColor("black")}><span aria-hidden="true">♠</span>黑牌<small>SPADES & CLUBS</small></button>
      </fieldset>
      {!revealed && <button type="button" className={styles.drawButton} disabled={!canDraw} onClick={onDraw}>{busy ? "正在洗牌…" : !bet ? "先押一个候选" : !color ? "先猜红或黑" : "翻开命运的牌"}<span aria-hidden="true">↗</span></button>}
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
    <div className={styles.duelHeading}><p className={styles.gameKicker}>02 / A FAIR FIGHT</p><h4>一拳，结束纠结。</h4><p>{bet ? `为「${bet.name}」赢下这一局。` : "先选一个答案，再用一场猜拳为它争取机会。"}</p></div>
    <div className={styles.duelStage} data-outcome={revealed ? round?.outcome : "pending"}>
      <div className={styles.duelPlayer}><span>YOU / 你</span><div data-duel-hand><HandGlyph gesture={player} /></div><strong>{revealed || gesture ? name(player) : "准备出拳"}</strong></div>
      <div className={styles.duelVersus}><span aria-hidden="true">{busy && countdown ? countdown : revealed ? round?.outcome === "win" ? "WIN" : round?.outcome === "draw" ? "TIE" : "NEXT" : "VS"}</span><small role="status" aria-live="polite">{busy && countdown ? `${countdown}，准备` : revealed ? "胜负已分晓" : "一场公平的较量"}</small></div>
      <div className={styles.duelOpponent}><span>CHANCE / 偶然</span><div data-duel-hand><HandGlyph gesture={opponent} /></div><strong>{revealed ? name(opponent) : "等待揭晓"}</strong></div>
    </div>
    <fieldset className={styles.gestureChoices} disabled={!bet || busy || !!round}><legend>准备出什么？</legend>{gestures.map((item) => <button key={item.id} type="button" aria-pressed={gesture === item.id} onClick={() => onGesture(item.id)}><HandGlyph gesture={item.id} /><span>{item.name}</span></button>)}</fieldset>
    {!revealed && <button type="button" className={styles.duelButton} disabled={!canDraw} onClick={onDraw}>{busy ? "石头，剪刀，布！" : !bet ? "先押一个候选" : !gesture ? "先选你的手势" : "准备好了，出拳"}<span aria-hidden="true">→</span></button>}
    <div className={styles.duelResult}>{children}</div>
  </div>;
}

export function DrawLotsRoom({ bet, round, revealed, busy, canDraw, onDraw, children, options, activeIndex, onBet }: GameProps & {
  options: ChoiceOption[];
  activeIndex: number | null;
  onBet: (id: string) => void;
}) {
  return <div className={styles.lotteryRoom} data-game-ui="guess" data-busy={busy}>
    <div className={styles.lotteryHeading}><div><p className={styles.gameKicker}>03 / LETTERS FROM POSSIBILITY</p><h4>哪封信，会写着答案？</h4></div><p>先点一封信押下预感，再让光标替你抽签。<br />每个已选候选的机会相同。</p></div>
    <div className={styles.envelopeGrid}>{options.map((option, index) => <button key={option.id} type="button" className={styles.envelope} data-ticket-index={index} data-lit={activeIndex === index} data-winner={revealed && round?.drawn.id === option.id} aria-pressed={bet?.id === option.id} disabled={busy || !!round} onClick={() => onBet(option.id)}>
      <span className={styles.envelopeFold} aria-hidden="true" /><small>LETTER {String(index + 1).padStart(2, "0")}</small><span className={styles.waxSeal} aria-hidden="true">{bet?.id === option.id ? "✳" : "ES"}</span><strong>{option.name}</strong><span className={styles.envelopeHint}>{revealed && round?.drawn.id === option.id ? "抽中了这封信" : bet?.id === option.id ? "这是我的预感" : "点选这封信"}</span>
    </button>)}</div>
    <div className={styles.lotteryDock}>
      {revealed && round ? <div className={styles.openLetter} data-open-letter>{round.drawn.image && <Image src={round.drawn.image} alt={round.drawn.name} width={160} height={160} unoptimized />}<div><span>偶然抽中了</span><strong>{round.drawn.name}</strong><p>{round.drawn.detail}</p></div></div> : <p>{bet ? `你的预感是「${bet.name}」。准备打开来信。` : "点选上方的一封信，先猜答案落在哪里。"}</p>}
      {!revealed && <button type="button" className={styles.lotteryButton} disabled={!canDraw} onClick={onDraw}>{busy ? "来信正在穿行…" : !bet ? "先猜一个候选" : "让偶然抽一封"}<span aria-hidden="true">↗</span></button>}
    </div>
    <div className={styles.lotteryResult}>{children}</div>
  </div>;
}
