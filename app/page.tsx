"use client";

import { startTransition, useRef, useState } from "react";
import { ActivityIndicator } from "@/components/activity-indicator";
import { ImagePreviewList } from "@/components/image-preview-list";
import { InspirationSummary } from "@/components/inspiration-summary";
import { ObjectSelector } from "@/components/object-selector";
import { ResultsGrid } from "@/components/results-grid";
import { SearchPlanCard } from "@/components/search-plan-card";
import { StatusBanner } from "@/components/status-banner";
import { StoreStatusList } from "@/components/store-status-list";
import { UploadZone } from "@/components/upload-zone";
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
  const resultsRef = useRef<HTMLElement | null>(null);
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
  }

  async function runAnalysis() {
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

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
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
            className="inline-flex h-12 w-12 flex-none items-center justify-center rounded-full border border-[var(--line)] bg-white/75 text-[var(--muted)] transition hover:bg-white disabled:opacity-50"
            disabled={Boolean(loadingLabel)}
            onClick={resetSession}
            type="button"
          >
            <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
              <path
                d="M20 11a8 8 0 1 1-2.34-5.66M20 4v7h-7"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
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
            <ImagePreviewList emptyText="Room previews appear here." files={roomFiles} />
          </div>
          <div>
            <UploadZone
              files={inspirationFiles}
              hint="Pinterest saves, screenshots, or showroom photos."
              label="Inspiration photos"
              onChange={setInspirationFiles}
            />
            <ImagePreviewList emptyText="Inspiration previews appear here." files={inspirationFiles} />
          </div>
        </div>

        <div className="flex justify-center lg:justify-start">
          <button
            className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:opacity-60"
            disabled={!canAnalyze || Boolean(loadingLabel)}
            onClick={runAnalysis}
            type="button"
          >
            {loadingLabel ? loadingLabel : "Analyze my photos"}
          </button>
        </div>

        {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
        {loadingLabel ? <StatusBanner tone="neutral">{loadingLabel}</StatusBanner> : null}
        {loadingLabel ? <ActivityIndicator label={loadingLabel} /> : null}

        {inspiration || isAnalyzing ? (
          <InspirationSummary inspiration={inspiration} loading={isAnalyzing && !inspiration} />
        ) : null}

        <section className="glass-panel rounded-[2rem] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-lg font-semibold">Detected objects</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Pick the item you want to shop for and latentcouch will refresh the plan and the results.
              </p>
            </div>
            {roomObjects ? (
              <span className="rounded-full bg-white/75 px-3 py-1 text-xs text-[var(--muted)]">
                {roomObjects.roomType}
              </span>
            ) : null}
          </div>

          {roomObjects ? <p className="mt-3 text-sm text-[var(--muted)]">{roomObjects.summary}</p> : null}

          <div className="mt-4">
            <ObjectSelector
              objects={roomObjects?.objects || []}
              onSelect={selectObject}
              selectedId={selectedObject?.id}
            />
          </div>

          <div className="mt-5">
            <SearchPlanCard plan={searchPlan} loading={isPlanning && !searchPlan} />
          </div>
        </section>

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
      </section>
    </main>
  );
}
