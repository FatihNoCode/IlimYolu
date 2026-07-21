// Lightweight on-device activity log, for reporting bugs from a real phone.
//
// The problem it solves: when something goes wrong on someone's device there
// is no console to look at, and "it said not found" is not enough to act on.
// So every feature the user opens, and every error the app shows, appends a
// line to a small in-memory ring buffer.
//
// Two rules keep it from turning into surveillance or a storage leak:
//
//  1. It is *transient*. If a session records no errors the buffer is dropped
//     on a timer (and on app resume), so a normal run leaves nothing behind.
//     Only a session that actually produced an error is worth keeping.
//  2. It never leaves the device on its own. The user opens Voorkeuren, sees
//     exactly what it says, and chooses to share it.

import { APP_VERSION } from './version';

export type LogLevel = 'action' | 'error';

export interface LogEntry {
  at: string;
  level: LogLevel;
  // The feature the user was in ("Facturatie", "Elif-Ba"), not a code path.
  feature: string;
  message: string;
}

const MAX_ENTRIES = 200;
// A run with no errors is dropped this long after the last entry. Long enough
// that an error arriving shortly after an action still has its lead-up.
const PRUNE_AFTER_MS = 5 * 60 * 1000;

let entries: LogEntry[] = [];
let errorCount = 0;
let lastWrite = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

export function subscribeDeviceLog(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function push(level: LogLevel, feature: string, message: string) {
  entries.push({
    at: new Date().toISOString(),
    level,
    feature,
    message: String(message).slice(0, 500),
  });
  if (entries.length > MAX_ENTRIES) entries = entries.slice(-MAX_ENTRIES);
  if (level === 'error') errorCount++;
  lastWrite = Date.now();
  emit();
}

/** Record that the user used a feature. Cheap — call it freely. */
export function logAction(feature: string, message: string) {
  push('action', feature, message);
}

/** Record an error the user was actually shown, or one thrown in the app. */
export function logError(feature: string, message: string) {
  push('error', feature, message);
}

export function getDeviceLog(): LogEntry[] {
  return entries;
}

export function deviceLogHasErrors() {
  return errorCount > 0;
}

export function clearDeviceLog() {
  entries = [];
  errorCount = 0;
  emit();
}

/** Drop a clean run. No-op once an error has been recorded. */
export function pruneDeviceLog() {
  if (errorCount > 0 || entries.length === 0) return;
  if (Date.now() - lastWrite < PRUNE_AFTER_MS) return;
  clearDeviceLog();
}

/** The log as plain text, which is what gets shared or copied. */
export function formatDeviceLog(): string {
  const header = [
    `Rahman Egitim — logboek`,
    `Versie: ${APP_VERSION}`,
    `Datum: ${new Date().toLocaleString()}`,
    `Platform: ${navigator.userAgent}`,
    '',
  ];
  const body = entries.map(
    (e) => `${e.at}  ${e.level === 'error' ? 'FOUT ' : 'actie'}  [${e.feature}] ${e.message}`,
  );
  return [...header, ...body].join('\n');
}

let installed = false;

/**
 * Wire up the global error sources and the auto-prune timer. Called once from
 * main.tsx, before the app renders, so a crash during boot is still captured.
 */
export function installDeviceLog() {
  if (installed) return;
  installed = true;

  window.addEventListener('error', (e) => {
    logError('App', e.message || 'Onbekende fout');
  });
  window.addEventListener('unhandledrejection', (e) => {
    const reason: any = (e as PromiseRejectionEvent).reason;
    logError('App', reason?.message || String(reason));
  });

  setInterval(pruneDeviceLog, 60 * 1000);
}
