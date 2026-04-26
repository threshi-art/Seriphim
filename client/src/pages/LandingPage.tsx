
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Brain, ChevronDown, Code2, Globe, Newspaper, Plane, Shield, Sparkles,
  Cloud, Zap, Eye, Lock, ArrowRight, Activity, Cpu, Satellite,
  Volume2, VolumeX, SkipForward,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

const HERO_IMG = "/manus-storage/seraphim-hero_3de3500d.jpg";
const NSOC_IMG = "/manus-storage/seraphim-nsoc_75aed095.jpg";
const EYE_IMG = "/manus-storage/seraphim-eye_c80a8562.jpg";
const OCEAN_IMG = "/manus-storage/seraphim-ocean_593e84b5.jpg";

/* ── Ambient music tracks ── */
const TRACKS = [
  { src: "/manus-storage/amarantamusic-skoll-dark-cinematic-horror-suspense-ambient-204962_3394937a.mp3", name: "Skoll — Dark Cinematic" },
  { src: "/manus-storage/the_mountain-suspense-dramatic-ambient-375987_b02575eb.mp3", name: "The Mountain — Suspense" },
  { src: "/manus-storage/leberch-tension-background-250877_a3bc97fe.mp3", name: "Tension Background" },
  { src: "/manus-storage/leberch-background-suspense-255436_17277f46.mp3", name: "Background Suspense" },
];

/* ── Feature cards ── */
const features = [
  { icon: Brain, title: "AI Brain", desc: "GPT-powered reasoning engine with persistent memory and autonomous task execution" },
  { icon: Shield, title: "Network Defense", desc: "Real-time threat monitoring, connection analysis, and suspicious activity detection" },
  { icon: Code2, title: "Code Engine", desc: "Write, review, and debug code with syntax highlighting across 9 languages" },
  { icon: Globe, title: "Web Discovery", desc: "StumbleUpon-style random website exploration based on your interests" },
  { icon: Newspaper, title: "News Intel", desc: "Multi-source news aggregation with real-time updates and category filtering" },
  { icon: Cloud, title: "Weather Radar", desc: "Live weather monitoring with forecasts and condition tracking" },
  { icon: Plane, title: "Flight Monitor", desc: "Real-time flight tracking with interactive maps and route visualization" },
  { icon: Eye, title: "EiRAM Analysis", desc: "Narrative analysis engine detecting ideological signals and escalation risk" },
  { icon: Zap, title: "Self-Improving", desc: "Autonomous plugin system — Seraphim writes and installs its own capabilities" },
  { icon: Lock, title: "Audit Trail", desc: "Complete activity log of every decision, tool call, and self-improvement action" },
];

/* ── Stats ── */
const stats = [
  { value: "10", label: "Modules", icon: Cpu },
  { value: "24/7", label: "Monitoring", icon: Activity },
  { value: "∞", label: "Self-Evolving", icon: Zap },
  { value: "LIVE", label: "Flight Data", icon: Satellite },
];

/* ── Animated particles ── */
function ParticleField() {
  const particles = useRef(
    Array.from({ length: 50 }, () => ({
      w: Math.random() * 3 + 1,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      opacity: Math.random() * 0.4 + 0.1,
      yEnd: -30 - Math.random() * 60,
      dur: 3 + Math.random() * 5,
      delay: Math.random() * 6,
    }))
  ).current;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: p.w, height: p.w, left: p.left, top: p.top,
            background: `oklch(0.70 0.14 175 / ${p.opacity})`,
          }}
          animate={{ y: [0, p.yEnd], opacity: [0, 0.8, 0] }}
          transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

/* ── Grid overlay ── */
function GridOverlay() {
  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.03]"
      style={{
        backgroundImage: `
          linear-gradient(oklch(0.70 0.14 175 / 0.3) 1px, transparent 1px),
          linear-gradient(90deg, oklch(0.70 0.14 175 / 0.3) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
      }}
    />
  );
}

/* ── Scan line animation ── */
function ScanLine() {
  return (
    <motion.div
      className="absolute left-0 right-0 h-px pointer-events-none z-30"
      style={{ background: "linear-gradient(90deg, transparent, oklch(0.70 0.14 175 / 0.4), transparent)" }}
      animate={{ top: ["0%", "100%"] }}
      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
    />
  );
}

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });

  const heroY = useTransform(scrollYProgress, [0, 0.15], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);

  /* ── Visitor geo-location ── */
  const [geoInfo, setGeoInfo] = useState<{ ip: string; lat: string; lon: string } | null>(null);

  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then((r) => r.json())
      .then((d) => {
        if (d.ip && d.latitude !== undefined) {
          setGeoInfo({ ip: d.ip, lat: Number(d.latitude).toFixed(4), lon: Number(d.longitude).toFixed(4) });
        }
      })
      .catch(() => {});
  }, []);

  /* ── Ambient music state ── */
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [trackIdx, setTrackIdx] = useState(0);
  const [muted, setMuted] = useState(true);
  const [audioReady, setAudioReady] = useState(false);

  useEffect(() => {
    const audio = new Audio(TRACKS[0].src);
    audio.loop = false;
    audio.volume = 0.18;
    audio.muted = true;
    audioRef.current = audio;
    setAudioReady(true);

    const onEnded = () => {
      setTrackIdx((prev) => {
        const next = (prev + 1) % TRACKS.length;
        audio.src = TRACKS[next].src;
        audio.play().catch(() => {});
        return next;
      });
    };
    audio.addEventListener("ended", onEnded);

    // Attempt autoplay (muted — browsers allow this)
    audio.play().catch(() => {});

    return () => {
      audio.removeEventListener("ended", onEnded);
      audio.pause();
      audio.src = "";
    };
  }, []);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    const next = !muted;
    audioRef.current.muted = next;
    if (!next) audioRef.current.play().catch(() => {});
    setMuted(next);
  }, [muted]);

  const skipTrack = useCallback(() => {
    if (!audioRef.current) return;
    setTrackIdx((prev) => {
      const next = (prev + 1) % TRACKS.length;
      audioRef.current!.src = TRACKS[next].src;
      audioRef.current!.play().catch(() => {});
      return next;
    });
  }, []);

  const handleEnter = () => {
    // Stop music when entering the dashboard
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    setLocation("/deck");
  };

  return (
    <div ref={containerRef} className="relative bg-[#050a12]">
      {/* ═══════════════════════════════════════════
          SECTION 1 — Hero (Full-screen immersive)
      ═══════════════════════════════════════════ */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background image with heavy overlay */}
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-[#050a12]/70" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050a12]/50 via-transparent to-[#050a12]" />
        </div>

        <ParticleField />
        <GridOverlay />
        <ScanLine />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 flex flex-col items-center text-center px-6 max-w-5xl"
        >
          {/* Glowing logo mark */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 80, delay: 0.2 }}
            className="mb-8"
          >
            <div className="relative">
              <div className="absolute inset-[-8px] rounded-2xl bg-[oklch(0.70_0.14_175_/_0.25)] blur-2xl animate-pulse" />
              <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-[oklch(0.70_0.14_175)] to-[oklch(0.50_0.18_200)] flex items-center justify-center shadow-[0_0_40px_oklch(0.70_0.14_175_/_0.3)]">
                <Sparkles className="h-10 w-10 text-[#050a12]" />
              </div>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-[10px] font-bold uppercase tracking-[0.4em] text-[oklch(0.70_0.14_175)] mb-4"
          >
            Autonomous Intelligence Platform
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-7xl md:text-9xl font-black tracking-tight text-white mb-6"
            style={{ fontFamily: "'Inter', sans-serif", textShadow: "0 0 80px oklch(0.70 0.14 175 / 0.2)" }}
          >
            SERAPHIM
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="text-lg md:text-xl text-[oklch(0.60_0.02_230)] max-w-2xl mb-10 leading-relaxed"
          >
            A self-evolving AI agent that thinks, defends, analyzes, and improves.
            Your personal command center for intelligence, engineering, and discovery.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
          >
            <button
              onClick={handleEnter}
              className="group relative px-10 py-4 rounded-xl font-bold text-sm overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_oklch(0.70_0.14_175_/_0.3)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.70_0.14_175)] to-[oklch(0.55_0.18_200)]" />
              <span className="relative z-10 flex items-center gap-2 text-[#050a12]">
                Enter Command Center
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-[9px] uppercase tracking-[0.3em] text-[oklch(0.35_0.02_230)]">Scroll to explore</span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <ChevronDown className="h-4 w-4 text-[oklch(0.35_0.02_230)]" />
          </motion.div>
        </motion.div>

        {/* ── Visitor geo HUD (bottom-left, very subtle) ── */}
        {geoInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3, duration: 1.5 }}
            className="fixed bottom-6 left-6 z-50 pointer-events-none select-none"
          >
            <div className="font-mono text-[8px] leading-[1.4] text-[oklch(0.22_0.01_230)] tracking-wider">
              <span>{geoInfo.ip}</span>
              <br />
              <span>{geoInfo.lat}  {geoInfo.lon}</span>
            </div>
          </motion.div>
        )}

        {/* ── Ambient music control (bottom-right) ── */}
        {audioReady && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.2 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2"
          >
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[rgba(5,10,18,0.85)] backdrop-blur-xl border border-[oklch(0.15_0.02_230)] shadow-[0_0_20px_rgba(0,0,0,0.5)]">
              <button
                onClick={toggleMute}
                className="p-1.5 rounded-lg hover:bg-[oklch(0.70_0.14_175_/_0.1)] transition-colors"
                title={muted ? "Unmute ambient music" : "Mute"}
              >
                {muted ? (
                  <VolumeX className="h-4 w-4 text-[oklch(0.40_0.02_230)]" />
                ) : (
                  <Volume2 className="h-4 w-4 text-[oklch(0.70_0.14_175)]" />
                )}
              </button>
              <button
                onClick={skipTrack}
                className="p-1.5 rounded-lg hover:bg-[oklch(0.70_0.14_175_/_0.1)] transition-colors"
                title="Next track"
              >
                <SkipForward className="h-3.5 w-3.5 text-[oklch(0.40_0.02_230)]" />
              </button>
              <span className="text-[9px] text-[oklch(0.35_0.02_230)] max-w-[120px] truncate pl-1">
                {TRACKS[trackIdx].name}
              </span>
            </div>
          </motion.div>
        )}
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 2 — The Eye (Surveillance/Vision)
      ═══════════════════════════════════════════ */}
      <section className="relative py-0 overflow-hidden">
        <div className="relative h-[70vh] md:h-[80vh]">
          <img src={EYE_IMG} alt="Seraphim Vision" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050a12] via-transparent to-[#050a12]" />
          <div className="absolute inset-0 bg-[#050a12]/30" />

          <div className="absolute inset-0 flex items-center justify-center z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="text-center px-6 max-w-3xl"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[oklch(0.70_0.14_175)] mb-4">
                Always Watching
              </p>
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4" style={{ textShadow: "0 0 60px oklch(0.70 0.14 175 / 0.3)" }}>
                See Everything.
              </h2>
              <p className="text-[oklch(0.55_0.02_230)] text-sm md:text-base leading-relaxed max-w-xl mx-auto">
                Network defense, flight tracking, news intelligence, and threat analysis —
                Seraphim monitors every signal so you don't have to.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 3 — Stats Bar
      ═══════════════════════════════════════════ */}
      <section className="relative py-16 border-y border-[oklch(0.12_0.02_230)]">
        <div className="absolute inset-0 bg-[#060c16]" />
        <div className="relative z-10 max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <s.icon className="h-5 w-5 text-[oklch(0.70_0.14_175)] mx-auto mb-3" />
                <div className="text-3xl md:text-4xl font-black text-white mb-1">{s.value}</div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-[oklch(0.40_0.02_230)]">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 4 — Feature Grid
      ═══════════════════════════════════════════ */}
      <section className="relative py-32">
        <div className="absolute inset-0 bg-[#050a12]" />
        <GridOverlay />

        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[oklch(0.70_0.14_175)] mb-3">
              Capabilities
            </p>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              Ten Modules. One Mind.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.05 }}
                className="group relative p-5 rounded-xl border border-[oklch(0.15_0.02_230)] bg-[oklch(0.10_0.02_230_/_0.5)] hover:border-[oklch(0.70_0.14_175_/_0.3)] hover:bg-[oklch(0.12_0.02_230_/_0.5)] transition-all duration-300"
              >
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-[oklch(0.70_0.14_175_/_0.03)] to-transparent pointer-events-none" />
                <div className="h-9 w-9 rounded-lg bg-[oklch(0.70_0.14_175_/_0.1)] border border-[oklch(0.70_0.14_175_/_0.2)] flex items-center justify-center mb-3 group-hover:bg-[oklch(0.70_0.14_175_/_0.15)] transition-colors">
                  <f.icon className="h-4 w-4 text-[oklch(0.70_0.14_175)]" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5">{f.title}</h3>
                <p className="text-xs text-[oklch(0.50_0.02_230)] leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 5 — NSOC Operations Center
      ═══════════════════════════════════════════ */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#050a12] via-[#060c16] to-[#050a12]" />

        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[oklch(0.70_0.14_175)] mb-3">
              Inspired By
            </p>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              Operations Center Grade
            </h2>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="relative rounded-2xl overflow-hidden border border-[oklch(0.15_0.02_230)]"
          >
            <img src={NSOC_IMG} alt="NSA Operations Center" className="w-full h-[350px] md:h-[500px] object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050a12] via-[#050a12]/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
              <p className="text-[oklch(0.55_0.02_230)] max-w-xl text-sm leading-relaxed">
                Designed with the same information density and situational awareness
                found in national security operations centers. Every pixel serves a purpose.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 6 — Dark Ocean (Depth / Mystery)
      ═══════════════════════════════════════════ */}
      <section className="relative py-0 overflow-hidden">
        <div className="relative h-[60vh] md:h-[70vh]">
          <img src={OCEAN_IMG} alt="The Deep" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050a12] via-transparent to-[#050a12]" />
          <div className="absolute inset-0 bg-[#050a12]/20" />

          <div className="absolute inset-0 flex items-end justify-center z-10 pb-16 md:pb-24">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center px-6 max-w-2xl"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[oklch(0.70_0.14_175)] mb-4">
                Beneath The Surface
              </p>
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">
                Depth of Intelligence
              </h2>
              <p className="text-[oklch(0.50_0.02_230)] text-sm leading-relaxed">
                Seraphim doesn't just respond — it reasons, remembers, and evolves.
                Every interaction makes it sharper.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 7 — CTA
      ═══════════════════════════════════════════ */}
      <section className="relative py-32">
        <div className="absolute inset-0 bg-[#050a12]" />
        <ParticleField />

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="relative mx-auto mb-8 w-fit">
              <div className="absolute inset-[-12px] rounded-2xl bg-[oklch(0.70_0.14_175_/_0.2)] blur-2xl animate-pulse" />
              <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-[oklch(0.70_0.14_175)] to-[oklch(0.50_0.18_200)] flex items-center justify-center shadow-[0_0_50px_oklch(0.70_0.14_175_/_0.3)]">
                <Sparkles className="h-8 w-8 text-[#050a12]" />
              </div>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
              Ready to Begin?
            </h2>
            <p className="text-[oklch(0.50_0.02_230)] mb-10 text-sm md:text-base leading-relaxed">
              Step into the command center. Seraphim is waiting.
            </p>
            <button
              onClick={handleEnter}
              className="group relative px-12 py-4 rounded-xl font-bold text-sm overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_oklch(0.70_0.14_175_/_0.3)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.70_0.14_175)] to-[oklch(0.55_0.18_200)]" />
              <span className="relative z-10 flex items-center gap-2 text-[#050a12]">
                Launch Seraphim
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-8 border-t border-[oklch(0.12_0.02_230)]">
        <div className="relative z-10 max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[oklch(0.70_0.14_175)]" />
            <span className="text-xs font-bold text-[oklch(0.40_0.02_230)]">SERAPHIM</span>
          </div>
          <p className="text-[10px] text-[oklch(0.25_0.02_230)]">
            Autonomous Intelligence Platform &mdash; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
