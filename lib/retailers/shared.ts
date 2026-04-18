import { chromium, type Browser, type Page } from "playwright";
import type { ProductCandidate } from "@/lib/types";
import { normalizeWhitespace } from "@/lib/utils";

type RawCard = {
  title: string;
  url: string;
  imageUrl?: string | null;
  priceText?: string;
  rawText?: string;
};

type SearchScrapeConfig = {
  retailer: string;
  searchUrl: string;
  productLinkPatterns: string[];
  waitForSelector?: string;
  maxItems?: number;
};

const DEFAULT_TIMEOUT_MS = 12000;

export async function withBrowser<T>(work: (page: Page) => Promise<T>) {
  const browser = await chromium.launch({
    headless: process.env.PLAYWRIGHT_HEADLESS !== "false"
  });

  try {
    const page = await createConfiguredPage(browser);
    return await work(page);
  } finally {
    await browser.close();
  }
}

async function createConfiguredPage(browser: Browser) {
  const context = await browser.newContext({
    userAgent: "latentcouch/0.1 local-first product finder"
  });

  const page = await context.newPage();
  page.setDefaultTimeout(DEFAULT_TIMEOUT_MS);
  return page;
}

export async function scrapeProductCards(config: SearchScrapeConfig): Promise<ProductCandidate[]> {
  return withBrowser(async (page) => {
    await page.goto(config.searchUrl, {
      waitUntil: "domcontentloaded",
      timeout: DEFAULT_TIMEOUT_MS
    });

    if (config.waitForSelector) {
      await page.waitForLoadState("domcontentloaded");
      await page
        .waitForSelector(config.waitForSelector, {
          timeout: 4000
        })
        .catch(() => undefined);
    }

    const cards = await page.evaluate(
      ({ productLinkPatterns, maxItems }) => {
        const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"));

        return anchors
          .filter((anchor) =>
            productLinkPatterns.some((pattern) => anchor.href.toLowerCase().includes(pattern))
          )
          .map((anchor) => {
            const card = anchor.closest("article, li, div");
            const title =
              anchor.getAttribute("aria-label") ||
              anchor.querySelector("img")?.getAttribute("alt") ||
              anchor.textContent ||
              "";
            const imageUrl =
              anchor.querySelector("img")?.getAttribute("src") ||
              anchor.querySelector("img")?.getAttribute("data-src") ||
              null;
            const rawText = card?.textContent || anchor.textContent || "";
            const priceMatch = rawText.match(/(\d[\d\s.,]*)(\s?(Ft|HUF|€|EUR|CHF|Kč|CZK))/i);

            return {
              title,
              url: anchor.href,
              imageUrl,
              priceText: priceMatch ? priceMatch[0] : "",
              rawText
            };
          })
          .filter((item) => item.title.trim() && item.url)
          .slice(0, maxItems || 8);
      },
      {
        productLinkPatterns: config.productLinkPatterns,
        maxItems: config.maxItems || 8
      }
    );

    return cards.map((card) => rawCardToCandidate(config.retailer, card));
  });
}

function rawCardToCandidate(retailer: string, raw: RawCard): ProductCandidate {
  const normalizedPrice = normalizeWhitespace(raw.priceText || "");

  return {
    retailer,
    title: normalizeWhitespace(raw.title),
    priceText: normalizedPrice || "Price unavailable",
    priceValue: parsePriceValue(normalizedPrice),
    currency: parseCurrency(normalizedPrice),
    url: raw.url,
    imageUrl: raw.imageUrl || null,
    extractedAttributes: extractAttributesFromText(`${raw.title} ${raw.rawText || ""}`),
    matchReasons: [],
    confidence: 0.45,
    rawText: normalizeWhitespace(raw.rawText || raw.title)
  };
}

export async function safeRetailerSearch(
  retailer: string,
  work: () => Promise<ProductCandidate[]>
) {
  try {
    const candidates = await Promise.race([
      work(),
      new Promise<ProductCandidate[]>((_, reject) => {
        setTimeout(() => reject(new Error("Timed out while scraping the retailer page")), 15000);
      })
    ]);

    return { candidates };
  } catch (error) {
    return {
      candidates: [],
      error: error instanceof Error ? error.message : `Failed to search ${retailer}`
    };
  }
}

export function parsePriceValue(text: string) {
  const digits = text.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
  const match = digits.match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

export function parseCurrency(text: string) {
  if (/ft|huf/i.test(text)) return "HUF";
  if (/eur|€/i.test(text)) return "EUR";
  if (/czk|kč/i.test(text)) return "CZK";
  return "N/A";
}

export function extractAttributesFromText(text: string) {
  const lower = text.toLowerCase();
  const attributes = [
    "oak",
    "wood",
    "round",
    "rectangular",
    "boucle",
    "linen",
    "beige",
    "cream",
    "black",
    "white",
    "minimal",
    "japandi",
    "scandinavian",
    "soft edge",
    "storage",
    "glass",
    "metal",
    "mosdó",
    "mosdószekrény",
    "fürdőszoba",
    "szekrény",
    "magasszekrény",
    "tükör",
    "lámpa",
    "étkezőasztal",
    "dohányzóasztal",
    "kanapé",
    "fotel",
    "polc",
    "komód",
    "szőnyeg",
    "ágy"
  ];

  return attributes.filter((attribute) => lower.includes(attribute));
}
