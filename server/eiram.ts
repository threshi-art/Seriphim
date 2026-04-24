/**
 * EiRAM — Narrative & Ideological Analysis Engine
 * Ported from the user's existing EiRAM codebase.
 * Modules: IRI, VDM, ECS, EEM, PFM
 */

// ── Keyword Lexicons ──

const ANGER_WORDS = new Set([
  "angry","furious","rage","hate","hateful","disgusted","traitor",
  "enemy","enemies","corrupt","outrage","outraged"
]);
const FEAR_WORDS = new Set([
  "afraid","fear","terrified","threat","danger","collapse",
  "destroy","ruin","unsafe","scared","panic"
]);
const GRIEVANCE_WORDS = new Set([
  "betrayed","forgotten","humiliated","cheated","stolen","lied",
  "disrespected","abandoned","silenced","targeted"
]);
const THREAT_WORDS = new Set([
  "fight","war","punish","destroy","remove","attack","retaliate",
  "crush","eliminate"
]);
const REVENGE_WORDS = new Set([
  "revenge","payback","settle","punish","retaliate","make them pay"
]);
const URGENCY_WORDS = new Set([
  "now","immediately","before it is too late","last chance","urgent",
  "cannot wait","must act"
]);
const DEHUMANIZATION_WORDS = new Set([
  "parasites","vermin","animals","scum","rats","infestation"
]);
const ABSOLUTIST_WORDS = new Set([
  "always","never","everyone","nobody","all","nothing",
  "completely","totally","entirely"
]);
const INGROUP_PHRASES = new Set([
  "we","us","our people","real americans","patriots","people like us"
]);
const OUTGROUP_PHRASES = new Set([
  "they","them","elites","traitors","invaders","those people","the enemy"
]);
const VICTIMHOOD_PHRASES = new Set([
  "we are under attack","they are coming for us","nobody listens",
  "we are being replaced","they hate us","we are being erased"
]);
const AUTHORITARIAN_PHRASES = new Set([
  "only one leader","strong hand","crush dissent","take control",
  "restore order by force"
]);
const ESCALATION_PHRASES = new Set([
  "fight back","take back","make them pay","they must be stopped",
  "we cannot wait","this means war","do what must be done"
]);

// ── Helpers ──

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/\b[\w']+\b/g) || []);
}

function splitSentences(text: string): string[] {
  return text.trim().split(/(?<=[.!?])\s+/).filter(s => s.trim());
}

function countWordHits(tokens: string[], lexicon: Set<string>): number {
  let count = 0;
  for (const t of tokens) {
    if (lexicon.has(t)) count++;
  }
  return count;
}

function countPhraseHits(textLower: string, phrases: Set<string>): number {
  let count = 0;
  phrases.forEach(phrase => {
    if (textLower.includes(phrase)) count++;
  });
  return count;
}

function safeRatio(value: number, total: number, scale = 1.0): number {
  if (total <= 0) return 0;
  return Math.min(1.0, Math.round((value / total) * scale * 10000) / 10000);
}

// ── Feature Extraction ──

export interface EiramFeatures {
  anger_score: number;
  fear_score: number;
  certainty_score: number;
  grievance_score: number;
  threat_score: number;
  revenge_score: number;
  urgency_score: number;
  dehumanization_score: number;
  ingroup_score: number;
  outgroup_score: number;
  victimhood_score: number;
  authoritarian_score: number;
  identity_fusion_score: number;
  moral_polarization_score: number;
  volatility_score: number;
  humiliation_score: number;
  narrative_entropy_score: number;
  rigidity_score: number;
  contradiction_score: number;
  escalation_phrase_hits: number;
  sentence_count: number;
  token_count: number;
  evidence_candidates: string[];
}

function extractFeatures(text: string): EiramFeatures {
  const textLower = text.toLowerCase();
  const tokens = tokenize(text);
  const sentences = splitSentences(text);
  const totalTokens = tokens.length;

  const angerHits = countWordHits(tokens, ANGER_WORDS);
  const fearHits = countWordHits(tokens, FEAR_WORDS);
  const grievanceHits = countWordHits(tokens, GRIEVANCE_WORDS);
  const threatHits = countWordHits(tokens, THREAT_WORDS);
  const revengeHits = countWordHits(tokens, REVENGE_WORDS);
  const urgencyHits = countPhraseHits(textLower, URGENCY_WORDS);
  const dehumanizationHits = countWordHits(tokens, DEHUMANIZATION_WORDS);
  const absolutistHits = countWordHits(tokens, ABSOLUTIST_WORDS);
  const ingroupHits = countPhraseHits(textLower, INGROUP_PHRASES);
  const outgroupHits = countPhraseHits(textLower, OUTGROUP_PHRASES);
  const victimhoodHits = countPhraseHits(textLower, VICTIMHOOD_PHRASES);
  const authoritarianHits = countPhraseHits(textLower, AUTHORITARIAN_PHRASES);
  const escalationPhraseHits = countPhraseHits(textLower, ESCALATION_PHRASES);

  const certainty_score = safeRatio(absolutistHits, Math.max(totalTokens, 1), 10);
  const anger_score = safeRatio(angerHits, Math.max(totalTokens, 1), 12);
  const fear_score = safeRatio(fearHits, Math.max(totalTokens, 1), 12);
  const grievance_score = safeRatio(grievanceHits, Math.max(totalTokens, 1), 12);
  const threat_score = safeRatio(threatHits, Math.max(totalTokens, 1), 12);
  const revenge_score = safeRatio(revengeHits, Math.max(totalTokens, 1), 12);
  const urgency_score = Math.min(1.0, Math.round(urgencyHits * 0.25 * 10000) / 10000);
  const dehumanization_score = Math.min(1.0, Math.round(dehumanizationHits * 0.25 * 10000) / 10000);
  const ingroup_score = Math.min(1.0, Math.round(ingroupHits * 0.2 * 10000) / 10000);
  const outgroup_score = Math.min(1.0, Math.round(outgroupHits * 0.2 * 10000) / 10000);
  const victimhood_score = Math.min(1.0, Math.round(victimhoodHits * 0.25 * 10000) / 10000);
  const authoritarian_score = Math.min(1.0, Math.round(authoritarianHits * 0.3 * 10000) / 10000);

  const identity_fusion_score = Math.min(1.0,
    Math.round((ingroup_score * 0.5 + outgroup_score * 0.3 + victimhood_score * 0.2) * 10000) / 10000);
  const moral_polarization_score = Math.min(1.0,
    Math.round((outgroup_score * 0.4 + certainty_score * 0.3 + grievance_score * 0.3) * 10000) / 10000);
  const volatility_score = Math.min(1.0,
    Math.round((anger_score * 0.4 + fear_score * 0.3 + urgency_score * 0.3) * 10000) / 10000);
  const humiliation_score = Math.min(1.0,
    Math.round((grievance_score * 0.6 + victimhood_score * 0.4) * 10000) / 10000);
  const rigidity_score = Math.min(1.0,
    Math.round((certainty_score * 0.5 + absolutistHits / Math.max(totalTokens, 1)) * 10000) / 10000);
  const narrative_entropy_score = Math.round(Math.max(0.0, 1.0 - rigidity_score) * 10000) / 10000;

  const evidence_candidates: string[] = [];
  const escalationArr = Array.from(ESCALATION_PHRASES);
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const s = sentence.toLowerCase();
    if (escalationArr.some(p => s.includes(p))) {
      evidence_candidates.push(sentence);
      continue;
    }
    if (["betrayed","fight","enemy","stolen","traitor","destroy"].some(w => s.includes(w))) {
      evidence_candidates.push(sentence);
    }
  }

  return {
    anger_score, fear_score, certainty_score, grievance_score, threat_score,
    revenge_score, urgency_score, dehumanization_score, ingroup_score,
    outgroup_score, victimhood_score, authoritarian_score, identity_fusion_score,
    moral_polarization_score, volatility_score, humiliation_score,
    narrative_entropy_score, rigidity_score, contradiction_score: 0.1,
    escalation_phrase_hits: escalationPhraseHits, sentence_count: sentences.length,
    token_count: totalTokens, evidence_candidates: evidence_candidates.slice(0, 5),
  };
}

// ── Module: IRI (Ideological Resonance Index) ──
function analyzeIRI(f: EiramFeatures) {
  let score = 0.20 * f.certainty_score + 0.20 * f.identity_fusion_score +
    0.15 * f.grievance_score + 0.15 * f.outgroup_score +
    0.15 * f.moral_polarization_score + 0.15 * f.rigidity_score;
  score = Math.min(1.0, Math.round(score * 10000) / 10000);
  const label = score >= 0.8 ? "very high" : score >= 0.6 ? "high" : score >= 0.35 ? "moderate" : "low";
  return { score, label, rationale: `certainty=${f.certainty_score}, identity_fusion=${f.identity_fusion_score}, grievance=${f.grievance_score}, outgroup=${f.outgroup_score}, rigidity=${f.rigidity_score}` };
}

// ── Module: VDM (Vulnerability & Destabilization Metric) ──
function analyzeVDM(f: EiramFeatures) {
  let score = 0.30 * f.fear_score + 0.25 * f.humiliation_score +
    0.20 * f.grievance_score + 0.25 * f.victimhood_score;
  score = Math.min(1.0, Math.round(score * 10000) / 10000);
  const label = score >= 0.8 ? "severe vulnerability" : score >= 0.6 ? "high vulnerability" : score >= 0.35 ? "moderate vulnerability" : "low vulnerability";
  return { score, label, rationale: `fear=${f.fear_score}, humiliation=${f.humiliation_score}, grievance=${f.grievance_score}, victimhood=${f.victimhood_score}` };
}

// ── Module: ECS (Escalation Classification System) ──
function analyzeECS(f: EiramFeatures) {
  let activeSignals = 0;
  for (const key of ["anger_score","threat_score","urgency_score","dehumanization_score","revenge_score"] as const) {
    if ((f as any)[key] >= 0.25) activeSignals++;
  }
  let coBonus = 0;
  if (activeSignals >= 3) coBonus += 0.1;
  if (f.escalation_phrase_hits >= 1) coBonus += 0.15;
  let score = 0.20 * f.anger_score + 0.20 * f.threat_score + 0.20 * f.urgency_score +
    0.20 * f.dehumanization_score + 0.20 * f.revenge_score + coBonus;
  score = Math.min(1.0, Math.round(score * 10000) / 10000);
  const label = score >= 0.8 ? "acute escalation" : score >= 0.6 ? "high escalation" : score >= 0.35 ? "moderate escalation" : "low escalation";
  return { score, label, rationale: `anger=${f.anger_score}, threat=${f.threat_score}, urgency=${f.urgency_score}, dehumanization=${f.dehumanization_score}, revenge=${f.revenge_score}, bonus=${coBonus}` };
}

// ── Module: EEM (Epistemic Elasticity Metric) ──
function analyzeEEM(f: EiramFeatures) {
  const score = Math.min(1.0, Math.round(f.rigidity_score * 10000) / 10000);
  const label = score >= 0.75 ? "rigid" : score >= 0.4 ? "mixed" : "adaptive";
  return { score, label, rationale: `rigidity=${f.rigidity_score}, entropy=${f.narrative_entropy_score}` };
}

// ── Module: PFM (Predictive Forecast Module) ──
function analyzePFM(f: EiramFeatures) {
  let score = 0.25 * f.identity_fusion_score + 0.20 * f.grievance_score +
    0.20 * f.volatility_score + 0.15 * f.threat_score + 0.20 * f.rigidity_score;
  score = Math.min(1.0, Math.round(score * 10000) / 10000);
  const label = score >= 0.85 ? "acute hardening" : score >= 0.65 ? "hardening" : score >= 0.4 ? "unstable" : "stabilizing";
  return { score, label, rationale: `identity_fusion=${f.identity_fusion_score}, grievance=${f.grievance_score}, volatility=${f.volatility_score}, threat=${f.threat_score}, rigidity=${f.rigidity_score}` };
}

// ── Aggregation ──

export interface EiramResult {
  summary: string;
  module_scores: Record<string, { score: number; label: string; rationale: string }>;
  extracted_features: Record<string, number>;
  risk_vector: {
    overall_risk: number;
    ideological_lock: number;
    emotional_destabilization: number;
    escalation_risk: number;
    rigidity: number;
    forecast_hardening: number;
  };
  evidence: string[];
  forecast: string;
}

export function runEiram(text: string): EiramResult {
  const features = extractFeatures(text);
  const iri = analyzeIRI(features);
  const vdm = analyzeVDM(features);
  const ecs = analyzeECS(features);
  const eem = analyzeEEM(features);
  const pfm = analyzePFM(features);

  const overall_risk = Math.round((iri.score + vdm.score + ecs.score + pfm.score) / 4 * 10000) / 10000;

  let summary: string, forecast: string;
  if (overall_risk >= 0.8) {
    summary = "High risk profile with strong ideological lock, emotional destabilization, and escalation signals.";
    forecast = "Subject appears likely to harden further without interruption or countervailing social pressure.";
  } else if (overall_risk >= 0.6) {
    summary = "Elevated risk profile with notable grievance, rigidity, and directional hardening.";
    forecast = "Subject may continue moving toward more rigid and adversarial framing.";
  } else if (overall_risk >= 0.35) {
    summary = "Moderate risk profile with some ideological and emotional volatility.";
    forecast = "Subject may stabilize or harden depending on reinforcement, grievance exposure, and group identity cues.";
  } else {
    summary = "Low to moderate risk profile with limited signs of ideological lock.";
    forecast = "Subject currently appears more stable than hardened.";
  }

  let evidence = features.evidence_candidates;
  if (evidence.length === 0) {
    const backup: string[] = [];
    const textLower = text.toLowerCase();
    for (const phrase of ["betrayed","fight back","enemy","stolen","traitor","destroy","make them pay"]) {
      if (textLower.includes(phrase)) backup.push(`Detected phrase: ${phrase}`);
    }
    evidence = backup.slice(0, 5);
  }

  const { evidence_candidates, sentence_count, token_count, ...featureScores } = features;

  return {
    summary,
    module_scores: { iri, vdm, ecs, eem, pfm },
    extracted_features: featureScores as unknown as Record<string, number>,
    risk_vector: {
      overall_risk,
      ideological_lock: iri.score,
      emotional_destabilization: vdm.score,
      escalation_risk: ecs.score,
      rigidity: eem.score,
      forecast_hardening: pfm.score,
    },
    evidence,
    forecast,
  };
}
