"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { choiceCategories, decisionHistoryKey, parseDecisionHistory, type Decision } from "./choice-data";
import { traceKey, notesKey, memoryEvent, parseTraces, parseNotes, saveNote, favouriteChoices, type Trace } from "./choice-memory";
import { StickyNotes } from "./StickyNotes";
import styles from "./DecisionArchive.module.css";

const modeNames = { poker: "Fortune Deck", rps: "A Fair Fight", guess: "Trust Your Hunch" } as const;

export function DecisionArchive() {
  const [records, setRecords] = useState<Decision[]>([]);
  const [traces, setTraces] = useState<Trace[]>([]);
  const [notes, setNotes] = useState<Record<string,string>>({});
  const [noteStatus, setNoteStatus] = useState("");
  const [visibleTraces, setVisibleTraces] = useState(20);
  const [visibleRecords, setVisibleRecords] = useState(8);
  const [memoryFilter, setMemoryFilter] = useState("all");
  const favourites = useMemo(()=>favouriteChoices(records),[records]);
  const filteredTraces=traces.filter(t=>memoryFilter === "all" || t.categoryId === memoryFilter);
  function annotate(id:string,value:string) {
    setNotes(previous=>({...previous,[id]:value}));
    setNoteStatus(saveNote(id,value) ? "Note saved in this browser and added to your roll." : "Could not save. Please copy your note before leaving.");
  }

  useEffect(() => {
    const read = () => {
      try { setRecords(parseDecisionHistory(localStorage.getItem(decisionHistoryKey))); setTraces(parseTraces(localStorage.getItem(traceKey))); setNotes(parseNotes(localStorage.getItem(notesKey))); }
      catch { setRecords([]); }
    };
    read();
    window.addEventListener("storage", read);
    window.addEventListener(memoryEvent, read);
    return () => {window.removeEventListener("storage", read);window.removeEventListener(memoryEvent, read);};
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
        <p>The answer is not the end. Revisit what drew you, keep what you learned, then make another decision. Your shortlist, trials and accepted answers each have a place here.</p>
        <dl>
          <div><dt>Decisions preserved</dt><dd>{String(records.length).padStart(2, "0")}</dd></div>
          <div><dt>Most accepted choice</dt><dd>{favourites[0] ? `${favourites[0].name} · ${favourites[0].count} times` : "Still discovering"}</dd></div>
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
        <iframe className={styles.stage} src="/entangled/paper-roll/index.html?v=19" title="Three-dimensional decision archive; move the pointer to steer and click to pause" />
      </div>
      <StickyNotes />
    </section>

    <section className={styles.feedback} aria-labelledby="feedback-title">
      <span>YOUR PERSONAL FEEDBACK / {favourite}</span>
      <h2 id="feedback-title">What keeps calling you back?</h2>
      <p>{records.length ? `${records.length} accepted answers, ${traces.filter(t=>t.action==="round").length} recorded trials. A preference is a pattern, never a rule.` : "Your first choice begins the story. Until then, the roll holds possibilities, not invented memories."}</p>
      {favourites.length>0 && <ol className={styles.favourites}>{favourites.slice(0,5).map((item,index)=><li key={item.categoryId+item.name}><span>0{index+1}</span><strong>{item.name}<small>{choiceCategories[item.categoryId].label}</small></strong><b>{item.count}<small>accepted</small></b></li>)}</ol>}
      <label htmlFor="memory-reflection">A note to your future self</label>
      <textarea id="memory-reflection" maxLength={600} value={notes.reflection ?? ""} onChange={e=>annotate("reflection",e.target.value)} placeholder="What felt right? What would you try differently next time?" />
      <p className={styles.saveStatus} role="status">{noteStatus || "Stored only in this browser. Latest 500 accepted answers and 2,000 steps are retained."}</p>
      <Link className={styles.again} href="/">THE ANSWER IS NOT THE END. DECIDE AGAIN ↗</Link>
    </section>
    <section className={styles.annotations}>
      <article><span>01 / THE TRACE</span><h3>A choice becomes real when it is remembered.</h3><p>Accepted answers remain on this device, private to this browser and ready to be found again.</p></article>
      <article><span>02 / THE METHOD</span><h3>Instinct first. Chance second. Action last.</h3><p>The game never replaces desire; it merely gives desire enough theatre to speak clearly.</p></article>
      <article className={styles.lastCard}><span>03 / THE INVITATION</span><h3>The archive is not an ending.</h3><Link href="/">MAKE ANOTHER DECISION <b>↗</b></Link></article>
    </section>

    {records.length > 0 && <section className={styles.recent} aria-labelledby="recent-title">
      <div><span>RECENT ENTRIES</span><h2 id="recent-title">What chance last revealed.</h2></div>
      <ol>{records.slice(0, visibleRecords).map((record, index) => <li key={record.id}>
        <span>{String(index + 1).padStart(2, "0")}</span>
        <div><small>{choiceCategories[record.categoryId].label} · {modeNames[record.mode]}</small><strong>{record.option.name}</strong><p>{record.option.detail}</p><label className={styles.noteLabel} htmlFor={`note-${record.id}`}>Keep a memory</label><textarea id={`note-${record.id}`} maxLength={600} value={notes[record.id] ?? ""} onChange={e=>annotate(record.id,e.target.value)} placeholder="How did this choice turn out?" /></div>
        <time dateTime={record.decidedAt}>{new Date(record.decidedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</time>
      </li>)}</ol>{records.length>visibleRecords && <button className={styles.more} onClick={()=>setVisibleRecords(n=>n+8)}>MORE MEMORIES ↓</button>}
    </section>}

    <section className={styles.traces} aria-labelledby="traces-title">
      <span>THE PATH, NOT JUST THE ANSWER</span><h2 id="traces-title">Every little turn.</h2>
      <div className={styles.traceFilters}>{["all","food","style","travel"].map(id=><button key={id} aria-pressed={memoryFilter===id} onClick={()=>{setMemoryFilter(id);setVisibleTraces(20);}}>{id === "all" ? "All rooms" : choiceCategories[id as keyof typeof choiceCategories].label}</button>)}</div>
      {filteredTraces.length ? <ol>{filteredTraces.slice(0,visibleTraces).map(t=><li key={t.id}><time dateTime={t.at}>{new Date(t.at).toLocaleString("en-GB",{month:"short",day:"2-digit",hour:"2-digit",minute:"2-digit"})}</time><span>{choiceCategories[t.categoryId].label} / {t.action}</span><strong>{t.label}</strong></li>)}</ol> : <p>No steps recorded here yet. Enter a room and begin with what appeals to you.</p>}
      {filteredTraces.length>visibleTraces && <button className={styles.more} onClick={()=>setVisibleTraces(n=>n+20)}>UNFURL MORE STEPS ↓</button>}
    </section>
    <footer className={styles.footer}><span>LESS OVERTHINKING. MORE LIVING.</span><span>ENTANGLED SHELTER · 2026</span></footer>
  </main>;
}

