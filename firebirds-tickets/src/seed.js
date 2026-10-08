// 2026-27 Coachella Valley Firebirds home schedule (Acrisure Arena, Pacific time).
//
// Compiled from the team's July 9, 2026 schedule release, the Aug. 3, 2026 theme-night
// release, and the Sept. 16, 2026 giveaway calendar as reported by KESQ, NBC Palm Springs,
// Patch, OurSports Central and Acrisure Arena listings. The team announced 36 home games;
// 33 are listed here. Sources disagreed on a few dates, so verify against
// https://cvfirebirds.com/schedule/2026-27-schedule/ and edit games in the admin panel.
//
// Dates are YYYY-MM-DD, times are 24h local (America/Los_Angeles).

export const SEASON_LABEL = '2026-27 Season';

export const GAMES = [
  { date: '2026-10-02', time: '19:00', opponent: 'Ontario Reign', theme: 'Opening Night / Homeowner Night', giveaway: 'Jersey scarf' },
  { date: '2026-10-09', time: '19:00', opponent: 'San Diego Gulls', theme: '', giveaway: '' },
  { date: '2026-10-11', time: '15:00', opponent: 'Ontario Reign', theme: '', giveaway: '' },
  { date: '2026-10-23', time: '19:00', opponent: 'San Jose Barracuda', theme: 'Oktoberfest', giveaway: '' },
  { date: '2026-10-28', time: '19:00', opponent: 'Tucson Roadrunners', theme: '', giveaway: '' },
  { date: '2026-10-30', time: '19:00', opponent: 'Henderson Silver Knights', theme: 'Día de los Muertos', giveaway: 'Luchador mask' },
  { date: '2026-11-04', time: '19:00', opponent: 'Colorado Eagles', theme: '', giveaway: '' },
  { date: '2026-11-12', time: '19:00', opponent: 'San Jose Barracuda', theme: '', giveaway: '' },
  { date: '2026-11-15', time: '15:00', opponent: 'Abbotsford Canucks', theme: 'Cancer Awareness Night', giveaway: '' },
  { date: '2026-11-27', time: '19:00', opponent: 'Bakersfield Condors', theme: 'Thanksgiving Break', giveaway: 'Fuego on a Shelf figurine' },
  { date: '2026-11-28', time: '18:00', opponent: 'Henderson Silver Knights', theme: 'Military Appreciation Night', giveaway: 'Challenge coin' },
  { date: '2026-12-02', time: '19:00', opponent: 'Tucson Roadrunners', theme: '', giveaway: '' },
  { date: '2026-12-04', time: '19:00', opponent: 'Calgary Wranglers', theme: 'Margarita Valley', giveaway: '' },
  { date: '2026-12-06', time: '17:00', opponent: 'Bakersfield Condors', theme: 'Route 66 Night', giveaway: 'Car sun shade' },
  { date: '2026-12-08', time: '19:00', opponent: 'Calgary Wranglers', theme: '', giveaway: '' },
  { date: '2026-12-16', time: '19:00', opponent: 'San Jose Barracuda', theme: '', giveaway: '' },
  { date: '2026-12-20', time: '17:00', opponent: 'San Diego Gulls', theme: 'Teddy Bear Toss', giveaway: '', notes: 'Start time unconfirmed (Sunday games are 3 or 5 p.m.)' },
  { date: '2026-12-31', time: '17:00', opponent: 'San Diego Gulls', theme: "New Year's Eve", giveaway: '' },
  { date: '2027-01-08', time: '19:00', opponent: 'Henderson Silver Knights', theme: '', giveaway: '' },
  { date: '2027-01-09', time: '18:00', opponent: 'Henderson Silver Knights', theme: 'Pride Night', giveaway: 'Sherpa bucket hat' },
  { date: '2027-01-13', time: '19:00', opponent: 'Calgary Wranglers', theme: 'Canadian Night', giveaway: '' },
  { date: '2027-01-17', time: '17:00', opponent: 'San Diego Gulls', theme: "Kids' Night", giveaway: 'Kids jersey' },
  { date: '2027-01-23', time: '18:00', opponent: 'Bakersfield Condors', theme: 'First Responders Night', giveaway: '' },
  { date: '2027-02-11', time: '19:00', opponent: 'Tucson Roadrunners', theme: '', giveaway: '', notes: 'Date unconfirmed (sources list Feb. 4 or Feb. 11)' },
  { date: '2027-02-13', time: '18:00', opponent: 'Calgary Wranglers', theme: '', giveaway: '' },
  { date: '2027-02-20', time: '18:00', opponent: 'Colorado Eagles', theme: 'Kraken Night', giveaway: 'Kokko bobblehead' },
  { date: '2027-02-27', time: '18:00', opponent: 'Bakersfield Condors', theme: 'Coachella Valley Lakers Night', giveaway: '', notes: 'Date unconfirmed (sources list Feb. 27 or Feb. 28)' },
  { date: '2027-03-12', time: '19:00', opponent: 'Texas Stars', theme: "Yacht Rock / 80's Night", giveaway: '' },
  { date: '2027-03-14', time: '17:00', opponent: 'Colorado Eagles', theme: "Fuego's Birthday", giveaway: 'Fuego plush keychain', notes: 'Start time unconfirmed (Sunday games are 3 or 5 p.m.)' },
  { date: '2027-03-17', time: '19:00', opponent: 'Texas Stars', theme: "St. Patrick's Day", giveaway: '' },
  { date: '2027-03-27', time: '18:00', opponent: 'Tucson Roadrunners', theme: '', giveaway: '' },
  { date: '2027-03-31', time: '19:00', opponent: 'Abbotsford Canucks', theme: 'Teacher Appreciation Night', giveaway: '' },
  { date: '2027-04-03', time: '18:00', opponent: 'Ontario Reign', theme: 'Fan Appreciation Night', giveaway: 'Hockey stick can cooler' },
];

// Perks shown on the public page. Edit in the admin panel; these are starting values.
export const DEFAULT_PERKS = [
  { icon: '🎟️', title: 'Seats', detail: 'Two tickets. Section and row to be confirmed in the admin panel.' },
  { icon: '🍔', title: 'Food & drink', detail: 'Complimentary food and non-alcoholic drinks with the tickets.' },
  { icon: '🅿️', title: 'VIP parking', detail: 'One VIP parking pass at Acrisure Arena.' },
  { icon: '🧢', title: 'Merch discount', detail: 'Discount on Firebirds merchandise at the team store.' },
];

export const DEFAULT_SETTINGS = {
  season_label: SEASON_LABEL,
  draw_lead_days: '3',
  tickets_per_game: '2',
  intro_text: 'Pick the home games you would like to attend. A few days before each game we randomly draw one name from everyone who entered. Win once and you are set for the season so everyone gets a turn.',
  perks: JSON.stringify(DEFAULT_PERKS),
};
