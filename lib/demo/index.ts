import fixture from "./fixture.json";
import type {
  DetectedObject,
  Inspiration,
  ProductCandidate,
  RoomObjects,
  SearchPlan
} from "@/lib/types";

export type StoreStatus = {
  retailer: string;
  ok: boolean;
  error?: string;
  resultCount: number;
  manualSearchUrl?: string;
};

export type DemoFixture = {
  roomObjects: RoomObjects;
  inspiration: Inspiration;
  selectedObject: DetectedObject;
  searchPlan: SearchPlan;
  results: ProductCandidate[];
  statuses: StoreStatus[];
};

// Seed/captured demo session used by the client-side "Try the demo" button.
// No API calls, no OpenAI key, no Playwright — safe to run on any static host.
export const demoFixture = fixture as unknown as DemoFixture;

// Toggle for the dev-only capture button (see README "Regenerating the demo fixture").
export const demoCaptureEnabled =
  process.env.NEXT_PUBLIC_ENABLE_DEMO_CAPTURE === "1";
