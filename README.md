# latentcouch

Your approximate nearest couch, found from your couch.

`latentcouch` is a practical furniture-shopping helper. It takes room photos plus inspiration photos, extracts shoppable furniture cues, searches a small set of retailers with Playwright, and ranks first-page product cards that best match the vibe.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- OpenAI Responses API
- Zod
- Playwright

## Install

If Node.js and pnpm are already available on your machine:

```bash
pnpm install
pnpm exec playwright install chromium
cp .env.example .env.local
pnpm dev
```

```bash
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4.1-mini
PLAYWRIGHT_HEADLESS=true
```

## Package dependencies

Runtime:

- `next`
- `react`
- `react-dom`
- `openai`
- `zod`
- `playwright`
- `clsx`

Dev:

- `typescript`
- `tailwindcss`
- `@tailwindcss/postcss`
- `eslint`
- `eslint-config-next`
- `@types/node`
- `@types/react`
- `@types/react-dom`

Equivalent install commands:

```bash
pnpm add next react react-dom openai zod playwright clsx
pnpm add -D typescript tailwindcss @tailwindcss/postcss eslint eslint-config-next @types/node @types/react @types/react-dom
```

## Folder tree

```text
latentcouch/
├─ .env.example
├─ README.md
├─ app/
│  ├─ api/
│  │  ├─ analyze-room/route.ts
│  │  ├─ analyze-inspiration/route.ts
│  │  ├─ plan-search/route.ts
│  │  └─ search-products/route.ts
│  ├─ globals.css
│  ├─ layout.tsx
│  └─ page.tsx
├─ components/
│  ├─ image-preview-list.tsx
│  ├─ inspiration-summary.tsx
│  ├─ object-selector.tsx
│  ├─ product-card.tsx
│  ├─ results-grid.tsx
│  ├─ search-plan-card.tsx
│  ├─ status-banner.tsx
│  ├─ store-status-list.tsx
│  └─ upload-zone.tsx
├─ lib/
│  ├─ types.ts
│  ├─ utils.ts
│  ├─ openai/
│  │  ├─ analyze-inspiration.ts
│  │  ├─ analyze-room.ts
│  │  ├─ client.ts
│  │  └─ plan-search.ts
│  ├─ ranking/
│  │  └─ rank-candidates.ts
│  └─ retailers/
│     ├─ beliani.ts
│     ├─ bonami.ts
│     ├─ ikea.ts
│     ├─ index.ts
│     ├─ mobelix.ts
│     ├─ momax.ts
│     ├─ shared.ts
│     ├─ types.ts
│     └─ xxxlutz.ts
├─ next.config.ts
├─ package.json
├─ postcss.config.mjs
└─ tsconfig.json
```

## Architecture

The main user flow stays intentionally linear:

1. Upload room images and inspiration images in `app/page.tsx`.
2. POST room images to `/api/analyze-room`.
3. POST inspiration images to `/api/analyze-inspiration`.
4. Show detected objects as selectable cards.
5. On object selection, POST to `/api/plan-search`.
6. POST the resulting search plan to `/api/search-products`.
7. Run retailer adapters with Playwright.
8. Rank product candidates.
9. Render top matches in a grid.

## Schemas

Implemented in [`lib/types.ts`](/Users/veronikapalotai/git/latentcouch/lib/types.ts):

- `RoomObjectsSchema`
- `InspirationSchema`
- `SearchPlanSchema`
- `ProductCandidateSchema`

These back both API validation and OpenAI structured responses.

## Retailer adapter notes

Each retailer adapter implements the same interface in [`lib/retailers/types.ts`](/Users/veronikapalotai/git/latentcouch/lib/retailers/types.ts).

The reusable scraping logic lives in [`lib/retailers/shared.ts`](/Users/veronikapalotai/git/latentcouch/lib/retailers/shared.ts).

Currently:

- `IKEA`, `Bonami`, and `Beliani` are the strongest first-pass adapters
- `XXXLutz`, `Mömax`, and `Möbelix` are scaffolded with the same generic extraction path
- selectors are intentionally isolated with TODO-friendly config points because store markup can change

## Limitations

- Retailer selectors are heuristic and may need tuning.
- Scraping can fail due to consent popups, anti-bot flows, or markup changes.
- Results are based only on the first result page.
- Ranking is lexical and heuristic, not embedding-based.
- No dimension extraction or room measurement yet.
- No persistence. Reloading the page resets the session.

## Suggested next steps

If you want to extend this after the shopping trip:

1. Add optional dimension extraction and a manual size filter.
2. Cache prior retailer responses in local files.
3. Add a lightweight judge step to compare the top 10 products semantically.
4. Add saved sessions or exportable moodboards.

## Portfolio framing

This project shows:

- multimodal LLM orchestration
- structured JSON with schema validation
- resilient adapter design for flaky third-party websites
- local-first product thinking under time pressure
- a clear end-to-end local workflow without infrastructure overhead
