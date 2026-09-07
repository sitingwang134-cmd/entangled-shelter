"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./EntangledShelter.module.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

type CategoryId = "food" | "style" | "travel";
type GameMode = "poker" | "rps" | "guess";
type Stage = "options" | "modes" | "play" | "result";

type Category = {
  id: CategoryId;
  numeral: string;
  kicker: string;
  title: string;
  question: string;
  description: string;
  accent: string;
  artClass: string;
  options: string[];
};

const categories: Category[] = [
  {
    id: "food",
    numeral: "I",
    kicker: "FOOD / 食欲悖论",
    title: "今晚，吃什么？",
    question: "别再打开第 17 个外卖页面。",
    description: "把所有想吃的放上桌，让宇宙替你保留唯一一盘。",
    accent: "#ff7657",
    artClass: styles.foodArt,
    options: ["沸腾火锅", "深夜拉面", "一盘寿司", "罪恶汉堡", "清醒沙拉", "只吃甜品"],
  },
  {
    id: "style",
    numeral: "II",
    kicker: "STYLE / 衣橱叠加态",
    title: "今天，穿什么？",
    question: "你可以同时是六种人，直到出门。",
    description: "把风格放进叠加态，在镜子前完成最后一次坍缩。",
    accent: "#ffd66e",
    artClass: styles.styleArt,
    options: ["黑白极简", "美式复古", "Y2K 千禧", "户外机能", "松弛通勤", "约会氛围"],
  },
  {
    id: "travel",
    numeral: "III",
    kicker: "TRAVEL / 出发不确定性",
    title: "下一站，去哪里？",
    question: "路线可以精确，心动不用。",
    description: "把目的地放进轨道，允许一次偶然改变整个周末。",
    accent: "#79d6ff",
    artClass: styles.travelArt,
    options: ["山野徒步", "海边发呆", "城市漫游", "古镇慢行", "帐篷露营", "随机车站"],
  },
];

const modes = [
  {
    id: "poker" as const,
    symbol: "A♠",
    title: "命运扑克",
    copy: "每个候选发一张牌，点数最高者获得今晚。",
  },
  {
    id: "rps" as const,
    symbol: "✌",
    title: "剪刀石头布",
    copy: "先押一个答案。赢过系统，它就成为现实。",
  },
  {
    id: "guess" as const,
    symbol: "?",
    title: "先猜后抽",
    copy: "先承认你心里的偏爱，再看随机答案是否同意。",
  },
];

const rpsGestures = [
  { id: "rock", symbol: "●", label: "石头" },
  { id: "scissors", symbol: "✌", label: "剪刀" },
  { id: "paper", symbol: "▱", label: "布" },
] as const;

type RpsId = (typeof rpsGestures)[number]["id"];

function randomItem<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function isRpsWin(player: RpsId, system: RpsId) {
  return (
    (player === "rock" && system === "scissors") ||
    (player === "scissors" && system === "paper") ||
    (player === "paper" && system === "rock")
  );
}

export function EntangledShelter() {
  const pageRef = useRef<HTMLElement>(null);
  const labRef = useRef<HTMLElement>(null);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [stage, setStage] = useState<Stage>("options");
  const [selected, setSelected] = useState<string[]>([]);
  const [mode, setMode] = useState<GameMode | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [guess, setGuess] = useState<string | null>(null);
  const [pendingPick, setPendingPick] = useState<string | null>(null);
  const [gameNote, setGameNote] = useState("");
  const [cardScores, setCardScores] = useState<{ label: string; score: number }[]>([]);

  const accentStyle = useMemo(
    () => ({ "--accent": activeCategory?.accent ?? "#c9ff38" }) as CSSProperties,
    [activeCategory],
  );

  useGSAP(
    () => {
      if (!pageRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const entrance = gsap.timeline({ defaults: { ease: "power3.out" } });
      entrance
        .from("[data-motion='header']", { yPercent: -110, duration: 0.8 })
        .from("[data-motion='hero-eyebrow']", { opacity: 0, y: 22, duration: 0.7 }, 0.15)
        .from(
          "[data-motion='hero-title-primary'], [data-motion='hero-title-script']",
          { opacity: 0, yPercent: 70, rotate: 2, duration: 1.15, stagger: 0.1 },
          0.12,
        )
        .from("[data-motion='hero-intro'], [data-motion='hero-footer']", { opacity: 0, y: 28, duration: 0.8, stagger: 0.08 }, 0.45)
        .from("[data-motion='hero-orbit']", { opacity: 0, scale: 0.2, rotate: -90, duration: 1.3 }, 0.2);

      const heroTimeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: "[data-motion='hero-scroll']",
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        },
      });

      heroTimeline
        .to("[data-motion='hero-art']", { scale: 1.28, yPercent: 7 }, 0)
        .to("[data-motion='hero-title-primary']", { xPercent: -21, scale: 0.9 }, 0)
        .to("[data-motion='hero-title-script']", { xPercent: 24, yPercent: -20, rotate: -5, scale: 1.08 }, 0)
        .to("[data-motion='hero-intro']", { yPercent: -85, opacity: 0.08 }, 0)
        .to("[data-motion='hero-eyebrow']", { y: -45, opacity: 0 }, 0)
        .to("[data-motion='hero-footer']", { y: 36, opacity: 0 }, 0)
        .to("[data-motion='hero-orbit']", { scale: 9, rotate: 130, opacity: 0.95 }, 0.08)
        .to("[data-motion='hero-shade']", { opacity: 0.45 }, 0.28);

      const manifestoTimeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: "[data-motion='manifesto']",
          start: "top 82%",
          end: "bottom 34%",
          scrub: 0.9,
        },
      });

      manifestoTimeline
        .from("[data-motion='manifesto-label']", { x: -70, opacity: 0 }, 0)
        .from(
          "[data-motion='manifesto-line']",
          { yPercent: 115, rotate: 2, opacity: 0, stagger: 0.18 },
          0.05,
        )
        .from("[data-motion='manifesto-copy'] > p", { y: 70, opacity: 0, stagger: 0.16 }, 0.32)
        .fromTo("[data-motion='manifesto-signal']", { scaleX: 0 }, { scaleX: 1 }, 0.25);

      gsap.utils.toArray<HTMLElement>("[data-motion='portal']").forEach((portal) => {
        const stage = portal.querySelector<HTMLElement>("[data-motion='portal-stage']");
        const art = portal.querySelector<HTMLElement>("[data-motion='portal-art']");
        const shade = portal.querySelector<HTMLElement>("[data-motion='portal-shade']");
        const topline = portal.querySelector<HTMLElement>("[data-motion='portal-topline']");
        const body = portal.querySelector<HTMLElement>("[data-motion='portal-body']");
        const orbit = portal.querySelector<HTMLElement>("[data-motion='portal-orbit']");

        if (!stage || !art || !shade || !topline || !body || !orbit) return;

        gsap.fromTo(
          stage,
          { clipPath: "inset(8% 4% 8% 4% round 28px)" },
          {
            clipPath: "inset(0% 0% 0% 0% round 0px)",
            ease: "none",
            scrollTrigger: {
              trigger: portal,
              start: "top 92%",
              end: "top 18%",
              scrub: 0.75,
            },
          },
        );

        const portalTimeline = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: portal,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        });

        portalTimeline
          .fromTo(art, { scale: 1.2, yPercent: -4 }, { scale: 1.03, yPercent: 7 }, 0)
          .fromTo(topline, { y: -34, opacity: 0 }, { y: 12, opacity: 1 }, 0.06)
          .fromTo(body, { yPercent: 28, opacity: 0.05 }, { yPercent: -12, opacity: 1 }, 0)
          .fromTo(orbit, { scale: 0.3, rotate: -120, opacity: 0 }, { scale: 1.35, rotate: 110, opacity: 0.92 }, 0.02)
          .fromTo(shade, { opacity: 0.98 }, { opacity: 0.64 }, 0);
      });

      const rulesTimeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: "[data-motion='rules']",
          start: "top 78%",
          end: "bottom 70%",
          scrub: 0.85,
        },
      });

      rulesTimeline
        .from("[data-motion='rules-heading']", { xPercent: -16, opacity: 0 }, 0)
        .from("[data-motion='rule-item']", { y: 110, opacity: 0, stagger: 0.2 }, 0.08);

      const finalTimeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: "[data-motion='final']",
          start: "top bottom",
          end: "center center",
          scrub: 0.8,
        },
      });
      finalTimeline
        .from("[data-motion='final-title']", { scale: 0.42, y: 150, rotate: 4, opacity: 0 }, 0)
        .from("[data-motion='final-copy'], [data-motion='final-button']", { y: 50, opacity: 0, stagger: 0.18 }, 0.32);

      gsap.fromTo(
        "[data-motion='scroll-progress']",
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: { start: 0, end: "max", scrub: 0.15 },
        },
      );

      const refresh = () => ScrollTrigger.refresh();
      document.fonts.ready.then(refresh).catch(() => undefined);
      window.addEventListener("load", refresh, { once: true });
      return () => window.removeEventListener("load", refresh);
    },
    { scope: pageRef },
  );

  useGSAP(
    () => {
      if (!activeCategory || !labRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const modalTimeline = gsap.timeline({ defaults: { ease: "power3.out" } });
      modalTimeline
        .from(labRef.current, { y: 48, scale: 0.96, opacity: 0, duration: 0.5 })
        .from(
          "[data-motion='lab-panel'] > *:not([data-motion='result-word'])",
          { y: 28, opacity: 0, duration: 0.45, stagger: 0.055 },
          0.14,
        )
        .from(
          "[data-motion='card']",
          { y: 150, rotate: 0, opacity: 0, duration: 0.72, stagger: 0.11, ease: "back.out(1.55)" },
          0.12,
        )
        .from("[data-motion='result-word']", { scale: 0.25, rotate: -8, opacity: 0, duration: 0.72, ease: "back.out(1.8)" }, 0.12);
    },
    { scope: labRef, dependencies: [activeCategory, stage], revertOnUpdate: true },
  );

  useEffect(() => {
    if (!activeCategory) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveCategory(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [activeCategory]);

  function openCategory(category: Category) {
    setActiveCategory(category);
    setStage("options");
    setSelected([]);
    setMode(null);
    setResult(null);
    setGuess(null);
    setPendingPick(null);
    setGameNote("");
    setCardScores([]);
  }

  function toggleOption(option: string) {
    setSelected((current) =>
      current.includes(option) ? current.filter((item) => item !== option) : [...current, option],
    );
  }

  function chooseMode(nextMode: GameMode) {
    setMode(nextMode);
    setStage("play");
    setGameNote("");
    setGuess(null);
    setPendingPick(randomItem(selected));
  }

  function dealPoker() {
    const cards = selected.map((label) => ({ label, score: Math.ceil(Math.random() * 13) }));
    const winner = [...cards].sort((a, b) => b.score - a.score)[0];
    setCardScores(cards);
    setResult(winner.label);
    setGameNote(`${winner.score} 点。它从所有可能里赢了出来。`);
    setStage("result");
  }

  function playRps(player: RpsId) {
    const system = randomItem(rpsGestures).id;
    const playerLabel = rpsGestures.find((item) => item.id === player)?.label;
    const systemLabel = rpsGestures.find((item) => item.id === system)?.label;
    if (isRpsWin(player, system)) {
      setResult(pendingPick ?? randomItem(selected));
      setGameNote(`你出${playerLabel}，系统出${systemLabel}。你赢了，押注生效。`);
      setStage("result");
      return;
    }
    setPendingPick(randomItem(selected));
    setGameNote(
      player === system
        ? `都是${playerLabel}。宇宙卡住了，换一个押注再来。`
        : `你出${playerLabel}，系统出${systemLabel}。暂未授权，押注已自动轮换。`,
    );
  }

  function revealGuess() {
    if (!guess) return;
    const drawn = randomItem(selected);
    setResult(drawn);
    setGameNote(
      drawn === guess
        ? "你猜中了。原来答案一直都在你心里。"
        : `你猜的是「${guess}」，抽中的是「${drawn}」。这次听偶然的。`,
    );
    setStage("result");
  }

  function replay() {
    setStage("modes");
    setMode(null);
    setResult(null);
    setGuess(null);
    setGameNote("");
    setCardScores([]);
  }

  return (
    <main className={styles.page} ref={pageRef}>
      <div className={styles.scrollRail} aria-hidden="true">
        <span data-motion="scroll-progress" />
      </div>
      <header className={styles.header} data-motion="header">
        <a className={styles.brand} href="#top" aria-label="Entangled Shelter 首页">
          <span className={styles.brandMark}>ES</span>
          <span>Entangled Shelter</span>
        </a>
        <nav className={styles.nav} aria-label="主要导航">
          <a href="#food">美食</a>
          <a href="#style">穿搭</a>
          <a href="#travel">旅行</a>
        </nav>
        <a className={styles.headerCta} href="#portals">
          开始选择 <span>↘</span>
        </a>
      </header>

      <section className={styles.heroScroll} id="top" data-motion="hero-scroll">
        <div className={styles.hero}>
          <div className={styles.heroArt} data-motion="hero-art" aria-hidden="true" />
          <div className={styles.heroShade} data-motion="hero-shade" aria-hidden="true" />
          <div className={styles.heroOrbit} data-motion="hero-orbit" aria-hidden="true">
            <i /><i /><i />
            <b>?</b>
          </div>
          <div className={styles.floatingGlyphs} aria-hidden="true">
            <span>?</span><span>✦</span><span>↗</span>
          </div>
          <p className={styles.eyebrow} data-motion="hero-eyebrow">VIBE CODING FOR THE CHRONICALLY UNDECIDED</p>
          <div className={styles.heroTitleWrap}>
            <h1>
              <span data-motion="hero-title-primary">Entangled</span>
              <span className={styles.script} data-motion="hero-title-script">Shelter</span>
            </h1>
            <p className={styles.heroIntro} data-motion="hero-intro">
              给选择困难症的一间量子避难所。把所有可能放进叠加态，再用一点运气，让答案坍缩。
            </p>
          </div>
          <div className={styles.heroFooter} data-motion="hero-footer">
            <a href="#portals">进入选择实验</a>
            <span>SCROLL TO COLLAPSE ↓</span>
            <span>NO ACCOUNT · NO JUDGEMENT · JUST DECIDE</span>
          </div>
        </div>
      </section>

      <section className={styles.manifesto} aria-labelledby="manifesto-title" data-motion="manifesto">
        <p data-motion="manifesto-label">ENTANGLED SHELTER / 001</p>
        <h2 id="manifesto-title">
          <span className={styles.manifestoLine}><span data-motion="manifesto-line">不是替你思考，</span></span>
          <span className={styles.manifestoLine}><span data-motion="manifesto-line">是帮你<em>停止思考。</em></span></span>
        </h2>
        <div className={styles.manifestoSignal} data-motion="manifesto-signal" aria-hidden="true"><i /></div>
        <div className={styles.manifestoCopy} data-motion="manifesto-copy">
          <p>当每个选项都很好，继续比较不会带来更好的答案，只会让晚饭变凉、衣服堆满床、周末原地消失。</p>
          <p>在这里，候选项可以同时存在。直到你选择一种规则，让一个答案成为现实。</p>
        </div>
      </section>

      <section className={styles.portals} id="portals" aria-label="选择场景">
        {categories.map((category) => (
          <article
            className={styles.portal}
            id={category.id}
            key={category.id}
            style={{ "--accent": category.accent } as CSSProperties}
            data-motion="portal"
          >
            <div className={styles.portalStage} data-motion="portal-stage">
              <div className={`${styles.portalArt} ${category.artClass}`} data-motion="portal-art" aria-hidden="true" />
              <div className={styles.portalShade} data-motion="portal-shade" aria-hidden="true" />
              <div className={styles.portalOrbit} data-motion="portal-orbit" aria-hidden="true">
                <span>{category.numeral}</span><i /><i />
              </div>
              <div className={styles.portalTopline} data-motion="portal-topline">
                <span>{category.kicker}</span>
                <span>{category.numeral} / III</span>
              </div>
              <div className={styles.portalBody} data-motion="portal-body">
                <p>{category.question}</p>
                <h2>{category.title}</h2>
                <p className={styles.portalDescription}>{category.description}</p>
                <button type="button" onClick={() => openCategory(category)}>
                  打开选择器 <span>↗</span>
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className={styles.rules} id="rules" data-motion="rules">
        <div className={styles.rulesHeading} data-motion="rules-heading">
          <p>HOW TO COLLAPSE A POSSIBILITY</p>
          <h2>三步，结束内耗。</h2>
        </div>
        <ol className={styles.ruleList}>
          <li data-motion="rule-item">
            <span>01</span>
            <div>
              <h3>放入候选</h3>
              <p>选两个以上。纠结得越真诚，结果越有意义。</p>
            </div>
          </li>
          <li data-motion="rule-item">
            <span>02</span>
            <div>
              <h3>选择宇宙规则</h3>
              <p>发牌、猜拳，或者先猜后抽。没有算法画像。</p>
            </div>
          </li>
          <li data-motion="rule-item">
            <span>03</span>
            <div>
              <h3>接受坍缩</h3>
              <p>答案出现后，不许再开新的点评软件。</p>
            </div>
          </li>
        </ol>
      </section>

      <section className={styles.finalCta} data-motion="final">
        <p data-motion="final-copy">THE UNIVERSE IS READY WHEN YOU ARE</p>
        <h2 data-motion="final-title">别再想了。</h2>
        <button type="button" data-motion="final-button" onClick={() => openCategory(categories[0])}>
          开始抽 <span>→</span>
        </button>
      </section>

      <footer className={styles.footer}>
        <span>ENTANGLED SHELTER © 2026</span>
        <span>BUILT FOR BEAUTIFUL INDECISION</span>
      </footer>

      {activeCategory ? (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => {
          if (event.currentTarget === event.target) setActiveCategory(null);
        }}>
          <section
            className={styles.lab}
            role="dialog"
            aria-modal="true"
            aria-labelledby="choice-lab-title"
            style={accentStyle}
            ref={labRef}
          >
            <div className={styles.labHeader}>
              <div>
                <span>{activeCategory.kicker}</span>
                <h2 id="choice-lab-title">选择实验室</h2>
              </div>
              <button type="button" onClick={() => setActiveCategory(null)} aria-label="关闭选择实验室">
                ×
              </button>
            </div>

            <div className={styles.labProgress} aria-label="当前进度">
              <span className={stage === "options" ? styles.currentStep : ""}>01 候选</span>
              <span className={stage === "modes" || stage === "play" ? styles.currentStep : ""}>02 规则</span>
              <span className={stage === "result" ? styles.currentStep : ""}>03 答案</span>
            </div>

            {stage === "options" ? (
              <div className={styles.labPanel} data-motion="lab-panel">
                <p className={styles.labKicker}>把还在纠结的选项都点亮，至少选两个。</p>
                <div className={styles.optionGrid}>
                  {activeCategory.options.map((option, index) => {
                    const isSelected = selected.includes(option);
                    return (
                      <button
                        type="button"
                        aria-pressed={isSelected}
                        className={isSelected ? styles.selectedOption : ""}
                        onClick={() => toggleOption(option)}
                        key={option}
                      >
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        {option}
                        <i>{isSelected ? "✓" : "+"}</i>
                      </button>
                    );
                  })}
                </div>
                <button
                  className={styles.primaryAction}
                  type="button"
                  disabled={selected.length < 2}
                  onClick={() => setStage("modes")}
                >
                  选择宇宙规则 <span>→</span>
                </button>
              </div>
            ) : null}

            {stage === "modes" ? (
              <div className={styles.labPanel} data-motion="lab-panel">
                <p className={styles.labKicker}>{selected.length} 个候选已经进入叠加态。用什么方式结束它？</p>
                <div className={styles.modeGrid}>
                  {modes.map((item) => (
                    <button type="button" onClick={() => chooseMode(item.id)} key={item.id}>
                      <span>{item.symbol}</span>
                      <h3>{item.title}</h3>
                      <p>{item.copy}</p>
                      <i>选择 ↗</i>
                    </button>
                  ))}
                </div>
                <button className={styles.textAction} type="button" onClick={() => setStage("options")}>
                  ← 返回候选
                </button>
              </div>
            ) : null}

            {stage === "play" && mode === "poker" ? (
              <div className={`${styles.labPanel} ${styles.centerPanel}`} data-motion="lab-panel">
                <p className={styles.labKicker}>所有候选已经坐上牌桌。</p>
                <div className={styles.deckPreview} aria-hidden="true">
                  <span data-motion="card">A</span><span data-motion="card">?</span><span data-motion="card">♠</span>
                </div>
                <button className={styles.primaryAction} type="button" onClick={dealPoker}>
                  发牌决定 <span>↻</span>
                </button>
              </div>
            ) : null}

            {stage === "play" && mode === "rps" ? (
              <div className={`${styles.labPanel} ${styles.centerPanel}`} data-motion="lab-panel">
                <p className={styles.labKicker}>你现在押注：<strong>{pendingPick}</strong></p>
                <h3 className={styles.playTitle}>赢过系统，就选它。</h3>
                <div className={styles.rpsGrid}>
                  {rpsGestures.map((gesture) => (
                    <button type="button" onClick={() => playRps(gesture.id)} key={gesture.id}>
                      <span>{gesture.symbol}</span>{gesture.label}
                    </button>
                  ))}
                </div>
                {gameNote ? <p className={styles.gameNote} aria-live="polite">{gameNote}</p> : null}
              </div>
            ) : null}

            {stage === "play" && mode === "guess" ? (
              <div className={styles.labPanel} data-motion="lab-panel">
                <p className={styles.labKicker}>别装作没有偏爱。先猜哪一个会被抽中。</p>
                <div className={styles.guessGrid}>
                  {selected.map((option) => (
                    <button
                      type="button"
                      aria-pressed={guess === option}
                      className={guess === option ? styles.selectedGuess : ""}
                      onClick={() => setGuess(option)}
                      key={option}
                    >
                      {option}<span>{guess === option ? "已押注" : "押它"}</span>
                    </button>
                  ))}
                </div>
                <button className={styles.primaryAction} type="button" disabled={!guess} onClick={revealGuess}>
                  先猜后抽 <span>?</span>
                </button>
              </div>
            ) : null}

            {stage === "result" && result ? (
              <div className={`${styles.labPanel} ${styles.resultPanel}`} data-motion="lab-panel">
                <p>THE POSSIBILITY HAS COLLAPSED</p>
                <h3>就选</h3>
                <strong data-motion="result-word">{result}</strong>
                <p className={styles.resultNote}>{gameNote}</p>
                {cardScores.length ? (
                  <div className={styles.scoreLine}>
                    {cardScores.map((card) => <span key={card.label}>{card.label} · {card.score}</span>)}
                  </div>
                ) : null}
                <div className={styles.resultActions}>
                  <button className={styles.primaryAction} type="button" onClick={() => setActiveCategory(null)}>
                    接受答案 <span>✓</span>
                  </button>
                  <button className={styles.textAction} type="button" onClick={replay}>再坍缩一次</button>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </main>
  );
}
