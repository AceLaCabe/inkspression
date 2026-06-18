// src/app/app/entries/[id]/EntryDetailClient.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase";
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

const defaultMoods = [
  "Calm",
  "Anxious",
  "Low",
  "Overwhelmed",
  "Energized",
  "Sad",
];

const writingModes = [
  "One sentence",
  "Brain dump",
  "Tiny check-in",
  "Two-minute release",
  "Momentum note",
  "Soft reflection",
  "Free note",
];

type Mood = string;

function getCustomMoodKey(uid?: string | null) {
  return uid ? `ink_custom_moods_${uid}` : null;
}

function formatFull(d?: Date | null) {
  if (!d) return "Just now";

  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function EntryDetailClient({ id }: { id: string }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mood, setMood] = useState<Mood | null>(null);
  const [mode, setMode] = useState("Free note");
  const [prompt, setPrompt] = useState("");

  const [customMoods, setCustomMoods] = useState<string[]>([]);
  const [createdLabel, setCreatedLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const canEdit = useMemo(() => !loading && !!user, [loading, user]);

  const allMoods = useMemo(() => {
    return [...defaultMoods, ...customMoods];
  }, [customMoods]);

  const wordCount = useMemo(() => {
    return body.trim().split(/\s+/).filter(Boolean).length;
  }, [body]);

  const displayTitle = title.trim() || "Untitled entry";

  useEffect(() => {
    if (!user) {
      setCustomMoods([]);
      return;
    }

    const key = getCustomMoodKey(user.uid);
    if (!key) return;

    const stored = window.localStorage.getItem(key);

    if (!stored) {
      setCustomMoods([]);
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      setCustomMoods(Array.isArray(parsed) ? parsed : []);
    } catch {
      setCustomMoods([]);
    }
  }, [user]);

  useEffect(() => {
    async function load() {
      setError(null);

      if (loading) return;

      if (!id || typeof id !== "string") {
        setBusy(false);
        setError("Invalid entry.");
        return;
      }

      if (!user) {
        setBusy(false);
        setError("Sign in to view saved entries.");
        return;
      }

      setBusy(true);

      try {
        const ref = doc(db, "users", user.uid, "entries", id);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setError("Entry not found.");
          return;
        }

        const data = (snap.data() || {}) as {
          title?: unknown;
          body?: unknown;
          mood?: unknown;
          mode?: unknown;
          prompt?: unknown;
          createdAt?: { toDate?: () => Date };
        };

        setTitle(typeof data.title === "string" ? data.title : "");
        setBody(typeof data.body === "string" ? data.body : "");
        setMood(typeof data.mood === "string" ? data.mood : null);
        setMode(typeof data.mode === "string" ? data.mode : "Free note");
        setPrompt(typeof data.prompt === "string" ? data.prompt : "");

        const ts = data.createdAt?.toDate?.();
        setCreatedLabel(formatFull(ts));
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Could not load entry.";
        setError(message);
      } finally {
        setBusy(false);
      }
    }

    load();
  }, [user, loading, id]);

  async function handleSave() {
    if (!user || !id) return;

    setSaving(true);
    setToast(null);
    setError(null);

    try {
      const ref = doc(db, "users", user.uid, "entries", id);

      await updateDoc(ref, {
        title: title.trim() || null,
        body: body.trim() || "",
        mood: mood ?? null,
        mode: mode || null,
        prompt: prompt.trim() || null,
        updatedAt: serverTimestamp(),
      });

      setToast("Saved softly.");
      window.setTimeout(() => setToast(null), 1600);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Could not save changes.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!user || !id) return;

    const ok = window.confirm("Delete this entry? This can’t be undone.");
    if (!ok) return;

    setDeleting(true);
    setError(null);

    try {
      const ref = doc(db, "users", user.uid, "entries", id);
      await deleteDoc(ref);

      router.push("/app/entries");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Could not delete entry.";
      setError(message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppShell title="Entry">
      <section className="mx-auto max-w-3xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/app/entries" className="ink-link text-sm">
            ← Back to entries
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={!canEdit || deleting || busy}
              className="ink-btn ink-btn-secondary"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={!canEdit || saving || busy}
              className="ink-btn ink-btn-primary"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>

        {busy ? (
          <div className="ink-card-soft p-4 text-sm">
            <span className="ink-subtext">Loading entry…</span>
          </div>
        ) : error ? (
          <div className="ink-alert text-sm">{error}</div>
        ) : (
          <>
            <section className="ink-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] ink-subtext">
                Saved reflection
              </p>

              <h1
                className="mt-1 text-3xl font-semibold tracking-tight"
                style={{ color: "rgb(var(--ink-text))" }}
              >
                {displayTitle}
              </h1>

              <div className="mt-3 flex flex-wrap gap-2">
                {mood ? (
                  <span className="ink-chip ink-chip-active">{mood}</span>
                ) : (
                  <span className="ink-chip">No mood saved</span>
                )}

                {mode ? (
                  <span className="ink-chip">{mode}</span>
                ) : (
                  <span className="ink-chip">Free note</span>
                )}

                <span className="ink-chip">{wordCount} words</span>
              </div>

              <p className="ink-subtext mt-3 text-sm">
                Created {createdLabel}. You can edit this softly without making
                it perfect.
              </p>
            </section>

            <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="ink-card p-5">
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] ink-subtext">
                      Mood
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {allMoods.map((item) => {
                        const selected = item === mood;

                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setMood(selected ? null : item)}
                            className={`ink-chip ${
                              selected ? "ink-chip-active" : ""
                            }`}
                            aria-pressed={selected}
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] ink-subtext">
                      Writing mode
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {writingModes.map((item) => {
                        const selected = item === mode;

                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setMode(item)}
                            className={`ink-chip ${
                              selected ? "ink-chip-active" : ""
                            }`}
                            aria-pressed={selected}
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="ink-card p-5">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] ink-subtext">
                    Title
                  </span>

                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Give this moment a name"
                    className="ink-input mt-3"
                  />
                </label>

                <label className="mt-4 block">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] ink-subtext">
                    Original prompt
                  </span>

                  <input
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder="No prompt saved"
                    className="ink-input mt-3"
                  />
                </label>

                <label className="mt-4 block">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] ink-subtext">
                    Entry
                  </span>

                  <textarea
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    placeholder="Your entry goes here."
                    className="ink-input ink-textarea mt-3 min-h-[16rem]"
                  />
                </label>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs ink-subtext">
                    {wordCount > 0
                      ? `${wordCount} word${
                          wordCount === 1 ? "" : "s"
                        } written.`
                      : "Still empty. One sentence is enough."}
                  </p>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!canEdit || saving || busy}
                    className="ink-btn ink-btn-primary"
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                </div>

                {toast ? (
                  <div className="mt-3 text-sm ink-subtext">{toast}</div>
                ) : null}
              </div>
            </section>
          </>
        )}
      </section>
    </AppShell>
  );
}