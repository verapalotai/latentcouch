import type { RetailerAdapter } from "./types";
import { getRetailerManualSearchUrl } from "@/lib/shopping-taxonomy";

export const xxxlutzAdapter: RetailerAdapter = {
  name: "xxxlutz",
  displayName: "XXXLutz",
  async search(input) {
    return {
      candidates: [],
      error: "XXXLutz is challenge-gating automated scraping right now. Open the store search.",
      manualSearchUrl: getRetailerManualSearchUrl("xxxlutz", input.objectCategory as never, input.broadQuery)
    };
  }
};
