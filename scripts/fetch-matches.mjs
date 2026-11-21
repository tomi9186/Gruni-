#!/usr/bin/env node

/**
 * Fetches daily football fixtures & odds from API-Football (v3.football.api-sports.io),
 * calculates Poisson + Form probabilities, optionally enriches top matches with Gemini AI,
 * and saves public/data/matches_YYYY-MM-DD.json + updates public/data/manifest.json.
 *
 * Required env:
 *   API_FOOTBALL_KEY  - Free API key from api-sports.io (100 req/day)
 * Optional env:
 *   GEMINI_API_KEY    - Free Google AI Studio key for natural-language match reasoning
 *   FETCH_DATE        - YYYY-MM-DD (defaults to today UTC)
 */

import fs from "node:fs";
import path from "node:path";

const API_KEY = process.env.API_FOOTBALL_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const FETCH_DATE =
  process.env.FETCH_DATE || new Date().toISOString().slice(0, 10);

const DATA_DIR = path.join(process.cwd(), "public", "data");
const OUTPUT_FILE = path.join(DATA_DIR, `matches_${FETCH_DATE}.json`);

if (!API_KEY) {
  console.error("❌ Missing API_FOOTBALL_KEY environment variable.");
  process.exit(1);
}

const API_BASE = "https://v3.football.api-sports.io";

async function apiFetch(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "x-apisports-key": API_KEY,
    },
  });
  if (!res.ok) {
    throw new Error(`API-Football HTTP ${res.status} on ${endpoint}`);
  }
  const json = await res.json();
  if (json.errors && Object.keys(json.errors).length > 0) {
    throw new Error(`API-Football error: ${JSON.stringify(json.errors)}`);
  }
  return json;
}

// --- Poisson math helpers ---
function factorial(n) {
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

function poissonPmf(k, lambda) {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

function calculatePoissonProbabilities(lambdaHome, lambdaAway) {
  const maxGoals = 7;
  let homeWin = 0;
  let draw = 0;
  let awayWin = 0;
  let btts = 0;
  let over15 = 0;
  let over25 = 0;
  let over35 = 0;

  for (let h = 0; h <= maxGoals; h++) {
    const pH = poissonPmf(h, lambdaHome);
    for (let a = 0; a <= maxGoals; a++) {
      const pA = poissonPmf(a, lambdaAway);
      const p = pH * pA;
      if (h > a) homeWin += p;
      else if (h === a) draw += p;
      else awayWin += p;

      if (h > 0 && a > 0) btts += p;
      const total = h + a;
      if (total > 1.5) over15 += p;
      if (total > 2.5) over25 += p;
      if (total > 3.5) over35 += p;
    }
  }

  // Approximate 1st half (approx 45% of total goals)
  const lh1 = lambdaHome * 0.45;
  const la1 = lambdaAway * 0.45;
  let fhOver05 = 0;
  let fhOver15 = 0;
  let htHome = 0;
  let htDraw = 0;
  let htAway = 0;

  for (let h = 0; h <= 5; h++) {
    const pH = poissonPmf(h, lh1);
    for (let a = 0; a <= 5; a++) {
      const p = pH * poissonPmf(a, la1);
      if (h + a > 0.5) fhOver05 += p;
      if (h + a > 1.5) fhOver15 += p;
      if (h > a) htHome += p;
      else if (h === a) htDraw += p;
      else htAway += p;
    }
  }

  const pct = (v) => Math.max(1, Math.min(96, Math.round(v * 100)));

  return {
    home_win: pct(homeWin),
    draw: pct(draw),
    away_win: pct(awayWin),
    btts: pct(btts),
    over_15: pct(over15),
    over_25: pct(over25),
    over_35: pct(over35),
    fh_over_05: pct(fhOver05),
    fh_over_15: pct(fhOver15),
    ht_home: pct(htHome),
    ht_away: pct(htAway),
    ht_draw: pct(htDraw),
  };
}

function formScore(formStr) {
  if (!formStr) return 1.0;
  let pts = 0;
  let count = 0;
  for (const ch of formStr.slice(-5)) {
    if (ch === "W") pts += 3;
    else if (ch === "D") pts += 1;
    count++;
  }
  if (count === 0) return 1.0;
  // Normalize around 1.0 (0.85 to 1.15)
  const ratio = pts / (count * 3);
  return 0.85 + ratio * 0.3;
}

function parseOddsForFixture(bookmakers) {
  if (!Array.isArray(bookmakers) || bookmakers.length === 0) return null;

  // Prefer Bet365 (id 8) or Pinnacle (id 4) or first available
  const preferred =
    bookmakers.find((b) => b.id === 8) ||
    bookmakers.find((b) => b.id === 4) ||
    bookmakers[0];

  const bets = preferred?.bets || [];
  const findBet = (name) => bets.find((b) => b.name === name)?.values || [];
  const findVal = (values, label) => {
    const v = values.find((x) => String(x.value) === label);
    return v ? String(v.odd) : null;
  };

  const matchWinner = findBet("Match Winner");
  const btts = findBet("Both Teams Score");
  const ou = findBet("Goals Over/Under");
  const ouFh = findBet("Goals Over/Under - First Half");
  const dc = findBet("Double Chance");

  const homeWin = findVal(matchWinner, "Home");
  const draw = findVal(matchWinner, "Draw");
  const awayWin = findVal(matchWinner, "Away");

  if (!homeWin || !awayWin) return null;

  return {
    home_win: homeWin,
    draw: draw || "3.20",
    away_win: awayWin,
    btts_yes: findVal(btts, "Yes") || "",
    btts_no: findVal(btts, "No") || "",
    over_15: findVal(ou, "Over 1.5") || "",
    over_25: findVal(ou, "Over 2.5") || "",
    over_35: findVal(ou, "Over 3.5") || "",
    fh_over_05: findVal(ouFh, "Over 0.5") || "",
    fh_over_15: findVal(ouFh, "Over 1.5") || "",
    dc_1x: findVal(dc, "Home/Draw") || "",
    dc_12: findVal(dc, "Home/Away") || "",
    dc_x2: findVal(dc, "Draw/Away") || "",
  };
}

function probabilitiesFromOdds(odds) {
  if (!odds) return null;
  const h = parseFloat(odds.home_win);
  const d = parseFloat(odds.draw);
  const a = parseFloat(odds.away_win);
  if (!h || !d || !a) return null;

  const invSum = 1 / h + 1 / d + 1 / a;
  const pH = 1 / h / invSum;
  const pD = 1 / d / invSum;
  const pA = 1 / a / invSum;

  const over25Odd = parseFloat(odds.over_25);
  const bttsOdd = parseFloat(odds.btts_yes);
  const pOver25 = over25Odd > 1 ? Math.min(0.88, Math.max(0.15, (1 / over25Odd) * 0.93)) : 0.5;
  const pBtts = bttsOdd > 1 ? Math.min(0.85, Math.max(0.2, (1 / bttsOdd) * 0.93)) : 0.5;

  const pct = (v) => Math.max(1, Math.min(96, Math.round(v * 100)));

  return {
    home_win: pct(pH),
    draw: pct(pD),
    away_win: pct(pA),
    btts: pct(pBtts),
    over_15: pct(Math.min(0.92, pOver25 + 0.22)),
    over_25: pct(pOver25),
    over_35: pct(Math.max(0.12, pOver25 - 0.22)),
    fh_over_05: pct(Math.min(0.88, pOver25 + 0.16)),
    fh_over_15: pct(Math.max(0.15, pOver25 - 0.18)),
    ht_home: pct(pH * 0.78),
    ht_away: pct(pA * 0.78),
    ht_draw: pct(1 - pH * 0.78 - pA * 0.78),
  };
}

function buildStatisticalReasoning(match, homeStats, awayStats) {
  const parts = [];
  if (homeStats && awayStats) {
    const hAvg = homeStats.goalsForAvg.toFixed(2);
    const aAvg = awayStats.goalsForAvg.toFixed(2);
    parts.push(
      `Poisson model: ${match.home_team.name} zabija ${hAvg} gol/ut., ${match.away_team.name} zabija ${aAvg} gol/ut.`
    );
  } else {
    parts.push("Procjena temeljena na tržišnim kvotama i snazi momčadi.");
  }
  if (match.form?.home || match.form?.away) {
    parts.push(
      `Forma: domaćin ${match.form?.home || "?"}, gost ${match.form?.away || "?"}.`
    );
  }
  return parts.join(" ");
}

async function enrichWithGemini(matches) {
  if (!GEMINI_KEY || matches.length === 0) return;

  const topMatches = matches
    .filter((m) => m.probabilities && m.odds)
    .slice(0, 15);

  if (topMatches.length === 0) return;

  const prompt = `Ti si sportski analitičar. Za svaku od sljedećih nogometnih utakmica napiši kratku, konkretnu analizu na hrvatskom jeziku (max 1-2 rečenice) na temelju forme i izračunatih postotaka. Vrati isključivo JSON niz objekata oblika [{"match_id": number, "ai_reasoning": string, "risk_level": "Nizak"|"Srednji"|"Visok"}].

Utakmice:
${JSON.stringify(
  topMatches.map((m) => ({
    match_id: m.match_id,
    home: m.home_team.name,
    away: m.away_team.name,
    league: m.competition.name,
    form_home: m.form?.home || "",
    form_away: m.form?.away || "",
    probs: m.probabilities,
    odds: {
      1: m.odds.home_win,
      X: m.odds.draw,
      2: m.odds.away_win,
      over25: m.odds.over_25,
      btts: m.odds.btts_yes,
    },
  }))
)}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );

    if (!res.ok) {
      console.warn(`⚠️ Gemini API returned HTTP ${res.status}, skipping LLM enrichment.`);
      return;
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return;

    const parsed = JSON.parse(text);
    const byId = new Map(parsed.map((item) => [item.match_id, item]));
    for (const m of matches) {
      const enrichment = byId.get(m.match_id);
      if (enrichment) {
        m.ai_reasoning = enrichment.ai_reasoning;
        if (["Nizak", "Srednji", "Visok"].includes(enrichment.risk_level)) {
          m.risk_level = enrichment.risk_level;
        }
      }
    }
    console.log(`✨ Enriched ${byId.size} matches with Gemini AI.`);
  } catch (err) {
    console.warn("⚠️ Gemini enrichment failed:", err.message);
  }
}

function updateManifest() {
  const files = fs.readdirSync(DATA_DIR);
  const dates = files
    .map((f) => f.match(/^matches_(\d{4}-\d{2}-\d{2})\.json$/)?.[1])
    .filter(Boolean)
    .sort();

  const manifestPath = path.join(DATA_DIR, "manifest.json");
  fs.writeFileSync(
    manifestPath,
    JSON.stringify({ available_dates: dates }, null, 2)
  );
  console.log(`📋 Updated manifest.json with ${dates.length} dates.`);
}

async function main() {
  console.log(`⚽ Fetching fixtures for ${FETCH_DATE} from API-Football...`);
  const fixturesRes = await apiFetch(`/fixtures?date=${FETCH_DATE}`);
  const fixtures = fixturesRes.response || [];
  console.log(`Found ${fixtures.length} fixtures.`);

  // Fetch odds (up to 5 pages to keep API usage very low)
  const oddsMap = new Map();
  for (let page = 1; page <= 5; page++) {
    const oddsRes = await apiFetch(`/odds?date=${FETCH_DATE}&page=${page}`);
    for (const item of oddsRes.response || []) {
      const parsed = parseOddsForFixture(item.bookmakers);
      if (parsed) {
        oddsMap.set(item.fixture.id, parsed);
      }
    }
    const totalPages = oddsRes.paging?.total || 1;
    if (page >= totalPages) break;
  }
  console.log(`Loaded odds for ${oddsMap.size} fixtures.`);

  // Collect unique leagues that have odds so we can fetch standings (capped at 25 leagues)
  const leagueKeys = new Map();
  for (const f of fixtures) {
    if (!oddsMap.has(f.fixture.id)) continue;
    const key = `${f.league.id}-${f.league.season}`;
    if (!leagueKeys.has(key)) {
      leagueKeys.set(key, { id: f.league.id, season: f.league.season });
    }
    if (leagueKeys.size >= 25) break;
  }

  // teamStatsMap: `${leagueId}-${teamId}` -> { goalsForAvg, goalsAgainstAvg, form }
  const teamStatsMap = new Map();
  for (const { id, season } of leagueKeys.values()) {
    try {
      const stRes = await apiFetch(`/standings?league=${id}&season=${season}`);
      const groups = stRes.response?.[0]?.league?.standings || [];
      for (const group of groups) {
        for (const row of group) {
          const played = row.all?.played || 1;
          const gf = (row.all?.goals?.for ?? 1.2 * played) / played;
          const ga = (row.all?.goals?.against ?? 1.2 * played) / played;
          teamStatsMap.set(`${id}-${row.team.id}`, {
            goalsForAvg: gf,
            goalsAgainstAvg: ga,
            form: row.form || "",
          });
        }
      }
    } catch {
      // Some cup competitions have no standings; ignore gracefully
    }
  }
  console.log(`Loaded standings stats for ${teamStatsMap.size} teams.`);

  const matches = fixtures.map((f) => {
    const odds = oddsMap.get(f.fixture.id) || null;
    const homeStats = teamStatsMap.get(`${f.league.id}-${f.teams.home.id}`);
    const awayStats = teamStatsMap.get(`${f.league.id}-${f.teams.away.id}`);

    let probabilities = null;
    if (homeStats && awayStats) {
      // Poisson expected goals with home advantage (1.12x) and form factor
      const lambdaHome = Math.max(
        0.3,
        ((homeStats.goalsForAvg + awayStats.goalsAgainstAvg) / 2) *
          1.12 *
          formScore(homeStats.form)
      );
      const lambdaAway = Math.max(
        0.25,
        ((awayStats.goalsForAvg + homeStats.goalsAgainstAvg) / 2) *
          0.92 *
          formScore(awayStats.form)
      );
      probabilities = calculatePoissonProbabilities(lambdaHome, lambdaAway);
    } else if (odds) {
      probabilities = probabilitiesFromOdds(odds);
    }

    const predictions = probabilities
      ? {
          result:
            probabilities.home_win >= probabilities.away_win
              ? "home_or_draw"
              : "away_or_draw",
          correct_score: "1-1",
          htft: "Home/Home",
          btts: probabilities.btts >= 55,
          over_25: probabilities.over_25 >= 55,
        }
      : null;

    const maxProb = probabilities
      ? Math.max(
          probabilities.home_win,
          probabilities.away_win,
          probabilities.btts,
          probabilities.over_25
        )
      : 0;

    const matchObj = {
      match_id: f.fixture.id,
      kickoff: f.fixture.date,
      status: f.fixture.status.short || "NS",
      minute: f.fixture.status.elapsed ?? null,
      home_team: {
        id: f.teams.home.id,
        name: f.teams.home.name,
        slug: f.teams.home.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        logo: f.teams.home.logo,
      },
      away_team: {
        id: f.teams.away.id,
        name: f.teams.away.name,
        slug: f.teams.away.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        logo: f.teams.away.logo,
      },
      competition: {
        id: f.league.id,
        name: f.league.name,
        slug: `${f.league.country}/${f.league.name}`
          .toLowerCase()
          .replace(/[^a-z0-9/]+/g, "-"),
        country: f.league.country,
        country_code: f.league.country?.slice(0, 2).toUpperCase() || "",
      },
      score: {
        home: f.goals.home ?? 0,
        away: f.goals.away ?? 0,
        ht_home: f.score?.halftime?.home ?? 0,
        ht_away: f.score?.halftime?.away ?? 0,
      },
      probabilities,
      predictions,
      odds,
      fixture_slug: `${f.teams.home.name}-vs-${f.teams.away.name}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-"),
      form: {
        home: homeStats?.form?.slice(-5) || "",
        away: awayStats?.form?.slice(-5) || "",
        home_btts: "",
        away_btts: "",
      },
      asian_odds: null,
      risk_level: maxProb >= 70 ? "Nizak" : maxProb >= 55 ? "Srednji" : "Visok",
      ai_reasoning: "",
    };

    if (probabilities) {
      matchObj.ai_reasoning = buildStatisticalReasoning(
        matchObj,
        homeStats,
        awayStats
      );
    }

    return matchObj;
  });

  await enrichWithGemini(matches);

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify({ success: true, data: matches })
  );
  console.log(`✅ Saved ${matches.length} matches to ${OUTPUT_FILE}`);

  updateManifest();
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
