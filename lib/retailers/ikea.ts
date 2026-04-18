import type { RetailerAdapter } from "./types";
import { getRetailerManualSearchUrl } from "@/lib/shopping-taxonomy";
import { safeRetailerSearch, scrapeProductCards } from "./shared";

export const ikeaAdapter: RetailerAdapter = {
  name: "ikea",
  displayName: "IKEA",
  async search(input) {
    return safeRetailerSearch("ikea", () =>
      scrapeProductCards({
        retailer: "ikea",
        searchUrl: getRetailerManualSearchUrl("ikea", input.objectCategory as never, input.broadQuery),
        productLinkPatterns: ["/p/", "/products/"],
        waitForSelector: "a[href*='/p/']"
      })
    );
  }
};
