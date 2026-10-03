function parts(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return { y: y!, m: m!, d: d!, weekday: new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay() };
}

/** Monday of the week containing `iso` (ISO 8601 weeks start on Monday). */
export function mondayOfIso(iso: string): string {
  const { y, m, d, weekday } = parts(iso);
  return new Date(Date.UTC(y, m - 1, d - ((weekday + 6) % 7))).toISOString().slice(0, 10);
}

export function addDaysIso(iso: string, days: number): string {
  const { y, m, d } = parts(iso);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
