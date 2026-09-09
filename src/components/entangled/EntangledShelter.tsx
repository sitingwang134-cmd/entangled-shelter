"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { DepthScene } from "./DepthScene";
import { ChoiceLab, type CategoryId } from "./ChoiceLab";
import { useSiteMotion } from "./site-motion";
import styles from "./EntangledShelter.module.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const chapters = [
  { id: "food" as const, number: "I", name: "美食", title: "Taste", subtitle: "把今晚，交给食欲。", description: "火锅还是拉面？想吃的太多，不如给偶然留一个座位。", image: "room", focus: .64, detail: "doorway", detailTitle: "夜晚很长，别只用来纠结。", detailCopy: "从热气腾腾到清爽简单。挑几个真正想吃的，先猜，再揭晓。", labels: ["热辣一顿", "深夜食堂", "清爽轻食", "甜品自由"], note: "FEED YOUR CURIOSITY", symbol: "♥" },
  { id: "style" as const, number: "II", name: "穿搭", title: "Style", subtitle: "今天，不止一种你。", description: "衣橱里的每一种可能，都值得一次出场。让直觉先走一步。", image: "levitate", focus: .53, detail: "atelier", detailTitle: "风格没有标准答案，只有今天的心情。", detailCopy: "从黑白极简，到松弛复古。选好你的候选风格，赢下一次说走就走。", labels: ["黑白极简", "美式复古", "松弛通勤", "户外机能"], note: "DRESS FOR THE POSSIBILITY", symbol: "♠" },
  { id: "travel" as const, number: "III", name: "旅行", title: "Wander", subtitle: "下一站，让偶然领路。", description: "计划可以晚一点，出发不用。山野、海边，或一座没去过的小城。", image: "salt", focus: .68, detail: "car", detailTitle: "把路线留给地图，把心动留给自己。", detailCopy: "不必先决定整个世界。从这个周末开始，让一张牌把你带远一点。", labels: ["山野徒步", "海边发呆", "城市漫游", "古镇慢行"], note: "TAKE THE SCENIC ROUTE", symbol: "♦" },
];

function Geometry({ className = "" }: { className?: string }) {
  return <svg className={`${styles.geometry} ${className}`} viewBox="0 0 1000 1000" fill="none" aria-hidden="true">
    <circle cx="500" cy="500" r="475" /><circle cx="500" cy="500" r="335" />
    <ellipse cx="500" cy="500" rx="475" ry="180" /><ellipse cx="500" cy="500" rx="180" ry="475" />
    <path d="M25 500H975M500 25V975M164 164L836 836M164 836L836 164M164 164H836V836H164Z" />
    <path d="M25 500L500 25L975 500L500 975Z" />
  </svg>;
}

function Art({ id, alt, focus = .5, priority = false }: { id: string; alt: string; focus?: number; priority?: boolean }) {
  const strengths: Record<string, number> = { room: .5, atelier: .6, angels: .6, hands: .45, doorway: .75, car: .75 };
  return <DepthScene image={`/entangled/${id}.webp`} depth={`/entangled/${id}-depth.png`} alt={alt} focusX={focus} strength={strengths[id] ?? 1} priority={priority} />;
}

export function EntangledShelter() {
  const root = useRef<HTMLDivElement>(null);
  const smooth = useRef<Lenis | null>(null);
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [active, setActive] = useState("top");
  const [menu, setMenu] = useState(false);
  const motion = useSiteMotion();

  useEffect(() => {
    if (motion === "reduced") return;
    const lenis = new Lenis({ duration: 1.05, smoothWheel: true, respectReducedMotion: false, anchors: { offset: -60 }, prevent: (node) => !!node.closest("dialog, [role='dialog']") });
    smooth.current = lenis;
    const tick = (time: number) => lenis.raf(time * 1000);
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(tick);
    return () => { gsap.ticker.remove(tick); lenis.destroy(); smooth.current = null; };
  }, [motion]);

  useEffect(() => {
    if (category || menu) smooth.current?.stop();
    else smooth.current?.start();
  }, [category, menu, motion]);

  useEffect(() => {
    if (!menu) return;
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") setMenu(false); };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [menu]);

  useGSAP(() => {
    const container = root.current;
    if (!container) return;
    container.querySelectorAll<HTMLElement>("[data-nav-section]").forEach((section) => {
      const select = () => { setActive(section.id); container.dataset.theme = section.dataset.theme ?? "dark"; };
      ScrollTrigger.create({ trigger: section, start: "top 30%", end: "bottom 30%", onEnter: select, onEnterBack: select });
    });
    const mm = gsap.matchMedia();
    mm.add("all", () => {
      if (motion === "reduced") return;
      gsap.timeline({ defaults: { ease: "power3.out" } })
        .from("[data-entrance='header']", { y: -65, autoAlpha: 0, duration: .8 })
        .from("[data-entrance='title']", { yPercent: 110, rotation: 3, autoAlpha: 0, duration: 1.3, stagger: .12 }, .15)
        .from("[data-entrance='detail']", { y: 30, autoAlpha: 0, duration: .8, stagger: .12 }, .65)
        .from("[data-hero-card]", { y: 100, rotationY: 100, autoAlpha: 0, duration: 1, stagger: .1 }, .6);
      gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: "#top", start: "top top", end: "bottom bottom", scrub: .8 } })
        .to("[data-hero-image]", { scale: 1.17, yPercent: 4 }, 0)
        .to("[data-hero-title]", { yPercent: -45, scale: .83, autoAlpha: 0 }, 0)
        .to("[data-hero-note]", { y: -70, autoAlpha: 0 }, 0)
        .to("[data-hero-card]", { yPercent: -180, x: (index) => (index - 1) * 130, rotation: (index) => (index - 1) * 48, scale: 1.3, stagger: .04 }, 0)
        .to("[data-hero-geometry]", { rotation: 45, scale: 1.7, autoAlpha: .1 }, 0);
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
        gsap.from(element, { y: 55, autoAlpha: 0, duration: 1.05, ease: "power3.out", scrollTrigger: { trigger: element, start: "top 90%", toggleActions: "play none none reverse" } });
      });
      chapters.forEach((chapter) => {
        const el = container.querySelector<HTMLElement>(`#${chapter.id}`);
        if (!el) return;
        gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: .9 } })
          .fromTo(el.querySelector("[data-chapter-image]"), { scale: 1.08, yPercent: -3 }, { scale: 1.2, yPercent: 4 }, 0)
          .fromTo(el.querySelector("[data-chapter-title]"), { y: 100, x: 20 }, { y: -140, x: -20 }, 0)
          .fromTo(el.querySelector("[data-chapter-geometry]"), { rotation: -25 }, { rotation: 60 }, 0)
          .fromTo(el.querySelector("[data-chapter-shade]"), { opacity: .6 }, { opacity: 1 }, .25);
        gsap.fromTo(el.querySelector("[data-scene-mask]"), { clipPath: "inset(5% 3% round 3px)" }, { clipPath: "inset(0% 0% round 0px)", ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "top 15%", scrub: .7 } });
      });
      gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: "#ritual", start: "top 85%", end: "bottom 65%", scrub: .8 } })
        .from("[data-ritual-title]", { xPercent: -12 }, 0)
        .from("[data-ritual-card]", { y: 130, rotationY: 45, rotation: -8, stagger: .12 }, .1);
      gsap.fromTo("[data-scroll-progress]", { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: .1 } });
      const cleanup: (() => void)[] = [];
      if (window.matchMedia("(pointer: fine)").matches) container.querySelectorAll<HTMLElement>("[data-tilt]").forEach((element) => {
        const x = gsap.quickTo(element, "rotationY", { duration: .65, ease: "power3.out" });
        const y = gsap.quickTo(element, "rotationX", { duration: .65, ease: "power3.out" });
        const move = (event: PointerEvent) => { const rect = element.getBoundingClientRect(); x(((event.clientX - rect.left) / rect.width - .5) * 12); y(-((event.clientY - rect.top) / rect.height - .5) * 12); };
        const leave = () => { x(0); y(0); };
        element.addEventListener("pointermove", move); element.addEventListener("pointerleave", leave);
        cleanup.push(() => { element.removeEventListener("pointermove", move); element.removeEventListener("pointerleave", leave); });
      });
      return () => cleanup.forEach((dispose) => dispose());
    }, root);
    let alive = true;
    document.fonts.ready.then(() => { if (alive) ScrollTrigger.refresh(); });
    return () => { alive = false; mm.revert(); };
  }, { scope: root, dependencies: [motion], revertOnUpdate: true });

  function open(id: CategoryId) { setMenu(false); setCategory(id); }

  return <div className={styles.page} ref={root} data-theme="dark" data-active-section={active} data-motion={motion}>
    <a className={styles.skip} href="#chapters">跳到选择场景</a>
    <header className={styles.header} data-entrance="header">
      <a href="#top" className={styles.brand} aria-label="Entangled Shelter 首页"><span className={styles.brandSymbol}>✳</span> Entangled Shelter <span className={styles.edition}>THE INDECISION EDITION</span></a>
      <nav className={styles.headerNav} aria-label="主要导航">{chapters.map((item) => <a href={`#${item.id}`} key={item.id} aria-current={active === item.id ? "location" : undefined}>{item.name}</a>)}<a href="#ritual">玩法</a><a href="/history">档案</a></nav>
      <button className={styles.headerCta} onClick={() => open("food")}>替我决定 <span>↗</span></button>
      <button className={styles.menuButton} aria-label={menu ? "关闭菜单" : "打开菜单"} aria-expanded={menu} aria-controls="chapter-menu" onClick={() => setMenu(!menu)}>{menu ? "×" : "☰"}</button>
      <span className={styles.progress} data-scroll-progress aria-hidden="true" />
    </header>
    {menu && <nav id="chapter-menu" className={styles.mobileMenu} aria-label="章节菜单">{chapters.map((item) => <a href={`#${item.id}`} key={item.id} onClick={() => setMenu(false)}><span>{item.number}</span>{item.name}<i>{item.title}</i></a>)}<a href="#ritual" onClick={() => setMenu(false)}>怎么玩？ <i>The ritual</i></a><a href="/history"><span>V</span>选择档案 <i>The archive</i></a></nav>}
    <aside className={`${styles.sidebar} ${active !== "top" && active !== "intro" ? styles.sidebarVisible : ""}`} aria-label="章节导航">
      <a className={styles.sidebarTitle} href="#top">The<br /><em>Indecision</em><br />Edition</a>
      <div className={styles.sidebarLinks}>{chapters.map((item) => <a href={`#${item.id}`} key={item.id} aria-current={active === item.id ? "location" : undefined}><span>{item.name}<small>{item.title}</small></span><i>{item.number}</i></a>)}<a href="#ritual" aria-current={active === "ritual" ? "location" : undefined}><span>游戏规则<small>The ritual</small></span><i>IV</i></a><a href="/history"><span>选择档案<small>The archive</small></span><i>V</i></a></div>
      <span className={styles.sidebarFoot}>LESS OVERTHINKING.<br />MORE LIVING.<br /><br />© ENTANGLED SHELTER 2026</span>
    </aside>
    <main>
      <section id="top" className={styles.heroScroll} data-nav-section data-depth-section data-theme="dark">
        <div className={styles.hero}>
          <div className={styles.heroImage} data-hero-image><Art id="station" alt="古典油画中的站台人物与悬浮绿色游戏机" focus={.67} priority /></div>
          <div className={styles.heroShade} />
          <Geometry className={styles.heroGeometry} /><div className={styles.heroGeometryMotion} data-hero-geometry><Geometry /></div>
          <div className={styles.heroCopy} data-hero-title>
            <p className={styles.eyebrow} data-entrance="detail">A LITTLE CHANCE. A LITTLE COURAGE.</p>
            <h1><span className={styles.titleLine}><span data-entrance="title">Entangled</span></span><span className={styles.titleLine}><em data-entrance="title">Shelter</em></span></h1>
            <div className={styles.heroDescription} data-entrance="detail"><span>给选择困难症的<br />一间避难所。</span><p>不必想好所有答案。<br />先猜，后抽。猜对了，就选它。</p></div>
            <a className={styles.heroLink} href="#chapters" data-entrance="detail">让偶然开始 <span>↓</span></a>
          </div>
          <div className={styles.heroCards} aria-hidden="true">{["♥", "♠", "♦"].map((suit, index) => <div className={styles.heroCard} key={suit} data-hero-card><small>{index === 1 ? "Q" : "A"}<br />{suit}</small><b>{suit}</b><span>ES</span></div>)}</div>
          <div className={styles.heroBottom} data-hero-note data-entrance="detail"><span>VIBE CODING FOR THE BEAUTIFULLY UNDECIDED</span><span>向下滚动，进入另一种可能 <b>↓</b></span><span>01 — 04</span></div>
        </div>
      </section>
      <section className={styles.intro} id="intro" data-nav-section data-theme="light">
        <div className={styles.introLabel} data-reveal><span>WELCOME TO THE SHELTER</span><span>没有正确答案，也没关系。</span></div>
        <h2 data-reveal>所有可能，<br />都值得<em>一次偶然。</em></h2>
        <div className={styles.introBottom} data-reveal><p>晚饭、衣橱、下一站。<br />把那些都不错的选项放在一起，<br />让一场小小的游戏，结束漫长的比较。</p><a href="#chapters">三个入口，一个答案 <span>↘</span></a><span className={styles.introStar} aria-hidden="true">✳</span></div>
      </section>
      <div id="chapters" className={styles.chapters}>
        {chapters.map((chapter) => <section id={chapter.id} className={styles.chapter} key={chapter.id} data-nav-section data-depth-section data-theme="dark" data-category={chapter.id}>
          <div className={styles.chapterBackdrop} data-scene-mask>
            <div className={styles.chapterImage} data-chapter-image><Art id={chapter.image} alt={`${chapter.name}章节的${chapter.image === "room" ? "蓝色飞纸房间" : chapter.image === "levitate" ? "空中漂浮人物" : "盐湖家庭与风筝"}`} focus={chapter.focus} /></div>
            <div className={styles.chapterShade} data-chapter-shade />
            <div className={styles.chapterGeometry} data-chapter-geometry><Geometry /></div>
          </div>
          <div className={styles.chapterContent}>
            <div className={styles.chapterHeading}>
              <div className={styles.chapterOverline}><span>CHAPTER {chapter.number}</span><span>{chapter.note}</span></div>
              <div data-chapter-title><h2>{chapter.title}<sup>{chapter.number}</sup></h2><p className={styles.chapterSubtitle}>{chapter.subtitle}</p></div>
              <div className={styles.chapterLead}><p>{chapter.description}</p><button className={styles.roundCta} onClick={() => open(chapter.id)} data-choice-category={chapter.id} aria-label={`打开${chapter.name}选择器`}>开始选择 <span>↗</span></button></div>
            </div>
            <div className={styles.chapterDetails}>
              <article className={styles.storyCard} data-reveal>
                {chapter.id === "food" ? <div className={styles.foodFilm}><video controls autoPlay muted loop playsInline preload="metadata" poster="/entangled/food-film-v10.webp" aria-label="美食章节视频"><source src="/entangled/food-film-v10.mp4" type="video/mp4" />你的浏览器暂不支持视频播放。</video></div> : <button className={styles.storyVisual} onClick={() => open(chapter.id)} aria-label={`进入${chapter.name}具体样式`} data-depth-section><Art id={chapter.detail} alt={chapter.detail === "atelier" ? "奶油色房间里的白裙穿搭" : "车内沐浴阳光的旅行人物"} focus={chapter.detail === "atelier" ? .28 : .6} /><span>EXPLORE {chapter.title.toUpperCase()} ↗</span></button>}
                <div className={styles.storyCopy}><span className={styles.tinyLabel}>A DIFFERENT WAY TO DECIDE</span><h3>{chapter.detailTitle}</h3><p>{chapter.detailCopy}</p><button className={styles.textButton} onClick={() => open(chapter.id)}>进入{chapter.name}选择器 <span>↗</span></button></div>
              </article>
              <div className={styles.choiceColumn}>
                <article className={styles.pickCard} data-reveal data-chapter-entry={chapter.id}>
                  <div className={styles.pickHeading}><span className={styles.tinyLabel}>THE {chapter.title.toUpperCase()} EDIT / {chapter.number}</span><span className={styles.pickEdition}>20 POSSIBILITIES</span></div>
                  <span className={styles.pickTitle} aria-hidden="true">{chapter.title}<i>↗</i></span>
                  <h3>{chapter.subtitle}</h3>
                  <p className={styles.pickIntro}>留几个心动的选项，让偶然替你揭晓。</p>
                  <div className={styles.styleLabels}>{chapter.labels.map((label, index) => <button onClick={() => open(chapter.id)} key={label}><small>0{index + 1}</small><span>{label}</span><i aria-hidden="true">↗</i></button>)}</div>
                  <button className={styles.pickAction} onClick={() => open(chapter.id)}>探索全部{chapter.name}灵感 <span aria-hidden="true">↗</span></button>
                </article>
                <div className={styles.chapterNote} data-reveal><span>THE RULE IS SIMPLE</span><p>猜对了，就选它。<br />没猜对，再给直觉一次机会。</p><span>NO PROFILE. NO PRESSURE.</span></div>
              </div>
            </div>
          </div>
        </section>)}
      </div>
      <section id="ritual" className={styles.ritual} data-nav-section data-theme="light">
        <div className={styles.ritualContent}>
          <p className={styles.tinyLabel} data-reveal>IV / THE ART OF LETTING GO</p>
          <h2 data-ritual-title>一点游戏，<br /><em>一点勇气。</em></h2>
          <p className={styles.ritualIntro} data-reveal>不让随机替你思考。先说出偏爱，再给偶然一个机会。</p>
          <div className={styles.ritualCards}>
            {[{ n: "01", title: "命运扑克", suit: "♥", copy: "押一个候选，猜红还是黑。翻牌猜对，答案生效。" }, { n: "02", title: "剪刀石头布", suit: "✌︎", copy: "先选心里的答案，再出拳。赢过系统，就选它。" }, { n: "03", title: "先猜后抽", suit: "?", copy: "猜哪一个会被抽中。猜对才确认，没中可以再来。" }].map((rule) => <button className={styles.ritualCard} key={rule.n} data-ritual-card onClick={() => open("food")}><span>{rule.n}<i>↗</i></span><b>{rule.suit}</b><h3>{rule.title}</h3><p>{rule.copy}</p></button>)}
          </div>
          <div className={styles.artInterlude} data-reveal>
            <div className={styles.interludeImage} data-depth-section><Art id="angels" alt="相依的古典天使群像" /></div><div><p className={styles.tinyLabel}>A SOFTER PLACE TO LAND</p><h3>不必每次，<br />都做最好的选择。</h3><p>有时，选一个喜欢的，<br />然后好好生活，就够了。</p></div>
          </div>
        </div>
      </section>
      <section id="ending" className={styles.ending} data-nav-section data-theme="dark" data-depth-section>
        <div className={styles.endingArt}><Art id="hands" alt="两只彼此靠近的古典油画手掌" /></div>
        <div className={styles.endingCopy} data-reveal><p className={styles.tinyLabel}>YOUR NEXT POSSIBILITY IS WAITING</p><h2>别再想了。<br /><em>Let&apos;s play.</em></h2><div className={styles.endingActions}>{chapters.map((item) => <button onClick={() => open(item.id)} key={item.id}>{item.name} <span>↗</span></button>)}<a className={styles.archiveAction} href="/history">翻阅选择档案 <span>↗</span></a></div></div>
        <footer className={styles.footer}><a href="#top">Entangled Shelter ↑</a><span>BUILT FOR BEAUTIFUL INDECISION · 2026</span></footer>
      </section>
    </main>
    {category && <ChoiceLab key={category} categoryId={category} onClose={() => setCategory(null)} />}
  </div>;
}
