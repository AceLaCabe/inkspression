// src/app/app/entries/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";

type Entry = {
  id: string;
  title: string | null;
  bodyPreview: string | null;
  mood: string | null;
  mode: string | null;
  createdAtLabel: string;
  createdAtMs: number;
};

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

function getCustomMoodKey(uid?: string | null) {
  return uid ? `ink_custom_moods_${uid}` : null;
}

function formatRelative(d?: Date | null) {
  if (!d) return "Just now";

  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;

  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;

  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

function makePreview(value?: unknown) {
  if (typeof value !== "string") return null;

  const cleaned = value.trim().replace(/\s+/g, " ");
  if (!cleaned) return null;

  return cleaned.length > 110 ? `${cleaned.slice(0, 110)}…` : cleaned;
}

export default function EntriesPage() {
  const { user, loading } = useAuth();

  const demo = useMemo<Entry[]>(
    () => [
      {
        id: "demo-1",
        title: "A small win",
        bodyPreview: "I did one thing I kept avoiding, and it counted.",
        mood: "Calm",
        mode: "One sentence",
        createdAtLabel: "Today",
        createdAtMs: Date.now(),
      },
      {
        id: "demo-2",
        title: "Overthinking spiral",
        bodyPreview: "My thoughts kept circling, so I let them land somewhere soft.",
        mood: "Anxious",
        mode: "Brain dump",
        createdAtLabel: "Yesterday",
        createdAtMs: Date.now() - 86400000,
      },
      {
        id: "demo-3",
        title: "Soft reset",
        bodyPreview: "I did not have much to say, but I showed up anyway.",
        mood: "Low",
        mode: "Tiny check-in",
        createdAtLabel: "2 days ago",
        createdAtMs: Date.now() - 2 * 86400000,
      },
    ],
    []
  );

  const [items, setItems] = useState<Entry[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [searchText, setSearchText] = useState("");
  const [moodFilter, setMoodFilter] = useState("All");
  const [modeFilter, setModeFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [customMoods, setCustomMoods] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      setCustomMoods([]);
      return;
    }

    const key = getCustomMoodKey(user.uid);
    if (!key) return;

    const stored = window.localStorage.getItem(key);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      setCustomMoods(Array.isArray(parsed) ? parsed : []);
    } catch {
      setCustomMoods([]);
    }
  }, [user]);

  useEffect(() => {
    async function load() {
      setErr(null);

      if (loading) return;

      if (!user) {
        setItems(demo);
        return;
      }

      setBusy(true);

      try {
        const q = query(
          collection(db, "users", user.uid, "entries"),
          orderBy("createdAt", "desc"),
          limit(50)
        );

        const snap = await getDocs(q);

        const rows: Entry[] = snap.docs.map((docSnap) => {
          const data = (docSnap.data() || {}) as {
            title?: unknown;
            body?: unknown;
            mood?: unknown;
            mode?: unknown;
            createdAt?: { toDate?: () => Date };
          };

          const ts = data.createdAt?.toDate?.();

          return {
            id: docSnap.id,
            title: typeof data.title === "string" ? data.title : null,
            bodyPreview: makePreview(data.body),
            mood: typeof data.mood === "string" ? data.mood : null,
            mode: typeof data.mode === "string" ? data.mode : null,
            createdAtLabel: formatRelative(ts),
            createdAtMs: ts ? ts.getTime() : 0,
          };
        });

        setItems(rows);
      } catch (error: any) {
        setErr(error?.message ?? "Could not load entries.");
      } finally {
        setBusy(false);
      }
    }

    load();
  }, [user, loading, demo]);

  const moodOptions = useMemo(() => {
    const moodsFromEntries = items
      .map((entry) => entry.mood)
      .filter((mood): mood is string => Boolean(mood));

    return [
      "All",
      ...Array.from(new Set([...defaultMoods, ...moodsFromEntries, ...customMoods])),
    ];
  }, [items, customMoods]);

  const modeOptions = useMemo(() => {
    const modesFromEntries = items
      .map((entry) => entry.mode)
      .filter((mode): mode is string => Boolean(mode));

    return ["All", ...Array.from(new Set([...defaultModes, ...modesFromEntries]))];
  }, [items]);

  const filteredItems = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    const filtered = items.filter((entry) => {
      const title = entry.title?.toLowerCase() ?? "";
      const mood = entry.mood?.toLowerCase() ?? "";
      const mode = entry.mode?.toLowerCase() ?? "";
      const preview = entry.bodyPreview?.toLowerCase() ?? "";

      const matchesSearch =
        !search ||
        title.includes(search) ||
        mood.includes(search) ||
        mode.includes(search) ||
        preview.includes(search);

      const matchesMood =
        moodFilter === "All" ? true : entry.mood === moodFilter;

      const matchesMode =
        modeFilter === "All" ? true : entry.mode === modeFilter;

      return matchesSearch && matchesMood && matchesMode;
    });

    return [...filtered].sort((a, b) => {
      if (sortOrder === "newest") return b.createdAtMs - a.createdAtMs;
      return a.createdAtMs - b.createdAtMs;
    });
  }, [items, searchText, moodFilter, modeFilter, sortOrder]);

  const hasFilters =
    searchText.trim() !== "" ||
    moodFilter !== "All" ||
    modeFilter !== "All" ||
    sortOrder !== "newest";

  const statusText = loading
    ? "Loading entries."
    : busy
      ? "Loading entries."
      : err
        ? `Error loading entries: ${err}`
        : filteredItems.length === 0
          ? items.length === 0
            ? "No entries yet."
            : "No entries match your search or filter."
          : `${filteredItems.length} ${
              filteredItems.length === 1 ? "entry" : "entries"
            } shown.`;

  function clearFilters() {
    setSearchText("");
    setMoodFilter("All");
    setModeFilter("All");
    setSortOrder("newest");
  }

  return (
    <AppShell title="Entries">
      <section className="space-y-5" aria-describedby="entries-page-status">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] ink-subtext">
              Reflection library
            </p>

            <h1
              className="mt-1 text-3xl font-semibold tracking-tight"
              style={{ color: "rgb(var(--ink-text))" }}
            >
              Saved reflections
            </h1>

            <p className="ink-subtext mt-2 max-w-xl text-sm">
              {loading
                ? "Loading your reflections…"
                : user
                  ? "A soft place to return to what you felt, noticed, and wrote."
                  : "Demo entries are available while you explore."}
            </p>
          </div>

          <Link
            href="/app/new"
            className="ink-btn ink-btn-primary inline-flex shrink-0"
          >
            New entry
          </Link>
        </div>

        <p id="entries-page-status" className="sr-only" aria-live="polite">
          {statusText}
        </p>

        <fieldset className="ink-card p-4">
          <legend
            className="text-sm font-semibold"
            style={{ color: "rgb(var(--ink-text))" }}
          >
            Find a reflection
          </legend>

          <div className="mt-3 grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.75fr]">
            <div>
              <label
                htmlFor="entry-search"
                className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] ink-subtext"
              >
                Search
              </label>

              <input
                id="entry-search"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Title, mood, mode, or words"
                className="ink-input"
                type="search"
                autoComplete="off"
              />
            </div>

            <div>
              <label
                htmlFor="entry-mood-filter"
                className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] ink-subtext"
              >
                Mood
              </label>

              <select
                id="entry-mood-filter"
                value={moodFilter}
                onChange={(event) => setMoodFilter(event.target.value)}
                className="ink-input"
              >
                {moodOptions.map((mood) => (
                  <option key={mood} value={mood}>
                    {mood}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="entry-mode-filter"
                className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] ink-subtext"
              >
                Mode
              </label>

              <select
                id="entry-mode-filter"
                value={modeFilter}
                onChange={(event) => setModeFilter(event.target.value)}
                className="ink-input"
              >
                {modeOptions.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="entry-sort-order"
                className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] ink-subtext"
              >
                Sort
              </label>

              <select
                id="entry-sort-order"
                value={sortOrder}
                onChange={(event) =>
                  setSortOrder(event.target.value as "newest" | "oldest")
                }
                className="ink-input"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </div>
          </div>

          {hasFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="ink-btn ink-btn-secondary mt-3"
            >
              Clear filters
            </button>
          ) : null}
        </fieldset>

        {err ? (
          <div className="ink-alert text-sm" role="alert">
            {err}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2" aria-label="Entry results">
          {busy ? (
            <div className="ink-card-soft p-5 text-sm md:col-span-2" aria-live="polite">
              <span className="ink-subtext">Loading entries…</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="ink-card p-6 md:col-span-2">
              <div
                className="text-base font-semibold"
                style={{ color: "rgb(var(--ink-text))" }}
              >
                {items.length === 0
                  ? "No reflections yet."
                  : "No reflections match that filter."}
              </div>

              <p className="ink-subtext mt-2 text-sm">
                {items.length === 0
                  ? "Start with one sentence. This space will collect your check-ins gently."
                  : "Try clearing the filters or searching a softer word."}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {items.length === 0 ? (
                  <Link href="/app/new" className="ink-btn ink-btn-primary">
                    Write first entry
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="ink-btn ink-btn-secondary"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            filteredItems.map((entry) => {
              const href = entry.id.startsWith("demo-")
                ? "/auth"
                : `/app/entries/${entry.id}`;

              const entryTitle =
                typeof entry.title === "string" && entry.title.trim()
                  ? entry.title
                  : "Untitled entry";

              const entryMeta = [
                entry.mood,
                entry.mode,
                entry.createdAtLabel,
              ].filter(Boolean);

              return (
                <Link
                  key={entry.id}
                  href={href}
                  className="ink-card ink-card-link p-5 hover:-translate-y-0.5 hover:shadow-md"
                  aria-label={`${entryTitle}. ${entryMeta.join(". ")}. ${
                    user ? "Saved entry." : "Demo entry."
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] ink-subtext">
                        {user ? "Saved reflection" : "Demo reflection"}
                      </p>

                      <h2
                        className="mt-1 truncate text-base font-semibold tracking-tight"
                        style={{ color: "rgb(var(--ink-text))" }}
                      >
                        {entryTitle}
                      </h2>
                    </div>

                    {entry.mood ? (
                      <span className="ink-chip ink-chip-accent shrink-0">
                        {entry.mood}
                      </span>
                    ) : null}
                  </div>

                  {entry.bodyPreview ? (
                    <p className="ink-subtext mt-3 line-clamp-2 text-sm">
                      {entry.bodyPreview}
                    </p>
                  ) : (
                    <p className="ink-subtext mt-3 text-sm">
                      No preview saved for this entry.
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs ink-subtext">
                    <span>{entry.mode ?? "Free note"}</span>
                    <span>{entry.createdAtLabel}</span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </section>
    </AppShell>
  );
}