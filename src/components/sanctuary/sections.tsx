import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, Sparkles, Compass, BookOpen, Loader2 } from "lucide-react";
import { CHAPTERS, ORACLE, VERSES, fetchVerse, getChapter, toDevanagari, toRoman, type Verse } from "@/data/gita";
import { Mandala, Reveal, Magnetic } from "./fx";

export type Pos = { ch: number; v: number; note?: string };

export function Brand() {
  return (
    <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
      <span className="font-display text-ivory shrink-0 text-base tracking-[0.3em] sm:text-lg sm:tracking-[0.35em]">G<span className="font-sans text-gold font-light">1</span>TA</span>
      <span className="bg-gold glow h-1.5 w-1.5 shrink-0 rounded-full" />
      <span className="text-muted-foreground hidden text-[10px] uppercase tracking-[0.3em] lg:inline-block">The Eternal Song of the Divine</span>
    </div>
  );
}

export function Hero({ onBegin, onOracle }: { onBegin: () => void; onOracle: () => void }) {
  const [draw, setDraw] = useState<Verse | null>(null);
  const [flipped, setFlipped] = useState(false);
  const pull = () => {
    setFlipped(false);
    setDraw(VERSES[Math.floor(Math.random() * VERSES.length)] ?? null);
    setTimeout(() => setFlipped(true), 500);
  };
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-24 text-center">
      <div className="text-gold pointer-events-none absolute inset-0 flex items-center justify-center" style={{ opacity: "var(--mandala-opacity)" }}>
        <Mandala part="lotus" className="animate-spin-slow absolute h-[140vmin] w-[140vmin] md:h-[120vmin] md:w-[120vmin]" />
        <Mandala part="yantra" className="animate-spin-slower absolute h-[100vmin] w-[100vmin] md:h-[85vmin] md:w-[85vmin]" />
        <div className="animate-core absolute"><Mandala part="core" className="h-[60vmin] w-[60vmin] md:h-[50vmin] md:w-[50vmin] drop-shadow-[0_0_24px_var(--gold)]" /></div>
      </div>
      <div className="hero-aura pointer-events-none absolute inset-0" />
      <p className="text-gold relative mb-8 text-[10px] uppercase tracking-[0.35em] sm:text-[11px] sm:tracking-[0.5em]">Kurukshetra · The Chariot · Chapter I</p>
      <h1 className="font-serif text-ivory relative max-w-5xl text-[clamp(2.25rem,9vw,6rem)] font-light leading-[1.08] sm:text-6xl md:text-7xl lg:text-8xl">
        <Reveal text="When the Mind is at War," delay={0.2} />
        <br />
        <span className="italic"><Reveal text="Enter the Eternal Dialogue." delay={0.6} className="text-gold-liquid" /></span>
      </h1>
      <p className="text-muted-foreground relative mt-8 max-w-xl text-base leading-relaxed">
        Seven hundred verses spoken between a warrior and the Divine — on duty, fear, and the mastery of the mind.
      </p>
      <div className="relative mt-12 flex w-full flex-col items-stretch justify-center gap-3.5 px-4 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
        <Magnetic onClick={onBegin} className="bg-gold-liquid glow sweep text-primary-foreground min-h-14 w-full rounded-full px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] sm:w-auto sm:px-8 sm:text-sm sm:tracking-[0.2em]">
          Begin the Journey · Ch. 1
        </Magnetic>
        <button onClick={pull} className="glass text-foreground hover:text-gold flex min-h-14 items-center justify-center gap-2 rounded-full px-6 py-4 text-sm tracking-wide transition-colors"><Sparkles className="h-4 w-4" />Verse of the Moment</button>
        <button onClick={onOracle} className="glass text-muted-foreground hover:text-gold flex min-h-14 items-center justify-center gap-2 rounded-full px-6 py-4 sm:border-transparent sm:bg-transparent text-sm tracking-wide transition-colors"><Compass className="h-4 w-4" />Seek Guidance by State of Mind</button>
      </div>

      <AnimatePresence>
        {draw && (
          <motion.div className="bg-background/80 fixed inset-0 z-[60] flex items-center justify-center p-6 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDraw(null)}>
            <div style={{ perspective: 1400 }} onClick={(e) => e.stopPropagation()}>
              <motion.div className="relative h-[520px] w-[340px] md:w-[400px]" style={{ transformStyle: "preserve-3d" }} initial={{ rotateY: 0, y: 40 }} animate={{ rotateY: flipped ? 180 : 0, y: 0 }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}>
                <div className="glass glow absolute inset-0 flex items-center justify-center rounded-3xl" style={{ backfaceVisibility: "hidden" }}>
                  <Mandala className="text-gold h-56 w-56 animate-spin" />
                </div>
                <div className="glass glow absolute inset-0 flex flex-col justify-between rounded-3xl p-8 text-left" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                  <p className="text-gold text-[10px] uppercase tracking-[0.4em]">Bhagavad Gita {draw.ch}.{draw.v}</p>
                  <p className="font-deva text-ivory whitespace-pre-line text-lg leading-loose">{draw.devanagari}</p>
                  <p className="font-serif text-foreground text-xl italic leading-snug">"{draw.translation}"</p>
                  <button onClick={() => { setDraw(null); onBegin(); }} className="text-muted-foreground hover:text-gold self-start text-xs uppercase tracking-[0.3em]">Close ✦</button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function SectionTitle({ k, title, sub }: { k: string; title: string; sub: string }) {
  return (
    <div className="mb-10 text-center md:mb-14">
      <p className="text-gold mb-4 text-[11px] uppercase tracking-[0.5em]">{k}</p>
      <h2 className="font-display text-ivory text-[clamp(1.75rem,7vw,3rem)] tracking-[0.12em]"><Reveal text={title} /></h2>
      <p className="font-serif text-muted-foreground mx-auto mt-4 max-w-xl text-xl italic">{sub}</p>
    </div>
  );
}

export function Oracle({ onOpen }: { onOpen: (p: Pos) => void }) {
  return (
    <section id="oracle" className="relative mx-auto max-w-6xl scroll-mt-24 px-4 py-24 sm:px-6 md:py-32">
      <SectionTitle k="भ्रान्ति · Bhranti" title="The Dilemma Oracle" sub="What weighs upon your mind? Choose, and the song will answer." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ORACLE.map((o, i) => (
          <motion.button key={o.id} onClick={() => onOpen({ ch: o.refs[0][0], v: o.refs[0][1], note: o.note })}
            initial={{ opacity: 0, y: 24, filter: "blur(6px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.8 }}
            className="glass spot specular group hover:glow rounded-2xl p-6 sm:p-8 text-left transition-all duration-500 hover:-translate-y-1 hover:border-gold/60">
            <span className="font-deva text-gold/70 group-hover:text-gold text-3xl transition-colors">{o.sanskrit}</span>
            <h3 className="font-serif text-ivory mt-6 text-2xl">{o.label}</h3>
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">{o.note}</p>
            <p className="text-gold mt-6 text-[10px] uppercase tracking-[0.35em]">{o.refs.map((r) => r.join(".")).join(" · ")} →</p>
          </motion.button>
        ))}
      </div>
    </section>
  );
}

export function Chapters({ onOpen }: { onOpen: (p: Pos) => void }) {
  return (
    <section id="chapters" className="relative mx-auto max-w-7xl scroll-mt-24 px-4 py-24 sm:px-6 md:py-32">
      <SectionTitle k="अष्टादश अध्याय" title="The Eighteen Adhyayas" sub="Eighteen chapters. Seven hundred verses. One conversation." />
      <div className="grid auto-rows-[minmax(200px,auto)] grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:auto-rows-[minmax(240px,auto)] md:grid-cols-4">
        {CHAPTERS.map((c, i) => {
          const big = [1, 2, 11, 18].includes(c.n);
          return (
            <motion.button key={c.n} onClick={() => onOpen({ ch: c.n, v: 1 })}
              initial={{ opacity: 0, y: 24, filter: "blur(6px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }} viewport={{ once: true, margin: "-60px" }} transition={{ delay: (i % 4) * 0.07, duration: 0.8 }}
              className={`glass spot specular group hover:glow flex flex-col justify-between overflow-hidden rounded-2xl p-7 text-left transition-all duration-500 hover:border-gold/70 ${big ? "sm:col-span-2" : ""}`}>
              <div className="flex items-start justify-between">
                <span className="font-display text-gold text-sm tracking-[0.3em]">{toRoman(c.n)}</span>
                <span className="font-deva text-gold/40 group-hover:text-gold text-4xl transition-colors">{toDevanagari(c.n)}</span>
              </div>
              <div>
                <p className="font-deva text-muted-foreground text-sm">{c.devanagari}</p>
                <h3 className="font-serif text-ivory mt-1 text-2xl leading-tight">{c.sanskrit}</h3>
                <p className="text-gold/90 mt-1 text-xs uppercase tracking-[0.2em]">{c.english}</p>
                {big && <p className="text-muted-foreground mt-4 max-w-md text-sm leading-relaxed">{c.theme}</p>}
                {!big && <p className="text-muted-foreground mt-3 line-clamp-3 text-xs leading-relaxed md:opacity-0 md:transition-opacity md:duration-500 md:group-hover:opacity-100">{c.theme}</p>}
                <p className="text-muted-foreground mt-4 text-[10px] uppercase tracking-[0.35em]">{c.verses} Verses</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}

export function Reader({ pos, setPos, zen, isSaved, toggleSave }: { pos: Pos; setPos: (p: Pos) => void; zen: boolean; isSaved: (k: string) => boolean; toggleSave: (v: Verse) => void }) {
  const [verse, setVerse] = useState<Verse | null>(null);
  const [err, setErr] = useState(false);
  const [word, setWord] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [showRef, setShowRef] = useState(true);
  const chapter = getChapter(pos.ch);

  useEffect(() => {
    let live = true;
    setErr(false); setWord(null); setHover(null);
    fetchVerse(pos.ch, pos.v).then((v) => live && setVerse(v)).catch(() => live && setErr(true));
    return () => { live = false; };
  }, [pos.ch, pos.v]);

  const step = (d: number) => {
    let { ch, v } = pos; v += d;
    if (v < 1) { ch = ch > 1 ? ch - 1 : 18; v = getChapter(ch).verses; }
    if (v > getChapter(ch).verses) { ch = ch < 18 ? ch + 1 : 1; v = 1; }
    setPos({ ch, v });
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input,textarea")) return;
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  });

  const key = `${pos.ch}.${pos.v}`;
  const loading = !verse || verse.ch !== pos.ch || verse.v !== pos.v;

  return (
    <section id="reader" className={`relative mx-auto scroll-mt-20 px-3 transition-all duration-700 sm:px-6 ${zen ? "max-w-5xl py-28 md:py-40" : "max-w-4xl py-24 md:py-32"}`}>
      {!zen && <SectionTitle k="The Sanctuary" title="Verse Reader" sub="Use ← → or swipe to move through the song." />}
      <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:mb-6 sm:gap-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <select aria-label="Chapter" value={pos.ch} onChange={(e) => setPos({ ch: +e.target.value, v: 1 })} className="glass text-foreground min-h-11 min-w-0 flex-1 truncate rounded-full px-4 py-2 text-xs uppercase tracking-[0.15em] outline-none sm:flex-none">
            {CHAPTERS.map((c) => <option key={c.n} value={c.n} className="bg-background">{toRoman(c.n)} · {c.sanskrit}</option>)}
          </select>
          <select aria-label="Verse" value={pos.v} onChange={(e) => setPos({ ch: pos.ch, v: +e.target.value })} className="glass text-foreground min-h-11 shrink-0 rounded-full px-3 py-2 text-xs outline-none">
            {Array.from({ length: chapter.verses }, (_, i) => <option key={i} value={i + 1} className="bg-background">Verse {i + 1}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button aria-label="Previous verse" onClick={() => step(-1)} className="glass hover:text-gold grid h-11 w-11 place-items-center rounded-full transition-colors"><ArrowLeft className="h-4 w-4" /></button>
          <button aria-label="Next verse" onClick={() => step(1)} className="glass hover:text-gold grid h-11 w-11 place-items-center rounded-full transition-colors"><ArrowRight className="h-4 w-4" /></button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.article key={key} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2}
          onDragEnd={(_, i) => { if (i.offset.x < -80) step(1); if (i.offset.x > 80) step(-1); }}
          initial={{ opacity: 0, filter: "blur(14px)", y: 20 }} animate={{ opacity: 1, filter: "blur(0px)", y: 0 }} exit={{ opacity: 0, filter: "blur(14px)", y: -20 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          whileDrag={{ scale: 0.98, rotate: 0 }} style={{ touchAction: "pan-y" }}
          className="glass spot specular relative cursor-grab overflow-hidden rounded-3xl p-5 active:cursor-grabbing sm:p-8 md:p-14">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <p className="text-gold text-[10px] uppercase tracking-[0.45em]">{chapter.sanskrit}</p>
              <p className="font-display text-ivory mt-2 text-2xl tracking-[0.2em]">{toRoman(pos.ch)} · {pos.v}</p>
            </div>
            {verse && !loading && (
              <button aria-label="Bookmark verse" onClick={() => toggleSave(verse)} className="hover:text-gold text-muted-foreground transition-colors">
                {isSaved(key) ? <BookmarkCheck className="text-gold h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
              </button>
            )}
          </div>

          {pos.note && <p className="font-serif text-gold mb-8 border-l border-gold/40 pl-4 text-lg italic">{pos.note}</p>}

          {err ? (
            <p className="text-muted-foreground py-16 text-center">This verse could not be reached right now. Try another, or check your connection.</p>
          ) : loading ? (
            <div className="text-gold flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <>
              <p className={`font-deva text-ivory whitespace-pre-line text-center leading-[1.9] [text-shadow:0_0_30px_var(--aura)] ${zen ? "text-3xl md:text-5xl" : "text-xl sm:text-2xl md:text-4xl"}`}>{verse!.devanagari}</p>
              <p className="font-serif text-muted-foreground mt-8 whitespace-pre-line text-center text-lg italic leading-relaxed sm:text-xl">{verse!.iast}</p>

              {verse!.words.length > 0 && (
                <div className="mt-8 sm:mt-10">
                  <p className="text-muted-foreground mb-3 text-center text-[10px] uppercase tracking-[0.35em]">Tap a word to reveal its meaning</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {verse!.words.map(([w, m], i) => (
                      <button key={i} onPointerDown={(e) => e.stopPropagation()} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => setWord(word === i ? null : i)} aria-pressed={word === i}
                        className={`glass min-h-11 rounded-full px-4 py-2 text-sm transition-all duration-300 ${word === i ? "border-gold text-gold glow" : hover === i ? "text-gold" : "text-foreground"}`}>
                        <span className={/[\u0900-\u097F]/.test(w) ? "font-deva" : "font-serif italic"}>{w}</span>
                      </button>
                    ))}
                  </div>
                  <AnimatePresence mode="wait">
                    {(word ?? hover) !== null && verse!.words[(word ?? hover)!] && (
                      <motion.div key={word ?? hover} initial={{ opacity: 0, y: 8, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -6 }}
                        className="glass specular glow mx-auto mt-4 max-w-md rounded-2xl px-5 py-4 text-center">
                        <p className="text-gold text-lg">{verse!.words[(word ?? hover)!]![0]}</p>
                        <p className="text-foreground mt-1 text-sm">{verse!.words[(word ?? hover)!]![1]}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <div className="mx-auto my-12 h-px w-24 bg-gold/40" />
              <p className={`font-serif text-ivory text-center leading-snug ${zen ? "text-3xl" : "text-xl sm:text-2xl md:text-[1.7rem]"}`}>{verse!.translation}</p>

              {verse!.reflection && !zen && (
                <div className="mt-12">
                  <button onClick={() => setShowRef(!showRef)} className="text-gold flex items-center gap-2 text-[11px] uppercase tracking-[0.35em]"><BookOpen className="h-4 w-4" />The Strategist's Reflection {showRef ? "−" : "+"}</button>
                  <AnimatePresence initial={false}>
                    {showRef && (
                      <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="text-muted-foreground mt-4 overflow-hidden leading-relaxed">{verse!.reflection}</motion.p>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
        </motion.article>
      </AnimatePresence>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button onClick={() => step(-1)} className="glass specular hover:text-gold flex min-h-12 items-center justify-center gap-2 rounded-full text-xs uppercase tracking-[0.25em] transition-colors"><ArrowLeft className="h-4 w-4" />Prev Verse</button>
        <button onClick={() => step(1)} className="glass specular hover:text-gold flex min-h-12 items-center justify-center gap-2 rounded-full text-xs uppercase tracking-[0.25em] transition-colors">Next Verse<ArrowRight className="h-4 w-4" /></button>
      </div>
    </section>
  );
}
