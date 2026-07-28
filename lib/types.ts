export interface Team {
  name: string;
  country: string;
}

export interface League {
  name: string;
  country: string;
  badge?: string;
}

export interface Prediction {
  type: "1" | "X" | "2" | "over2.5" | "under2.5";
  outcome: string;
  probability: number;
}

export interface Match {
  id: string;
  kickOffTime: string;
  status: "scheduled" | "live" | "finished";
  score: string | null;
  homeTeam: Team;
  awayTeam: Team;
  league: League;
  prediction: Prediction;
  odds: number;
  matchResult?: "win" | "loss" | "draw";
  matchDate: string;
}

export interface FilterState {
  search: string;
  oddsFilter: "all" | "1.30" | "1.60-1.80" | "2.00";
  minOdds: number;
  maxOdds: number;
  minProbability: number;
}

export interface MatchDataState {
  data: Match[];
  isLoading: boolean;
  error: string | null;
  isLocal: boolean;
}
