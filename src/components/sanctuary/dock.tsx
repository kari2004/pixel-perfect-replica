import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Music2, Eye, EyeOff, Sun, Moon, BookMarked, X, Download, Trash2 } from "lucide-react";
import { CHAPTERS, VERSES, findVerse, getChapter, toRoman, type Verse } from "@/data/gita";
import type { Pos } from "./sections";

export type Saved = { key: string; ch: number; v: number; translation: string; devanagari: string; note: string };

/* ---------- 432Hz drone ---------- */
function useDrone() {
  const ref = useRef<{ ctx: AudioContext; master: GainNode; analyser: AnalyserNode; stop: () => void } | null>(null);
  const [on, setOn] = useState(false);
  const toggle = () => {
    if (ref.current) {
      const { ctx, master, stop } = ref.current;
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
      setTimeout(() => { stop(); ctx.close(); }, 1600);
      ref.current = null; setOn(false); return;
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    void ctx.resume(); // must run inside the tap handler for iOS / Android
    const master = ctx.createGain(); master.gain.value = 0.0001;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1400; lp.Q.value = 0.7;
    const delay = ctx.createDelay(); delay.delayTime.value = 0.35;
    const fb = ctx.createGain(); fb.gain.value = 0.35;
    const analyser = ctx.createAnalyser(); analyser.fftSize = 256;
    lp.connect(master); lp.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(master);
    master.connect(analyser); analyser.connect(ctx.destination);
    // 216Hz sub-drone + 432Hz harmonic drone with fifth & octave partials
    const partials: [number, OscillatorType, number][] = [[216, "sine", 0.32], [432, "sine", 0.24], [432 * 1.5, "triangle", 0.07], [864, "sine", 0.06], [432.6, "sine", 0.1], [108, "sine", 0.12]];
    const oscs = partials.map(([f, t, g]) => {
      const o = ctx.createOscillator(); o.type = t; o.frequency.value = f;
      const gn = ctx.createGain(); gn.gain.value = g;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05 + Math.random() * 0.15;
      const lg = ctx.createGain(); lg.gain.value = g * 0.5; lfo.connect(lg); lg.connect(gn.gain);
      o.connect(gn); gn.connect(lp); o.start(); lfo.start();
      return [o, lfo];
    });
    master.gain.setValueAtTime(0.0001, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 3);
    ref.current = { ctx, master, analyser, stop: () => oscs.flat().forEach((o) => o.stop()) };
    setOn(true);
  };
  return { on, toggle, analyser: () => ref.current?.analyser };
}

function Wave({ get }: { get: () => AnalyserNode | undefined }) {
  const c = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let raf = 0;
    const draw = () => {
      const a = get(); const cv = c.current;
      if (a && cv) {
        const ctx = cv.getContext("2d")!; const d = new Uint8Array(a.fftSize); a.getByteTimeDomainData(d);
        ctx.clearRect(0, 0, cv.width, cv.height);
        ctx.strokeStyle = getComputedStyle(cv).color; ctx.lineWidth = 1.5; ctx.beginPath();
        d.forEach((val, i) => { const x = (i / d.length) * cv.width, y = ((val - 128) / 128) * cv.height * 2.2 + cv.height / 2; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
        ctx.stroke();
      }
      raf = requestAnimationFrame(draw);
    };
    draw(); return () => cancelAnimationFrame(raf);
  }, [get]);
  return <canvas ref={c} width={56} height={16} className="text-gold h-4 w-10 sm:w-14" />;
}

/* ---------- Quote card export ---------- */
async function exportCard(v: { ch: number; v: number; devanagari: string; translation: string }) {
  await Promise.all(["500 26px Cinzel", "44px 'Noto Serif Devanagari'", "italic 46px 'Cormorant Garamond'"].map((f) => document.fonts.load(f).catch(() => null)));
  const W = 1080, H = 1350, S = 2, cv = document.createElement("canvas"); cv.width = W * S; cv.height = H * S;
  const c = cv.getContext("2d")!; c.scale(S, S);
  const GOLD = "#D4AF37";
  const g = c.createRadialGradient(W / 2, H * 0.42, 40, W / 2, H / 2, H * 0.9); g.addColorStop(0, "#1c170a"); g.addColorStop(1, "#050508");
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  // ornamental border
  c.strokeStyle = "rgba(212,175,55,0.65)"; c.lineWidth = 2; c.strokeRect(48, 48, W - 96, H - 96);
  c.strokeStyle = "rgba(212,175,55,0.3)"; c.lineWidth = 1; c.strokeRect(64, 64, W - 128, H - 128);
  c.fillStyle = GOLD;
  for (const [x, y] of [[48, 48], [W - 48, 48], [48, H - 48], [W - 48, H - 48]] as const) { c.save(); c.translate(x, y); c.rotate(Math.PI / 4); c.fillRect(-9, -9, 18, 18); c.restore(); }
  c.beginPath(); c.arc(W / 2, 205, 4, 0, Math.PI * 2); c.fill();
  c.textAlign = "center"; c.font = "500 26px Cinzel"; c.fillText(`BHAGAVAD GITA  ·  ${v.ch}.${v.v}`, W / 2, 160);
  const wrap = (t: string, y: number, lh: number, max: number) => {
    for (const para of t.split("\n")) {
      let line = "";
      for (const w of para.split(" ")) { const test = line + w + " "; if (c.measureText(test).width > max && line) { c.fillText(line.trim(), W / 2, y); y += lh; line = w + " "; } else line = test; }
      c.fillText(line.trim(), W / 2, y); y += lh;
    }
    return y;
  };
  c.fillStyle = "#F3E7C6"; c.font = "42px 'Noto Serif Devanagari'";
  let y = wrap(v.devanagari, 320, 76, 860);
  c.strokeStyle = "rgba(212,175,55,0.5)"; c.beginPath(); c.moveTo(W / 2 - 60, y + 10); c.lineTo(W / 2 + 60, y + 10); c.stroke();
  c.fillStyle = "#ece4cf"; c.font = "italic 44px 'Cormorant Garamond'";
  const tr = v.translation.length > 360 ? v.translation.slice(0, 357) + "…" : v.translation;
  wrap(`“${tr}”`, y + 90, 60, 840);
  c.fillStyle = GOLD; c.font = "500 24px Cinzel"; c.fillText(`— CHAPTER ${v.ch}, VERSE ${v.v} —`, W / 2, H - 170);
  c.fillStyle = "rgba(212,175,55,0.8)"; c.font = "28px Cinzel"; c.fillText("G1TA.COM", W / 2, H - 110);
  const blob: Blob | null = await new Promise((r) => cv.toBlob(r, "image/png"));
  if (!blob) return;
  const name = `gita-${v.ch}-${v.v}.png`;
  const file = new File([blob], name, { type: "image/png" });
  const touch = matchMedia("(pointer: coarse)").matches;
  if (touch && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: `Bhagavad Gita ${v.ch}.${v.v}` }); return; } catch { /* fall through to download */ }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.download = name; a.href = url; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* ---------- Command palette ---------- */
function Palette({ open, onClose, onGo }: { open: boolean; onClose: () => void; onGo: (p: Pos) => void }) {
  const [q, setQ] = useState("");
  useEffect(() => { if (open) setQ(""); }, [open]);
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    const ref = s.match(/^(\d{1,2})[.:\s](\d{1,2})$/);
    const out: { label: string; sub: string; pos: Pos }[] = [];
    if (ref) { const ch = Number(ref[1]), v = Number(ref[2]); if (ch >= 1 && ch <= 18 && v >= 1 && v <= getChapter(ch).verses) out.push({ label: `Go to ${ch}.${v}`, sub: getChapter(ch).sanskrit, pos: { ch, v } }); }
    CHAPTERS.filter((c) => !s || `${c.n} ${c.sanskrit} ${c.english} ${c.theme}`.toLowerCase().includes(s)).slice(0, s ? 6 : 4)
      .forEach((c) => out.push({ label: `${toRoman(c.n)} · ${c.sanskrit}`, sub: c.english, pos: { ch: c.n, v: 1 } }));
    VERSES.filter((v) => !s || [v.translation, v.iast, v.reflection, v.tags.join(" "), v.words.map((w) => w.join(" ")).join(" ")].join(" ").toLowerCase().includes(s)).slice(0, 8)
      .forEach((v) => out.push({ label: `${v.ch}.${v.v}`, sub: v.translation, pos: { ch: v.ch, v: v.v } }));
    return out;
  }, [q]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="bg-background/70 fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[15vh] backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div initial={{ y: -20, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: -20, scale: 0.97 }} onClick={(e) => e.stopPropagation()} className="glass glow w-full max-w-xl overflow-hidden rounded-2xl">
            <div className="flex items-center gap-3 border-b px-5 py-4">
              <Search className="text-gold h-4 w-4" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search: duty, ego, peace, karma, 2.47…" className="placeholder:text-muted-foreground w-full bg-transparent text-sm outline-none"
                onKeyDown={(e) => { if (e.key === "Enter" && results[0]) { onGo(results[0].pos); onClose(); } if (e.key === "Escape") onClose(); }} />
              <kbd className="text-muted-foreground text-[10px]">ESC</kbd>
            </div>
            <ul className="max-h-[50vh] overflow-y-auto p-2">
              {results.map((r, i) => (
                <li key={i}><button onClick={() => { onGo(r.pos); onClose(); }} className="hover:bg-accent w-full rounded-xl px-4 py-3 text-left transition-colors">
                  <p className="text-gold font-display text-xs tracking-[0.2em]">{r.label}</p>
                  <p className="text-muted-foreground mt-1 line-clamp-1 text-sm">{r.sub}</p>
                </button></li>
              ))}
              {!results.length && <li className="text-muted-foreground px-4 py-6 text-center text-sm">No verse sings of that yet. Try “peace” or “mind”.</li>}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------- Bookmarks ---------- */
function Drawer({ open, onClose, saved, setSaved, onGo }: { open: boolean; onClose: () => void; saved: Saved[]; setSaved: (s: Saved[]) => void; onGo: (p: Pos) => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="bg-background/50 fixed inset-0 z-[70]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 260 }} className="glass fixed inset-y-0 right-0 z-[75] flex w-full max-w-md flex-col">
            <div className="flex items-center justify-between border-b p-6">
              <div><p className="text-gold text-[10px] uppercase tracking-[0.4em]">Saved Scroll</p><p className="font-serif text-ivory text-2xl">Your Shlokas</p></div>
              <button aria-label="Close" onClick={onClose} className="hover:text-gold"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              {!saved.length && <p className="font-serif text-muted-foreground text-lg italic">Bookmark a verse in the reader and it will rest here, with room for your reflections.</p>}
              {saved.map((s) => (
                <div key={s.key} className="rounded-2xl border p-5">
                  <div className="flex items-center justify-between">
                    <button onClick={() => { onGo({ ch: s.ch, v: s.v }); onClose(); }} className="font-display text-gold text-sm tracking-[0.2em]">{s.key} →</button>
                    <div className="flex gap-1">
                      <button aria-label="Download quote card" onClick={() => void exportCard(s)} className="text-muted-foreground hover:text-gold grid h-11 w-11 place-items-center"><Download className="h-4 w-4" /></button>
                      <button aria-label="Remove" onClick={() => setSaved(saved.filter((x) => x.key !== s.key))} className="text-muted-foreground hover:text-destructive grid h-11 w-11 place-items-center"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <p className="font-serif text-foreground mt-2 line-clamp-3">{s.translation}</p>
                  <textarea value={s.note} placeholder="Journal a reflection…" onChange={(e) => setSaved(saved.map((x) => (x.key === s.key ? { ...x, note: e.target.value } : x)))}
                    className="bg-muted/40 placeholder:text-muted-foreground mt-3 w-full resize-none rounded-xl p-3 text-sm outline-none focus:ring-1 focus:ring-gold/50" rows={2} />
                </div>
              ))}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export function Dock({ zen, setZen, light, setLight, saved, setSaved, onGo }: { zen: boolean; setZen: (b: boolean) => void; light: boolean; setLight: (b: boolean) => void; saved: Saved[]; setSaved: (s: Saved[]) => void; onGo: (p: Pos) => void }) {
  const [pal, setPal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const drone = useDrone();
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPal((p) => !p); } };
    addEventListener("keydown", k); return () => removeEventListener("keydown", k);
  }, []);
  const btn = "hover:text-gold active:text-gold flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-full px-2 transition-colors sm:flex-row sm:gap-2 sm:px-3";
  const lbl = "text-[9px] uppercase tracking-[0.12em] sm:text-xs sm:normal-case sm:tracking-normal";
  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center mb-[env(safe-area-inset-bottom)] sm:bottom-6">
      <motion.nav initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: zen ? 0.4 : 1 }} whileHover={{ opacity: 1 }} transition={{ duration: 0.6 }}
        className="glass glow specular pointer-events-auto flex max-w-[92vw] items-center gap-1 rounded-full px-2 py-1.5 text-sm sm:gap-1 sm:px-2">
        <button onClick={() => setPal(true)} className={btn} aria-label="Search"><Search className="h-4 w-4" /><span className={lbl}><span className="sm:hidden">Search</span><span className="text-muted-foreground hidden sm:inline">⌘K</span></span></button>
        <button onClick={drone.toggle} className={`${btn} ${drone.on ? "text-gold" : ""}`} aria-label="432Hz soundscape" aria-pressed={drone.on}>
          {drone.on ? <Wave get={drone.analyser} /> : <Music2 className="h-4 w-4" />}<span className={lbl}>432Hz</span>
        </button>
        <button onClick={() => setZen(!zen)} className={`${btn} ${zen ? "text-gold" : ""}`} aria-label="Zen mode" aria-pressed={zen}>{zen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}<span className={lbl}>Zen</span></button>
        <button onClick={() => setLight(!light)} className={btn} aria-label="Theme">{light ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}<span className={lbl}>{light ? "Void" : "Parchment"}</span></button>
        <button onClick={() => setDrawer(true)} className={btn} aria-label="Bookmarks"><BookMarked className="h-4 w-4" /><span className={lbl}>Saved{saved.length > 0 && <span className="text-gold"> {saved.length}</span>}</span></button>
      </motion.nav>
      </div>
      <Palette open={pal} onClose={() => setPal(false)} onGo={onGo} />
      <Drawer open={drawer} onClose={() => setDrawer(false)} saved={saved} setSaved={setSaved} onGo={onGo} />
    </>
  );
}

export const toSaved = (v: Verse): Saved => ({ key: `${v.ch}.${v.v}`, ch: v.ch, v: v.v, translation: v.translation, devanagari: v.devanagari, note: "" });
export { findVerse };
