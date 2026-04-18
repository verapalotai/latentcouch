import type { RetailerAdapter } from "./types";
import { getRetailerManualSearchUrl } from "@/lib/shopping-taxonomy";

export const mobelixAdapter: RetailerAdapter = {
  name: "mobelix",
  displayName: "Möbelix",
  async search(input) {
    return {
      candidates: [],
      error: "Möbelix is challenge-gating automated scraping right now. Open the store search.",
      manualSearchUrl: getRetailerManualSearchUrl("mobelix", input.objectCategory as never, input.broadQuery)
    };
  }
};
