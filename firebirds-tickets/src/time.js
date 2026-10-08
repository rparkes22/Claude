// All game times are Pacific (America/Los_Angeles). Helpers to compare against "now".
const TZ = 'America/Los_Angeles';

const parts = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ, hourCycle: 'h23',
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
});

/** Returns { date: 'YYYY-MM-DD', time: 'HH:MM' } for `now` in Pacific time. */
export function nowInPacific(now = new Date()) {
  const p = Object.fromEntries(parts.formatToParts(now).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

export function addDays(isoDate, days) {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function isValidDate(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));
}

export function isValidTime(s) {
  return typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
}

/** True once the game's start time has passed (Pacific). */
export function gameHasStarted(game, now = new Date()) {
  const cur = nowInPacific(now);
  return game.date < cur.date || (game.date === cur.date && game.time <= cur.time);
}
