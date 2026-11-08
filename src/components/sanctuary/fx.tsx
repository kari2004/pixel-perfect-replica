import { useEffect, useRef, useState, type ReactNode, type MouseEvent } from "react";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";

export function ParticleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    let w = 0, h = 0, raf = 0;
    const mouse = { x: -9999, y: -9999 };
    const resize = () => { w = c.width = innerWidth; h = c.height = innerHeight; };
    resize();
    const count = Math.min(120, Math.floor(innerWidth / 12));
    const ps = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.6 + 0.3,
      vy: -(Math.random() * 0.3 + 0.08), vx: (Math.random() - 0.5) * 0.1, a: Math.random() * 0.6 + 0.2, t: Math.random() * 6,
    }));
    const onMove = (e: PointerEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const tick = () => {
      const rgb = getComputedStyle(document.documentElement).getPropertyValue("--particle").trim() || "212,175,55";
      ctx.clearRect(0, 0, w, h);
      for (const p of ps) {
        p.t += 0.02;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
        if (d < 140) { p.x += (dx / d) * 0.9; p.y += (dy / d) * 0.9; }
        p.x += p.vx + Math.sin(p.t) * 0.15; p.y += p.vy;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        ctx.beginPath();
        ctx.fillStyle = `rgba(${rgb},${p.a * (0.6 + Math.sin(p.t) * 0.4)})`;
        ctx.shadowBlur = 8; ctx.shadowColor = `rgba(${rgb},0.8)`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    addEventListener("resize", resize); addEventListener("pointermove", onMove);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); removeEventListener("pointermove", onMove); };
  }, []);
  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-0" aria-hidden />;
}

export function CursorAura() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const on = (e: PointerEvent) => {
      if (ref.current) ref.current.style.transform = `translate(${e.clientX - 300}px, ${e.clientY - 300}px)`;
      document.querySelectorAll<HTMLElement>(".spot").forEach((el) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    };
    addEventListener("pointermove", on);
    return () => removeEventListener("pointermove", on);
  }, []);
  return <div ref={ref} aria-hidden className="pointer-events-none fixed left-0 top-0 z-0 h-[600px] w-[600px] rounded-full transition-transform duration-500 ease-out" style={{ background: "radial-gradient(circle, var(--aura), transparent 65%)" }} />;
}

export function ScrollBar() {
  const { scrollYProgress } = useScroll();
  const x = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  return <motion.div style={{ scaleX: x }} className="bg-gold-liquid glow fixed inset-x-0 top-0 z-50 h-[2px] origin-left" />;
}

const petals = (n: number, r: number, len: number) =>
  Array.from({ length: n }, (_, i) => (
    <path key={i} transform={`rotate(${(i / n) * 360} 200 200)`} d={`M200 ${200 - r} Q ${200 + len * 0.35} ${200 - r - len * 0.5} 200 ${200 - r - len} Q ${200 - len * 0.35} ${200 - r - len * 0.5} 200 ${200 - r}`} />
  ));

export function Mandala({ className = "", part = "all" }: { className?: string; part?: "all" | "lotus" | "yantra" | "core" }) {
  return (
    <svg viewBox="0 0 400 400" className={className} fill="none" stroke="currentColor" strokeWidth="0.6" aria-hidden>
      {(part === "all" || part === "lotus") && (
        <g><circle cx="200" cy="200" r="196" /><circle cx="200" cy="200" r="188" strokeDasharray="2 4" />{petals(32, 140, 46)}{petals(16, 96, 44)}<rect x="40" y="40" width="320" height="320" strokeDasharray="1 3" /></g>
      )}
      {(part === "all" || part === "yantra") && (
        <g>
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i} transform={`rotate(${i * 36} 200 200)`}><path d="M200 110 L278 245 L122 245 Z" /><path d="M200 290 L278 155 L122 155 Z" /></g>
          ))}
          <circle cx="200" cy="200" r="112" strokeDasharray="1 5" />
        </g>
      )}
      {(part === "all" || part === "core") && (
        <g>{petals(8, 56, 40)}<circle cx="200" cy="200" r="56" /><circle cx="200" cy="200" r="22" strokeWidth="1" /><circle cx="200" cy="200" r="5" fill="currentColor" /></g>
      )}
    </svg>
  );
}

export function Reveal({ text, className = "", delay = 0 }: { text: string; className?: string; delay?: number }) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((w, i) => (
        <motion.span key={i + w} className="inline-block"
          initial={{ opacity: 0, filter: "blur(12px)", y: 12 }}
          whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.9, delay: delay + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
        >{w}&nbsp;</motion.span>
      ))}
    </span>
  );
}

export function Magnetic({ children, className = "", onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  const [p, setP] = useState({ x: 0, y: 0 });
  const move = (e: MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setP({ x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.4 });
  };
  return (
    <motion.button onClick={onClick} onMouseMove={move} onMouseLeave={() => setP({ x: 0, y: 0 })}
      animate={p} transition={{ type: "spring", stiffness: 200, damping: 15 }} className={className}>
      {children}
    </motion.button>
  );
}

export function Preloader({ onDone }: { onDone: () => void }) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const t = [setTimeout(() => setStage(1), 900), setTimeout(() => setStage(2), 3000), setTimeout(() => setStage(3), 4700), setTimeout(onDone, 5900)];
    return () => t.forEach(clearTimeout);
  }, [onDone]);
  return (
    <motion.div className="fixed inset-0 z-[100] overflow-hidden" exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
      {/* temple doors */}
      <motion.div className="absolute inset-y-0 left-0 w-1/2 bg-background" animate={stage === 3 ? { x: "-100%" } : { x: 0 }} transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }} />
      <motion.div className="absolute inset-y-0 right-0 w-1/2 bg-background" animate={stage === 3 ? { x: "100%" } : { x: 0 }} transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }} />
      <motion.div animate={{ opacity: stage === 3 ? 0 : 1 }} className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div className="bg-gold-liquid glow absolute left-1/2 w-[2px] -translate-x-1/2" initial={{ height: 0 }} animate={{ height: "100vh" }} transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }} />
        <motion.div initial={{ opacity: 0, scale: 0.6, rotate: -90 }} animate={{ opacity: 0.8, scale: 1, rotate: 0 }} transition={{ duration: 2.4, ease: "easeOut" }} className="text-gold">
          <Mandala className="animate-spin-slow h-72 w-72 md:h-96 md:w-96" />
        </motion.div>
        <div className="absolute flex h-24 items-center justify-center px-6 text-center">
          <AnimatePresence mode="wait">
            {stage === 1 && (
              <motion.p key="s" initial={{ opacity: 0, filter: "blur(10px)" }} animate={{ opacity: 1, filter: "blur(0px)" }} exit={{ opacity: 0, filter: "blur(10px)" }} transition={{ duration: 1 }} className="font-deva text-gold-liquid text-3xl md:text-5xl">
                यदा यदा हि धर्मस्य…
              </motion.p>
            )}
            {stage >= 2 && (
              <motion.p key="e" initial={{ opacity: 0, letterSpacing: "0.1em" }} animate={{ opacity: 1, letterSpacing: "0.4em" }} transition={{ duration: 1.4 }} className="font-display text-ivory text-sm md:text-lg">
                G1TA.COM — ENTER THE SANCTUARY
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      <button onClick={onDone} className="font-sans text-muted-foreground hover:text-gold absolute bottom-8 right-8 text-xs uppercase tracking-[0.3em] transition-colors">Skip Intro</button>
    </motion.div>
  );
}
