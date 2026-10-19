// src/app/app/entries/[id]/EntryDetailClient.tsx

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  BookOpenText,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Pencil,
  Save,
  Trash2,
  X,
} from "lucide-react";

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

type EntryFields = {
  title: string;
  body: string;
  mood: string | null;
  mode: string;
  prompt: string;
};

type EntryDate = {
  createdAt: Date | null;
  updatedAt: Date | null;
};

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

const emptyEntry: EntryFields = {
  title: "",
  body: "",
  mood: null,
  mode: "Free note",
  prompt: "",
};

function getCustomMoodKey(uid: string) {
  return `ink_custom_moods_${uid}`;
}

function parseDate(value: unknown): Date | null {
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    const date = value.toDate();

    if (
      date instanceof Date &&
      !Number.isNaN(date.getTime())
    ) {
      return date;
    }
  }

  return null;
}

function formatDate(date: Date | null) {
  if (!date) return "Date unavailable";

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatDateTime(date: Date | null) {
  if (!date) return "Date unavailable";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function countWords(text: string) {
  return text.trim()
    ? text.trim().split(/\s+/).length
    : 0;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error
    ? error.message
    : fallback;
}

export default function EntryDetailClient({
  id,
}: {
  id: string;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [entry, setEntry] =
    useState<EntryFields>(emptyEntry);

  const [original, setOriginal] =
    useState<EntryFields | null>(null);

  const [dates, setDates] = useState<EntryDate>({
    createdAt: null,
    updatedAt: null,
  });

  const [customMoods, setCustomMoods] =
    useState<string[]>([]);

  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [editing, setEditing] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [confirmDelete, setConfirmDelete] =
    useState(false);

  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const canEdit = !loading && Boolean(user) && !busy;

  const displayTitle =
    entry.title.trim() || "Untitled reflection";

  const wordCount = useMemo(
    () => countWords(entry.body),
    [entry.body]
  );

  const allMoods = useMemo(
    () =>
      Array.from(
        new Set([...defaultMoods, ...customMoods])
      ),
    [customMoods]
  );

  const hasChanges = useMemo(() => {
    if (!original) return false;

    return (
      entry.title !== original.title ||
      entry.body !== original.body ||
      entry.mood !== original.mood ||
      entry.mode !== original.mode ||
      entry.prompt !== original.prompt
    );
  }, [entry, original]);

  const hasContent = Boolean(
    entry.title.trim() || entry.body.trim()
  );

  function updateField<K extends keyof EntryFields>(
    field: K,
    value: EntryFields[K]
  ) {
    setEntry((current) => ({
      ...current,
      [field]: value,
    }));

    setStatus(null);
  }

  // Load the entry and custom moods for this account.
  useEffect(() => {
    let active = true;

    async function loadEntry() {
      if (loading) return;

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBusy(true);
      setError(null);
      setStatus(null);
      setOriginal(null);
      setCustomMoods([]);
      setEditing(false);
      setConfirmDelete(false);

      if (!user) {
        setError("Sign in to view this reflection.");
        setBusy(false);
        return;
      }

      if (!id) {
        setError("This reflection could not be found.");
        setBusy(false);
        return;
      }

      try {
        const stored = localStorage.getItem(
          getCustomMoodKey(user.uid)
        );

        if (stored) {
          const parsed: unknown = JSON.parse(stored);

          if (Array.isArray(parsed)) {
            setCustomMoods(
              parsed.filter(
                (value): value is string =>
                  typeof value === "string"
              )
            );
          }
        }
      } catch {
        // Custom mood storage is optional.
      }

      try {
        const entryRef = doc(
          db,
          "users",
          user.uid,
          "entries",
          id
        );

        const snapshot = await getDoc(entryRef);

        if (!active) return;

        if (!snapshot.exists()) {
          setError("This reflection was not found.");
          return;
        }

        const data = snapshot.data();

        const loaded: EntryFields = {
          title:
            typeof data.title === "string"
              ? data.title
              : "",
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
              : "Free note",
          prompt:
            typeof data.prompt === "string"
              ? data.prompt
              : "",
        };

        setEntry(loaded);
        setOriginal({ ...loaded });

        setDates({
          createdAt: parseDate(data.createdAt),
          updatedAt: parseDate(data.updatedAt),
        });
      } catch (caught: unknown) {
        if (active) {
          setError(
            getErrorMessage(
              caught,
              "Could not load this reflection."
            )
          );
        }
      } finally {
        if (active) setBusy(false);
      }
    }

    loadEntry();

    return () => {
      active = false;
    };
  }, [user, loading, id]);

  function beginEditing() {
    setEditing(true);
    setShowOptions(false);
    setConfirmDelete(false);
    setError(null);
    setStatus(null);
  }

  function cancelEditing() {
    if (hasChanges) {
      const confirmed = window.confirm(
        "Discard your unsaved changes?"
      );

      if (!confirmed) return;
    }

    if (original) {
      setEntry({ ...original });
    }

    setEditing(false);
    setShowOptions(false);
    setError(null);
    setStatus(null);
  }

  function handleBack(
    event: React.MouseEvent<HTMLAnchorElement>
  ) {
    if (editing && hasChanges) {
      const confirmed = window.confirm(
        "Leave without saving your changes?"
      );

      if (!confirmed) {
        event.preventDefault();
      }
    }
  }

  async function handleSave() {
    if (
      !user ||
      !id ||
      !canEdit ||
      saving ||
      deleting ||
      !hasChanges ||
      !hasContent
    ) {
      return;
    }

    setSaving(true);
    setError(null);
    setStatus(null);

    try {
      const entryRef = doc(
        db,
        "users",
        user.uid,
        "entries",
        id
      );

      const saved: EntryFields = {
        title: entry.title.trim(),
        body: entry.body.trim(),
        mood: entry.mood,
        mode: entry.mode || "Free note",
        prompt: entry.prompt.trim(),
      };

      await updateDoc(entryRef, {
        title: saved.title || null,
        body: saved.body,
        mood: saved.mood,
        mode: saved.mode,
        prompt: saved.prompt || null,
        updatedAt: serverTimestamp(),
      });

      setEntry(saved);
      setOriginal({ ...saved });

      setDates((current) => ({
        ...current,
        updatedAt: new Date(),
      }));

      setEditing(false);
      setShowOptions(false);
      setStatus("Your changes have been saved.");
    } catch (caught: unknown) {
      setError(
        getErrorMessage(
          caught,
          "Could not save your changes."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (
      !user ||
      !id ||
      !canEdit ||
      deleting ||
      saving ||
      !confirmDelete
    ) {
      return;
    }

    setDeleting(true);
    setError(null);
    setStatus(null);

    try {
      const entryRef = doc(
        db,
        "users",
        user.uid,
        "entries",
        id
      );

      await deleteDoc(entryRef);

      router.replace("/app/entries");
    } catch (caught: unknown) {
      setError(
        getErrorMessage(
          caught,
          "Could not delete this reflection."
        )
      );

      setDeleting(false);
    }
  }

  return (
    <AppShell title="Reflection">
      <section
        className="mx-auto max-w-3xl space-y-6"
        aria-labelledby="reflection-title"
      >
        {/* Navigation and actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/app/entries"
            className="ink-link inline-flex items-center gap-2 text-sm"
            onClick={handleBack}
          >
            <ArrowLeft
              className="ink-icon-sm"
              aria-hidden="true"
            />
            Back to reflections
          </Link>

          {!busy && !error && !editing && (
            <button
              type="button"
              className="ink-btn ink-btn-secondary"
              disabled={!canEdit}
              onClick={beginEditing}
            >
              <Pencil
                className="ink-icon-sm"
                aria-hidden="true"
              />
              Edit reflection
            </button>
          )}
        </div>

        {/* Loading */}
        {busy ? (
          <div className="ink-card p-6" role="status">
            <p className="ink-subtext">
              Loading your reflection…
            </p>
          </div>
        ) : !original ? (
          <div className="ink-alert" role="alert">
            <p className="font-semibold">
              Reflection unavailable
            </p>

            <p className="mt-2 text-sm">
              {error || "This reflection couldn't be loaded."}
            </p>
          </div>
        ) : (
          <>
            {/* Reflection header */}
            <header className="ink-card space-y-4 p-5 sm:p-7">
              <div>
                <span className="ink-eyebrow">
                  Saved reflection
                </span>

                <h1
                  id="reflection-title"
                  className="mt-2 break-words text-3xl font-semibold"
                >
                  {displayTitle}
                </h1>

                <p className="ink-subtext mt-3 text-sm">
                  Created{" "}
                  <time
                    dateTime={
                      dates.createdAt?.toISOString()
                    }
                    title={formatDateTime(dates.createdAt)}
                  >
                    {formatDate(dates.createdAt)}
                  </time>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {entry.mood && (
                  <span className="ink-chip-accent ink-chip">
                    {entry.mood}
                  </span>
                )}

                <span className="ink-chip-accent ink-chip">
                  {entry.mode || "Free note"}
                </span>

                <span className="ink-subtext text-sm">
                  {wordCount}{" "}
                  {wordCount === 1 ? "word" : "words"}
                </span>
              </div>
            </header>

            {editing ? (
              /* EDITING MODE */
              <section
                className="ink-card space-y-6 p-5 sm:p-7"
                aria-labelledby="edit-heading"
              >
                <div>
                  <span className="ink-eyebrow">
                    Editing
                  </span>

                  <h2
                    id="edit-heading"
                    className="mt-2 text-xl font-semibold"
                  >
                    Edit your reflection
                  </h2>

                  <p className="ink-subtext mt-2 text-sm">
                    Make any changes you'd like.
                    Save when you're finished.
                  </p>
                </div>

                {/* Title */}
                <div>
                  <label
                    htmlFor="edit-reflection-title"
                    className="block text-sm font-semibold"
                  >
                    Title
                  </label>

                  <input
                    id="edit-reflection-title"
                    type="text"
                    className="ink-input mt-2"
                    maxLength={120}
                    value={entry.title}
                    onChange={(event) =>
                      updateField(
                        "title",
                        event.target.value
                      )
                    }
                    placeholder="Name this reflection"
                  />
                </div>

                {/* Mood and writing mode */}
                <div className="ink-card-soft p-4">
                  <button
                    type="button"
                    className="flex min-h-[44px] w-full items-center justify-between gap-3 text-left"
                    aria-expanded={showOptions}
                    aria-controls="reflection-edit-options"
                    onClick={() =>
                      setShowOptions((value) => !value)
                    }
                  >
                    <span className="font-semibold">
                      Feeling and writing mode
                    </span>

                    {showOptions ? (
                      <ChevronUp
                        className="ink-icon"
                        aria-hidden="true"
                      />
                    ) : (
                      <ChevronDown
                        className="ink-icon"
                        aria-hidden="true"
                      />
                    )}
                  </button>

                  <p className="ink-subtext mt-1 text-sm">
                    {entry.mood || "No feeling selected"}
                    {" · "}
                    {entry.mode}
                  </p>

                  {showOptions && (
                    <div
                      id="reflection-edit-options"
                      className="mt-5 space-y-6 border-t pt-5"
                      style={{
                        borderColor:
                          "rgb(var(--ink-border))",
                      }}
                    >
                      <div>
                        <p className="text-sm font-semibold">
                          Feeling
                        </p>

                        <div
                          className="mt-3 flex flex-wrap gap-2"
                          role="group"
                          aria-label="Select a feeling"
                        >
                          {allMoods.map((item) => {
                            const selected =
                              entry.mood === item;

                            return (
                              <button
                                key={item}
                                type="button"
                                className="ink-chip"
                                aria-pressed={selected}
                                onClick={() =>
                                  updateField(
                                    "mood",
                                    selected ? null : item
                                  )
                                }
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
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-semibold">
                          Writing mode
                        </p>

                        <div
                          className="mt-3 flex flex-wrap gap-2"
                          role="group"
                          aria-label="Select a writing mode"
                        >
                          {writingModes.map((item) => (
                            <button
                              key={item}
                              type="button"
                              className="ink-chip"
                              aria-pressed={
                                entry.mode === item
                              }
                              onClick={() =>
                                updateField("mode", item)
                              }
                            >
                              {entry.mode === item && (
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
                </div>

                {/* Original prompt */}
                <div>
                  <label
                    htmlFor="edit-reflection-prompt"
                    className="block text-sm font-semibold"
                  >
                    Writing prompt
                    <span className="ink-subtext ml-2 font-normal">
                      (optional)
                    </span>
                  </label>

                  <input
                    id="edit-reflection-prompt"
                    type="text"
                    className="ink-input mt-2"
                    value={entry.prompt}
                    onChange={(event) =>
                      updateField(
                        "prompt",
                        event.target.value
                      )
                    }
                    placeholder="No prompt saved"
                  />
                </div>

                {/* Reflection body */}
                <div>
                  <label
                    htmlFor="edit-reflection-body"
                    className="block text-sm font-semibold"
                  >
                    Your reflection
                  </label>

                  <textarea
                    id="edit-reflection-body"
                    className="ink-input ink-textarea mt-2 min-h-[300px] w-full leading-relaxed"
                    value={entry.body}
                    onChange={(event) =>
                      updateField(
                        "body",
                        event.target.value
                      )
                    }
                    placeholder="Write what's on your mind…"
                  />
                </div>

                {/* Save and cancel */}
                <div
                  className="flex flex-wrap items-center justify-between gap-3 border-t pt-5"
                  style={{
                    borderColor:
                      "rgb(var(--ink-border))",
                  }}
                >
                  <p className="ink-subtext text-sm">
                    {hasChanges
                      ? "You have unsaved changes."
                      : "No changes yet."}
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      className="ink-btn ink-btn-secondary"
                      disabled={saving}
                      onClick={cancelEditing}
                    >
                      <X
                        className="ink-icon-sm"
                        aria-hidden="true"
                      />
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="ink-btn ink-btn-primary"
                      disabled={
                        !canEdit ||
                        saving ||
                        !hasChanges ||
                        !hasContent
                      }
                      onClick={handleSave}
                    >
                      <Save
                        className="ink-icon-sm"
                        aria-hidden="true"
                      />
                      {saving
                        ? "Saving…"
                        : "Save changes"}
                    </button>
                  </div>
                </div>
              </section>
            ) : (
              /* READING MODE */
              <section
                className="ink-card space-y-6 p-5 sm:p-7"
                aria-labelledby="reading-heading"
              >
                <div>
                  <span className="ink-eyebrow">
                    Your words
                  </span>

                  <h2
                    id="reading-heading"
                    className="sr-only"
                  >
                    Reflection content
                  </h2>
                </div>

                {entry.prompt && (
                  <div className="ink-card-soft p-4 sm:p-5">
                    <span className="ink-eyebrow">
                      Original prompt
                    </span>

                    <p className="mt-3 break-words font-medium">
                      {entry.prompt}
                    </p>
                  </div>
                )}

                {entry.body.trim() ? (
                  <div
                    className="
                      min-w-0
                      whitespace-pre-wrap
                      break-words
                      text-base
                      leading-8
                    "
                  >
                    {entry.body}
                  </div>
                ) : (
                  <p className="ink-subtext">
                    This reflection doesn't have written text.
                  </p>
                )}

                {dates.updatedAt && (
                  <p className="ink-subtext border-t pt-4 text-sm"
                    style={{
                      borderColor:
                        "rgb(var(--ink-border))",
                    }}
                  >
                    Last updated{" "}
                    <time
                      dateTime={dates.updatedAt.toISOString()}
                    >
                      {formatDateTime(dates.updatedAt)}
                    </time>
                  </p>
                )}
              </section>
            )}

            {/* Save feedback and errors */}
            {status && (
              <div
                className="ink-alert flex items-start gap-3"
                role="status"
                aria-live="polite"
              >
                <CheckCircle2
                  className="ink-icon"
                  aria-hidden="true"
                />
                <p>{status}</p>
              </div>
            )}

            {error && (
              <div
                className="ink-alert"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* Secondary deletion action */}
            {!editing && (
              <section
                className="border-t pt-5"
                style={{
                  borderColor: "rgb(var(--ink-border))",
                }}
                aria-labelledby="manage-reflection-heading"
              >
                <h2
                  id="manage-reflection-heading"
                  className="text-sm font-semibold"
                >
                  Manage reflection
                </h2>

                {!confirmDelete ? (
                  <button
                    type="button"
                    className="ink-btn ink-btn-secondary mt-3"
                    disabled={!canEdit}
                    onClick={() =>
                      setConfirmDelete(true)
                    }
                  >
                    <Trash2
                      className="ink-icon-sm"
                      aria-hidden="true"
                    />
                    Delete reflection
                  </button>
                ) : (
                  <div
                    className="ink-alert mt-4 space-y-4"
                    aria-labelledby="confirm-delete-heading"
                  >
                    <div>
                      <h3
                        id="confirm-delete-heading"
                        className="font-semibold"
                      >
                        Delete this reflection?
                      </h3>

                      <p className="mt-2 break-words text-sm">
                        "{displayTitle}" will be permanently
                        deleted from your saved reflections.
                        This action cannot be undone.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        className="ink-btn ink-btn-secondary"
                        disabled={deleting}
                        onClick={() =>
                          setConfirmDelete(false)
                        }
                      >
                        Keep reflection
                      </button>

                      <button
                        type="button"
                        className="ink-btn ink-btn-danger"
                        disabled={deleting}
                        onClick={handleDelete}
                      >
                        <Trash2
                          className="ink-icon-sm"
                          aria-hidden="true"
                        />
                        {deleting
                          ? "Deleting…"
                          : "Yes, delete"}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </section>
    </AppShell>
  );
}