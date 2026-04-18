import type { RetailerAdapter } from "./types";
import { getRetailerManualSearchUrl } from "@/lib/shopping-taxonomy";

export const momaxAdapter: RetailerAdapter = {
  name: "momax",
  displayName: "Mömax",
  async search(input) {
    return {
      candidates: [],
      error: "Mömax is challenge-gating automated scraping right now. Open the store search.",
      manualSearchUrl: getRetailerManualSearchUrl("momax", input.objectCategory as never, input.broadQuery)
    };
  }
};
