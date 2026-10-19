
// src/app/app/new/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Feather,
  Pencil,
  Plus,
  X,
} from "lucide-react";

import {
  useEntryDraft,
  type EntryDraft,
} from "@/hooks/useEntryDraft";

import {
  RotateCcw,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

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

function normalizeMoodLabel(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

export default function NewEntryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const [mood, setMood] = useState<Mood | null>(null);
  const [mode, setMode] = useState("Free note");
  const [prompt, setPrompt] = useState("What is here right now?");
  const [showWritingOptions, setShowWritingOptions] =
  useState(false);

const [showPrompt, setShowPrompt] = useState(true);

  const [customMoods, setCustomMoods] = useState<string[]>([]);
  const [addingMood, setAddingMood] = useState(false);
  const [newMood, setNewMood] = useState("");
  




  const [saving, setSaving] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const allMoods = useMemo(() => {
    return [...defaultMoods, ...customMoods];
  }, [customMoods]);

  const canWrite = Boolean(title.trim() || body.trim());

  const wordCount = useMemo(() => {
    return body.trim().split(/\s+/).filter(Boolean).length;
  }, [body]);
  const draftFields = useMemo(
  () => ({
    title,
    body,
    mood,
    mode,
    prompt,
    showPrompt,
  }),
  [title, body, mood, mode, prompt, showPrompt]
);

const {
  ready: draftReady,
  recovery,
  saveStatus,
  restoreDraft,
  discardDraft,
  clearSavedDraft,
} = useEntryDraft({
  uid: user?.uid ?? null,
  loading,
  fields: draftFields,

  onRestore: (draft: EntryDraft) => {
    setTitle(draft.title);
    setBody(draft.body);
    setMood(draft.mood);
    setMode(draft.mode);
    setPrompt(draft.prompt);
    setShowPrompt(draft.showPrompt);

    if (draft.mood) {
      sessionStorage.setItem("ink_mood", draft.mood);
    } else {
      sessionStorage.removeItem("ink_mood");
    }
  },
});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const urlMood = params.get("mood");
    const urlMode = params.get("mode");
    const urlPrompt = params.get("prompt");

    if (urlMood) {
      setMood(urlMood);
      window.sessionStorage.setItem("ink_mood", urlMood);
    } else {
      const savedMood = window.sessionStorage.getItem("ink_mood");
      if (savedMood) setMood(savedMood);
    }

    if (urlMode) setMode(urlMode);
    if (urlPrompt) setPrompt(urlPrompt);
  }, []);

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

async function handleSave() {
  if (loading || !draftReady || recovery || saving) return;

    if (!user) {
      setShowGate(true);
      return;
    }

    if (!canWrite) return;

    setSaving(true);
    setToast(null);

    try {
      await addDoc(collection(db, "users", user.uid, "entries"), {
        title: title.trim() || null,
        body: body.trim(),
        mood: mood ?? null,
        mode: mode || null,
        prompt: showPrompt ? prompt || null : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
clearSavedDraft();
router.push("/app/entries");
   } catch (error: unknown) {
  setToast(
    error instanceof Error
      ? error.message
      : "Could not save your reflection. Please try again."
  );
} finally {
      setSaving(false);
    }
  }

  function handleMoodToggle(nextMood: string) {
    const next = mood === nextMood ? null : nextMood;

    setMood(next);

    if (next) {
      window.sessionStorage.setItem("ink_mood", next);
    } else {
      window.sessionStorage.removeItem("ink_mood");
    }
  }

  function handleAddMood() {
    const normalized = normalizeMoodLabel(newMood);
    if (!normalized) return;

    const existing = allMoods.find(
      (item) => item.toLowerCase() === normalized.toLowerCase()
    );

    if (existing) {
      setMood(existing);
      window.sessionStorage.setItem("ink_mood", existing);
      setNewMood("");
      setAddingMood(false);
      return;
    }

    const updated = [...customMoods, normalized];
    setCustomMoods(updated);

    const key = getCustomMoodKey(user?.uid);
    if (key) {
      window.localStorage.setItem(key, JSON.stringify(updated));
    }

    setMood(normalized);
    window.sessionStorage.setItem("ink_mood", normalized);

    setNewMood("");
    setAddingMood(false);
  }

  return (
  <AppShell title="New entry">
    <section className="mx-auto max-w-3xl space-y-5">

      {/* Page introduction */}
      <header className="space-y-3">
        <Link
          href="/app"
          className="ink-link inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft
            className="ink-icon-sm"
            aria-hidden="true"
          />
          Back to dashboard
        </Link>

        <div className="flex items-start gap-3">
          <div
            className="ink-icon-badge shrink-0"
            aria-hidden="true"
          >
            <Feather className="ink-icon-lg" />
          </div>

          <div>
            <span className="ink-eyebrow">
              Gentle entry
            </span>

            <h1 className="mt-2 text-3xl font-semibold">
              Start with what's here.
            </h1>

            <p className="ink-subtext mt-2 text-sm">
              You don't need a complete thought.
              One honest sentence is enough.
            </p>
          </div>
        </div>
      </header>
      {/* Unfinished draft recovery */}
{recovery && (
  <section
    className="ink-panel space-y-4"
    aria-labelledby="draft-recovery-title"
  >
    <div className="flex items-start gap-3">
      <div className="ink-icon-badge shrink-0">
        <RotateCcw
          className="ink-icon"
          aria-hidden="true"
        />
      </div>

      <div>
        <h2
          id="draft-recovery-title"
          className="text-lg font-semibold"
        >
          Your words are still here.
        </h2>

        <p className="ink-subtext mt-2 text-sm">
          You have an unfinished reflection.
          Would you like to pick up where you left off?
        </p>

        <p className="ink-subtext mt-2 text-sm">
          Last saved{" "}
          {new Date(
            recovery.draft.updatedAt
          ).toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      </div>
    </div>

    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        className="ink-btn ink-btn-primary"
        onClick={restoreDraft}
      >
        <RotateCcw
          className="ink-icon-sm"
          aria-hidden="true"
        />
        Continue writing
      </button>

      <button
        type="button"
        className="ink-btn ink-btn-secondary"
        onClick={discardDraft}
      >
        <Trash2
          className="ink-icon-sm"
          aria-hidden="true"
        />
        Start fresh
      </button>
    </div>

    <p className="ink-subtext text-sm">
      Starting fresh will discard this unfinished
      reflection from your browser.
    </p>
  </section>
)}

      {/* Primary writing space */}
     {draftReady && !recovery && (
  <section
    className="ink-card space-y-6 p-5 sm:p-7"
    aria-labelledby="writing-heading"
  >

        {/* Selected mood and mode */}
        <div
          className="rounded-2xl p-4"
          style={{
            background: "rgb(var(--ink-surface-soft))",
            border: "1px solid rgb(var(--ink-border))",
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="ink-eyebrow">
                Your starting point
              </span>

              <div className="mt-3 flex flex-wrap gap-2">
                {mood && (
                  <span className="ink-chip-accent ink-chip">
                    <Check
                      className="ink-icon-sm"
                      aria-hidden="true"
                    />
                    {mood}
                  </span>
                )}

                <span className="ink-chip-accent ink-chip">
                  {mode}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="ink-btn ink-btn-secondary"
              aria-expanded={showWritingOptions}
              aria-controls="writing-options"
              onClick={() =>
                setShowWritingOptions((value) => !value)
              }
            >
              <Pencil
                className="ink-icon-sm"
                aria-hidden="true"
              />

              {showWritingOptions
                ? "Done"
                : "Change"}

              {showWritingOptions ? (
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
          </div>

          <p className="ink-subtext mt-3 text-sm">
            {mood
              ? "This is where you're beginning, not where you have to stay."
              : "You can write without naming a feeling."}
          </p>
        </div>

        {/* Optional writing preferences */}
        {showWritingOptions && (
          <div
            id="writing-options"
            className="space-y-6 rounded-2xl border p-4 sm:p-5"
            style={{
              borderColor: "rgb(var(--ink-border))",
            }}
          >
            <div>
              <h2 className="text-base font-semibold">
                How are you feeling?
              </h2>

              <p className="ink-subtext mt-2 text-sm">
                You can change your mind at any time.
              </p>

              <div
                className="mt-4 flex flex-wrap gap-2"
                role="group"
                aria-label="Choose a mood"
              >
                {allMoods.map((item) => {
                  const selected = item === mood;

                  return (
                    <button
                      key={item}
                      type="button"
                      className="ink-chip"
                      aria-pressed={selected}
                      onClick={() => handleMoodToggle(item)}
                    >
                      {selected && (
                        <Check
                          className="ink-icon-sm"
                          aria-hidden="true"
                        />
                      )}
                      {item}
                    </button>
                  );
                })}

                <button
                  type="button"
                  className="ink-chip ink-chip-action"
                  aria-expanded={addingMood}
                  aria-controls="new-mood-options"
                  onClick={() =>
                    setAddingMood((value) => !value)
                  }
                >
                  <Plus
                    className="ink-icon-sm"
                    aria-hidden="true"
                  />
                  Another feeling
                </button>
              </div>

              {addingMood && (
                <div
                  id="new-mood-options"
                  className="ink-card-soft mt-4 p-4"
                >
                  <label
                    htmlFor="custom-entry-mood"
                    className="block text-sm font-semibold"
                  >
                    Name your feeling
                  </label>

                  <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                    <input
                      id="custom-entry-mood"
                      value={newMood}
                      maxLength={24}
                      onChange={(event) =>
                        setNewMood(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleAddMood();
                        }
                      }}
                      placeholder="Whatever word feels right"
                      className="ink-input"
                    />

                    <button
                      type="button"
                      className="ink-btn ink-btn-primary"
                      disabled={!newMood.trim()}
                      onClick={handleAddMood}
                    >
                      Add feeling
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div
              className="border-t pt-5"
              style={{
                borderColor: "rgb(var(--ink-border))",
              }}
            >
              <h2 className="text-base font-semibold">
                Writing approach
              </h2>

              <p className="ink-subtext mt-2 text-sm">
                Choose a little structure or none at all.
              </p>

              <div
                className="mt-4 flex flex-wrap gap-2"
                role="group"
                aria-label="Choose a writing mode"
              >
                {writingModes.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="ink-chip"
                    aria-pressed={mode === item}
                    onClick={() => setMode(item)}
                  >
                    {mode === item && (
                      <Check
                        className="ink-icon-sm"
                        aria-hidden="true"
                      />
                    )}
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Optional suggestion */}
        {showPrompt && (
          <aside
            className="ink-card-soft p-4 sm:p-5"
            aria-label="Optional writing prompt"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="ink-eyebrow">
                A thought to begin with
              </span>

              <button
                type="button"
                className="ink-btn ink-btn-secondary"
                aria-label="Dismiss suggested prompt"
                onClick={() => setShowPrompt(false)}
              >
                <X
                  className="ink-icon-sm"
                  aria-hidden="true"
                />
                <span className="hidden sm:inline">
                  Dismiss
                </span>
              </button>
            </div>

            <p className="mt-3 text-lg font-semibold leading-relaxed">
              {prompt}
            </p>

            <p className="ink-subtext mt-2 text-sm">
              Use this question or follow your own thoughts.
            </p>
          </aside>
        )}

        {/* Restore prompt */}
        {!showPrompt && (
          <button
            type="button"
            className="ink-link text-left text-sm"
            onClick={() => setShowPrompt(true)}
          >
            Show suggested prompt
          </button>
        )}

        {/* Editor */}
        <div className="space-y-5">
          <div>
            <label
              htmlFor="entry-title"
              className="block text-sm font-semibold"
            >
              Give this moment a name
              <span className="ink-subtext ml-2 font-normal">
                (optional)
              </span>
            </label>

            <input
              id="entry-title"
              type="text"
              value={title}
              maxLength={120}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="A thought, a feeling, or today's date"
              className="ink-input mt-2"
            />
          </div>

          <div>
            <label
              htmlFor="entry-body"
              id="writing-heading"
              className="block text-sm font-semibold"
            >
              Your reflection
            </label>

            <p className="ink-subtext mt-1 text-sm">
              This space is yours. There's no right length.
            </p>

            <textarea
              id="entry-body"
              value={body}
              onChange={(event) =>
                setBody(event.target.value)
              }
              placeholder="Start wherever your thoughts take you…"
              className="ink-input ink-textarea mt-3 min-h-[280px] w-full resize-y text-base leading-relaxed"
            />
          </div>
        </div>

        {/* Save controls */}
        <div
          className="flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between"
          style={{
            borderColor: "rgb(var(--ink-border))",
          }}
        >
          <div className="space-y-2">
  <p className="ink-subtext text-sm">
    {wordCount > 0
      ? `${wordCount} word${wordCount === 1 ? "" : "s"} written.`
      : "Nothing to prove here."}
  </p>

  {draftReady && !recovery && canWrite && (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 text-sm ink-subtext"
    >
      {saveStatus === "unavailable" ? (
        <>
          <AlertCircle
            className="ink-icon-sm"
            aria-hidden="true"
          />
          Draft couldn't be saved in this browser.
        </>
      ) : saveStatus === "saved" ? (
        <>
          <CheckCircle2
            className="ink-icon-sm"
            aria-hidden="true"
          />
          Draft saved on this device
        </>
      ) : (
        "Your draft saves automatically as you write."
      )}
    </div>
  )}
</div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/app"
              className="ink-btn ink-btn-secondary"
            >
              Back
            </Link>

            <button
              type="button"
              className="ink-btn ink-btn-primary"
              disabled={
  saving ||
  loading ||
  !draftReady ||
  Boolean(recovery) ||
  !canWrite
}
              onClick={handleSave}
            >
              {saving
                ? "Saving reflection…"
                : "Save reflection"}
            </button>
          </div>
        </div>

        {/* Demo sign-in gate */}
        {showGate && (
          <div
            className="ink-alert space-y-3"
            role="status"
          >
            <h3 className="font-semibold">
              Ready to keep this reflection?
            </h3>

            <p className="ink-subtext text-sm">
              You can explore the writing experience
              without an account. Sign in to save
              your entries.
            </p>

            <Link
              href="/auth"
              className="ink-btn ink-btn-primary"
            >
              Sign in to save
            </Link>
          </div>
        )}

        {/* Save error */}
        {toast && (
          <div
            role="alert"
            className="ink-alert"
          >
            {toast}
          </div>
        )}
      </section>)}
    </section>
  </AppShell>
);
}