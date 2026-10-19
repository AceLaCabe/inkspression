// src/app/app/entries/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  ArrowRight,
  BookOpenText,
  ChevronDown,
  ChevronUp,
  Filter,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import AppShell from "@/components/AppShell";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase";

import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
} from "firebase/firestore";

type Entry = {
  id: string;
  title: string | null;
  body: string;
  mood: string | null;
  mode: string | null;
  createdAtMs: number | null;
  demo?: boolean;
};

type SortOrder = "newest" | "oldest";

const PAGE_LIMIT = 50;

const defaultMoods = [
  "Calm",
  "Anxious",
  "Low",
  "Overwhelmed",
  "Energized",
  "Sad",
];

const defaultModes = [
  "One sentence",
  "Brain dump",
  "Tiny check-in",
  "Two-minute release",
  "Momentum note",
  "Soft reflection",
  "Free note",
];

function getCustomMoodKey(uid: string) {
  return `ink_custom_moods_${uid}`;
}

function makeDemoEntries(): Entry[] {
  const now = Date.now();

  return [
    {
      id: "demo-1",
      title: "A small win",
      body:
        "I did one thing I kept avoiding, and it counted.",
      mood: "Calm",
      mode: "One sentence",
      createdAtMs: now,
      demo: true,
    },
    {
      id: "demo-2",
      title: "Overthinking spiral",
      body:
        "My thoughts kept circling, so I let them land somewhere soft.",
      mood: "Anxious",
      mode: "Brain dump",
      createdAtMs: now - 86400000,
      demo: true,
    },
    {
      id: "demo-3",
      title: "Soft reset",
      body:
        "I did not have much to say, but I showed up anyway.",
      mood: "Low",
      mode: "Tiny check-in",
      createdAtMs: now - 2 * 86400000,
      demo: true,
    },
  ];
}

function formatDate(timestamp: number | null) {
  if (timestamp === null || !Number.isFinite(timestamp)) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp));
}

function formatPreview(text: string, maxLength = 160) {
  const cleaned = text.trim().replace(/\s+/g, " ");

  if (!cleaned) return null;

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.slice(0, maxLength).trimEnd()}…`;
}

function getEntryTitle(entry: Entry) {
  return entry.title?.trim() || "Untitled reflection";
}

function sortEntries(
  entries: Entry[],
  order: SortOrder
) {
  return [...entries].sort((a, b) => {
    const first = a.createdAtMs ?? 0;
    const second = b.createdAtMs ?? 0;

    return order === "newest"
      ? second - first
      : first - second;
  });
}

export default function EntriesPage() {
  const { user, loading } = useAuth();

  const [entries, setEntries] = useState<Entry[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchText, setSearchText] = useState("");
  const [moodFilter, setMoodFilter] = useState("All");
  const [modeFilter, setModeFilter] = useState("All");
  const [sortOrder, setSortOrder] =
    useState<SortOrder>("newest");

  const [showFilters, setShowFilters] = useState(false);
  const [customMoods, setCustomMoods] =
    useState<string[]>([]);

  // Load custom mood names for the filter options.
  useEffect(() => {
    if (loading || !user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCustomMoods([]);
      return;
    }

    try {
      const key = getCustomMoodKey(user.uid);
      const stored = localStorage.getItem(key);
      const parsed: unknown = stored
        ? JSON.parse(stored)
        : [];

      const valid = Array.isArray(parsed)
        ? parsed.filter(
            (item): item is string =>
              typeof item === "string"
          )
        : [];

      setCustomMoods(valid);
    } catch {
      setCustomMoods([]);
    }
  }, [user, loading]);

  // Load saved reflections or demo examples.
  useEffect(() => {
    let active = true;

    async function loadEntries() {
      if (loading) return;

      setBusy(true);
      setError(null);

      if (!user) {
        setEntries(makeDemoEntries());
        setBusy(false);
        return;
      }

      try {
        const entriesQuery = query(
          collection(db, "users", user.uid, "entries"),
          orderBy("createdAt", "desc"),
          limit(PAGE_LIMIT)
        );

        const snapshot = await getDocs(entriesQuery);

        if (!active) return;

        const loaded: Entry[] = snapshot.docs.map(
          (entryDoc) => {
            const data = entryDoc.data();

            const date = data.createdAt?.toDate?.();

            return {
              id: entryDoc.id,
              title:
                typeof data.title === "string"
                  ? data.title
                  : null,
              body:
                typeof data.body === "string"
                  ? data.body
                  : "",
              mood:
                typeof data.mood === "string"
                  ? data.mood
                  : null,
              mode:
                typeof data.mode === "string"
                  ? data.mode
                  : null,
              createdAtMs:
                date instanceof Date &&
                Number.isFinite(date.getTime())
                  ? date.getTime()
                  : null,
            };
          }
        );

        setEntries(loaded);
      } catch (caught: unknown) {
        if (!active) return;

        setEntries([]);
        setError(
          caught instanceof Error
            ? caught.message
            : "Could not load your reflections."
        );
      } finally {
        if (active) {
          setBusy(false);
        }
      }
    }

    loadEntries();

    return () => {
      active = false;
    };
  }, [user, loading]);

  // Derive available filters from loaded entries.
  const moodOptions = useMemo(() => {
    const usedMoods = entries
      .map((entry) => entry.mood)
      .filter((value): value is string =>
        Boolean(value)
      );

    return [
      "All",
      ...Array.from(
        new Set([
          ...defaultMoods,
          ...usedMoods,
          ...customMoods,
        ])
      ),
    ];
  }, [entries, customMoods]);

  const modeOptions = useMemo(() => {
    const usedModes = entries
      .map((entry) => entry.mode)
      .filter((value): value is string =>
        Boolean(value)
      );

    return [
      "All",
      ...Array.from(
        new Set([...defaultModes, ...usedModes])
      ),
    ];
  }, [entries]);

  // Search all text in the loaded reflections,
  // not just the shortened card preview.
  const filteredEntries = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    const matching = entries.filter((entry) => {
      const searchableText = [
        entry.title,
        entry.body,
        entry.mood,
        entry.mode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !search || searchableText.includes(search);

      const matchesMood =
        moodFilter === "All" ||
        entry.mood === moodFilter;

      const matchesMode =
        modeFilter === "All" ||
        entry.mode === modeFilter;

      return (
        matchesSearch &&
        matchesMood &&
        matchesMode
      );
    });

    return sortEntries(matching, sortOrder);
  }, [
    entries,
    searchText,
    moodFilter,
    modeFilter,
    sortOrder,
  ]);

  const hasFilters =
    Boolean(searchText.trim()) ||
    moodFilter !== "All" ||
    modeFilter !== "All" ||
    sortOrder !== "newest";

  const isDemo = !loading && !user;
  const hasEntries = entries.length > 0;

  const isLoading = loading || busy;

  const statusText = isLoading
    ? "Loading reflections."
    : error
      ? "Reflections could not be loaded."
      : filteredEntries.length === 0
        ? hasEntries
          ? "No reflections match your search."
          : "No reflections yet."
        : `${filteredEntries.length} ${
            filteredEntries.length === 1
              ? "reflection"
              : "reflections"
          } shown.`;

  function clearFilters() {
    setSearchText("");
    setMoodFilter("All");
    setModeFilter("All");
    setSortOrder("newest");
  }

  return (
    <AppShell title="Entries">
      <section
        className="min-w-0 space-y-6"
        aria-labelledby="library-heading"
      >
        {/* Introduction */}
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="ink-eyebrow">
              Reflection library
            </span>

            <h1
              id="library-heading"
              className="mt-2 text-3xl font-semibold"
            >
              Saved reflections
            </h1>

            <p className="ink-subtext mt-3 max-w-xl text-sm">
              {isDemo
                ? "Explore a few example reflections before creating your own."
                : "A place to find and revisit what you've written."}
            </p>
          </div>

          <Link
            href="/app/new"
            className="ink-btn ink-btn-primary"
          >
            <Plus
              className="ink-icon-sm"
              aria-hidden="true"
            />
            New entry
          </Link>
        </header>

        {/* Search and filters */}
        <section
          className="ink-card p-4 sm:p-5"
          aria-labelledby="find-heading"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Search
                className="ink-icon"
                aria-hidden="true"
              />

              <h2
                id="find-heading"
                className="text-base font-semibold"
              >
                Find a reflection
              </h2>
            </div>
          </div>

          <div className="mt-4">
            <label
              htmlFor="reflection-search"
              className="block text-sm font-semibold"
            >
              Search your reflections
            </label>

            <div className="relative mt-2">
              <input
                id="reflection-search"
                type="search"
                value={searchText}
                onChange={(event) =>
                  setSearchText(event.target.value)
                }
                placeholder="Search titles, feelings, or words"
                className="ink-input pr-12"
                autoComplete="off"
              />

              {searchText && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearchText("")}
                  className="
                    absolute right-1 top-1/2
                    flex h-10 w-10 -translate-y-1/2
                    items-center justify-center
                    rounded-full
                  "
                >
                  <X
                    className="ink-icon-sm"
                    aria-hidden="true"
                  />
                </button>
              )}
            </div>
          </div>

          {/* Optional filter controls */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              className="ink-btn ink-btn-secondary"
              aria-expanded={showFilters}
              aria-controls="reflection-filters"
              onClick={() =>
                setShowFilters((current) => !current)
              }
            >
              <SlidersHorizontal
                className="ink-icon-sm"
                aria-hidden="true"
              />

              {showFilters
                ? "Hide filters"
                : "More filters"}

              {showFilters ? (
                <ChevronUp
                  className="ink-icon-sm"
                  aria-hidden="true"
                />
              ) : (
                <ChevronDown
                  className="ink-icon-sm"
                  aria-hidden="true"
                />
              )}
            </button>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="ink-link text-sm"
              >
                Clear filters
              </button>
            )}
          </div>

          {showFilters && (
            <div
              id="reflection-filters"
              className="mt-5 grid gap-4 border-t pt-5 sm:grid-cols-2 xl:grid-cols-3"
              style={{
                borderColor: "rgb(var(--ink-border))",
              }}
            >
              <div>
                <label
                  htmlFor="reflection-mood"
                  className="mb-2 block text-sm font-semibold"
                >
                  Feeling
                </label>

                <select
                  id="reflection-mood"
                  className="ink-input"
                  value={moodFilter}
                  onChange={(event) =>
                    setMoodFilter(event.target.value)
                  }
                >
                  {moodOptions.map((value) => (
                    <option key={value} value={value}>
                      {value === "All"
                        ? "All feelings"
                        : value}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="reflection-mode"
                  className="mb-2 block text-sm font-semibold"
                >
                  Writing mode
                </label>

                <select
                  id="reflection-mode"
                  className="ink-input"
                  value={modeFilter}
                  onChange={(event) =>
                    setModeFilter(event.target.value)
                  }
                >
                  {modeOptions.map((value) => (
                    <option key={value} value={value}>
                      {value === "All"
                        ? "All modes"
                        : value}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="reflection-sort"
                  className="mb-2 block text-sm font-semibold"
                >
                  Sort by
                </label>

                <select
                  id="reflection-sort"
                  className="ink-input"
                  value={sortOrder}
                  onChange={(event) =>
                    setSortOrder(
                      event.target.value as SortOrder
                    )
                  }
                >
                  <option value="newest">
                    Newest first
                  </option>
                  <option value="oldest">
                    Oldest first
                  </option>
                </select>
              </div>
            </div>
          )}
        </section>

        {/* Results count */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">
              Your reflections
            </h2>

            <p
              className="ink-subtext mt-1 text-sm"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {statusText}
            </p>
          </div>

          {hasFilters && (
            <span className="ink-subtext text-sm">
              Filters applied
            </span>
          )}
        </div>

        {/* Loading */}
        {isLoading ? (
          <div
            className="ink-card-soft p-6"
            role="status"
          >
            <p className="ink-subtext text-sm">
              Loading your reflections…
            </p>
          </div>
        ) : error ? (
          <div
            className="ink-alert"
            role="alert"
          >
            <p className="font-semibold">
              Reflections couldn't be loaded.
            </p>

            <p className="mt-2 text-sm">
              {error}
            </p>
          </div>
        ) : !hasEntries ? (
          /* First-entry empty state */
          <div className="ink-empty-state space-y-4">
            <BookOpenText
              className="ink-icon-lg"
              aria-hidden="true"
            />

            <div>
              <h3 className="text-lg font-semibold">
                Your library begins here.
              </h3>

              <p className="ink-subtext mt-2 max-w-md text-sm">
                When you save a reflection,
                you'll be able to find it here.
              </p>
            </div>

            <Link
              href="/app/new"
              className="ink-btn ink-btn-primary"
            >
              Write your first reflection
              <ArrowRight
                className="ink-icon-sm"
                aria-hidden="true"
              />
            </Link>
          </div>
        ) : filteredEntries.length === 0 ? (
          /* No search matches */
          <div className="ink-empty-state space-y-4">
            <Filter
              className="ink-icon-lg"
              aria-hidden="true"
            />

            <div>
              <h3 className="text-lg font-semibold">
                No matching reflections.
              </h3>

              <p className="ink-subtext mt-2 text-sm">
                Try another word or clear your filters
                to see more entries.
              </p>
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="ink-btn ink-btn-secondary"
            >
              Clear filters
            </button>
          </div>
        ) : (
          /* Reflection cards */
          <div
            className="grid min-w-0 gap-4 lg:grid-cols-2"
            aria-label="Saved reflection results"
          >
            {filteredEntries.map((entry) => {
              const title = getEntryTitle(entry);
              const preview = formatPreview(entry.body);

              const href = entry.demo
                ? "/auth"
                : `/app/entries/${entry.id}`;

              const dateLabel = formatDate(
                entry.createdAtMs
              );

              return (
                <article
                  key={entry.id}
                  className="min-w-0"
                >
                  <Link
                    href={href}
                    className="
                      ink-card ink-card-link
                      flex h-full min-w-0
                      flex-col gap-4 p-5
                      sm:p-6
                    "
                  >
                    {/* Card heading */}
                    <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <span className="ink-eyebrow">
                          {entry.demo
                            ? "Example reflection"
                            : "Saved reflection"}
                        </span>

                        <h3
                          className="
                            mt-2 text-lg font-semibold
                            leading-snug
                            break-words
                          "
                        >
                          {title}
                        </h3>
                      </div>

                      {entry.mood && (
                        <span
                          className="
                            inline-flex min-h-[36px]
                            max-w-full items-center
                            rounded-full border
                            px-3 py-1 text-sm
                            font-medium
                            break-words
                          "
                          style={{
                            borderColor:
                              "rgb(var(--ink-accent) / 0.4)",
                            background:
                              "rgb(var(--ink-accent) / 0.1)",
                            color:
                              "rgb(var(--ink-text))",
                          }}
                        >
                          {entry.mood}
                        </span>
                      )}
                    </div>

                    {/* Entry preview */}
                    <p className="ink-subtext flex-1 text-sm leading-relaxed">
                      {preview ||
                        "No written preview for this reflection."}
                    </p>

                    {/* Metadata */}
                    <div
                      className="
                        flex flex-wrap items-center
                        justify-between gap-3
                        border-t pt-4
                        text-sm
                      "
                      style={{
                        borderColor:
                          "rgb(var(--ink-border) / 0.6)",
                      }}
                    >
                      <span className="ink-subtext">
                        {entry.mode || "Free note"}
                      </span>

                      {entry.createdAtMs !== null ? (
                        <time
                          dateTime={new Date(
                            entry.createdAtMs
                          ).toISOString()}
                          className="ink-subtext"
                        >
                          {dateLabel}
                        </time>
                      ) : (
                        <span className="ink-subtext">
                          Date unavailable
                        </span>
                      )}
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        )}

        {/* Loaded-results scope */}
        {!isLoading &&
          !error &&
          !isDemo &&
          entries.length === PAGE_LIMIT && (
            <p className="ink-subtext text-sm">
              Showing results from your 50 most recent
              loaded reflections. Older entries aren't
              included in this search yet.
            </p>
          )}
      </section>
    </AppShell>
  );
}