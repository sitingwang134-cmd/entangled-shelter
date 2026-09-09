"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Image from "next/image";
import { ChoiceOrbit, HandGlyph } from "./ChoiceArtwork";
import { DrawLotsRoom, PokerTable, RockPaperScissorsArena } from "./ChoiceGames";
import {
  choiceCategories, createDecision, decisionHistoryKey, gameModes, gestures, parseDecisionHistory, playRound, getChoiceBatch, choiceBatchSize, createChoiceId, createLotterySequence,
} from "./choice-data";
import type { CardColor, CategoryId, ChoiceOption, Decision, GameMode, Gesture, RoundResult } from "./choice-data";
import { useSiteMotion } from "./site-motion";
import styles from "./ChoiceRoomV4.module.css";

export type { CategoryId } from "./choice-data";

if (typeof window !== "undefined") gsap.registerPlugin(useGSAP);

type Stage = "options" | "play" | "accepted";

export function ChoiceLab({ categoryId, onClose }: { categoryId: CategoryId; onClose: () => void }) {
  const motion = useSiteMotion();
  const reduced = motion === "reduced";
  const category = choiceCategories[categoryId];
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const drawTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const busyRef = useRef(false);
  const acceptedRef = useRef(false);
  const previousStage = useRef<Stage>("options");
  const [stage, setStage] = useState<Stage>("options");
  const [options, setOptions] = useState<ChoiceOption[]>(category.options);
  const [selectedIds, setSelectedIds] = useState<string[]>(category.options.slice(0, 4).map((option) => option.id));
  const [filter, setFilter] = useState("All");
  const [batch, setBatch] = useState(0);
  const [roundCount, setRoundCount] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [activeTicket, setActiveTicket] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [mode, setMode] = useState<GameMode>("poker");
  const [betId, setBetId] = useState<string | null>(null);
  const [color, setColor] = useState<CardColor | null>(null);
  const [gesture, setGesture] = useState<Gesture | null>(null);
  const [round, setRound] = useState<RoundResult | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<Decision[]>([]);
  const [saved, setSaved] = useState(false);
  const selected = useMemo(() => options.filter((option) => selectedIds.includes(option.id)), [options, selectedIds]);
  const bet = selected.find((option) => option.id === betId);
  const visibleOptions = useMemo(() => getChoiceBatch(options, filter, batch), [options, filter, batch]);
  const filteredCount = options.filter((option) => filter === "All" || option.group === filter).length;
  const batchCount = Math.max(1, Math.ceil(filteredCount / choiceBatchSize));
  const scene = categoryId === "food" ? "room" : categoryId === "style" ? "levitate" : "salt";
  const chapterTitle = categoryId === "food" ? "Taste" : categoryId === "style" ? "Style" : "Wander";
  const chosenMode = gameModes.find((item) => item.id === mode)!;
  const completed = isRevealed && !busy && !!round;
  const canDraw = !!bet && !busy && !round && (mode === "guess" || (mode === "poker" ? !!color : !!gesture));

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const bodyOverflow = document.body.style.overflow;
    const rootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    dialog.showModal();
    closeRef.current?.focus({ preventScroll: true });
    window.dispatchEvent(new CustomEvent("entangled:dialog", { detail: { open: true } }));
    return () => {
      busyRef.current = false;
      dialog.close();
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = rootOverflow;
      window.dispatchEvent(new CustomEvent("entangled:dialog", { detail: { open: false } }));
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  // Motion preference changes must not revert a live round and leave its busy
  // lock behind. The event context belongs to the stage; entrance motion has
  // its own preference-aware context below.
  const { contextSafe } = useGSAP(() => () => {
    drawTimelineRef.current = null;
  }, { scope: dialogRef, dependencies: [stage], revertOnUpdate: true });

  useGSAP(() => {
    if (previousStage.current !== stage) {
      if (dialogRef.current) dialogRef.current.scrollTop = 0;
      dialogRef.current?.querySelector<HTMLElement>("[data-stage-heading]")?.focus({ preventScroll: true });
      previousStage.current = stage;
    }
    if (reduced) {
      // Finish the existing reveal callbacks, retaining the already drawn
      // result, instead of killing the round midway through its card flip.
      drawTimelineRef.current?.progress(1);
    } else {
      gsap.fromTo("[data-lab-entrance]", { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.65, stagger: 0.055, ease: "power3.out" });
    }
  }, { scope: dialogRef, dependencies: [stage, reduced], revertOnUpdate: true });

  function resetRound() {
    if (busyRef.current) return;
    setRound(null);
    setIsRevealed(false);
    setCountdown(null);
    setActiveTicket(null);
    setError("");
    acceptedRef.current = false;
    contextSafe(() => {
      if (cardRef.current) gsap.set(cardRef.current, { rotationY: 0, y: 0, rotationZ: 0 });
    })();
  }

  useGSAP(() => {
    if (stage !== "options" || reduced) return;
    gsap.fromTo("[data-option-card]", { y: 32, rotation: -3, autoAlpha: 0 }, {
      y: 0, rotation: 0, autoAlpha: 1, duration: .5, stagger: .035, ease: "power3.out", clearProps: "transform,opacity,visibility",
    });
  }, { scope: dialogRef, dependencies: [stage, batch, filter, options.length, reduced], revertOnUpdate: true });

  function changeFilter(next: string) { setFilter(next); setBatch(0); }

  function changeMode(nextMode: GameMode) {
    if (busyRef.current) return;
    resetRound();
    setMode(nextMode);
    setColor(null);
    setGesture(null);
  }

  function selectBet(id: string) {
    if (busyRef.current) return;
    resetRound();
    setBetId(id);
  }

  function toggleOption(id: string) {
    setSelectedIds((previous) => previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]);
    setError("");
  }

  function addCustom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = custom.trim();
    if (!name) { setError("Write a particular possibility before placing it on the table."); return; }
    if (options.some((option) => option.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      setError("That possibility is already on the table; simply choose it there."); return;
    }
    if (options.filter((option) => option.custom).length >= 8) {
      setError("The table can hold eight personal possibilities. Let these answers play first."); return;
    }
    const option: ChoiceOption = { id: `custom-${createChoiceId()}`, name, detail: "A possibility written in your own hand", group: "My Possibilities", custom: true };
    setOptions((previous) => [...previous, option]);
    setSelectedIds((previous) => [...previous, option.id]);
    setCustom("");
    changeFilter("My Possibilities");
    setError("");
  }

  function trapTab(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusable = [...dialog.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex]:not([tabindex='-1'])")]
      .filter((element) => element.getClientRects().length > 0 && getComputedStyle(element).visibility !== "hidden");
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) { event.preventDefault(); return; }
    if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
      event.preventDefault();
      first.focus();
    }
  }

  function draw() {
    contextSafe(() => {
      if (!canDraw || !betId || busyRef.current) return;
      let nextRound: RoundResult;
      try {
        nextRound = playRound({ mode, options: selected, betId, color: color ?? undefined, gesture: gesture ?? undefined });
      } catch (cause) { setError(cause instanceof Error ? cause.message : "The card could not be dealt. Please try once more."); return; }
      busyRef.current = true;
      setBusy(true);
      setRoundCount((count) => count + 1);
      setRound(nextRound);
      setError("");
      const reveal = () => setIsRevealed(true);
      const finish = () => { drawTimelineRef.current = null; busyRef.current = false; setBusy(false); };
      if (reduced) {
        if (cardRef.current) gsap.set(cardRef.current, { rotationY: 180 });
        reveal();
        finish();
        return;
      }
      if (mode === "rps") {
        const timeline = gsap.timeline({ defaults: { ease: "power2.inOut" }, onComplete: finish });
        drawTimelineRef.current = timeline;
        for (const beat of [3, 2, 1]) {
          timeline.call(() => setCountdown(beat))
            .to("[data-duel-hand]", { y: -25, rotation: -8, duration: .22 })
            .to("[data-duel-hand]", { y: 0, rotation: 0, duration: .22 });
        }
        timeline.call(() => { setCountdown(null); reveal(); })
          .fromTo("[data-duel-hand]", { scale: .86 }, { scale: 1, duration: .4, ease: "back.out(1.8)" });
        return;
      }
      if (mode === "guess") {
        const timeline = gsap.timeline({ defaults: { ease: "none" }, onComplete: finish });
        drawTimelineRef.current = timeline;
        const winner = selected.findIndex((option) => option.id === nextRound.drawn.id);
        const sequence = createLotterySequence(selected.length, winner);
        sequence.forEach((index, step) => {
          timeline.call(() => setActiveTicket(index)).to({}, { duration: .035 + .14 * (step / (sequence.length - 1)) ** 3 });
        });
        timeline.call(reveal).to({}, { duration: .45 });
        return;
      }
      if (!cardRef.current) { reveal(); finish(); return; }
      drawTimelineRef.current = gsap.timeline({ defaults: { ease: "power2.inOut" }, onComplete: finish })
        .to("[data-deck-left]", { x: -52, rotation: -24, duration: .24 }, 0)
        .to("[data-deck-right]", { x: 52, rotation: 24, duration: .24 }, 0)
        .to(cardRef.current, { y: -30, rotationZ: -8, duration: 0.24 }, 0)
        .to("[data-deck-left], [data-deck-right]", { x: 0, rotation: 0, duration: .32 }, .24)
        .to(cardRef.current, { y: -12, rotationZ: 8, duration: 0.24 }, .24)
        .to(cardRef.current, { rotationZ: 0, rotationY: 90, duration: 0.36 })
        .call(reveal)
        .to(cardRef.current, { rotationY: 180, y: 0, duration: 0.5, ease: "power3.out" });
    })();
  }

  function accept() {
    if (!completed || !round || round.outcome !== "win" || acceptedRef.current) return;
    acceptedRef.current = true;
    try {
      const decision = createDecision(categoryId, round);
      let previous: Decision[] = [];
      try { previous = parseDecisionHistory(localStorage.getItem(decisionHistoryKey)); } catch { /* Storage may be disabled; the decision still works. */ }
      const next = [decision, ...previous].slice(0, 24);
      setHistory(next);
      try { localStorage.setItem(decisionHistoryKey, JSON.stringify(next)); setSaved(true); }
      catch { setSaved(false); }
      window.dispatchEvent(new CustomEvent("entangled:decision", { detail: decision }));
      setStage("accepted");
    } catch (cause) {
      acceptedRef.current = false;
      setError(cause instanceof Error ? cause.message : "Complete the round before accepting its answer.");
    }
  }

  const resultCopy = !completed ? "" : round.outcome === "win" ? "This time, chance stands beside you." : round.outcome === "draw" ? "A draw. Offer one more hand and let the answer emerge." : mode === "guess" ? `Chance drew “${round.drawn.name}”—a breath away from your hunch.` : mode === "rps" ? "Chance won this duel. Change your hand and challenge it once more." : "A missed call changes nothing: your desire remains.";
  const resultPanel = <>
    <div className={styles.roundStatus} role="status" aria-live="polite" aria-atomic="true">{completed && <><span className={styles.outcome}>{round.outcome === "win" ? mode === "rps" ? "YOU WON" : "IT’S A MATCH" : round.outcome === "draw" ? "ONE MORE" : "NOT THIS TIME"}</span><p>{resultCopy}</p>{mode === "rps" && <small>YOU: {gestures.find((item) => item.id === round.player)?.name} · CHANCE: {gestures.find((item) => item.id === round.opponent)?.name}</small>}</>}</div>
    {completed && <div className={styles.roundActions}>{round.outcome === "win" && <button type="button" className={styles.drawButton} onClick={accept}>CHOOSE “{round.bet.name}” <span aria-hidden="true">↗</span></button>}<button type="button" className={styles.retry} onClick={resetRound}>{round.outcome === "win" ? "THINK AGAIN, PLAY ANOTHER" : "ANOTHER ROUND / CHANGE YOUR HUNCH"}<span aria-hidden="true">↺</span></button></div>}
    {completed && round.outcome === "win" && <div key={roundCount} className={styles.celebration} aria-hidden="true">{["✦", "✧", "✦", "✧"].map((symbol, index) => <span key={index}>{symbol}</span>)}</div>}
  </>;

  return (
    <dialog ref={dialogRef} className={`${styles.dialog} ${styles.galleryEdition}`} data-choice-lab="true" data-category={categoryId} data-stage={stage} data-motion={motion} aria-labelledby="choice-lab-title" aria-describedby="choice-lab-description" onKeyDown={trapTab} onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <div className={styles.sheet}>
        <header className={styles.header}>
          <span className={styles.wordmark}>Entangled <i>Shelter</i><span>THE CHOICE ROOM</span></span>
          <span className={styles.edition}>NO. {categoryId === "food" ? "01" : categoryId === "style" ? "02" : "03"} / {category.english}</span>
          <button ref={closeRef} type="button" className={styles.close} onClick={onClose} aria-label="Close the choice room"><span aria-hidden="true">×</span></button>
        </header>

        <div className={styles.body}>
          <aside className={styles.introduction}>
            <div className={styles.introPainting} aria-hidden="true"><Image src={`/entangled/${scene}.webp`} alt="" fill sizes="(max-width: 760px) 100vw, 35vw" unoptimized /><ChoiceOrbit className={styles.introOrbit} /></div>
            <span className={styles.chapterWord} aria-hidden="true">{chapterTitle}</span>
            <p className={styles.eyebrow} data-lab-entrance>A LITTLE CHANCE, A LITTLE DESIRE / {category.label}</p>
            <h2 id="choice-lab-title" data-lab-entrance>{stage === "accepted" ? <>Then it is<br /><i>decided.</i></> : <>Allow yourself<br /><i>one answer.</i></>}</h2>
            <p id="choice-lab-description" className={styles.description} data-lab-entrance>{stage === "accepted" ? "Choosing does not banish every regret. It simply allows this moment to begin." : category.intro}</p>
            <ol className={styles.steps} aria-label="Decision steps" data-lab-entrance>
              {["Bring possibilities to the table", "Name a hunch, then ask chance", "If instinct prevails, choose it"].map((label, index) => <li key={label} data-active={(stage === "options" ? 0 : stage === "play" ? 1 : 2) === index} aria-current={(stage === "options" ? 0 : stage === "play" ? 1 : 2) === index ? "step" : undefined}><span>0{index + 1}</span>{label}</li>)}
            </ol>
            <div className={styles.marginNote} data-lab-entrance><span aria-hidden="true">✳</span><p>This is no decree from fate.<br />Only a small ritual for beginning.</p></div>
          </aside>

          <main className={styles.workspace}>
            {stage === "options" && <section className={styles.optionsStage} aria-label="Choose possibilities">
              <div className={styles.sectionHeading} data-lab-entrance><div><p className={styles.eyebrow}>01 / MAKE ROOM FOR POSSIBILITY</p><h3 tabIndex={-1} data-stage-heading>{category.question}</h3></div><span className={styles.counter}>{selected.length}<small>CHOSEN</small></span></div>
              <p className={styles.help} data-lab-entrance>Choose at least two answers you would gladly accept—or write one of your own.</p>
              <div className={styles.filters} aria-label="Filter possibilities" data-lab-entrance>{["All", ...category.groups, ...(options.some((option) => option.custom) ? ["My Possibilities"] : [])].map((group) => <button type="button" key={group} aria-pressed={filter === group} onClick={() => changeFilter(group)}>{group}</button>)}</div>
              <div className={styles.batchBar}><span role="status" aria-live="polite">{filteredCount} POSSIBILITIES · {visibleOptions.length} ON VIEW <small>{batch + 1} / {batchCount}</small></span><button type="button" className={styles.batchButton} disabled={batchCount < 2} onClick={() => setBatch((value) => (value + 1) % batchCount)}><span aria-hidden="true">↻</span> ANOTHER EDIT</button></div>
              <div className={styles.optionsGrid}>{visibleOptions.map((option) => <button type="button" key={option.id} className={styles.option} data-option-card aria-pressed={selectedIds.includes(option.id)} onClick={() => toggleOption(option.id)}>
                <span className={styles.optionPhoto}>{option.image ? <Image src={option.image} alt={option.name} width={800} height={800} sizes="(max-width: 640px) 45vw, 20vw" unoptimized /> : <span className={styles.customArt}>✳<small>YOUR IDEA</small></span>}<span className={styles.photoCaption}>NO. {option.custom ? "YOUR IDEA" : String(category.options.findIndex((item) => item.id === option.id) + 1).padStart(2, "0")}</span></span>
                <span className={styles.optionCopy}><span className={styles.optionTop}><small>{option.group}</small><span className={styles.check} aria-hidden="true">{selectedIds.includes(option.id) ? "✓" : "+"}</span></span><strong>{option.name}</strong><span className={styles.optionDetail}>{option.detail}</span></span>
              </button>)}</div>
              <div className={styles.selectedTray} aria-label="Chosen possibilities"><div><span>ON YOUR TABLE / {selected.length} CHOSEN</span><button type="button" disabled={!selected.length} onClick={() => setSelectedIds([])}>CLEAR</button></div>{selected.length ? <ul>{selected.map((option) => <li key={option.id}><button type="button" onClick={() => toggleOption(option.id)} aria-label={`Remove ${option.name}`}>{option.name}<span aria-hidden="true">×</span></button></li>)}</ul> : <p>Touch an image above to keep that possibility on the table.</p>}<small>Changing the edit preserves your choices · each preset has its own original illustration</small></div>
              <form onSubmit={addCustom} className={styles.customForm} data-lab-entrance><label htmlFor="choice-custom">Or write a possibility of your own</label><div><input id="choice-custom" value={custom} onChange={(event) => setCustom(event.target.value)} maxLength={36} placeholder={categoryId === "food" ? "Perhaps: wontons from the place downstairs" : categoryId === "style" ? "Perhaps: a blue shirt and new shoes" : "Perhaps: a weekend among old gardens"} /><button type="submit" aria-label="Add a personal possibility">PLACE ON TABLE <span aria-hidden="true">↗</span></button></div></form>
              <div className={styles.bottomBar} data-lab-entrance><span>{selected.length < 2 ? "AT LEAST TWO POSSIBILITIES ARE NEEDED" : `${selected.length} POSSIBILITIES ARE READY`}</span><button type="button" className={styles.primary} disabled={selected.length < 2} onClick={() => { setError(""); setStage("play"); }}>PLAY THE ROUND <span aria-hidden="true">↗</span></button></div>
            </section>}

            {stage === "play" && <section className={styles.playStage} aria-label="Wager and reveal">
              <div className={styles.sectionHeading} data-lab-entrance><div><p className={styles.eyebrow}>02 / LET CHANCE ANSWER</p><h3 tabIndex={-1} data-stage-heading>Name your desire first.</h3></div><button type="button" className={styles.textButton} disabled={busy} onClick={() => { resetRound(); setBetId(null); setStage("options"); }}>REVISE POSSIBILITIES ↗</button></div>
              <div className={styles.modeTabs} role="group" aria-label="Choose a game" data-lab-entrance>{gameModes.map((item) => <button key={item.id} type="button" aria-pressed={mode === item.id} disabled={busy} onClick={() => changeMode(item.id)}><span aria-hidden="true">{item.id === "rps" ? <HandGlyph gesture="scissors" /> : item.symbol}</span><strong>{item.name}</strong><small>{item.english}</small></button>)}</div>
              <p className={styles.rule} data-lab-entrance>{chosenMode.rule}</p>
              <fieldset className={styles.betField} disabled={busy} data-lab-entrance><legend>Where will you place your wager? <span>Desire must speak before chance.</span></legend><div>{selected.map((option) => <button type="button" key={option.id} aria-pressed={betId === option.id} onClick={() => selectBet(option.id)}><span aria-hidden="true">{betId === option.id ? "●" : "○"}</span> {option.name}</button>)}</div></fieldset>

              <div className={styles.gameRoom} key={mode} data-lab-entrance>
                {mode === "poker" && <PokerTable bet={bet} round={round} revealed={isRevealed} busy={busy} canDraw={canDraw} onDraw={draw} cardRef={cardRef} color={color} onColor={setColor}>{resultPanel}</PokerTable>}
                {mode === "rps" && <RockPaperScissorsArena bet={bet} round={round} revealed={isRevealed} busy={busy} canDraw={canDraw} onDraw={draw} gesture={gesture} onGesture={setGesture} countdown={countdown}>{resultPanel}</RockPaperScissorsArena>}
                {mode === "guess" && <DrawLotsRoom bet={bet} round={round} revealed={isRevealed} busy={busy} canDraw={canDraw} onDraw={draw} options={selected} activeIndex={activeTicket} onBet={selectBet}>{resultPanel}</DrawLotsRoom>}
              </div>
            </section>}

            {stage === "accepted" && round && <section className={styles.acceptedStage} aria-label="Accepted decision">
              <p className={styles.eyebrow} data-lab-entrance>03 / THE POSSIBILITY BECOMES REAL</p>
              <div className={styles.answerPhoto} data-lab-entrance>{round.bet.image ? <Image src={round.bet.image} alt={round.bet.name} width={800} height={800} unoptimized /> : <div className={styles.customArt}>✳<small>YOUR IDEA</small></div>}<span>{chapterTitle} / DECIDED</span></div>
              <div className={styles.receipt} data-lab-entrance><span className={styles.receiptTop}>ENTANGLED SHELTER <span>♥</span></span><p>THE ANSWER FOR TODAY</p><h3 tabIndex={-1} data-stage-heading>{round.bet.name}</h3><p className={styles.receiptDetail}>{round.bet.detail}</p><div className={styles.receiptMeta}><span>{category.label} / {chosenMode.name}</span><span>YOU CHOSE. THAT’S ENOUGH.</span></div><div className={styles.receiptSeal} aria-hidden="true">DECIDED<br />✳</div></div>
              <div className={styles.acceptedNote} role="status" data-lab-entrance><strong>Beautiful. Indecision may end here.</strong><p>{saved ? "This decision is preserved in this browser. Now go and make it a day worth remembering." : "The answer is settled. This browser could not preserve the record, but the decision is yours to carry."}</p></div>
              <div className={styles.acceptedActions} data-lab-entrance><button type="button" className={styles.primary} onClick={onClose}>GO WITH THE ANSWER <span aria-hidden="true">↗</span></button><button type="button" className={styles.textButton} onClick={() => { resetRound(); setBetId(null); setStage("options"); }}>DECIDE ONE MORE SMALL THING</button></div>
              {history.length > 1 && <div className={styles.history} data-lab-entrance><p className={styles.eyebrow}>RECENT LITTLE DECISIONS</p>{history.slice(1, 4).map((item) => <div key={item.id}><span>{choiceCategories[item.categoryId].label}</span><strong>{item.option.name}</strong><time dateTime={item.decidedAt}>{new Date(item.decidedAt).toLocaleDateString("en-GB", { month: "short", day: "2-digit" })}</time></div>)}</div>}
            </section>}
            <p className={styles.error} role="alert">{error}</p>
          </main>
        </div>
        <footer className={styles.footer}><span>LESS OVERTHINKING. MORE LIVING.</span><span>NO PERFECT ANSWER. STILL, A BEAUTIFUL ONE. ↗</span></footer>
      </div>
    </dialog>
  );
}
