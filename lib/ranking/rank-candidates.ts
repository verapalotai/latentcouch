import type { ProductCandidate, SearchPlan } from "@/lib/types";
import { expandSearchTerms, getCategoryDescriptor } from "@/lib/shopping-taxonomy";
import { clamp, normalizeWhitespace, uniqueStrings } from "@/lib/utils";

function normalizeForSearch(value: string) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function overlapScore(terms: string[], haystack: string) {
  if (!terms.length) return 0;
  const normalizedHaystack = normalizeForSearch(haystack);
  const hits = uniqueStrings(terms).filter((term) =>
    normalizedHaystack.includes(normalizeForSearch(term))
  ).length;
  return hits / terms.length;
}

function tokenize(value: string) {
  return uniqueStrings(
    normalizeForSearch(value)
      .split(/[^a-z0-9]+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 1)
  );
}

function tokenCoverage(terms: string[], haystack: string) {
  if (!terms.length) return 0;
  const haystackTokens = new Set(tokenize(haystack));
  const termTokens = uniqueStrings(terms.flatMap((term) => tokenize(term)));
  if (!termTokens.length) return 0;

  const hits = termTokens.filter((token) => haystackTokens.has(token)).length;
  return hits / termTokens.length;
}

function scoreSignal(terms: string[], haystack: string) {
  return Math.max(overlapScore(terms, haystack), tokenCoverage(terms, haystack));
}

function scoreCandidateLexically(plan: SearchPlan, candidate: ProductCandidate) {
  const descriptor = getCategoryDescriptor(plan.objectCategory as never);
  const objectTerms = expandSearchTerms([plan.objectLabel, plan.broadQuery]);
  const categoryTerms = expandSearchTerms(descriptor.expectedTerms);
  const forbiddenTerms = expandSearchTerms(descriptor.forbiddenTerms);
  const expandedMustHave = expandSearchTerms(plan.mustHave);
  const expandedNiceToHave = expandSearchTerms(plan.niceToHave);
  const expandedAvoid = expandSearchTerms(plan.avoid);
  const roomCueTerms = expandSearchTerms([
    plan.roomContext,
    plan.roomContext === "living_room" ? "nappali" : "",
    plan.roomContext === "dining_room" ? "étkező" : "",
    plan.roomContext === "bedroom" ? "hálószoba" : "",
    plan.roomContext === "bathroom" ? "fürdőszoba" : "",
    plan.roomContext === "kitchen" ? "konyha" : ""
  ]);

  const titleText = normalizeForSearch(candidate.title);
  const bodyText = normalizeForSearch(
    [candidate.rawText, ...candidate.extractedAttributes].filter(Boolean).join(" ")
  );
  const combinedText = [candidate.title, candidate.rawText, ...candidate.extractedAttributes]
    .filter(Boolean)
    .join(" ");

  const titleCategory = scoreSignal(categoryTerms, titleText);
  const bodyCategory = scoreSignal(categoryTerms, bodyText);
  const objectCoverage = scoreSignal(objectTerms, combinedText);
  const must = scoreSignal(expandedMustHave, combinedText);
  const nice = scoreSignal(expandedNiceToHave, combinedText);
  const avoid = scoreSignal(expandedAvoid, combinedText);
  const categoryMismatch = scoreSignal(forbiddenTerms, combinedText);
  const roomCue = scoreSignal(roomCueTerms, combinedText);
  const hasImage = candidate.imageUrl ? 1 : 0;
  const hasPrice = candidate.priceValue ? 1 : 0;

  const lexical = clamp(
    candidate.confidence * 0.08 +
      titleCategory * 0.28 +
      bodyCategory * 0.14 +
      objectCoverage * 0.18 +
      must * 0.16 +
      nice * 0.06 +
      roomCue * 0.04 +
      hasImage * 0.02 +
      hasPrice * 0.02 -
      avoid * 0.14 -
      categoryMismatch * 0.34
  );

  const matchReasons = [
    titleCategory >= 0.25 ? "Title matches the target product category" : "",
    objectCoverage >= 0.25 ? `Tracks the selected object language for ${plan.objectLabel}` : "",
    must >= 0.25 ? `Matches ${Math.round(must * 100)}% of must-have cues` : "",
    nice >= 0.2 ? `Picks up inspiration cues like ${plan.niceToHave.slice(0, 2).join(", ")}` : "",
    roomCue >= 0.2 ? `Looks aligned with ${plan.roomContext.replace("_", " ")} use` : "",
    bodyCategory > 0.2 && titleCategory < 0.2 ? "Body text supports the category fit" : "",
    categoryMismatch > 0.25 ? `Looks off-category for ${plan.objectLabel}` : "",
    avoid > 0.25 ? "Contains some avoid terms" : ""
  ].filter(Boolean);

  return {
    ...candidate,
    confidence: Number(lexical.toFixed(3)),
    matchReasons: uniqueStrings([...candidate.matchReasons, ...matchReasons]).slice(0, 3),
    scoreBreakdown: {
      ...candidate.scoreBreakdown,
      lexical: Number(lexical.toFixed(3)),
      final: Number(lexical.toFixed(3))
    }
  } satisfies ProductCandidate;
}

export function scoreCandidatesLexically(plan: SearchPlan, candidates: ProductCandidate[]) {
  return [...candidates]
    .map((candidate) => scoreCandidateLexically(plan, candidate))
    .sort((left, right) => right.confidence - left.confidence);
}

export function rankCandidates(plan: SearchPlan, candidates: ProductCandidate[]) {
  return scoreCandidatesLexically(plan, candidates).filter((candidate) => candidate.confidence >= 0.18);
}
