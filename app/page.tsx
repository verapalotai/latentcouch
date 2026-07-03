"use client";

import { startTransition, useRef, useState } from "react";
import { ImagePreviewList } from "@/components/image-preview-list";
import { InspirationSummary } from "@/components/inspiration-summary";
import { ObjectSelector } from "@/components/object-selector";
import { ResultsGrid } from "@/components/results-grid";
import { SearchPlanCard } from "@/components/search-plan-card";
import { StatusBanner } from "@/components/status-banner";
import { StoreStatusList } from "@/components/store-status-list";
import { UploadZone } from "@/components/upload-zone";
import { demoCaptureEnabled, demoFixture } from "@/lib/demo";
import { intersectShoppableObjects } from "@/lib/shopping-taxonomy";
import type {
  DetectedObject,
  Inspiration,
  ProductCandidate,
  RoomObjects,
  SearchPlan
} from "@/lib/types";

type StoreStatus = {
  retailer: string;
  ok: boolean;
  error?: string;
  resultCount: number;
  manualSearchUrl?: string;
};

type LoadingPhase = "analyzing" | "planning" | "searching" | null;

async function postImages(url: string, files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));

  const response = await fetch(url, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error((await response.json()).error || `Request failed for ${url}`);
  }

  return response.json();
}

export default function HomePage() {
  const [roomFiles, setRoomFiles] = useState<File[]>([]);
  const [inspirationFiles, setInspirationFiles] = useState<File[]>([]);
  const [roomObjects, setRoomObjects] = useState<RoomObjects | null>(null);
  const [inspiration, setInspiration] = useState<Inspiration | null>(null);
  const [selectedObject, setSelectedObject] = useState<DetectedObject | null>(null);
  const [searchPlan, setSearchPlan] = useState<SearchPlan | null>(null);
  const [results, setResults] = useState<ProductCandidate[]>([]);
  const [statuses, setStatuses] = useState<StoreStatus[]>([]);
  const [activeRetailerFilter, setActiveRetailerFilter] = useState<string | null>(null);
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>(null);
  const [loadingLabel, setLoadingLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [demoToast, setDemoToast] = useState(false);
  const resultsRef = useRef<HTMLElement | null>(null);
  const inspirationRef = useRef<HTMLDivElement | null>(null);
  const isAnalyzing = loadingPhase === "analyzing";
  const isPlanning = loadingPhase === "planning";
  const isSearching = loadingPhase === "searching";

  function resetSession() {
    setRoomFiles([]);
    setInspirationFiles([]);
    setRoomObjects(null);
    setInspiration(null);
    setSelectedObject(null);
    setSearchPlan(null);
    setResults([]);
    setStatuses([]);
    setActiveRetailerFilter(null);
    setLoadingPhase(null);
    setLoadingLabel(null);
    setError(null);
    setDemoToast(false);
  }

  function loadDemo() {
    resetSession();
    startTransition(() => {
      setRoomObjects(demoFixture.roomObjects);
      setInspiration(demoFixture.inspiration);
      setSelectedObject(demoFixture.selectedObject);
      setSearchPlan(demoFixture.searchPlan);
      setResults(demoFixture.results);
      setStatuses(demoFixture.statuses);
      setDemoToast(true);
    });
    requestAnimationFrame(() =>
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  }

  function downloadDemoFixture() {
    const captured = {
      roomObjects,
      inspiration,
      selectedObject,
      searchPlan,
      results,
      statuses
    };
    const blob = new Blob([JSON.stringify(captured, null, 2)], {
      type: "application/json"
    });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = "fixture.json";
    anchor.click();
    URL.revokeObjectURL(href);
  }

  async function runAnalysis() {
    setDemoToast(false);
    setError(null);
    setLoadingPhase("analyzing");
    setLoadingLabel("Analyzing photos...");

    try {
      const [roomResponse, inspirationResponse] = await Promise.all([
        postImages("/api/analyze-room", roomFiles),
        postImages("/api/analyze-inspiration", inspirationFiles)
      ]);

      startTransition(() => {
        setRoomObjects(roomResponse);
        setInspiration(inspirationResponse);
        setSelectedObject(null);
        setSearchPlan(null);
        setResults([]);
        setStatuses([]);
        setActiveRetailerFilter(null);
      });
      requestAnimationFrame(() =>
        inspirationRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      );
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to analyze images");
    } finally {
      setLoadingPhase(null);
      setLoadingLabel(null);
    }
  }

  async function selectObject(object: DetectedObject) {
    if (!inspiration) {
      return;
    }

    setError(null);
    setLoadingPhase("planning");
    setLoadingLabel(`Planning searches for ${object.label}...`);
    setSelectedObject(object);
    setSearchPlan(null);
    setResults([]);
    setStatuses([]);
    setActiveRetailerFilter(null);

    try {
      const planResponse = await fetch("/api/plan-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          selectedObject: object,
          inspiration
        })
      });

      if (!planResponse.ok) {
        throw new Error((await planResponse.json()).error || "Failed to plan retailer queries");
      }

      const planJson = await planResponse.json();
      setSearchPlan(planJson);
      setLoadingPhase("searching");
      setLoadingLabel("Searching retailer sites...");

      const searchResponse = await fetch("/api/search-products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          plan: planJson,
          selectedObject: object,
          inspiration
        })
      });

      if (!searchResponse.ok) {
        throw new Error((await searchResponse.json()).error || "Failed to search products");
      }

      const searchJson = await searchResponse.json();
      setResults(searchJson.results || []);
      setStatuses(searchJson.storeStatuses || []);
      setActiveRetailerFilter(null);
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to shop for that object");
    } finally {
      setLoadingPhase(null);
      setLoadingLabel(null);
    }
  }

  const canAnalyze = roomFiles.length > 0 && inspirationFiles.length > 0;
  const filteredResults = activeRetailerFilter
    ? results.filter((result) => result.retailer === activeRetailerFilter)
    : results;
  // Shoppable = objects in BOTH the room and the inspiration, carrying the inspiration's
  // desired attributes (we shop for the look you want, not what you already own).
  const shoppableObjects =
    roomObjects && inspiration
      ? intersectShoppableObjects(roomObjects.objects, inspiration.objects ?? [])
      : [];
  const showDetected = Boolean(roomObjects && inspiration);
  const showRanked = Boolean(searchPlan) || results.length > 0 || isSearching;

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {loadingLabel ? <div className="top-loader" aria-hidden="true" /> : null}
      <section className="glass-panel overflow-hidden rounded-[2.5rem] p-6 sm:p-8">
        <div className="flex items-start justify-between gap-6">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">latentcouch</p>
            <h1 className="mt-3 text-4xl leading-tight font-semibold sm:text-5xl">
              Your approximate nearest couch, found from your couch.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-[var(--muted)] sm:text-lg">
              Turn your home into your inspiration boards. Upload pictures of a room, upload the dream vibe, pick one detected object, and let LatentCouch handle the browsing.
            </p>
          </div>

          <button
            aria-label="Reset session"
            className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-full border border-[var(--line)] bg-white/75 text-[var(--muted)] transition hover:bg-white disabled:opacity-50"
            disabled={Boolean(loadingLabel)}
            onClick={resetSession}
            type="button"
          >
            <svg
              aria-hidden="true"
              className="h-[18px] w-[18px]"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                d="M3 12a9 9 0 1 0 3-6.7L3 8"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
              <path
                d="M3 3v5h5"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
          </button>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--accent-strong)] disabled:opacity-60"
            disabled={Boolean(loadingLabel)}
            onClick={loadDemo}
            type="button"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
              <path
                d="M8 5v14l11-7z"
                fill="currentColor"
              />
            </svg>
            Try the demo
          </button>
        </div>
      </section>

      <section className="mt-6 space-y-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <UploadZone
              files={roomFiles}
              hint="Kitchen, living room, bathroom, or any current-state room shots."
              label="Room photos"
              onChange={setRoomFiles}
            />
            <ImagePreviewList files={roomFiles} />
          </div>
          <div>
            <UploadZone
              files={inspirationFiles}
              hint="Pinterest saves, screenshots, or showroom photos."
              label="Inspiration photos"
              onChange={setInspirationFiles}
            />
            <ImagePreviewList files={inspirationFiles} />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
          <button
            className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:opacity-60"
            disabled={!canAnalyze || Boolean(loadingLabel)}
            onClick={runAnalysis}
            type="button"
          >
            {loadingLabel ? loadingLabel : "Analyze my photos"}
          </button>
          {demoCaptureEnabled && results.length > 0 ? (
            <button
              className="rounded-full border border-dashed border-[var(--line)] px-5 py-3 text-sm font-semibold text-[var(--muted)] transition hover:bg-white"
              onClick={downloadDemoFixture}
              type="button"
            >
              ⬇ Save demo fixture
            </button>
          ) : null}
        </div>

        {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}

        {inspiration || isAnalyzing || showDetected ? (
          <section className="glass-panel rounded-[2rem] p-6">
            {inspiration || isAnalyzing ? (
              <div ref={inspirationRef} className="scroll-mt-6">
                <InspirationSummary inspiration={inspiration} loading={isAnalyzing && !inspiration} />
              </div>
            ) : null}

            {showDetected ? (
              <div
                className={
                  inspiration || isAnalyzing
                    ? "mt-6 border-t border-[var(--line)] pt-6"
                    : ""
                }
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold">Shoppable objects</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Pieces found in both your room and your inspiration, shown with the look you want. Pick one to shop for it.
                    </p>
                  </div>
                  {roomObjects ? (
                    <span className="rounded-full bg-white/75 px-3 py-1 text-xs text-[var(--muted)]">
                      {roomObjects.roomType}
                    </span>
                  ) : null}
                </div>

                <div className="mt-4">
                  {shoppableObjects.length ? (
                    <ObjectSelector
                      objects={shoppableObjects}
                      onSelect={selectObject}
                      selectedId={selectedObject?.id}
                    />
                  ) : (
                    <p className="rounded-[1.25rem] border border-[var(--line)] bg-white/55 p-4 text-sm text-[var(--muted)]">
                      No pieces overlap between your room and your inspiration photos. Try inspiration images that include the items you want to replace.
                    </p>
                  )}
                </div>

                <div className="mt-6 border-t border-[var(--line)] pt-5">
                  <SearchPlanCard
                    plan={searchPlan}
                    loading={isPlanning && !searchPlan}
                    onChange={setSearchPlan}
                  />
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {showRanked ? (
        <section ref={resultsRef}>
          <div className="mb-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-2xl font-semibold">Ranked matches</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                First-page retailer cards, filtered toward the selected product category and ranked against the inspiration cues.
              </p>
            </div>
            {results.length ? (
              <span className="rounded-full bg-white/70 px-3 py-1 text-xs text-[var(--muted)]">
                {filteredResults.length}
                {activeRetailerFilter ? ` ${activeRetailerFilter} ` : " "}
                results
              </span>
            ) : null}
          </div>

          <StoreStatusList
            activeRetailer={activeRetailerFilter}
            onFilterSelect={(retailer) =>
              setActiveRetailerFilter((current) => (current === retailer ? null : retailer))
            }
            statuses={statuses}
          />

          <div className="mt-4">
            <ResultsGrid results={filteredResults} loading={isSearching && results.length === 0} />
          </div>
        </section>
        ) : null}
      </section>

      {demoToast ? (
        <div className="fixed inset-x-4 bottom-4 z-50 flex justify-center sm:inset-x-auto sm:right-6 sm:bottom-6 sm:justify-end">
          <div className="glass-panel flex max-w-md items-start gap-3 rounded-2xl border border-[var(--line)] p-4 shadow-lg">
            <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)]">
              <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                <path
                  d="M12 8h.01M11 12h1v4h1"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </span>
            <p className="text-sm text-[var(--muted)]">
              <span className="font-semibold text-[var(--accent-strong)]">Demo data</span> — a
              captured session, no live analysis or scraping. Upload your own photos and hit
              “Analyze my photos” to run the real pipeline (needs an API key, runs locally).
            </p>
            <button
              aria-label="Dismiss"
              className="ml-1 flex h-7 w-7 flex-none items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-black/5"
              onClick={() => setDemoToast(false)}
              type="button"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.8"
                />
              </svg>
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
