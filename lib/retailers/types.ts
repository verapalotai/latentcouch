import type { ProductCandidate } from "@/lib/types";

export type RetailerSearchResult = {
  candidates: ProductCandidate[];
  error?: string;
  manualSearchUrl?: string;
};

export type RetailerSearchInput = {
  query: string;
  objectLabel: string;
  objectCategory: string;
  broadQuery: string;
};

export interface RetailerAdapter {
  name: string;
  displayName: string;
  search(input: RetailerSearchInput): Promise<RetailerSearchResult>;
}
