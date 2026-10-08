// 2026-27 Coachella Valley Firebirds home schedule (Acrisure Arena, Pacific time).
//
// Dates and times verified against https://cvfirebirds.com/schedule/2026-27-schedule/
// on Oct. 8, 2026 (all 36 home games). Theme nights and giveaways come from the team's
// Aug. 3, 2026 theme-night release and Sept. 16, 2026 giveaway calendar. Edit games in
// the admin panel if the team changes anything.
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
  { date: '2026-12-20', time: '17:00', opponent: 'San Diego Gulls', theme: 'Teddy Bear Toss', giveaway: '' },
  { date: '2026-12-27', time: '15:00', opponent: 'Ontario Reign', theme: '', giveaway: '' },
  { date: '2026-12-31', time: '17:00', opponent: 'San Diego Gulls', theme: "New Year's Eve", giveaway: '' },
  { date: '2027-01-08', time: '19:00', opponent: 'Henderson Silver Knights', theme: '', giveaway: '' },
  { date: '2027-01-09', time: '18:00', opponent: 'Henderson Silver Knights', theme: 'Pride Night', giveaway: 'Sherpa bucket hat' },
  { date: '2027-01-13', time: '19:00', opponent: 'Calgary Wranglers', theme: 'Canadian Night', giveaway: '' },
  { date: '2027-01-17', time: '17:00', opponent: 'San Diego Gulls', theme: "Kids' Night", giveaway: 'Kids jersey' },
  { date: '2027-01-23', time: '18:00', opponent: 'Bakersfield Condors', theme: 'First Responders Night', giveaway: '' },
  { date: '2027-02-03', time: '19:00', opponent: 'Tucson Roadrunners', theme: '', giveaway: '' },
  { date: '2027-02-12', time: '19:00', opponent: 'Calgary Wranglers', theme: '', giveaway: '' },
  { date: '2027-02-19', time: '19:00', opponent: 'Colorado Eagles', theme: '', giveaway: '' },
  { date: '2027-02-20', time: '18:00', opponent: 'Colorado Eagles', theme: 'Kraken Night', giveaway: 'Kokko bobblehead' },
  { date: '2027-02-27', time: '18:00', opponent: 'Bakersfield Condors', theme: 'Coachella Valley Lakers Night', giveaway: '' },
  { date: '2027-03-03', time: '19:00', opponent: 'San Jose Barracuda', theme: '', giveaway: '' },
  { date: '2027-03-12', time: '19:00', opponent: 'Texas Stars', theme: "Yacht Rock / 80's Night", giveaway: '' },
  { date: '2027-03-14', time: '15:00', opponent: 'Colorado Eagles', theme: "Fuego's Birthday", giveaway: 'Fuego plush keychain' },
  { date: '2027-03-17', time: '19:00', opponent: 'Texas Stars', theme: "St. Patrick's Day", giveaway: '' },
  { date: '2027-03-26', time: '19:00', opponent: 'Tucson Roadrunners', theme: '', giveaway: '' },
  { date: '2027-03-31', time: '19:00', opponent: 'Abbotsford Canucks', theme: 'Teacher Appreciation Night', giveaway: '' },
  { date: '2027-04-03', time: '18:00', opponent: 'Ontario Reign', theme: 'Fan Appreciation Night', giveaway: 'Hockey stick can cooler' },
];

// Perks shown on the public page. Edit in the admin panel; these are starting values.
export const DEFAULT_PERKS = [
  { icon: '🎟️', title: 'Seats', detail: 'Four tickets in Section 205, Row C, Seats 1-4.' },
  { icon: '🍔', title: 'Free meal', detail: 'Each ticket is good for one free meal at the 2nd level food venues.' },
  { icon: '🅿️', title: 'VIP parking', detail: 'VIP Lot B parking pass.' },
  { icon: '🧢', title: 'Merch discount', detail: 'Show your ticket for 15% off Firebirds merchandise.' },
];

export const DEFAULT_SETTINGS = {
  season_label: SEASON_LABEL,
  tickets_per_game: '4',
  intro_text: 'Pick the home games you would like to attend. At the beginning of each month we randomly draw one name for each of that month\'s games from everyone who entered. Win once and you are set for the season so everyone gets a turn.',
  perks: JSON.stringify(DEFAULT_PERKS),
};
