// // src/app/app/new/page.tsx
// "use client";

// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { useEffect, useMemo, useState } from "react";
// import AppShell from "@/components/AppShell";
// import { useAuth } from "@/components/AuthProvider";
// import { db } from "@/lib/firebase";
// import { addDoc, collection, serverTimestamp } from "firebase/firestore";

// const defaultMoods = [
//   "Calm",
//   "Anxious",
//   "Low",
//   "Overwhelmed",
//   "Energized",
//   "Sad",
// ];

// type Mood = string;

// function getCustomMoodKey(uid?: string | null) {
//   return uid ? `ink_custom_moods_${uid}` : null;
// }

// export default function NewEntryPage() {
//   const { user, loading } = useAuth();
//   const router = useRouter();

//   const [title, setTitle] = useState("");
//   const [body, setBody] = useState("");

//   const [mood, setMood] = useState<Mood | null>(null);
//   const [customMoods, setCustomMoods] = useState<string[]>([]);

//   const [addingMood, setAddingMood] = useState(false);
//   const [newMood, setNewMood] = useState("");

//   const [saving, setSaving] = useState(false);
//   const [showGate, setShowGate] = useState(false);
//   const [toast, setToast] = useState<string | null>(null);

//   const allMoods = [...defaultMoods, ...customMoods];

//   useEffect(() => {
//     const saved = sessionStorage.getItem("ink_mood");
//     if (saved) setMood(saved);
//   }, []);

//   useEffect(() => {
//     if (!user) {
//       setCustomMoods([]);
//       return;
//     }

//     const key = getCustomMoodKey(user.uid);
//     if (!key) return;

//     const stored = localStorage.getItem(key);
//     if (!stored) {
//       setCustomMoods([]);
//       return;
//     }

//     try {
//       const parsed = JSON.parse(stored);
//       if (Array.isArray(parsed)) {
//         setCustomMoods(parsed);
//       } else {
//         setCustomMoods([]);
//       }
//     } catch {
//       setCustomMoods([]);
//     }
//   }, [user]);

//   const canSave = useMemo(() => {
//     if (loading || !user) return false;
//     return Boolean(title.trim() || body.trim());
//   }, [loading, user, title, body]);

//   async function handleSave() {
//     if (loading) return;

//     if (!user) {
//       setShowGate(true);
//       return;
//     }

//     if (!canSave) return;

//     setSaving(true);
//     setToast(null);

//     try {
//       await addDoc(collection(db, "users", user.uid, "entries"), {
//         title: title.trim() || null,
//         body: body.trim() || "",
//         mood: mood ?? null,
//         createdAt: serverTimestamp(),
//         updatedAt: serverTimestamp(),
//       });

//       router.push("/app/entries");
//     } catch (e: any) {
//       setToast(e?.message ?? "Could not save entry.");
//     } finally {
//       setSaving(false);
//     }
//   }

//   function handleAddMood() {
//     const trimmed = newMood.trim();
//     if (!trimmed) return;

//     if (allMoods.some((m) => m.toLowerCase() === trimmed.toLowerCase())) {
//       setMood(trimmed);
//       sessionStorage.setItem("ink_mood", trimmed);
//       setNewMood("");
//       setAddingMood(false);
//       return;
//     }

//     const updated = [...customMoods, trimmed];
//     setCustomMoods(updated);

//     const key = getCustomMoodKey(user?.uid);
//     if (key) {
//       localStorage.setItem(key, JSON.stringify(updated));
//     }

//     setMood(trimmed);
//     sessionStorage.setItem("ink_mood", trimmed);

//     setNewMood("");
//     setAddingMood(false);
//   }

//   return (
//     <AppShell title="New entry">
//   <section className="mx-auto max-w-2xl space-y-6">

//     {/* Mood */}
//     <div className="space-y-3">
//       <div className="text-sm ink-muted">
//         How are you feeling?
//       </div>

//       <div className="flex flex-wrap gap-2">
//         {allMoods.map((m) => {
//           const selected = m === mood;

//           return (
//             <button
//               key={m}
//               type="button"
//               onClick={() => {
//                 const next = selected ? null : m;
//                 setMood(next);
//                 if (next) sessionStorage.setItem("ink_mood", next);
//                 else sessionStorage.removeItem("ink_mood");
//               }}
//               className={`ink-chip ${selected ? "ink-chip-active" : ""}`}
//             >
//               {m}
//             </button>
//           );
//         })}

//         <button
//           type="button"
//           onClick={() => setAddingMood(true)}
//           className="ink-chip ink-chip-action"
//         >
//           + Custom
//         </button>
//       </div>

//       {addingMood && (
//         <div className="flex gap-2">
//           <input
//             value={newMood}
//             onChange={(e) => setNewMood(e.target.value)}
//             placeholder="Name your feeling..."
//             className="ink-input"
//           />

//           <button
//             type="button"
//             onClick={handleAddMood}
//             className="ink-btn ink-btn-primary"
//           >
//             Add
//           </button>
//         </div>
//       )}
//     </div>

//     {/* Title */}
//     <div>
//       <input
//         value={title}
//         onChange={(e) => setTitle(e.target.value)}
//         placeholder="Give this moment a name (optional)"
//         className="ink-input text-base"
//       />
//     </div>

//     {/* Body (MAIN FOCUS) */}
//     <div>
//       <textarea
//         value={body}
//         onChange={(e) => setBody(e.target.value)}
//         placeholder="No pressure. Start with one sentence."
//         className="ink-input ink-textarea text-base"
//       />
//     </div>

//     {/* Footer */}
//     <div className="flex items-center justify-between">
//       <span className="text-xs ink-muted">
//         Write the smallest true thing.
//       </span>

//       <button
//         onClick={handleSave}
//         disabled={saving || loading}
//         className="ink-btn ink-btn-primary"
//       >
//         {saving ? "Saving…" : "Save"}
//       </button>
//     </div>

//     {toast && (
//       <div className="text-sm ink-subtext">
//         {toast}
//       </div>
//     )}
//   </section>
// </AppShell>
//   );
// }

// src/app/app/new/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

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
    if (loading) return;

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
        prompt: prompt || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      router.push("/app/entries");
    } catch (error: any) {
      setToast(error?.message ?? "Could not save entry.");
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
        <div className="ink-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] ink-subtext">
            Gentle entry
          </p>

          <h1
            className="mt-1 text-3xl font-semibold tracking-tight"
            style={{ color: "rgb(var(--ink-text))" }}
          >
            Start with what’s here.
          </h1>

          <p className="ink-subtext mt-2 max-w-xl text-sm">
            You do not need a complete thought. One honest sentence counts.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
          <section className="ink-card p-5">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] ink-subtext">
                  Mood
                </p>

                <h2
                  className="mt-1 text-lg font-semibold tracking-tight"
                  style={{ color: "rgb(var(--ink-text))" }}
                >
                  How are you arriving?
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                {allMoods.map((item) => {
                  const selected = item === mood;

                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleMoodToggle(item)}
                      className={`ink-chip ${selected ? "ink-chip-active" : ""}`}
                      aria-pressed={selected}
                    >
                      {item}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setAddingMood((current) => !current)}
                  className={`ink-chip ink-chip-action ${
                    addingMood ? "ink-chip-active" : ""
                  }`}
                  aria-pressed={addingMood}
                >
                  + Custom
                </button>
              </div>

              {addingMood ? (
                <div
                  className="rounded-2xl border p-3"
                  style={{ borderColor: "rgb(var(--ink-border))" }}
                >
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <label className="block flex-1">
                      <span className="sr-only">Name your feeling</span>

                      <input
                        value={newMood}
                        onChange={(event) => setNewMood(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            handleAddMood();
                          }
                        }}
                        placeholder="Name your feeling..."
                        className="ink-input"
                        maxLength={24}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleAddMood}
                      disabled={!newMood.trim()}
                      className="ink-btn ink-btn-primary"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ) : null}

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] ink-subtext">
                  Writing mode
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
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
          </section>

          <section className="ink-card p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] ink-subtext">
              Suggested prompt
            </p>

            <div
              className="mt-3 rounded-2xl p-4"
              style={{ background: "rgb(var(--ink-muted-surface))" }}
            >
              <p
                className="text-lg font-semibold leading-snug tracking-tight"
                style={{ color: "rgb(var(--ink-text))" }}
              >
                {prompt}
              </p>

              <p className="ink-subtext mt-2 text-sm">
                Use this, ignore it, or write beside it. The prompt is only a
                doorway.
              </p>
            </div>

            <label className="mt-4 block">
              <span className="sr-only">Entry title</span>

              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Give this moment a name (optional)"
                className="ink-input text-base"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] ink-subtext">
                Write it out
              </span>

              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="No pressure. Start with one sentence."
                className="ink-input ink-textarea mt-3 min-h-[14rem] text-base"
              />
            </label>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs ink-subtext">
                {wordCount > 0
                  ? `${wordCount} word${wordCount === 1 ? "" : "s"} written.`
                  : "Write the smallest true thing."}
              </div>

              <div className="flex flex-wrap gap-2">
                <Link href="/app" className="ink-btn ink-btn-secondary">
                  Back
                </Link>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || loading || !canWrite}
                  className="ink-btn ink-btn-primary"
                >
                  {saving ? "Saving…" : "Save entry"}
                </button>
              </div>
            </div>

            {showGate ? (
              <div
                className="mt-4 rounded-2xl border p-4"
                style={{
                  borderColor: "rgb(var(--ink-border))",
                  background: "rgb(var(--ink-muted-surface))",
                }}
              >
                <div
                  className="text-sm font-semibold"
                  style={{ color: "rgb(var(--ink-text))" }}
                >
                  Sign in to save this entry.
                </div>

                <p className="ink-subtext mt-1 text-sm">
                  You can explore the writing flow without an account. Saving
                  entries needs sign in.
                </p>

                <Link
                  href="/auth"
                  className="ink-btn ink-btn-primary mt-3 inline-flex"
                >
                  Sign in
                </Link>
              </div>
            ) : null}

            {toast ? (
              <div className="mt-3 text-sm ink-subtext">{toast}</div>
            ) : null}
          </section>
        </div>
      </section>
    </AppShell>
  );
}