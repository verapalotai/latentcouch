import { z } from "zod";

export const DetectedObjectSchema = z.object({
  id: z.string(),
  label: z.string(),
  confidence: z.number().min(0).max(1),
  attributes: z.object({
    colors: z.array(z.string()),
    materials: z.array(z.string()),
    shapes: z.array(z.string()),
    styleHints: z.array(z.string()),
    sizeHint: z.string()
  }),
  notes: z.array(z.string())
});

export const RoomObjectsSchema = z.object({
  roomType: z.string(),
  summary: z.string(),
  objects: z.array(DetectedObjectSchema)
});

export const InspirationSchema = z.object({
  styleKeywords: z.array(z.string()),
  colorPalette: z.array(z.string()),
  materials: z.array(z.string()),
  shapeKeywords: z.array(z.string()),
  vibeNotes: z.array(z.string()),
  avoidKeywords: z.array(z.string()),
  shoppingSummary: z.string()
});

export const RetailerQuerySchema = z.object({
  retailer: z.enum(["ikea", "bonami", "beliani", "xxxlutz", "momax", "mobelix", "jysk"]),
  query: z.string()
});

export const SearchPlanSchema = z.object({
  objectLabel: z.string(),
  objectCategory: z.string(),
  broadQuery: z.string(),
  roomContext: z.string(),
  mustHave: z.array(z.string()),
  niceToHave: z.array(z.string()),
  avoid: z.array(z.string()),
  queryRationale: z.string(),
  retailerQueries: z.array(RetailerQuerySchema)
});

export const ProductCandidateSchema = z.object({
  retailer: z.string(),
  title: z.string(),
  priceText: z.string(),
  priceValue: z.number().nullable(),
  currency: z.string(),
  url: z.string().url(),
  imageUrl: z.string().url().nullable(),
  extractedAttributes: z.array(z.string()),
  matchReasons: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  rawText: z.string(),
  scoreBreakdown: z
    .object({
      lexical: z.number().min(0).max(1).optional(),
      embedding: z.number().min(0).max(1).optional(),
      llm: z.number().min(0).max(1).optional(),
      final: z.number().min(0).max(1).optional()
    })
    .optional()
});

export const ProductSearchResponseSchema = z.object({
  results: z.array(ProductCandidateSchema),
  storeStatuses: z.array(
    z.object({
      retailer: z.string(),
      ok: z.boolean(),
      error: z.string().optional(),
      resultCount: z.number(),
      manualSearchUrl: z.string().url().optional()
    })
  )
});

export type DetectedObject = z.infer<typeof DetectedObjectSchema>;
export type RoomObjects = z.infer<typeof RoomObjectsSchema>;
export type Inspiration = z.infer<typeof InspirationSchema>;
export type SearchPlan = z.infer<typeof SearchPlanSchema>;
export type ProductCandidate = z.infer<typeof ProductCandidateSchema>;
export type ProductSearchResponse = z.infer<typeof ProductSearchResponseSchema>;

export type ImageInput = {
  mimeType: string;
  dataBase64: string;
};
