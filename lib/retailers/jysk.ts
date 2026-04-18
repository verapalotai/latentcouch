import type { RetailerAdapter } from "./types";
import { getRetailerManualSearchUrl } from "@/lib/shopping-taxonomy";

export const jyskAdapter: RetailerAdapter = {
  name: "jysk",
  displayName: "JYSK",
  async search(input) {
    return {
      candidates: [],
      error: "JYSK search is available, but this MVP currently opens the store search instead of scraping it.",
      manualSearchUrl: getRetailerManualSearchUrl("jysk", input.objectCategory as never, input.broadQuery)
    };
  }
};
