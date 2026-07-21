import { useEffect, useRef, useState } from 'react';
import logoUrl from '../../../imports/logo.svg';

// Cold-start screen. A spinner says "wait"; a greeting typing itself out says
// "welcome back" — and it fills exactly the same time the session check needs,
// so nothing is actually slower.
//
// The name comes from localStorage rather than the session, because the whole
// point is to show it *while* the session is still loading. It's written on
// every successful login (see rememberGreeting) and cleared on logout.

const KEY = 'ilimyolu:greeting';

export function rememberGreeting(name?: string | null) {
  try {
    if (name) localStorage.setItem(KEY, name);
    else localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function forgetGreeting() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

function rememberedName() {
  try {
    return localStorage.getItem(KEY) || '';
  } catch {
    return '';
  }
}

// Turkish is the default reading; Dutch speakers get the transliteration they
// know. Same greeting either way.
export function greetingFor(language: 'nl' | 'tr', name?: string | null) {
  const salaam = language === 'nl' ? 'Assalamu alaikum' : 'Selamun aleykum';
  return name ? `${salaam}, ${name}` : salaam;
}

interface GreetingSplashProps {
  language: 'nl' | 'tr';
  name?: string | null;
  // Fired once the line has finished typing (plus a beat to read it). The host
  // holds the splash until this arrives, so the greeting is never cut off
  // mid-word by a session check that happened to return quickly — and a long
  // name doesn't need a longer hard-coded timeout.
  onDone?: () => void;
}

export default function GreetingSplash({ language, name, onDone }: GreetingSplashProps) {
  const full = greetingFor(language, name ?? rememberedName());
  const [shown, setShown] = useState(0);

  useEffect(() => {
    setShown(0);
    // ~45ms a character reads as typing rather than as a stutter, and lands a
    // typical greeting in a little under a second.
    const id = setInterval(() => {
      setShown((n) => {
        if (n >= full.length) {
          clearInterval(id);
          return n;
        }
        return n + 1;
      });
    }, 45);
    return () => clearInterval(id);
  }, [full]);

  const done = shown >= full.length;

  // Through a ref so an inline callback from the parent can't restart the
  // timer on every re-render.
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => doneRef.current?.(), 400);
    return () => clearTimeout(id);
  }, [done]);

  return (
    <div className="size-full flex flex-col items-center justify-center gap-6 bg-gray-50 px-8">
      <img
        src={logoUrl}
        alt="Rahman Eğitim"
        className="h-24 w-24 object-contain"
        style={{ animation: 'greeting-rise 600ms cubic-bezier(0.32, 0.72, 0, 1) both' }}
      />
      <p className="min-h-[2rem] text-center text-xl font-semibold tracking-tight text-emerald-800">
        {full.slice(0, shown)}
        {/* The caret stops blinking once the line is finished, so the screen
            settles instead of flickering while the session finishes loading. */}
        <span
          aria-hidden
          className="ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[2px] bg-emerald-700"
          style={done ? { opacity: 0, transition: 'opacity 400ms' } : { animation: 'greeting-caret 900ms steps(2) infinite' }}
        />
      </p>
      <span className="sr-only">Yükleniyor... / Laden...</span>
    </div>
  );
}
