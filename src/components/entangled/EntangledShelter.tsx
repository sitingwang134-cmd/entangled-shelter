"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { rememberTrace } from "./choice-memory";
import { DissolveEdge } from "./DissolveEdge";
import { PhotoScene } from "./PhotoScene";
import { ChoiceLab, type CategoryId } from "./ChoiceLab";
import { TravelPorthole } from "./TravelPorthole";
import { useSiteMotion } from "./site-motion";
import styles from "./EntangledShelter.module.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const chapters = [
  { id: "food" as const, number: "I", name: "Taste", title: "Taste", subtitle: "Give the evening to appetite.", description: "Hot pot or ramen? When everything tempts you, leave one seat at the table for chance.", image: "room", focus: .64, detail: "doorway", detailTitle: "The night is too long to spend in indecision.", detailCopy: "From fragrant steam to something crisp and bright: gather what you truly crave, make your wager, then reveal the answer.", labels: ["A Fiery Supper", "After-Hours Table", "Garden Lightness", "A Sweet Finale"], note: "FEED YOUR CURIOSITY", symbol: "♥" },
  { id: "style" as const, number: "II", name: "Style", title: "Style", subtitle: "There is more than one way to be you.", description: "Every possibility in the wardrobe deserves its entrance. Let instinct take the first step.", image: "levitate", focus: .53, detail: "atelier", detailTitle: "Style has no final answer—only the mood of this moment.", detailCopy: "From quiet monochrome to easy vintage: choose the silhouettes calling to you and let play settle the matter.", labels: ["Quiet Monochrome", "American Vintage", "Relaxed Tailoring", "Outdoor Utility"], note: "DRESS FOR THE POSSIBILITY", symbol: "♠" },
  { id: "travel" as const, number: "III", name: "Wander", title: "Wander", subtitle: "Let chance name the next horizon.", description: "The itinerary may wait; departure need not. Mountains, shoreline, or a small city you have never met.", image: "salt", focus: .68, detail: "car", detailTitle: "Leave the route to the map, and the longing to yourself.", detailCopy: "You need not decide the whole world. Begin with one weekend and let a single card carry you farther.", labels: ["Highland Footpath", "A Day by the Sea", "City Drift", "Old-Town Reverie"], note: "TAKE THE SCENIC ROUTE", symbol: "♦" },
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
  if (id === "room") return <div className={styles.tasteMaterial}><PhotoScene image="/entangled/taste-editorial/pomegranate-table.webp" alt="Pomegranates, grapes and apples with copper cups on a dark table" focus={.5} /></div>;
  return <PhotoScene image={id === "salt" ? "/entangled/salon/wander-mist-castle.webp" : id === "station" ? "/entangled/salon/castle.webp" : id === "levitate" ? "/entangled/salon/sculpture-duet.webp" : id === "atelier" ? "/entangled/salon/salon.webp" : `/entangled/photos/${id}.webp`} atmosphere={id === "station"} alt={alt} focus={focus} priority={priority} />;
}

export function EntangledShelter() {
  const root = useRef<HTMLDivElement>(null);
  const portal = useRef<HTMLDivElement>(null);
  const transitioning = useRef(false);
  const transitionTimeline = useRef<gsap.core.Timeline | null>(null);
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
      gsap.set("[data-hero-card]", { rotationX: 0, rotationY: 0 });
      gsap.timeline({ defaults: { ease: "power3.out" } })
        .from("[data-entrance='header']", { y: -65, autoAlpha: 0, duration: .8 })
        .from("[data-entrance='title']", { yPercent: 110, rotation: 3, autoAlpha: 0, duration: 1.3, stagger: .12 }, .15)
        .from("[data-entrance='detail']", { y: 30, autoAlpha: 0, duration: .8, stagger: .12 }, .65)
        .from("[data-hero-card]", { y: 60, autoAlpha: 0, duration: 1, stagger: .1 }, .6);
      gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: "#top", start: "top top", end: "bottom bottom", scrub: .8 } })
        .to("[data-hero-image]", { scale: 1.17, yPercent: 4 }, 0)
        .to("[data-hero-title]", { yPercent: -45, scale: .83, autoAlpha: 0 }, 0)
        .to("[data-hero-note]", { y: -70, autoAlpha: 0 }, 0)
        .to("[data-hero-card]", { yPercent: -180, x: (index) => (index - 1) * 130, rotation: (index) => (index - 1) * 24, rotationX: 0, rotationY: 0, scale: 1.3, stagger: .04 }, 0)
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

  useEffect(() => () => { transitionTimeline.current?.kill(); }, []);
  function open(id: CategoryId) {
    if(transitioning.current) return;
    setMenu(false);
    rememberTrace(id,"opened",`Entered the ${id} room`);
    if(motion === "reduced" || !portal.current) {setCategory(id);return;}
    transitioning.current=true;
    const panel=portal.current;
    panel.dataset.category=id;
    transitionTimeline.current=gsap.timeline({onComplete:()=>{transitioning.current=false;transitionTimeline.current=null;}})
      .set(panel,{display:"grid",opacity:1})
      .fromTo(panel.querySelector("[data-portal-card]"),{scale:.2,rotation:-18,opacity:0},{scale:1,rotation:0,opacity:1,duration:.32,ease:"power2.out"})
      .to(panel.querySelector("[data-portal-card]"),{scale:14,rotation:9,duration:.65,ease:"power3.inOut"})
      .call(()=>setCategory(id))
      .to(panel,{opacity:0,duration:.45},"+=.08")
      .set(panel,{display:"none"});
  }

  return <div className={styles.page} ref={root} data-theme="dark" data-active-section={active} data-motion={motion}>
    <div className={styles.cardPortal} ref={portal} aria-hidden="true"><div data-portal-card><small>ES / THE PRIVATE SALON</small><b>♠</b><span>ONE MORE POSSIBILITY</span></div></div>
    <a className={styles.skip} href="#chapters">Skip to the decision rooms</a>
    <header className={styles.header} data-entrance="header">
      <a href="#top" className={styles.brand} aria-label="Entangled Shelter home"><span className={styles.brandSymbol}>✳</span> Entangled Shelter <span className={styles.edition}>THE INDECISION EDITION</span></a>
      <nav className={styles.headerNav} aria-label="Primary navigation">{chapters.map((item) => <a href={`#${item.id}`} key={item.id} aria-current={active === item.id ? "location" : undefined}>{item.name}</a>)}<a href="#ritual">The Ritual</a><a href="/history">Archive</a></nav>
      <button className={styles.headerCta} onClick={() => open("food")}>DECIDE FOR ME <span>↗</span></button>
      <button className={styles.menuButton} aria-label={menu ? "Close menu" : "Open menu"} aria-expanded={menu} aria-controls="chapter-menu" onClick={() => setMenu(!menu)}>{menu ? "×" : "☰"}</button>
      <span className={styles.progress} data-scroll-progress aria-hidden="true" />
    </header>
    {menu && <nav id="chapter-menu" className={styles.mobileMenu} aria-label="Chapter menu">{chapters.map((item) => <a href={`#${item.id}`} key={item.id} onClick={() => setMenu(false)}><span>{item.number}</span>{item.name}</a>)}<a href="#ritual" onClick={() => setMenu(false)}>How it works <i>The ritual</i></a><a href="/history"><span>V</span>Decision Archive <i>The archive</i></a></nav>}
    <aside className={`${styles.sidebar} ${active !== "top" && active !== "intro" ? styles.sidebarVisible : ""}`} aria-label="Chapter navigation">
      <a className={styles.sidebarTitle} href="#top">The<br /><em>Indecision</em><br />Edition</a>
      <div className={styles.sidebarLinks}>{chapters.map((item) => <a href={`#${item.id}`} key={item.id} aria-current={active === item.id ? "location" : undefined}><span>{item.name}</span><i>{item.number}</i></a>)}<a href="#ritual" aria-current={active === "ritual" ? "location" : undefined}><span>The Rules<small>The ritual</small></span><i>IV</i></a><a href="/history"><span>Decisions<small>The archive</small></span><i>V</i></a></div>
      <span className={styles.sidebarFoot}>LESS OVERTHINKING.<br />MORE LIVING.<br /><br />© ENTANGLED SHELTER 2026</span>
    </aside>
    <main>
      <section id="top" className={styles.heroScroll} data-nav-section data-depth-section data-theme="dark">
        <div className={styles.hero}>
          <div className={styles.heroImage} data-hero-image><Art id="station" alt="A medieval Scottish castle reflected in a misty lake" focus={.67} priority /></div>
          <div className={styles.heroShade} />
          <Geometry className={styles.heroGeometry} /><div className={styles.heroGeometryMotion} data-hero-geometry><Geometry /></div>
          <div className={styles.heroCopy} data-hero-title>
            <p className={styles.eyebrow} data-entrance="detail">A LITTLE CHANCE. A LITTLE COURAGE.</p>
            <h1><span className={styles.titleLine}><span data-entrance="title">Entangled</span></span><span className={styles.titleLine}><em data-entrance="title">Shelter</em></span></h1>
            <div className={styles.heroDescription} data-entrance="detail"><span>A refuge for the<br />beautifully undecided.</span><p>You need not know every answer.<br />Choose, remember, begin again. The answer is not the end.</p></div>
            <a className={styles.heroLink} href="#chapters" data-entrance="detail">LET CHANCE BEGIN <span>↓</span></a>
          </div>
          <div className={styles.heroCards}>{["♥", "♠", "♦"].map((suit, index) => <button className={styles.heroCard} key={suit} data-hero-card onClick={() => open(chapters[index].id)} aria-label={`Enter ${chapters[index].title} through the card`}><small>{index === 1 ? "Q" : "A"}<br />{suit}</small><b>{suit}</b><span>ES</span></button>)}</div>
          <div className={styles.heroBottom} data-hero-note data-entrance="detail"><span>A PRIVATE SALON FOR BEAUTIFUL INDECISION</span><span>SCROLL INTO ANOTHER POSSIBILITY <b>↓</b></span><span>01 — 04</span></div>
        </div>
      </section>
      <section className={styles.intro} id="intro" data-nav-section data-theme="light">
        <DissolveEdge />
        <div className={styles.introLabel} data-reveal><span>WELCOME TO THE SHELTER</span><span>There need not be a perfect answer.</span></div>
        <h2 data-reveal>Every possibility<br />deserves <em>a little chance.</em></h2>
        <div className={styles.introBottom} data-reveal><p>Supper, wardrobe, the next horizon.<br />Gather the choices that already feel right,<br />then let a small game end the long comparison.</p><a href="#chapters">THREE DOORS, ONE ANSWER <span>↘</span></a><span className={styles.introStar} aria-hidden="true">✳</span></div>
      </section>
      <div id="chapters" className={styles.chapters}>
        {chapters.map((chapter) => <section id={chapter.id} className={styles.chapter} key={chapter.id} data-nav-section data-depth-section data-theme="dark" data-category={chapter.id}>
          <div className={styles.chapterBackdrop} data-scene-mask>
            <div className={styles.chapterImage} data-chapter-image><Art id={chapter.image} alt={chapter.image === "room" ? "Pomegranates, grapes and apples on a dark table" : chapter.image === "levitate" ? "Two classical marble portraits emerging from a dark gallery" : "A medieval stone castle surrounded by mist and deep green forest"} focus={chapter.focus} /></div>
            <div className={styles.chapterShade} data-chapter-shade />
            <div className={styles.chapterGeometry} data-chapter-geometry><Geometry /></div>
          </div>
          <DissolveEdge />
          <div className={styles.chapterContent}>
            <div className={styles.chapterHeading}>
              <div className={styles.chapterOverline}><span>CHAPTER {chapter.number}</span><span>{chapter.note}</span></div>
              <div data-chapter-title><h2>{chapter.title}<sup>{chapter.number}</sup></h2><p className={styles.chapterSubtitle}>{chapter.subtitle}</p></div>
              <div className={styles.chapterLead}><p>{chapter.description}</p><button className={styles.roundCta} onClick={() => open(chapter.id)} data-choice-category={chapter.id} aria-label={`Open the ${chapter.name} selector`}>BEGIN THE CHOICE <span>↗</span></button></div>
            </div>
            <div className={styles.chapterDetails}>
              <article className={styles.storyCard} data-reveal>
                {chapter.id === "food" ? <div className={styles.foodFilm}><video controls autoPlay muted loop playsInline preload="metadata" poster="/entangled/photos/food-pasta.webp" aria-label="Taste chapter film"><source src="/entangled/food-film-v10.mp4" type="video/mp4" />Your browser cannot play this film.</video></div> : chapter.id === "travel" ? <TravelPorthole onExplore={() => open("travel")} /> : <button className={styles.storyVisual} onClick={() => open(chapter.id)} aria-label={`Enter the ${chapter.name} edit`} data-depth-section><Art id={chapter.detail} alt="An ornate European salon with vaulted arches" focus={.28} /><span>EXPLORE {chapter.title.toUpperCase()} ↗</span></button>}
                <div className={styles.storyCopy}><span className={styles.tinyLabel}>A DIFFERENT WAY TO DECIDE</span><h3>{chapter.detailTitle}</h3><p>{chapter.detailCopy}</p><button className={styles.textButton} onClick={() => open(chapter.id)}>ENTER THE {chapter.name.toUpperCase()} SELECTOR <span>↗</span></button></div>
              </article>
              <div className={styles.choiceColumn}>
                <article className={styles.pickCard} data-reveal data-chapter-entry={chapter.id}>
                  <div className={styles.pickHeading}><span className={styles.tinyLabel}>THE {chapter.title.toUpperCase()} EDIT / {chapter.number}</span><span className={styles.pickEdition}>20 POSSIBILITIES</span></div>
                  <span className={styles.pickTitle} aria-hidden="true">{chapter.title}<i>↗</i></span>
                  <h3>{chapter.subtitle}</h3>
                  <p className={styles.pickIntro}>Keep a few possibilities close; let chance unveil the one.</p>
                  <div className={styles.styleLabels}>{chapter.labels.map((label, index) => <button onClick={() => open(chapter.id)} key={label}><small>0{index + 1}</small><span>{label}</span><i aria-hidden="true">↗</i></button>)}</div>
                  <button className={styles.pickAction} onClick={() => open(chapter.id)}>EXPLORE ALL {chapter.name.toUpperCase()} POSSIBILITIES <span aria-hidden="true">↗</span></button>
                </article>
                <div className={styles.chapterNote} data-reveal><span>THE RULE IS SIMPLE</span><p>If your instinct is right, choose it.<br />If not, grant it another chance.</p><span>NO PROFILE. NO PRESSURE.</span></div>
              </div>
            </div>
          </div>
        </section>)}
      </div>
      <section id="ritual" className={styles.ritual} data-nav-section data-theme="light">
        <DissolveEdge />
        <div className={styles.ritualContent}>
          <p className={styles.tinyLabel} data-reveal>IV / THE ART OF LETTING GO</p>
          <h2 data-ritual-title>A little play,<br /><em>a little courage.</em></h2>
          <p className={styles.ritualIntro} data-reveal>Chance does not think for you. Name your desire first, then give the unknown a turn.</p>
          <div className={styles.ritualCards}>
            {[{ n: "01", title: "The Fortune Deck", suit: "♥", copy: "Wager on a possibility, then call red or black. If the card agrees, the answer is yours." }, { n: "02", title: "A Fair Fight", suit: "✌︎", copy: "Choose the answer in your heart, then throw your hand. Win the duel and honour it." }, { n: "03", title: "Trust Your Hunch", suit: "?", copy: "Predict which answer chance will draw. A match settles it; a miss earns another turn." }].map((rule) => <button className={styles.ritualCard} key={rule.n} data-ritual-card onClick={() => open("food")}><span>{rule.n}<i>↗</i></span><b>{rule.suit}</b><h3>{rule.title}</h3><p>{rule.copy}</p></button>)}
          </div>
          <div className={styles.artInterlude} data-reveal>
            <div className={styles.interludeImage} data-depth-section><Art id="angels" alt="A picnic basket resting in a sunlit woodland" /></div><div><p className={styles.tinyLabel}>A SOFTER PLACE TO LAND</p><h3>You need not make<br />the finest choice every time.</h3><p>Sometimes it is enough to choose what you love,<br />and live it beautifully.</p></div>
          </div>
        </div>
      </section>
      <section id="ending" className={styles.ending} data-nav-section data-theme="dark" data-depth-section>
        <DissolveEdge />
        <div className={styles.endingArt}><Art id="hands" alt="Two people holding hands" /></div>
        <div className={styles.endingCopy} data-reveal><p className={styles.tinyLabel}>YOUR NEXT POSSIBILITY IS WAITING</p><h2>Enough thinking.<br /><em>Let&apos;s play.</em></h2><div className={styles.endingActions}>{chapters.map((item) => <button onClick={() => open(item.id)} key={item.id}>{item.name} <span>↗</span></button>)}<a className={styles.archiveAction} href="/history">OPEN THE DECISION ARCHIVE <span>↗</span></a></div></div>
        <footer className={styles.footer}><a href="#top">Entangled Shelter ↑</a><a href="/photo-credits.html">PHOTOGRAPHY CREDITS ↗</a><span>BUILT FOR BEAUTIFUL INDECISION · 2026</span></footer>
      </section>
    </main>
    {category && <ChoiceLab key={category} categoryId={category} onClose={() => setCategory(null)} />}
  </div>;
}

