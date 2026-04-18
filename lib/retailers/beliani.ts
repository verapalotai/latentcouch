import type { RetailerAdapter } from "./types";
import { getRetailerManualSearchUrl } from "@/lib/shopping-taxonomy";

export const belianiAdapter: RetailerAdapter = {
  name: "beliani",
  displayName: "Beliani",
  async search(input) {
    return {
      candidates: [],
      error: "Beliani search is too noisy for this category, open the store search instead.",
      manualSearchUrl: getRetailerManualSearchUrl("beliani", input.objectCategory as never, input.broadQuery)
    };
  }
};
