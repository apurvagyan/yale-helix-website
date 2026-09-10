import Link from "next/link";
import { HERO } from "@/lib/content";

function PersonPlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-7 w-7">
      <circle cx="9" cy="8" r="3.5" />
      <path strokeLinecap="round" d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path strokeLinecap="round" d="M18.5 8v6M21.5 11h-6" />
    </svg>
  );
}

function CoffeeCupIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-7 w-7">
      <path strokeLinejoin="round" d="M4 8h13v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 9.5h1.5a2.5 2.5 0 0 1 0 5H17" />
      <path strokeLinecap="round" d="M8 4c0 .8-1 .8-1 1.6s1 .8 1 1.6M12 4c0 .8-1 .8-1 1.6s1 .8 1 1.6" />
    </svg>
  );
}

export default function Hero() {
  return (
    <section id="hero" className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-bg">
      {/* Background picture with the original gradient overlay. */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(0,0,0,0.9), rgba(66,104,255,0.1)), url('/assets/img/hero-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      {/* Bottom fade so the hero image eases into the next dark section. */}
      <div
        className="absolute inset-x-0 bottom-0 z-[1] h-40"
        style={{ background: "linear-gradient(to bottom, transparent, #0a0a0a)" }}
      />

      <div className="relative z-10 max-w-content px-5 text-center md:px-8">
        <h1 className="font-display text-6xl font-extrabold uppercase leading-[0.9] tracking-tight text-accent md:text-8xl">
          {HERO.title}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-xl text-text/80 md:text-2xl">{HERO.subtitle}</p>

        <div className="mt-12 flex flex-wrap justify-center gap-5">
          <Link
            href="/apply"
            className="group flex min-w-[220px] flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-8 text-center backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:border-accent/50 hover:bg-white/10 hover:shadow-accent"
          >
            <span className="text-accent">
              <PersonPlusIcon />
            </span>
            <span className="font-display text-base font-semibold tracking-wide text-text">
              Apply for Students
            </span>
          </Link>

          <a
            href="https://forms.gle/uNLeuAPtbMQ6c1eV9"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex min-w-[220px] flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-8 text-center backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:border-accent/50 hover:bg-white/10 hover:shadow-accent"
          >
            <span className="text-accent">
              <CoffeeCupIcon />
            </span>
            <span className="font-display text-base font-semibold tracking-wide text-text">
              Coffee Chat Sign-Ups
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
