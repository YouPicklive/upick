/**
 * Client-side category validation rules — mirrors the edge function's _shared/category-rules.ts
 * Used as a safety net to double-check results before displaying.
 */

// ── Category Rules ────────────────────────────────────────────────────

interface CategoryRule {
  excludedKeywords: string[];
  excludedCategories: Set<string>;
}

const CLIENT_CATEGORY_RULES: Record<string, CategoryRule> = {
  food: {
    excludedKeywords: [
      "staffing", "plumbing", "contractor", "industrial", "warehouse",
      "insurance", "attorney", "hvac", "recruiting", "audio visual",
    ],
    excludedCategories: new Set([
      "wellness", "shopping", "event",
    ]),
  },
  drinks: {
    excludedKeywords: [
      "staffing", "plumbing", "contractor", "industrial", "warehouse",
      "insurance", "attorney", "hvac", "recruiting",
    ],
    excludedCategories: new Set([
      "wellness", "shopping",
    ]),
  },
  activity: {
    excludedKeywords: [
      "staffing", "plumbing", "contractor", "industrial", "warehouse",
      "audio visual", "audiovisual", "event production", "equipment rental",
      "insurance", "attorney", "hvac",
    ],
    excludedCategories: new Set(["wellness", "shopping"]),
  },
  services: {
    excludedKeywords: [
      "staffing", "event", "catering", "coordinator", "security", "rental",
      "audiovisual", "dj", "venue", "plumbing", "hvac", "commercial",
      "industrial", "contractor", "recruiting", "employment",
    ],
    excludedCategories: new Set(["shopping", "event"]),
  },
  shopping: {
    excludedKeywords: [
      "plumbing", "hvac", "contractor", "roofing", "electric", "landscaping",
      "pest control", "auto repair", "insurance", "attorney", "dental",
      "medical", "clinic", "pharmacy", "cvs", "walgreens",
    ],
    excludedCategories: new Set(["wellness"]),
  },
  events: {
    excludedKeywords: [
      "staffing", "plumbing", "contractor", "industrial", "equipment rental",
      "audio visual", "audiovisual", "production company",
    ],
    excludedCategories: new Set([]),
  },
  surprise: {
    excludedKeywords: [
      "plumbing", "hvac", "contractor", "industrial", "warehouse",
      "staffing", "recruiting", "insurance", "attorney",
      "audio visual", "audiovisual", "production company",
    ],
    excludedCategories: new Set([]),
  },
};

export interface SpotLike {
  name: string;
  category: string;
  description?: string;
  tags?: string[];
}

/**
 * Client-side validation: checks if a spot is valid for the given intent.
 * This is a safety net — primary filtering happens server-side.
 */
export function isValidSpotForIntent(spot: SpotLike, intent: string | null): boolean {
  const effectiveIntent = intent || "surprise";
  const rules = CLIENT_CATEGORY_RULES[effectiveIntent] || CLIENT_CATEGORY_RULES.surprise;

  const textLower = `${spot.name} ${spot.description || ""}`.toLowerCase();

  // Check excluded keywords
  for (const kw of rules.excludedKeywords) {
    if (textLower.includes(kw)) return false;
  }

  return true;
}
