import type { RetailerAdapter } from "./types";
import { getRetailerManualSearchUrl } from "@/lib/shopping-taxonomy";
import { safeRetailerSearch, scrapeProductCards } from "./shared";

export const bonamiAdapter: RetailerAdapter = {
  name: "bonami",
  displayName: "Bonami",
  async search(input) {
    return safeRetailerSearch("bonami", () =>
      scrapeProductCards({
        retailer: "bonami",
        searchUrl: getRetailerManualSearchUrl("bonami", input.objectCategory as never, input.broadQuery),
        productLinkPatterns: ["/p/"],
        waitForSelector: "a[href*='/p/']"
      })
    );
  }
};
