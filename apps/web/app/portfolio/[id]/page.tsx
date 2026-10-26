'use client';

import { use, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useScroll, useSpring, useTransform } from 'framer-motion';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { api } from '@/lib/api';

/* Rebirth-style easing (cubic-bezier from the Framer template) */
const EASE = [0.44, 0, 0.56, 1] as const;

/** Compact number formatting for stats: 1250 → 1.3K, 2_000_000 → 2M. */
function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
  return String(n);
}

/* ----------------------------- types & maps ----------------------------- */

const PROFESSION_FR: Record<string, string> = {
  actress: 'Actrice',
  actor: 'Acteur',
  model: 'Mannequin',
  influencer: 'Influenceur·euse',
  content_creator: 'Créateur·rice de contenu',
  athlete: 'Athlète',
  other: 'Artiste',
};
const CATEGORY_FR: Record<string, string> = {
  reels: 'Reels',
  stories: 'Stories',
  live: 'Live',
  events: 'Événements',
  other: 'Autre',
};

interface Social { label: string; url: string; count?: number | null }
interface Photo { url: string; isCover?: boolean }
interface Experience { type: string; title: string; role?: string | null; year?: string | null }
interface Pricing { category: string; label: string; priceMin?: number | null; priceMax?: number | null; currency?: string | null }
interface Project { title: string; category?: string | null; description?: string | null; imageUrl?: string | null; featured?: boolean }
interface Data {
  fullName: string;
  profession: string;
  location: string;
  tagline?: string | null;
  headline?: string | null;
  biography?: string | null;
  skills?: string[];
  brandSummary?: string | null;
  availabilityText?: string | null;
  availabilityDate?: string | null;
  resumeUrl?: string | null;
  addressText?: string | null;
  email?: string | null;
  phone?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  tiktokUrl?: string | null;
  youtubeUrl?: string | null;
  instagramFollowers?: number | null;
  facebookFollowers?: number | null;
  tiktokFollowers?: number | null;
  youtubeSubscribers?: number | null;
  reach?: number | null;
  engagement?: number | null;
  photos?: Photo[];
  experiences?: Experience[];
  pricing?: Pricing[];
  projects?: Project[];
}

/* --------------------------- social icons ----------------------------- */

function SocialIcon({ name, className = 'h-5 w-5' }: { name: string; className?: string }) {
  const n = name.toLowerCase();
  if (n === 'instagram')
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 1.62c-3.15 0-3.5.01-4.74.07-.96.04-1.48.2-1.83.34-.46.18-.79.39-1.13.74-.34.34-.56.67-.74 1.13-.14.35-.3.87-.34 1.83-.06 1.24-.07 1.59-.07 4.74s.01 3.5.07 4.74c.04.96.2 1.48.34 1.83.18.46.39.79.74 1.13.34.34.67.56 1.13.74.35.14.87.3 1.83.34 1.24.06 1.59.07 4.74.07s3.5-.01 4.74-.07c.96-.04 1.48-.2 1.83-.34.46-.18.79-.39 1.13-.74.34-.34.56-.67.74-1.13.14-.35.3-.87.34-1.83.06-1.24.07-1.59.07-4.74s-.01-3.5-.07-4.74c-.04-.96-.2-1.48-.34-1.83a3.04 3.04 0 0 0-.74-1.13 3.04 3.04 0 0 0-1.13-.74c-.35-.14-.87-.3-1.83-.34-1.24-.06-1.59-.07-4.74-.07Zm0 2.76a5.46 5.46 0 1 1 0 10.92 5.46 5.46 0 0 1 0-10.92Zm0 1.62a3.84 3.84 0 1 0 0 7.68 3.84 3.84 0 0 0 0-7.68Zm5.65-2.9a1.28 1.28 0 1 1 0 2.56 1.28 1.28 0 0 1 0-2.56Z" />
      </svg>
    );
  if (n === 'facebook')
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z" />
      </svg>
    );
  if (n === 'tiktok')
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M16.6 5.82a4.5 4.5 0 0 1-1.07-2.98h-3.4v12.27a2.6 2.6 0 1 1-2.6-2.6c.27 0 .53.04.78.12v-3.46a6 6 0 1 0 5.2 5.94V9.4a7.7 7.7 0 0 0 4.5 1.45V7.4a4.5 4.5 0 0 1-3.41-1.58Z" />
      </svg>
    );
  if (n === 'youtube')
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.12C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.58A3 3 0 0 0 .5 6.2 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.12C4.5 20.5 12 20.5 12 20.5s7.5 0 9.4-.58a3 3 0 0 0 2.1-2.12A31.3 31.3 0 0 0 24 12a31.3 31.3 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />
      </svg>
    );
  return <span className={className}>↗</span>;
}

/* ----------------------------- animations ----------------------------- */

function Reveal({ children, delay = 0, y = 40, className = '' }: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 1, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Letter-by-letter blur-in reveal — the Rebirth template's hero signature. */
function SplitText({ text, className = '', delay = 0, stagger = 0.03 }: {
  text: string; className?: string; delay?: number; stagger?: number;
}) {
  return (
    <span className={className} aria-label={text}>
      {text.split(' ').map((word, w) => (
        <span key={w} className="inline-block whitespace-nowrap" aria-hidden>
          {word.split('').map((ch, i) => (
            <motion.span
              key={i}
              className="inline-block"
              initial={{ opacity: 0, filter: 'blur(10px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.6, delay: delay + (w * 4 + i) * stagger, ease: EASE }}
            >
              {ch}
            </motion.span>
          ))}
          {w < text.split(' ').length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </span>
  );
}

/* ------------------------------- page ---------------------------------- */

export default function PortfolioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getPortfolio(id)
      .then((p) => setData(p as unknown as Data))
      .catch((e) => setError((e as Error).message));
  }, [id]);

  useEffect(() => {
    if (data?.fullName) document.title = `${data.fullName} — Portfolio`;
  }, [data?.fullName]);

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.2 });

  // Lenis smooth scrolling (like the Rebirth template's lenis-autoToggle).
  const lenisRef = useRef<Lenis | null>(null);
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenisRef.current = lenis;
    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (lenisRef.current) lenisRef.current.scrollTo(el, { offset: -60 });
    else el.scrollIntoView({ behavior: 'smooth' });
  };
  const scrollToTop = () => {
    if (lenisRef.current) lenisRef.current.scrollTo(0);
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <p className="text-neutral-400">Portfolio introuvable.</p>
          <Link href="/dashboard" className="mt-3 inline-block text-sm underline">Retour au tableau de bord</Link>
        </div>
      </main>
    );
  }
  if (!data) {
    return <main className="flex min-h-screen items-center justify-center bg-black text-white text-sm text-neutral-500">Chargement…</main>;
  }

  const profession = PROFESSION_FR[data.profession] ?? data.profession;
  const photos = (data.photos ?? []).filter((p) => p.url);
  const projects = data.projects ?? [];
  const socials: Social[] = [
    { label: 'Instagram', url: data.instagramUrl, count: data.instagramFollowers },
    { label: 'Facebook', url: data.facebookUrl, count: data.facebookFollowers },
    { label: 'TikTok', url: data.tiktokUrl, count: data.tiktokFollowers },
    { label: 'YouTube', url: data.youtubeUrl, count: data.youtubeSubscribers },
  ].filter((s) => !!s.url) as Social[];

  function copy(text: string, label: string) {
    navigator.clipboard?.writeText(text).then(
      () => toast.success(`${label} copié`),
      () => toast.error('Copie impossible'),
    );
  }

  return (
    <main className="bg-black font-sans text-white antialiased">
      <Toaster />

      <motion.div style={{ scaleX: progress }} className="fixed inset-x-0 top-0 z-50 h-[2px] origin-left bg-white" />

      <Nav hasProjects={projects.length > 0} onNavigate={scrollToId} onHome={scrollToTop} />

      <Hero name={data.fullName} profession={profession} location={data.location} tagline={data.tagline} photos={photos} />

      <About data={data} socials={socials} />

      <Metrics data={data} />

      {projects.length > 0 && (
        <Projects projects={projects} photos={photos} />
      )}

      {data.experiences && data.experiences.length > 0 && (
        <Experiences items={data.experiences} />
      )}

      {data.pricing && data.pricing.length > 0 && <Pricing items={data.pricing} />}

      {(data.brandSummary || data.headline) && (
        <Quote text={data.brandSummary || data.headline || ''} />
      )}

      <ReacchyBanner />

      <BookCall data={data} />

      <Footer data={data} socials={socials} copy={copy} onTop={scrollToTop} />
    </main>
  );
}

/* --------------------------------- nav --------------------------------- */

function Nav({ hasProjects, onNavigate, onHome }: {
  hasProjects: boolean; onNavigate: (id: string) => void; onHome: () => void;
}) {
  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    onNavigate(id);
  };
  return (
    <motion.nav
      initial={{ opacity: 0.1, y: -75 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2, ease: EASE }}
      className="fixed inset-x-0 top-0 z-40 flex items-center justify-between gap-3 px-5 py-5 text-xs uppercase tracking-[0.12em] mix-blend-difference sm:gap-4 sm:tracking-[0.2em] sm:px-8"
    >
      <button onClick={onHome} aria-label="REACCHY" className="shrink-0 text-sm font-semibold tracking-[0.2em] hover:opacity-60 sm:tracking-[0.35em]">
        REACCHY
      </button>
      <div className="flex min-w-0 gap-3 overflow-x-auto whitespace-nowrap sm:gap-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {hasProjects && <a href="#projets" onClick={go('projets')} className="hover:opacity-60">Projets</a>}
        <a href="#about" onClick={go('about')} className="hover:opacity-60">À propos</a>
        <a href="#contact" onClick={go('contact')} className="hover:opacity-60">Contact</a>
      </div>
    </motion.nav>
  );
}

/* ------------------------------- sections ------------------------------ */

function Hero({ name, profession, location, tagline, photos }: {
  name: string; profession: string; location: string; tagline?: string | null; photos: Photo[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const [i, setI] = useState(0);
  useEffect(() => {
    if (photos.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % photos.length), 4000);
    return () => clearInterval(t);
  }, [photos.length]);

  return (
    <section ref={ref} className="relative h-[100svh] w-full overflow-hidden">
      <motion.div style={{ y }} className="absolute inset-0">
        {photos.length > 0 ? (
          photos.map((p, idx) => (
            <motion.img
              key={p.url}
              src={p.url}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              initial={false}
              animate={{ opacity: idx === i ? 1 : 0 }}
              transition={{ duration: 1.4, ease: 'easeInOut' }}
            />
          ))
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-black" />
        )}
        <div className="absolute inset-0 bg-black/40" />
      </motion.div>

      <motion.div style={{ opacity }} className="relative z-10 flex h-full flex-col justify-end px-5 pb-20 sm:px-8 sm:pb-24">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.15 }}
          className="mb-4 flex items-center justify-end text-xs uppercase tracking-[0.3em] text-white/70"
        >
          <span className="font-medium">2K26</span>
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-3 text-xs uppercase tracking-[0.3em] text-white/70"
        >
          {profession} — {location}
        </motion.p>
        <h1 className="font-serif text-[15vw] font-semibold uppercase leading-[0.9] tracking-tight sm:text-[10vw]">
          <SplitText text={name} delay={0.35} stagger={0.035} />
        </h1>
        {tagline && (
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-5 max-w-xl text-base text-white/80 sm:text-lg"
          >
            {tagline}
          </motion.p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-[10px] uppercase tracking-[0.3em] text-white/60"
      >
        Défiler
      </motion.div>
    </section>
  );
}

function About({ data, socials }: { data: Data; socials: Social[] }) {
  const paragraphs = (data.biography ?? '').split(/\n{2,}/).filter(Boolean);
  return (
    <section id="about" className="scroll-mt-20 border-t border-white/10 px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-[1fr_1.4fr]">
        <Reveal>
          <div className="md:sticky md:top-24">
            <h2 className="text-xs uppercase tracking-[0.3em] text-white/50">À propos</h2>
            {data.resumeUrl && (
              <a href={data.resumeUrl} target="_blank" rel="noopener noreferrer"
                className="mt-6 inline-block border-b border-white/40 pb-0.5 text-sm uppercase tracking-widest hover:border-white">
                Résumé ↗
              </a>
            )}
            {socials.length > 0 && (
              <div className="mt-8 flex flex-col gap-3">
                {socials.map(({ label, url, count }) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    title={label}
                    className="group flex items-center gap-3 text-white/80 transition-colors hover:text-white"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/25 transition-colors group-hover:border-white group-hover:bg-white group-hover:text-black">
                      <SocialIcon name={label} />
                    </span>
                    <span className="text-sm tabular-nums">
                      {count != null ? (
                        <>
                          <span className="font-medium">{formatCount(count)}</span>
                          <span className="ml-1.5 text-white/50">{label}</span>
                        </>
                      ) : (
                        label
                      )}
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="space-y-6 text-lg leading-relaxed text-white/85 sm:text-xl">
            {data.headline && <p className="font-serif text-2xl italic text-white sm:text-3xl">{data.headline}</p>}
            {paragraphs.length ? paragraphs.map((p, k) => <p key={k}>{p}</p>) : <p>{data.biography}</p>}
            {!!data.skills?.length && (
              <div className="flex flex-wrap gap-2 pt-4">
                {data.skills.map((s) => (
                  <span key={s} className="border border-white/30 px-3 py-1 text-xs uppercase tracking-wide text-white/80">{s}</span>
                ))}
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** Image with a gentle scroll-driven parallax + grayscale→color on hover. */
function ParallaxImage({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['-10%', '10%']);
  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.img
        style={{ y }}
        src={src}
        alt={alt}
        /* eslint-disable-next-line @next/next/no-img-element */
        className="h-full w-full scale-[1.18] object-cover grayscale transition-[filter] duration-700 group-hover:grayscale-0"
      />
    </div>
  );
}

function Projects({ projects, photos }: { projects: Project[]; photos: Photo[] }) {
  const [open, setOpen] = useState<Project | null>(null);

  // Fall back to uploaded portfolio photos when a project has no image of its own.
  const pool = photos.map((p) => p.url);
  const imageFor = (p: Project, idx: number) => p.imageUrl || pool[idx % pool.length] || null;

  return (
    <section id="projets" className="scroll-mt-20 border-t border-white/10 px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <Reveal><h2 className="mb-12 text-xs uppercase tracking-[0.3em] text-white/50">Projets</h2></Reveal>

        <div className="space-y-20">
          {projects.map((p, k) => {
            const img = imageFor(p, k);
            return (
              <Reveal key={`f${k}`} delay={0.05 * k}>
                <article
                  onClick={() => setOpen(p)}
                  className="group grid cursor-pointer gap-6 md:grid-cols-2 md:items-center"
                >
                  {img && <ParallaxImage src={img} alt={p.title} className="aspect-[4/3] w-full" />}
                  <div>
                    {p.category && <p className="text-xs uppercase tracking-[0.2em] text-white/50">{p.category}</p>}
                    <h3 className="mt-2 font-serif text-3xl sm:text-4xl">{p.title}</h3>
                    {p.description && <p className="mt-4 line-clamp-3 leading-relaxed text-white/75">{p.description}</p>}
                    <span className="mt-5 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/60 transition-colors group-hover:text-white">
                      Voir le projet <span aria-hidden>→</span>
                    </span>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
          >
            <motion.div
              className="max-h-[88vh] w-full max-w-3xl overflow-y-auto border border-white/15 bg-neutral-950"
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const idx = projects.indexOf(open);
                const img = imageFor(open, idx < 0 ? 0 : idx);
                return img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt={open.title} className="aspect-[16/9] w-full object-cover" />
                ) : null;
              })()}
              <div className="p-6 sm:p-10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    {open.category && <p className="text-xs uppercase tracking-[0.2em] text-white/50">{open.category}</p>}
                    <h3 className="mt-2 font-serif text-3xl sm:text-4xl">{open.title}</h3>
                  </div>
                  <button onClick={() => setOpen(null)} aria-label="Fermer"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/25 text-white/70 hover:bg-white hover:text-black">✕</button>
                </div>
                {open.description && <p className="mt-6 whitespace-pre-line leading-relaxed text-white/80">{open.description}</p>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function Experiences({ items }: { items: Experience[] }) {
  return (
    <section className="border-t border-white/10 px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <Reveal><h2 className="mb-12 text-xs uppercase tracking-[0.3em] text-white/50">Prix & distinctions</h2></Reveal>
        <div className="border-t border-white/10">
          {items.map((e, k) => (
            <Reveal key={k} delay={0.03 * k}>
              <div className="grid grid-cols-[auto_1fr_auto] items-baseline gap-4 border-b border-white/10 py-5">
                <span className="font-mono text-xs text-white/40">{e.year || '—'}</span>
                <div>
                  <span className="text-lg">{e.title}</span>
                  {e.role && <span className="ml-2 text-sm text-white/60">· {e.role}</span>}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing({ items }: { items: Pricing[] }) {
  const fmt = (p: Pricing) => {
    const c = p.currency || 'TND';
    if (p.priceMin != null && p.priceMax != null) return `${p.priceMin} – ${p.priceMax} ${c}`;
    if (p.priceMin != null) return `dès ${p.priceMin} ${c}`;
    if (p.priceMax != null) return `jusqu’à ${p.priceMax} ${c}`;
    return 'Sur demande';
  };
  return (
    <section className="border-t border-white/10 px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <Reveal><h2 className="mb-12 text-xs uppercase tracking-[0.3em] text-white/50">Tarifs</h2></Reveal>
        <div className="grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p, k) => (
            <Reveal key={k} delay={0.04 * k} className="bg-black">
              <div className="h-full p-8">
                {p.label?.trim() ? (
                  <>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/50">{CATEGORY_FR[p.category] ?? p.category}</p>
                    <h3 className="mt-3 font-serif text-2xl">{p.label}</h3>
                  </>
                ) : (
                  <h3 className="font-serif text-2xl">{CATEGORY_FR[p.category] ?? p.category}</h3>
                )}
                <p className="mt-4 text-lg text-white/85">{fmt(p)}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="mt-6 text-xs text-white/40">Tarifs indicatifs — devis personnalisé sur demande.</p>
      </div>
    </section>
  );
}

function Quote({ text }: { text: string }) {
  return (
    <section className="border-t border-white/10 px-5 py-28 sm:px-8 sm:py-40">
      <Reveal className="mx-auto max-w-4xl">
        <p className="font-serif text-3xl leading-snug tracking-tight sm:text-5xl">“{text}”</p>
      </Reveal>
    </section>
  );
}

/** Stats row: total followers ("abonnés"), reach, engagement — on one line.
 *  "Abonnés" sums every platform's followers; engagement is shown as a percentage. */
function Metrics({ data }: { data: Data }) {
  const followers =
    (data.instagramFollowers ?? 0) +
    (data.facebookFollowers ?? 0) +
    (data.tiktokFollowers ?? 0) +
    (data.youtubeSubscribers ?? 0);
  const stats: { label: string; value: number; display: string }[] = [
    { label: 'Abonnés', value: followers, display: formatCount(followers) },
    { label: 'Reach', value: data.reach ?? 0, display: formatCount(data.reach ?? 0) },
    { label: 'Engagement', value: data.engagement ?? 0, display: `${data.engagement ?? 0}%` },
  ];
  if (stats.every((s) => !s.value)) return null;
  return (
    <section id="stats" className="scroll-mt-20 border-t border-white/10 px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto grid max-w-5xl grid-cols-3 gap-4 sm:gap-10">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.1} className="text-center">
            <p className="font-serif text-4xl font-semibold tabular-nums sm:text-6xl">{s.display}</p>
            <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-white/50 sm:text-xs">{s.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/** Animated REACCHY brand banner — fades in, then an infinite marquee slides the
 *  wordmark in and out across the strip. Sits just before the contact section. */
function ReacchyBanner() {
  return (
    <motion.section
      aria-label="REACCHY"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 1, ease: EASE }}
      className="overflow-hidden border-t border-white/10 py-12 sm:py-16"
    >
      <motion.div
        className="flex w-max"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 22, ease: 'linear', repeat: Infinity }}
      >
        {[0, 1].map((half) => (
          <div key={half} className="flex shrink-0" aria-hidden={half === 1}>
            {Array.from({ length: 6 }).map((_, i) => (
              <span
                key={i}
                className="mx-6 font-serif text-5xl font-semibold uppercase tracking-tight text-white/90 sm:mx-10 sm:text-7xl"
              >
                Reacchy <span className="align-middle text-white/25">✦</span>
              </span>
            ))}
          </div>
        ))}
      </motion.div>
    </motion.section>
  );
}

function BookCall({ data }: { data: Data }) {
  return (
    <section id="contact" className="scroll-mt-20 border-t border-white/10 px-5 py-24 text-center sm:px-8 sm:py-36">
      <Reveal className="mx-auto max-w-3xl">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Travaillons ensemble</p>
        <h2 className="mt-6 font-serif text-4xl leading-tight sm:text-6xl">Réserver un appel</h2>
        {data.availabilityText && <p className="mt-6 text-white/75">{data.availabilityText}</p>}
        {data.availabilityDate && <p className="mt-1 text-sm text-white/50">Prochaine disponibilité : {data.availabilityDate}</p>}
        {data.email && (
          <a href={`mailto:${data.email}`}
            className="mt-10 inline-flex h-12 items-center rounded-full bg-white px-8 text-sm font-medium uppercase tracking-widest text-black transition-transform hover:scale-105">
            Prendre contact
          </a>
        )}
      </Reveal>
    </section>
  );
}

function Footer({ data, socials, copy, onTop }: { data: Data; socials: Social[]; copy: (t: string, l: string) => void; onTop: () => void }) {
  return (
    <footer className="border-t border-white/10 px-5 py-16 sm:px-8">
      <div className="mx-auto grid max-w-5xl gap-10 sm:grid-cols-[1fr_auto]">
        <div>
          <p className="font-serif text-2xl">{data.fullName}</p>
          <p className="mt-1 text-sm text-white/50">{PROFESSION_FR[data.profession] ?? data.profession} — {data.location}</p>
          {data.addressText && <p className="mt-4 max-w-xs text-sm text-white/50">{data.addressText}</p>}
        </div>
        <div className="space-y-3 text-sm">
          {data.email && (
            <button onClick={() => copy(data.email!, 'Email')} className="block text-left text-white/70 hover:text-white">
              {data.email} <span className="text-white/30">· copier</span>
            </button>
          )}
          {data.phone && (
            <button onClick={() => copy(data.phone!, 'Téléphone')} className="block text-left text-white/70 hover:text-white">
              {data.phone} <span className="text-white/30">· copier</span>
            </button>
          )}
          {socials.length > 0 && (
            <div className="flex flex-col gap-2 pt-1">
              {socials.map(({ label, url, count }) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  className="group flex items-center gap-3 text-white/70 transition-colors hover:text-white"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/25 transition-colors group-hover:border-white group-hover:bg-white group-hover:text-black">
                    <SocialIcon name={label} className="h-4 w-4" />
                  </span>
                  <span className="tabular-nums">
                    {count != null ? (
                      <>
                        <span className="font-medium">{formatCount(count)}</span>
                        <span className="ml-1.5 text-white/40">{label}</span>
                      </>
                    ) : (
                      label
                    )}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="mx-auto mt-12 flex max-w-5xl items-center justify-between border-t border-white/10 pt-6 text-xs text-white/40">
        <span>© 2026 {data.fullName}</span>
        <button onClick={onTop} className="uppercase tracking-widest hover:text-white">
          Haut de page ↑
        </button>
      </div>
    </footer>
  );
}
