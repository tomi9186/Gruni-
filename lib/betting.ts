import { Match } from "./types";

export interface MainPredictionResult {
  prediction: string;
  label: string;
  probability: number;
  odd: number;
  impliedProbability: number;
  valuePercent: number;
  kellyPercent: number;
  riskLevel: "Nizak" | "Srednji" | "Visok";
}

const PREDICTION_LABELS: Record<string, string> = {
  home_win: "Pobjeda domaćina (1)",
  away_win: "Pobjeda gosta (2)",
  draw: "Neriješeno (X)",
  btts: "Oba daju gol (GG)",
  over_15: "Više od 1.5 gola",
  over_25: "Više od 2.5 gola",
  over_35: "Više od 3.5 gola",
  fh_over_05: "1. pol. više od 0.5",
  fh_over_15: "1. pol. više od 1.5",
  "N/A": "N/A",
};

export function getPredictionLabel(key: string): string {
  return PREDICTION_LABELS[key] || key;
}

export function getMainPrediction(match: Match): MainPredictionResult {
  const { probabilities, odds } = match;
  if (!probabilities || !odds) {
    return {
      prediction: "N/A",
      label: "N/A",
      probability: 0,
      odd: 0,
      impliedProbability: 0,
      valuePercent: 0,
      kellyPercent: 0,
      riskLevel: "Visok",
    };
  }

  const betOptions = [
    { key: "home_win", prob: probabilities.home_win, odd: odds.home_win },
    { key: "away_win", prob: probabilities.away_win, odd: odds.away_win },
    { key: "draw", prob: probabilities.draw, odd: odds.draw },
    { key: "btts", prob: probabilities.btts, odd: odds.btts_yes },
    { key: "over_25", prob: probabilities.over_25, odd: odds.over_25 },
    { key: "over_15", prob: probabilities.over_15, odd: odds.over_15 },
    { key: "over_35", prob: probabilities.over_35, odd: odds.over_35 },
    { key: "fh_over_05", prob: probabilities.fh_over_05, odd: odds.fh_over_05 },
    { key: "fh_over_15", prob: probabilities.fh_over_15, odd: odds.fh_over_15 },
  ];

  const sortedOptions = betOptions
    .filter((option) => option.prob && option.odd && parseFloat(option.odd) > 0)
    .sort((a, b) => b.prob! - a.prob!);

  const bestBet =
    sortedOptions.find((option) => parseFloat(option.odd!) > 1.2) ||
    sortedOptions[0];

  if (!bestBet) {
    return {
      prediction: "N/A",
      label: "N/A",
      probability: 0,
      odd: 0,
      impliedProbability: 0,
      valuePercent: 0,
      kellyPercent: 0,
      riskLevel: "Visok",
    };
  }

  const probability = Math.min(bestBet.prob!, 96);
  const odd = parseFloat(bestBet.odd!);
  const impliedProbability = odd > 0 ? (1 / odd) * 100 : 0;
  // Expected Value: (P * Odd) - 1, expressed in %
  const valuePercent = ((probability / 100) * odd - 1) * 100;

  // Quarter-Kelly stake recommendation (capped at 5%)
  let kellyPercent = 0;
  if (odd > 1 && valuePercent > 0) {
    const fullKelly = ((probability / 100) * odd - 1) / (odd - 1);
    kellyPercent = Math.max(0, Math.min(5, fullKelly * 0.25 * 100));
  }

  const riskLevel: "Nizak" | "Srednji" | "Visok" =
    match.risk_level ||
    (probability >= 70 ? "Nizak" : probability >= 55 ? "Srednji" : "Visok");

  return {
    prediction: bestBet.key,
    label: getPredictionLabel(bestBet.key),
    probability,
    odd,
    impliedProbability,
    valuePercent,
    kellyPercent,
    riskLevel,
  };
}

export function checkPredictionCorrect(match: Match): boolean | null {
  if (match.status !== "FT") return null;

  const { prediction } = getMainPrediction(match);
  const { home, away, ht_home, ht_away } = match.score;

  if (home === null || away === null) return null;

  const totalScore = home + away;
  const fhTotalScore = (ht_home ?? 0) + (ht_away ?? 0);

  switch (prediction) {
    case "home_win":
      return home > away;
    case "away_win":
      return away > home;
    case "draw":
      return home === away;
    case "btts":
      return home > 0 && away > 0;
    case "over_15":
      return totalScore > 1.5;
    case "over_25":
      return totalScore > 2.5;
    case "over_35":
      return totalScore > 3.5;
    case "fh_over_05":
      return fhTotalScore > 0.5;
    case "fh_over_15":
      return fhTotalScore > 1.5;
    default:
      return null;
  }
}

export interface BacktestStats {
  totalFinished: number;
  hits: number;
  misses: number;
  hitRate: number;
  totalStaked: number;
  netProfit: number;
  roiPercent: number;
  valueTotal: number;
  valueHits: number;
  valueRoiPercent: number;
  byMarket: Array<{
    market: string;
    label: string;
    total: number;
    hits: number;
    hitRate: number;
    roiPercent: number;
  }>;
  topLeagues: Array<{
    league: string;
    total: number;
    hits: number;
    hitRate: number;
    roiPercent: number;
  }>;
}

export function calculateBacktestStats(
  matches: Match[],
  stakePerBet = 10
): BacktestStats {
  let totalFinished = 0;
  let hits = 0;
  let totalStaked = 0;
  let totalReturn = 0;

  let valueTotal = 0;
  let valueHits = 0;
  let valueStaked = 0;
  let valueReturn = 0;

  const marketMap = new Map<
    string,
    { total: number; hits: number; staked: number; returned: number }
  >();
  const leagueMap = new Map<
    string,
    { total: number; hits: number; staked: number; returned: number }
  >();

  for (const match of matches) {
    const isHit = checkPredictionCorrect(match);
    if (isHit === null) continue;

    const pred = getMainPrediction(match);
    if (pred.odd <= 0 || pred.prediction === "N/A") continue;

    totalFinished++;
    totalStaked += stakePerBet;
    const payout = isHit ? stakePerBet * pred.odd : 0;
    totalReturn += payout;
    if (isHit) hits++;

    if (pred.valuePercent > 0) {
      valueTotal++;
      valueStaked += stakePerBet;
      valueReturn += payout;
      if (isHit) valueHits++;
    }

    const mEntry = marketMap.get(pred.prediction) || {
      total: 0,
      hits: 0,
      staked: 0,
      returned: 0,
    };
    mEntry.total++;
    mEntry.staked += stakePerBet;
    mEntry.returned += payout;
    if (isHit) mEntry.hits++;
    marketMap.set(pred.prediction, mEntry);

    const leagueName = match.competition.name;
    const lEntry = leagueMap.get(leagueName) || {
      total: 0,
      hits: 0,
      staked: 0,
      returned: 0,
    };
    lEntry.total++;
    lEntry.staked += stakePerBet;
    lEntry.returned += payout;
    if (isHit) lEntry.hits++;
    leagueMap.set(leagueName, lEntry);
  }

  const netProfit = totalReturn - totalStaked;
  const roiPercent = totalStaked > 0 ? (netProfit / totalStaked) * 100 : 0;
  const valueRoiPercent =
    valueStaked > 0 ? ((valueReturn - valueStaked) / valueStaked) * 100 : 0;

  const byMarket = Array.from(marketMap.entries())
    .map(([market, stats]) => ({
      market,
      label: getPredictionLabel(market),
      total: stats.total,
      hits: stats.hits,
      hitRate: (stats.hits / stats.total) * 100,
      roiPercent: ((stats.returned - stats.staked) / stats.staked) * 100,
    }))
    .sort((a, b) => b.total - a.total);

  const topLeagues = Array.from(leagueMap.entries())
    .filter(([, stats]) => stats.total >= 3)
    .map(([league, stats]) => ({
      league,
      total: stats.total,
      hits: stats.hits,
      hitRate: (stats.hits / stats.total) * 100,
      roiPercent: ((stats.returned - stats.staked) / stats.staked) * 100,
    }))
    .sort((a, b) => b.roiPercent - a.roiPercent)
    .slice(0, 5);

  return {
    totalFinished,
    hits,
    misses: totalFinished - hits,
    hitRate: totalFinished > 0 ? (hits / totalFinished) * 100 : 0,
    totalStaked,
    netProfit,
    roiPercent,
    valueTotal,
    valueHits,
    valueRoiPercent,
    byMarket,
    topLeagues,
  };
}

export interface SlipCandidate {
  match: Match;
  prediction: MainPredictionResult;
}

export interface GeneratedSlip {
  items: SlipCandidate[];
  totalOdds: number;
  combinedProbability: number;
  avgValuePercent: number;
}

export function generateBettingSlip(
  matches: Match[],
  options: {
    targetOdds: number;
    maxLegs: number;
    minProbability: number;
    onlyValueBets: boolean;
    onlyUpcoming: boolean;
    seedOffset?: number;
  }
): GeneratedSlip | null {
  const {
    targetOdds,
    maxLegs,
    minProbability,
    onlyValueBets,
    onlyUpcoming,
    seedOffset = 0,
  } = options;

  let candidates: SlipCandidate[] = matches
    .filter((m) => !onlyUpcoming || m.status === "NS")
    .map((match) => ({
      match,
      prediction: getMainPrediction(match),
    }))
    .filter(
      (c) =>
        c.prediction.prediction !== "N/A" &&
        c.prediction.odd > 1.05 &&
        c.prediction.probability >= minProbability &&
        (!onlyValueBets || c.prediction.valuePercent > 0)
    );

  // Fallback to all matches if no NS matches exist (e.g. viewing past date)
  if (candidates.length === 0 && onlyUpcoming) {
    candidates = matches
      .map((match) => ({
        match,
        prediction: getMainPrediction(match),
      }))
      .filter(
        (c) =>
          c.prediction.prediction !== "N/A" &&
          c.prediction.odd > 1.05 &&
          c.prediction.probability >= minProbability &&
          (!onlyValueBets || c.prediction.valuePercent > 0)
      );
  }

  if (candidates.length === 0) return null;

  // Score candidates by probability + value bonus
  candidates.sort((a, b) => {
    const scoreA = a.prediction.probability + Math.max(0, a.prediction.valuePercent) * 0.5;
    const scoreB = b.prediction.probability + Math.max(0, b.prediction.valuePercent) * 0.5;
    return scoreB - scoreA;
  });

  // Rotate top pool slightly if user clicks "Novi prijedlog"
  const poolSize = Math.min(candidates.length, 30);
  const pool = candidates.slice(0, poolSize);
  const rotatedPool =
    seedOffset > 0
      ? [
          ...pool.slice(seedOffset % pool.length),
          ...pool.slice(0, seedOffset % pool.length),
        ]
      : pool;

  const selected: SlipCandidate[] = [];
  let currentOdds = 1;

  for (const candidate of rotatedPool) {
    if (selected.length >= maxLegs) break;
    if (currentOdds >= targetOdds * 0.92 && selected.length >= 2) break;

    const nextOdds = currentOdds * candidate.prediction.odd;
    // Allow slight overshoot only if we don't have enough legs yet, or if it's close to target
    if (nextOdds <= targetOdds * 1.35 || selected.length === 0) {
      selected.push(candidate);
      currentOdds = nextOdds;
    }
  }

  if (selected.length === 0) return null;

  const combinedProbability =
    selected.reduce((acc, item) => acc * (item.prediction.probability / 100), 1) *
    100;
  const avgValuePercent =
    selected.reduce((acc, item) => acc + item.prediction.valuePercent, 0) /
    selected.length;

  return {
    items: selected,
    totalOdds: currentOdds,
    combinedProbability,
    avgValuePercent,
  };
}
