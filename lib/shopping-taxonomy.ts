import type { DetectedObject, Inspiration, SearchPlan } from "@/lib/types";
import { uniqueStrings } from "@/lib/utils";

export type CanonicalCategory =
  | "bathroom_vanity"
  | "bathroom_tall_cabinet"
  | "mirror"
  | "rug"
  | "sofa"
  | "coffee_table"
  | "dining_table"
  | "dining_chair"
  | "armchair"
  | "bar_stool"
  | "sideboard"
  | "shelving_unit"
  | "pendant_lamp"
  | "floor_lamp"
  | "table_lamp"
  | "bed"
  | "wardrobe"
  | "nightstand"
  | "laundry_basket"
  | "storage_cabinet"
  | "generic_furniture";

type CategoryDescriptor = {
  category: CanonicalCategory;
  roomContext: string;
  broadQuery: string;
  expectedTerms: string[];
  forbiddenTerms: string[];
};

const CATEGORY_MAP: Array<{
  category: CanonicalCategory;
  matchers: string[];
  roomContext: string;
  broadQuery: string;
  expectedTerms: string[];
  forbiddenTerms: string[];
}> = [
  {
    category: "bathroom_vanity",
    matchers: ["sink with cabinet", "sink cabinet", "vanity", "washbasin cabinet", "mosdó", "mosdószekrény"],
    roomContext: "bathroom",
    broadQuery: "fürdőszobai szekrény",
    expectedTerms: [
      "mosdó",
      "mosdószekrény",
      "mosdó alatti szekrény",
      "mosdókagyló alatti szekrény",
      "vanity",
      "washbasin",
      "basin cabinet",
      "fürdőszoba"
    ],
    forbiddenTerms: ["lámpa", "asztal", "étkezőasztal", "kanapé", "tükör", "szőnyeg"]
  },
  {
    category: "bathroom_tall_cabinet",
    matchers: ["tall cabinet", "bathroom cabinet", "magasszekrény"],
    roomContext: "bathroom",
    broadQuery: "fürdőszobai szekrény",
    expectedTerms: ["szekrény", "magasszekrény", "fürdőszoba", "storage cabinet"],
    forbiddenTerms: ["lámpa", "asztal", "mosdó", "tükör"]
  },
  {
    category: "mirror",
    matchers: ["mirror", "tükör"],
    roomContext: "general",
    broadQuery: "tükör",
    expectedTerms: ["tükör", "mirror"],
    forbiddenTerms: ["lámpa", "asztal", "szekrény", "kanapé"]
  },
  {
    category: "rug",
    matchers: ["rug", "bath mat", "szőnyeg", "mat"],
    roomContext: "general",
    broadQuery: "szőnyeg",
    expectedTerms: ["szőnyeg", "rug", "bath mat", "futószőnyeg"],
    forbiddenTerms: ["asztal", "lámpa", "szekrény", "kanapé"]
  },
  {
    category: "sofa",
    matchers: ["sofa", "couch", "kanapé"],
    roomContext: "living_room",
    broadQuery: "kanapé",
    expectedTerms: ["kanapé", "ülőgarnitúra", "sofa", "couch"],
    forbiddenTerms: ["asztal", "lámpa", "szőnyeg", "ágy"]
  },
  {
    category: "coffee_table",
    matchers: ["coffee table", "dohányzóasztal"],
    roomContext: "living_room",
    broadQuery: "dohányzóasztal",
    expectedTerms: ["dohányzóasztal", "coffee table", "kisasztal"],
    forbiddenTerms: ["étkezőasztal", "dining table", "lámpa", "kanapé"]
  },
  {
    category: "dining_table",
    matchers: ["dining table", "étkezőasztal"],
    roomContext: "dining_room",
    broadQuery: "étkezőasztal",
    expectedTerms: ["étkezőasztal", "dining table", "asztal"],
    forbiddenTerms: ["dohányzóasztal", "lámpa", "kanapé", "szék"]
  },
  {
    category: "dining_chair",
    matchers: ["dining chair", "étkezőszék", "chair"],
    roomContext: "dining_room",
    broadQuery: "étkezőszék",
    expectedTerms: ["étkezőszék", "szék", "dining chair"],
    forbiddenTerms: ["kanapé", "asztal", "bárszék", "lámpa"]
  },
  {
    category: "armchair",
    matchers: ["armchair", "fotel"],
    roomContext: "living_room",
    broadQuery: "fotel",
    expectedTerms: ["fotel", "armchair", "accent chair"],
    forbiddenTerms: ["kanapé", "asztal", "lámpa"]
  },
  {
    category: "bar_stool",
    matchers: ["bar stool", "bárszék", "stool"],
    roomContext: "kitchen",
    broadQuery: "bárszék",
    expectedTerms: ["bárszék", "bar stool", "stool"],
    forbiddenTerms: ["étkezőszék", "asztal", "kanapé"]
  },
  {
    category: "sideboard",
    matchers: ["sideboard", "credenza", "tálalószekrény"],
    roomContext: "dining_room",
    broadQuery: "tálalószekrény",
    expectedTerms: ["tálalószekrény", "sideboard", "komód", "credenza"],
    forbiddenTerms: ["asztal", "kanapé", "lámpa"]
  },
  {
    category: "shelving_unit",
    matchers: ["shelving unit", "bookshelf", "bookcase", "polc"],
    roomContext: "general",
    broadQuery: "polc",
    expectedTerms: ["polc", "shelving", "bookcase", "bookshelf"],
    forbiddenTerms: ["asztal", "lámpa", "kanapé"]
  },
  {
    category: "pendant_lamp",
    matchers: ["pendant lamp", "függőlámpa"],
    roomContext: "general",
    broadQuery: "függőlámpa",
    expectedTerms: ["függőlámpa", "pendant lamp", "ceiling lamp"],
    forbiddenTerms: ["asztali lámpa", "table lamp", "floor lamp", "asztal"]
  },
  {
    category: "floor_lamp",
    matchers: ["floor lamp", "állólámpa"],
    roomContext: "general",
    broadQuery: "állólámpa",
    expectedTerms: ["állólámpa", "floor lamp"],
    forbiddenTerms: ["asztali lámpa", "függőlámpa", "asztal"]
  },
  {
    category: "table_lamp",
    matchers: ["table lamp", "asztali lámpa"],
    roomContext: "general",
    broadQuery: "asztali lámpa",
    expectedTerms: ["asztali lámpa", "table lamp", "lámpa"],
    forbiddenTerms: ["függőlámpa", "állólámpa", "asztal"]
  },
  {
    category: "bed",
    matchers: ["bed", "ágy"],
    roomContext: "bedroom",
    broadQuery: "ágy",
    expectedTerms: ["ágy", "bed", "daybed"],
    forbiddenTerms: ["kanapé", "asztal", "lámpa"]
  },
  {
    category: "wardrobe",
    matchers: ["wardrobe", "closet", "gardrób"],
    roomContext: "bedroom",
    broadQuery: "gardróbszekrény",
    expectedTerms: ["gardróbszekrény", "wardrobe", "closet", "szekrény"],
    forbiddenTerms: ["komód", "asztal", "ágy"]
  },
  {
    category: "nightstand",
    matchers: ["nightstand", "bedside table", "éjjeliszekrény"],
    roomContext: "bedroom",
    broadQuery: "éjjeliszekrény",
    expectedTerms: ["éjjeliszekrény", "nightstand", "bedside"],
    forbiddenTerms: ["dohányzóasztal", "étkezőasztal", "lámpa"]
  },
  {
    category: "laundry_basket",
    matchers: ["laundry basket", "hamper", "szennyeskosár"],
    roomContext: "bathroom",
    broadQuery: "szennyeskosár",
    expectedTerms: ["szennyeskosár", "laundry basket", "hamper", "kosár"],
    forbiddenTerms: ["szekrény", "lámpa", "asztal"]
  },
  {
    category: "storage_cabinet",
    matchers: ["cabinet", "storage cabinet", "szekrény"],
    roomContext: "general",
    broadQuery: "szekrény",
    expectedTerms: ["szekrény", "cabinet", "storage cabinet"],
    forbiddenTerms: ["lámpa", "asztal", "szőnyeg"]
  }
];

const TRANSLATION_MAP: Record<string, string[]> = {
  white: ["fehér"],
  black: ["fekete"],
  beige: ["bézs"],
  brown: ["barna"],
  grey: ["szürke", "szürkés", "antracit"],
  gray: ["szürke", "szürkés", "antracit"],
  green: ["zöld"],
  blue: ["kék"],
  oak: ["tölgy", "tölgyfa"],
  wood: ["fa", "fa dekor", "fahatású", "tölgyfa"],
  metal: ["fém"],
  glass: ["üveg"],
  fabric: ["szövet", "textil"],
  linen: ["len"],
  boucle: ["buklé"],
  round: ["kerek"],
  rectangular: ["téglalap", "téglalap alakú"],
  minimal: ["minimalista"],
  modern: ["modern"],
  floating: ["lebegő", "fali"],
  wall: ["fali"]
};

export function getCategoryDescriptor(category: CanonicalCategory): CategoryDescriptor {
  const match = CATEGORY_MAP.find((entry) => entry.category === category);
  return (
    match || {
      category: "generic_furniture",
      roomContext: "general",
      broadQuery: "bútor",
      expectedTerms: ["bútor"],
      forbiddenTerms: ["lámpa"]
    }
  );
}

export function inferCategoryFromObject(object: Pick<DetectedObject, "label" | "attributes" | "notes">) {
  const searchText = [
    object.label,
    ...object.attributes.materials,
    ...object.attributes.shapes,
    ...object.attributes.styleHints,
    ...object.notes
  ]
    .join(" ")
    .toLowerCase();

  const match = CATEGORY_MAP.find((entry) =>
    entry.matchers.some((matcher) => searchText.includes(matcher.toLowerCase()))
  );

  return getCategoryDescriptor(match?.category || "generic_furniture");
}

export function expandSearchTerms(values: string[]) {
  const expanded = values.flatMap((value) => {
    const phrase = value.toLowerCase().trim();
    const tokens = phrase
      .split(/[\s,/()-]+/)
      .map((token) => token.trim())
      .filter(Boolean);

    return uniqueStrings([
      value,
      phrase,
      ...(TRANSLATION_MAP[phrase] || []),
      ...tokens,
      ...tokens.flatMap((token) => TRANSLATION_MAP[token] || [])
    ]);
  });

  return uniqueStrings(expanded);
}

// Only the Hungarian translations for a set of English cues, used to show shoppers
// which localized terms we search regional stores (Bonami, Möbelix, XXXLutz) with.
export function toLocalizedKeywords(values: string[]) {
  const hungarian = values.flatMap((value) => {
    const phrase = value.toLowerCase().trim();
    const tokens = phrase
      .split(/[\s,/()-]+/)
      .map((token) => token.trim())
      .filter(Boolean);

    return [
      ...(TRANSLATION_MAP[phrase] || []),
      ...tokens.flatMap((token) => TRANSLATION_MAP[token] || [])
    ];
  });

  return uniqueStrings(hungarian);
}

// Every Hungarian term the taxonomy can emit (translation values + no-accent
// category words that the diacritic check below would miss).
const LOCALIZED_TERMS = new Set<string>([
  ...Object.values(TRANSLATION_MAP).flat().map((term) => term.toLowerCase()),
  "asztal",
  "kanape",
  "szonyeg"
]);

// Terms that read identically in both languages — keep them in the English sections.
const SHARED_TERMS = new Set<string>(["modern"]);

// True when a keyword is a Hungarian/localized term rather than an original English cue.
export function isLocalizedKeyword(term: string): boolean {
  const value = term.toLowerCase().trim();
  if (SHARED_TERMS.has(value)) return false;
  if (LOCALIZED_TERMS.has(value)) return true;
  return /[áéíóöőúüű]/.test(value);
}

// Split a keyword list into its original (English) cues and its localized (Hungarian) ones.
export function partitionKeywords(values: string[]) {
  const original: string[] = [];
  const localized: string[] = [];
  for (const value of values) {
    (isLocalizedKeyword(value) ? localized : original).push(value);
  }
  return { original: uniqueStrings(original), localized: uniqueStrings(localized) };
}

export function buildLocalSearchPlan(
  selectedObject: DetectedObject,
  inspiration: Inspiration,
  retailers: string[]
): SearchPlan {
  const descriptor = inferCategoryFromObject(selectedObject);
  const broadQuery = descriptor.broadQuery;
  const translatedObjectTerms = expandSearchTerms([selectedObject.label]);
  const translatedSizeHint = expandSearchTerms([selectedObject.attributes.sizeHint]);
  const translatedInspirationColors = expandSearchTerms(inspiration.colorPalette);
  const translatedInspirationMaterials = expandSearchTerms(inspiration.materials);
  const translatedStyles = expandSearchTerms([
    ...inspiration.styleKeywords,
    ...inspiration.vibeNotes
  ]);
  const translatedInspirationShapes = expandSearchTerms(inspiration.shapeKeywords);
  const mustHave = uniqueStrings([
    ...translatedObjectTerms.slice(0, 3),
    ...descriptor.expectedTerms.slice(0, 3),
    ...translatedInspirationColors.slice(0, 2),
    ...translatedInspirationMaterials.slice(0, 2),
    ...translatedInspirationShapes.slice(0, 2)
  ]).slice(0, 8);
  const niceToHave = uniqueStrings([
    ...translatedStyles.slice(0, 4),
    ...translatedInspirationMaterials.slice(0, 2),
    ...translatedInspirationColors.slice(0, 2),
    ...translatedInspirationShapes.slice(0, 2),
    ...translatedSizeHint.slice(0, 1)
  ]).slice(0, 8);
  const avoid = uniqueStrings([
    ...descriptor.forbiddenTerms,
    ...expandSearchTerms(inspiration.avoidKeywords)
  ]).slice(0, 8);

  return {
    objectLabel: selectedObject.label,
    objectCategory: descriptor.category,
    broadQuery,
    roomContext: descriptor.roomContext,
    mustHave,
    niceToHave,
    avoid,
    queryRationale: `Use the current room photo to identify the object type, then search broadly for ${broadQuery} and rank results using the inspiration images for color, material, shape, and style direction.`,
    retailerQueries: retailers.map((retailer) => ({
      retailer: retailer as SearchPlan["retailerQueries"][number]["retailer"],
      query: broadQuery
    }))
  };
}

export function getRetailerManualSearchUrl(retailer: string, objectCategory: CanonicalCategory, broadQuery: string) {
  const query = encodeURIComponent(broadQuery);

  switch (retailer) {
    case "ikea":
      return `https://www.ikea.com/hu/hu/search/?q=${query}`;
    case "bonami":
      return objectCategory === "bathroom_vanity" || objectCategory === "bathroom_tall_cabinet"
        ? "https://www.bonami.hu/c/mosdo-alatti-szekrenyek"
        : `https://www.bonami.hu/search?q=${query}`;
    case "beliani":
      return `https://www.beliani.hu/search/?query=${query}`;
    case "xxxlutz":
      return `https://www.xxxlutz.hu/search?query=${query}`;
    case "momax":
      return `https://www.moemax.hu/kereses?query=${query}`;
    case "mobelix":
      return `https://www.moebelix.hu/kereses?query=${query}`;
    case "jysk":
      return `https://jysk.hu/search?query=${query}`;
    default:
      return `https://www.google.com/search?q=${query}`;
  }
}
