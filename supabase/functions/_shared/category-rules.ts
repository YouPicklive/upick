/**
 * ── CATEGORY_RULES + PREFERENCE_RULES ──
 * Single source of truth for all search validation across YouPick.
 * Used by search-places edge function and mirrored client-side.
 */

// ── Category Rule Definitions ─────────────────────────────────────────

export interface CategoryRule {
  allowedTypes: Set<string>;
  requiredKeywords: string[];
  excludedKeywords: string[];
  excludedTypes: Set<string>;
  fallbackAllowedTypes: Set<string>;
}

export const CATEGORY_RULES: Record<string, CategoryRule> = {
  services: {
    // "services" is the internal intent name for Wellness
    allowedTypes: new Set([
      "spa", "massage", "gym", "yoga_studio", "beauty_salon", "hair_care",
      "physiotherapist", "chiropractor", "health",
    ]),
    requiredKeywords: [
      "spa", "massage", "yoga", "pilates", "wellness", "fitness", "sauna",
      "facial", "meditation", "chiropractic", "acupuncture", "gym", "health",
      "beauty", "skincare", "reiki", "stretch", "float",
    ],
    excludedKeywords: [
      "staffing", "event", "catering", "coordinator", "security", "rental",
      "audiovisual", "dj", "venue", "plumbing", "hvac", "commercial",
      "industrial", "contractor", "recruiting", "employment", "insurance",
      "attorney", "accounting", "tax", "notary", "auto repair",
    ],
    excludedTypes: new Set([
      "plumber", "electrician", "roofing_contractor", "general_contractor",
      "locksmith", "moving_company", "storage", "car_repair", "car_wash",
      "gas_station", "atm", "bank", "post_office", "courthouse",
      "fire_station", "police", "funeral_home", "laundry", "car_dealer",
      "real_estate_agency", "travel_agency", "insurance_agency", "lawyer",
      "accounting", "electronics_store",
    ]),
    fallbackAllowedTypes: new Set(["health", "beauty_salon", "gym"]),
  },

  food: {
    allowedTypes: new Set([
      "restaurant", "cafe", "bakery", "meal_takeaway", "meal_delivery",
    ]),
    requiredKeywords: [
      "restaurant", "cafe", "bakery", "brunch", "dinner", "lunch", "tacos",
      "pizza", "noodles", "sushi", "ramen", "bistro", "eatery", "grill",
      "kitchen", "diner", "bbq", "seafood", "steakhouse", "buffet",
      "pho", "thai", "mexican", "italian", "chinese", "indian", "burger",
      "sandwich", "wings", "food",
    ],
    excludedKeywords: [
      "staffing", "plumbing", "contractor", "industrial", "warehouse",
      "insurance", "attorney", "hvac", "recruiting",
    ],
    excludedTypes: new Set([
      "plumber", "electrician", "general_contractor", "locksmith",
      "moving_company", "storage", "car_repair", "gas_station",
      "insurance_agency", "lawyer",
    ]),
    fallbackAllowedTypes: new Set(["cafe", "bakery"]),
  },

  drinks: {
    allowedTypes: new Set([
      "bar", "brewery", "wine_bar", "cocktail_bar", "night_club",
    ]),
    requiredKeywords: [
      "bar", "brewery", "cocktail", "taproom", "pub", "wine", "lounge",
      "tavern", "saloon", "beer", "ale", "spirits", "distillery",
    ],
    excludedKeywords: [
      "staffing", "plumbing", "contractor", "industrial", "warehouse",
      "insurance", "attorney", "hvac", "recruiting",
    ],
    excludedTypes: new Set([
      "plumber", "electrician", "general_contractor", "locksmith",
      "moving_company", "storage", "car_repair", "gas_station",
      "insurance_agency", "lawyer", "bakery",
    ]),
    fallbackAllowedTypes: new Set(["bar", "brewery"]),
  },

  shopping: {
    allowedTypes: new Set([
      "store", "shopping_mall", "clothing_store", "shoe_store", "book_store",
      "home_goods_store", "furniture_store", "gift_shop", "jewelry_store",
      "department_store",
    ]),
    requiredKeywords: [
      "shop", "store", "boutique", "market", "book", "vintage", "decor",
      "clothing", "fashion", "gift", "antique", "thrift", "mall", "outlet",
      "retail",
    ],
    excludedKeywords: [
      "plumbing", "hvac", "contractor", "roofing", "electric", "landscaping",
      "pest control", "auto repair", "car wash", "insurance", "attorney",
      "dental", "medical", "clinic", "urgent care", "chiropractic",
      "storage unit", "dry cleaner", "laundromat", "tax service", "notary",
      "pharmacy", "cvs", "walgreens", "rite aid", "staffing", "industrial",
    ],
    excludedTypes: new Set([
      "plumber", "electrician", "roofing_contractor", "general_contractor",
      "locksmith", "moving_company", "storage", "car_repair", "car_wash",
      "gas_station", "convenience_store", "atm", "bank", "post_office",
      "courthouse", "fire_station", "police", "funeral_home", "laundry",
      "dry_cleaning", "car_dealer", "car_rental", "real_estate_agency",
      "travel_agency", "lodging", "pharmacy", "drugstore", "health",
      "hospital", "doctor", "dentist", "veterinary_care", "insurance_agency",
      "lawyer", "accounting",
    ]),
    fallbackAllowedTypes: new Set(["store", "home_goods_store", "gift_shop"]),
  },

  activity: {
    allowedTypes: new Set([
      "park", "tourist_attraction", "museum", "movie_theater", "bowling_alley",
      "amusement_center", "amusement_park", "hiking_area", "art_gallery",
      "zoo", "aquarium", "campground", "stadium",
    ]),
    requiredKeywords: [
      "park", "trail", "museum", "gallery", "bowling", "escape", "arcade",
      "garden", "walk", "tour", "zoo", "aquarium", "theater", "cinema",
      "trampoline", "climbing", "kayak", "pottery", "workshop", "golf",
      "mini golf", "laser tag", "go kart", "paintball", "adventure",
    ],
    excludedKeywords: [
      "staffing", "plumbing", "contractor", "industrial", "warehouse",
      "audio visual", "audiovisual", "av ", "event production",
      "event services", "lighting rental", "staging", "party rental",
      "equipment rental", "production company", "speaker rental",
      "projector", "truss", "insurance", "attorney", "hvac",
    ],
    excludedTypes: new Set([
      "electronics_store", "home_goods_store", "general_contractor",
      "storage", "moving_company", "car_rental", "plumber", "electrician",
      "roofing_contractor", "locksmith", "car_repair", "gas_station",
      "insurance_agency", "lawyer", "accounting",
    ]),
    fallbackAllowedTypes: new Set(["tourist_attraction", "park"]),
  },

  events: {
    allowedTypes: new Set([
      "concert_hall", "theater", "stadium", "event_venue", "night_club",
      "performing_arts_theater",
    ]),
    requiredKeywords: [
      "show", "concert", "festival", "live", "tour", "tonight", "today",
      "performance", "theater", "theatre", "comedy", "music", "dance",
      "exhibition", "event",
    ],
    excludedKeywords: [
      "staffing", "plumbing", "contractor", "industrial", "warehouse",
      "insurance", "attorney", "hvac", "recruiting", "equipment rental",
      "audio visual", "audiovisual", "production company",
    ],
    excludedTypes: new Set([
      "plumber", "electrician", "general_contractor", "locksmith",
      "moving_company", "storage", "car_repair", "gas_station",
      "insurance_agency", "lawyer",
    ]),
    fallbackAllowedTypes: new Set(["theater", "concert_hall"]),
  },

  surprise: {
    // Union of food + drinks + activity + shopping + services allowedTypes
    allowedTypes: new Set([
      // food
      "restaurant", "cafe", "bakery", "meal_takeaway", "meal_delivery",
      // drinks
      "bar", "brewery", "wine_bar", "cocktail_bar", "night_club",
      // activity
      "park", "tourist_attraction", "museum", "movie_theater", "bowling_alley",
      "amusement_center", "amusement_park", "hiking_area", "art_gallery",
      "zoo", "aquarium", "campground", "stadium",
      // shopping
      "store", "shopping_mall", "clothing_store", "shoe_store", "book_store",
      "home_goods_store", "furniture_store", "gift_shop", "jewelry_store",
      "department_store",
      // wellness
      "spa", "massage", "gym", "yoga_studio", "beauty_salon", "health",
    ]),
    requiredKeywords: [], // no keyword requirement for surprise
    excludedKeywords: [
      "plumbing", "hvac", "contractor", "industrial", "warehouse",
      "staffing", "recruiting", "employment", "insurance", "attorney",
      "audio visual", "audiovisual", "production company", "equipment rental",
    ],
    excludedTypes: new Set([
      "plumber", "electrician", "roofing_contractor", "general_contractor",
      "locksmith", "moving_company", "storage", "car_repair", "car_wash",
      "gas_station", "insurance_agency", "lawyer", "accounting",
      "funeral_home", "courthouse", "fire_station", "police",
    ]),
    fallbackAllowedTypes: new Set(["restaurant", "bar", "tourist_attraction", "store"]),
  },
};

// ── Preference Rules ──────────────────────────────────────────────────

export interface PriceConstraint {
  minLevel: number;
  maxLevel: number;
  allowMissing: boolean; // if true, missing price_level is allowed but ranked lower
}

export const PRICE_CONSTRAINTS: Record<string, PriceConstraint> = {
  cheap: { minLevel: 0, maxLevel: 1, allowMissing: false },
  mid: { minLevel: 1, maxLevel: 2, allowMissing: true },
  treat: { minLevel: 2, maxLevel: 4, allowMissing: true },
};

// Outdoor-related types and keywords
export const OUTDOOR_TYPES = new Set([
  "park", "hiking_area", "tourist_attraction", "campground", "garden",
  "natural_feature", "stadium",
]);
export const OUTDOOR_KEYWORDS = [
  "patio", "rooftop", "outdoor seating", "beer garden", "terrace",
  "courtyard", "deck", "open air", "al fresco",
];

export const INDOOR_TYPES = new Set([
  "museum", "movie_theater", "bowling_alley", "amusement_center",
  "gym", "spa", "restaurant", "shopping_mall", "store", "bar",
  "night_club", "theater", "concert_hall",
]);

// ── Validation Pipeline ───────────────────────────────────────────────

export interface PlaceCandidate {
  place_id?: string;
  name: string;
  types: string[];
  price_level?: number | null;
  rating?: number;
  user_ratings_total?: number;
  vicinity?: string;
  formatted_address?: string;
  geometry?: { location?: { lat: number; lng: number } };
  photos?: any[];
  // internal
  _validationScore?: number;
  _rejectionReason?: string;
}

/**
 * Core validation: does this place belong in the given category?
 * Returns { valid, reason }
 */
export function isValidForCategory(
  place: PlaceCandidate,
  intent: string
): { valid: boolean; reason: string } {
  const rules = CATEGORY_RULES[intent] || CATEGORY_RULES.surprise;
  const types = place.types || [];
  const nameLower = (place.name || "").toLowerCase();
  const textLower = `${place.name || ""} ${place.vicinity || ""} ${place.formatted_address || ""}`.toLowerCase();

  // Check excluded types first (hard reject)
  for (const t of types) {
    if (rules.excludedTypes.has(t)) {
      return { valid: false, reason: `excluded_type:${t}` };
    }
  }

  // Check excluded keywords (hard reject)
  for (const kw of rules.excludedKeywords) {
    if (textLower.includes(kw)) {
      return { valid: false, reason: `excluded_keyword:${kw}` };
    }
  }

  // Must match at least ONE of: allowedTypes OR requiredKeywords
  const hasAllowedType = types.some(t => rules.allowedTypes.has(t));
  const hasRequiredKeyword = rules.requiredKeywords.length === 0 || // surprise has no requirement
    rules.requiredKeywords.some(kw => textLower.includes(kw));

  if (!hasAllowedType && !hasRequiredKeyword) {
    return { valid: false, reason: "no_type_or_keyword_match" };
  }

  // Special cases
  if (intent === "food") {
    // Reject pure bars (has bar type but no food type)
    const isBar = types.includes("bar") || types.includes("night_club");
    const hasFood = types.some(t => rules.allowedTypes.has(t));
    if (isBar && !hasFood) {
      return { valid: false, reason: "pure_bar_in_food" };
    }
  }

  if (intent === "drinks") {
    // Reject pure cafes (has cafe type but no bar/drinks type)
    const isCafe = types.includes("cafe") || types.includes("bakery");
    const hasDrinks = types.some(t => rules.allowedTypes.has(t));
    if (isCafe && !hasDrinks) {
      return { valid: false, reason: "pure_cafe_in_drinks" };
    }
  }

  return { valid: true, reason: "passed" };
}

/**
 * Apply preference constraints (price, indoor/outdoor, distance).
 * Returns { passes, rankBoost } where rankBoost adjusts ranking.
 */
export function applyPreferenceConstraints(
  place: PlaceCandidate,
  filters: string[],
  intent: string
): { passes: boolean; rankBoost: number } {
  let rankBoost = 0;

  // ── Price ──
  const priceFilter = filters.find(f => f === "cheap" || f === "mid" || f === "treat");
  if (priceFilter) {
    const constraint = PRICE_CONSTRAINTS[priceFilter];
    if (place.price_level !== undefined && place.price_level !== null) {
      if (place.price_level < constraint.minLevel || place.price_level > constraint.maxLevel) {
        return { passes: false, rankBoost: 0 };
      }
      rankBoost += 2; // exact match bonus
    } else {
      // Missing price level
      if (!constraint.allowMissing) {
        return { passes: false, rankBoost: 0 };
      }
      rankBoost -= 1; // rank lower
    }
  }

  // ── Indoor/Outdoor ──
  const types = place.types || [];
  const textLower = `${place.name || ""} ${place.vicinity || ""}`.toLowerCase();

  if (filters.includes("outdoor")) {
    const isOutdoor = types.some(t => OUTDOOR_TYPES.has(t)) ||
      OUTDOOR_KEYWORDS.some(kw => textLower.includes(kw));
    if (intent === "activity" && !isOutdoor) {
      return { passes: false, rankBoost: 0 }; // hard reject for Activity+outdoor
    }
    rankBoost += isOutdoor ? 3 : -2;
  }

  if (filters.includes("indoor")) {
    const isIndoor = types.some(t => INDOOR_TYPES.has(t)) ||
      !types.some(t => OUTDOOR_TYPES.has(t));
    if (intent === "activity" && !isIndoor) {
      return { passes: false, rankBoost: 0 }; // hard reject for Activity+indoor
    }
    rankBoost += isIndoor ? 2 : -1;
  }

  return { passes: true, rankBoost };
}

/**
 * Score a validated place for ranking.
 */
export function scorePlaceForRanking(
  place: PlaceCandidate,
  intent: string,
  preferenceBoost: number
): number {
  const rules = CATEGORY_RULES[intent] || CATEGORY_RULES.surprise;
  const types = place.types || [];
  const textLower = `${place.name || ""} ${place.vicinity || ""}`.toLowerCase();

  let score = 0;

  // Category match strength: type match > keyword match
  const typeMatch = types.some(t => rules.allowedTypes.has(t));
  const keywordMatch = rules.requiredKeywords.some(kw => textLower.includes(kw));
  if (typeMatch) score += 5;
  if (keywordMatch) score += 2;

  // Rating + review count
  score += (place.rating || 0) * 1;
  const reviewCount = place.user_ratings_total || 0;
  if (reviewCount > 100) score += 2;
  else if (reviewCount > 50) score += 1;

  // Preference boost
  score += preferenceBoost;

  return score;
}

/**
 * Full pipeline: validate → constrain → score → rank → return.
 * If too few results, applies safe widening within category.
 */
export function runFilterPipeline(
  candidates: PlaceCandidate[],
  intent: string,
  filters: string[],
  minResults: number = 8,
  shuffleWeight: number = 0 // 0 = no shuffle, higher = more random
): PlaceCandidate[] {
  // Step 1: Validate against category rules
  let validated: Array<PlaceCandidate & { _score: number }> = [];

  for (const place of candidates) {
    const { valid } = isValidForCategory(place, intent);
    if (!valid) continue;

    const { passes, rankBoost } = applyPreferenceConstraints(place, filters, intent);
    if (!passes) continue;

    const score = scorePlaceForRanking(place, intent, rankBoost);
    validated.push({ ...place, _score: score });
  }

  // Step 2: Safe widening if too few results
  if (validated.length < minResults) {
    const rules = CATEGORY_RULES[intent] || CATEGORY_RULES.surprise;

    // Pass 1: Try with fallback types (relaxed type matching, keep keyword exclusions)
    for (const place of candidates) {
      if (validated.some(v => v.place_id === place.place_id)) continue;

      const types = place.types || [];
      const textLower = `${place.name || ""} ${place.vicinity || ""} ${place.formatted_address || ""}`.toLowerCase();

      // Still enforce exclusions
      if (types.some(t => rules.excludedTypes.has(t))) continue;
      if (rules.excludedKeywords.some(kw => textLower.includes(kw))) continue;

      // Accept if matches fallback types
      const hasFallback = types.some(t => rules.fallbackAllowedTypes.has(t));
      if (!hasFallback) continue;

      const { passes, rankBoost } = applyPreferenceConstraints(place, filters, intent);
      if (!passes) continue;

      const score = scorePlaceForRanking(place, intent, rankBoost) - 2; // slight penalty
      validated.push({ ...place, _score: score });
    }
  }

  // Step 3: If STILL too few, relax required keywords but keep all exclusions
  if (validated.length < minResults) {
    for (const place of candidates) {
      if (validated.some(v => v.place_id === place.place_id)) continue;

      const types = place.types || [];
      const textLower = `${place.name || ""} ${place.vicinity || ""} ${place.formatted_address || ""}`.toLowerCase();

      // Still enforce exclusions (never relax these)
      if (types.some(t => CATEGORY_RULES[intent]?.excludedTypes.has(t))) continue;
      if (CATEGORY_RULES[intent]?.excludedKeywords.some(kw => textLower.includes(kw))) continue;

      // Accept any type match (allowed OR fallback)
      const rules = CATEGORY_RULES[intent] || CATEGORY_RULES.surprise;
      const anyTypeMatch = types.some(t => rules.allowedTypes.has(t) || rules.fallbackAllowedTypes.has(t));
      if (!anyTypeMatch) continue;

      // Relax preference constraints for widening
      const score = scorePlaceForRanking(place, intent, 0) - 4;
      validated.push({ ...place, _score: score });
    }
  }

  // Step 4: Rank
  validated.sort((a, b) => {
    const scoreDiff = b._score - a._score;
    if (shuffleWeight > 0) {
      return scoreDiff + (Math.random() - 0.5) * shuffleWeight;
    }
    return scoreDiff;
  });

  // Deduplicate
  const seen = new Set<string>();
  const deduped: PlaceCandidate[] = [];
  for (const place of validated) {
    const key = place.place_id || place.name;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(place);
  }

  return deduped;
}
