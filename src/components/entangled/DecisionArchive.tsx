"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { choiceCategories, decisionHistoryKey, parseDecisionHistory, type Decision } from "./choice-data";
import styles from "./DecisionArchive.module.css";

const modeNames = { poker: "Fortune Deck", rps: "A Fair Fight", guess: "Trust Your Hunch" } as const;

export function DecisionArchive() {
  const [records, setRecords] = useState<Decision[]>([]);

  useEffect(() => {
    const read = () => {
      try { setRecords(parseDecisionHistory(localStorage.getItem(decisionHistoryKey))); }
      catch { setRecords([]); }
    };
    read();
    window.addEventListener("storage", read);
    return () => window.removeEventListener("storage", read);
  }, []);

  const favourite = useMemo(() => {
    if (!records.length) return "Still unwritten";
    const totals = records.reduce<Record<string, number>>((map, record) => {
      map[record.categoryId] = (map[record.categoryId] ?? 0) + 1;
      return map;
    }, {});
    const id = Object.entries(totals).sort((a, b) => b[1] - a[1])[0][0] as keyof typeof choiceCategories;
    return choiceCategories[id].label;
  }, [records]);

  const latest = records[0];

  return <main className={styles.archive}>
    <header className={styles.masthead}>
      <Link href="/" className={styles.brand}><span>✳</span> Entangled Shelter</Link>
      <Link href="/" className={styles.return}>RETURN TO THE SHELTER <span>↖</span></Link>
    </header>

    <section className={styles.intro}>
      <div className={styles.folio}>V / THE DECISION ARCHIVE</div>
      <h1>A cabinet of<br /><em>small certainties.</em></h1>
      <div className={styles.introGrid}>
        <p>Every accepted answer leaves a trace. Not a verdict, not a prophecy—simply proof that, for one luminous moment, you chose to begin.</p>
        <dl>
          <div><dt>Decisions preserved</dt><dd>{String(records.length).padStart(2, "0")}</dd></div>
          <div><dt>Most visited room</dt><dd>{favourite}</dd></div>
          <div><dt>Latest certainty</dt><dd>{latest?.option.name ?? "Awaiting chance"}</dd></div>
        </dl>
      </div>
    </section>

    <section className={styles.rollRoom} aria-labelledby="roll-title">
      <div className={styles.roomHeading}>
        <div><span>THE LIVING LEDGER</span><h2 id="roll-title">Turn the record.</h2></div>
        <p>Move the pointer to steer the roll. Click the stage to pause, or open the list within the ledger to revisit a particular decision.</p>
      </div>
      <div className={styles.stageFrame}>
        <iframe className={styles.stage} src="/entangled/paper-roll/index.html?v=12" title="Three-dimensional decision archive; move the pointer to steer and click to pause" />
      </div>
    </section>

    <section className={styles.annotations}>
      <article><span>01 / THE TRACE</span><h3>A choice becomes real when it is remembered.</h3><p>Accepted answers remain on this device, private to this browser and ready to be found again.</p></article>
      <article><span>02 / THE METHOD</span><h3>Instinct first. Chance second. Action last.</h3><p>The game never replaces desire; it merely gives desire enough theatre to speak clearly.</p></article>
      <article className={styles.lastCard}><span>03 / THE INVITATION</span><h3>The archive is not an ending.</h3><Link href="/">MAKE ANOTHER DECISION <b>↗</b></Link></article>
    </section>

    {records.length > 0 && <section className={styles.recent} aria-labelledby="recent-title">
      <div><span>RECENT ENTRIES</span><h2 id="recent-title">What chance last revealed.</h2></div>
      <ol>{records.slice(0, 6).map((record, index) => <li key={record.id}>
        <span>{String(index + 1).padStart(2, "0")}</span>
        <div><small>{choiceCategories[record.categoryId].label} · {modeNames[record.mode]}</small><strong>{record.option.name}</strong><p>{record.option.detail}</p></div>
        <time dateTime={record.decidedAt}>{new Date(record.decidedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</time>
      </li>)}</ol>
    </section>}

    <footer className={styles.footer}><span>LESS OVERTHINKING. MORE LIVING.</span><span>ENTANGLED SHELTER · 2026</span></footer>
  </main>;
}
