export interface Team {
  id: number;
  name: string;
  slug: string;
  logo: string;
}

export interface Competition {
  id: number;
  name: string;
  slug: string;
  country: string;
  country_code: string;
}

export interface Probabilities {
  home_win: number;
  draw: number;
  away_win: number;
  btts: number;
  over_15: number;
  over_25: number;
  over_35: number;
  fh_over_05: number;
  fh_over_15: number;
  ht_home: number;
  ht_away: number;
  ht_draw: number;
}

export interface Predictions {
  result: string;
  correct_score: string;
  htft: string;
  btts: boolean;
  over_25: boolean;
}

export interface Odds {
  home_win: string;
  draw: string;
  away_win: string;
  btts_yes: string;
  btts_no: string;
  over_15: string;
  over_25: string;
  over_35: string;
  fh_over_05: string;
  fh_over_15: string;
  dc_1x: string;
  dc_12: string;
  dc_x2: string;
}

export interface Score {
  home: number;
  away: number;
  ht_home: number;
  ht_away: number;
}

export interface Form {
  home: string;
  away: string;
  home_btts: string;
  away_btts: string;
}

export interface AsianOdds {
  ah: Array<{ line: number; home_odds: number; away_odds: number }>;
  ah_fh: Array<{ line: number; home_odds: number; away_odds: number }>;
  gl: Array<{ line: number; home_odds: number; away_odds: number }>;
  gl_fh: Array<{ line: number; home_odds: number; away_odds: number }>;
}

export interface Match {
  match_id: number;
  kickoff: string;
  status: "FT" | "LIVE" | "NS" | "PST" | "CANC" | "ABD" | "AWD" | "WO";
  minute: number | null;
  home_team: Team;
  away_team: Team;
  competition: Competition;
  score: Score;
  probabilities: Probabilities;
  predictions: Predictions;
  odds: Odds;
  fixture_slug: string;
  form: Form;
  asian_odds: AsianOdds;
}

export interface FilterState {
  search: string;
  minOdds: number;
  maxOdds: number;
  minProbability: number;
  minTime: number; // 0-1440 (minutes from 00:00)
  maxTime: number; // 0-1440 (minutes from 00:00)
  selectedLeagues: string[]; // competition.name array
}

export interface MatchDataState {
  data: Match[];
  isLoading: boolean;
  error: string | null;
  isLocal: boolean;
}
