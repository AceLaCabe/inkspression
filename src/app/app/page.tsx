// // src/app/app/page.tsx
// "use client";

// import Link from "next/link";
// import { useEffect, useMemo, useState } from "react";
// import AppShell from "@/components/AppShell";
// import { useAuth } from "@/components/AuthProvider";
// import { db } from "@/lib/firebase";
// import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";

// const defaultMoods = [
//   "Calm",
//   "Anxious",
//   "Low",
//   "Overwhelmed",
//   "Energized",
//   "Sad",
// ] as const;

// type DefaultMood = (typeof defaultMoods)[number];
// type Mood = DefaultMood | string;

// type CardEntry = { id: string; title: string; meta: string };

// const CURRENT_MOOD_KEY = "ink_mood";

// function getCustomMoodKey(uid?: string | null) {
//   return uid ? `ink_custom_moods_${uid}` : null;
// }

// function formatRelative(d?: Date | null) {
//   if (!d) return "Just now";
//   const diff = Date.now() - d.getTime();
//   const mins = Math.round(diff / 60000);
//   if (mins < 1) return "Just now";
//   if (mins < 60) return `${mins}m ago`;
//   const hrs = Math.round(mins / 60);
//   if (hrs < 24) return `${hrs}h ago`;
//   const days = Math.round(hrs / 24);
//   return `${days}d ago`;
// }

// function normalizeMoodLabel(value: string) {
//   const trimmed = value.trim();
//   if (!trimmed) return "";
//   return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
// }

// const demoRecent: CardEntry[] = [
//   { id: "demo-1", title: "A small win", meta: "Calm · Today" },
//   { id: "demo-2", title: "Overthinking spiral", meta: "Anxious · Yesterday" },
//   { id: "demo-3", title: "Soft reset", meta: "Low · 2 days ago" },
// ];

// export default function DashboardPage() {
//   const { user, loading } = useAuth();

//   const [mood, setMood] = useState<Mood | null>(null);
//   const [customMoods, setCustomMoods] = useState<string[]>([]);
//   const [showCustomMoodInput, setShowCustomMoodInput] = useState(false);
//   const [customMoodInput, setCustomMoodInput] = useState("");
//   const [editingMood, setEditingMood] = useState<string | null>(null);
//   const [editingMoodValue, setEditingMoodValue] = useState("");
//   const [manageCustomMoods, setManageCustomMoods] = useState(false);

//   const [recent, setRecent] = useState<CardEntry[]>(demoRecent);
//   const [busy, setBusy] = useState(false);

//   const allMoods = useMemo(() => {
//     return [...defaultMoods, ...customMoods] as string[];
//   }, [customMoods]);

//   const helperText = useMemo(() => {
//     if (!mood) return "Choose one word. No deep thinking required.";

//     const presetMap: Record<DefaultMood, string> = {
//       Calm: "Stay soft. Keep it simple.",
//       Anxious: "Let it spill out. No structure needed.",
//       Low: "One sentence is enough today.",
//       Overwhelmed: "Tiny steps. Two minutes max.",
//       Energized: "Capture momentum while it’s here.",
//       Sad: "Be gentle. Name what hurts.",
//     };

//     if (defaultMoods.includes(mood as DefaultMood)) {
//       return presetMap[mood as DefaultMood];
//     }

//     return `Start with ${String(mood).toLowerCase()}. Let that be enough for now.`;
//   }, [mood]);

//   useEffect(() => {
//     const savedMood = window.sessionStorage.getItem(CURRENT_MOOD_KEY);
//     if (savedMood) {
//       setMood(savedMood);
//     } else {
//       setMood(null);
//     }
//   }, []);

//   useEffect(() => {
//     if (!user) {
//       setCustomMoods([]);
//       setManageCustomMoods(false);
//       setShowCustomMoodInput(false);
//       setCustomMoodInput("");
//       setEditingMood(null);
//       setEditingMoodValue("");
//       return;
//     }

//     const key = getCustomMoodKey(user.uid);
//     if (!key) {
//       setCustomMoods([]);
//       return;
//     }

//     const stored = window.localStorage.getItem(key);
//     if (!stored) {
//       setCustomMoods([]);
//       return;
//     }

//     try {
//       const parsed = JSON.parse(stored) as string[];
//       if (Array.isArray(parsed)) {
//         setCustomMoods(parsed);
//       } else {
//         setCustomMoods([]);
//       }
//     } catch {
//       setCustomMoods([]);
//     }
//   }, [user]);

//   useEffect(() => {
//     async function loadRecent() {
//       if (loading) return;

//       if (!user) {
//         setRecent(demoRecent);
//         setBusy(false);
//         return;
//       }

//       setBusy(true);
//       try {
//         const q = query(
//           collection(db, "users", user.uid, "entries"),
//           orderBy("createdAt", "desc"),
//           limit(3)
//         );

//         const snap = await getDocs(q);

//         const rows = snap.docs.map((docSnap) => {
//           const data = docSnap.data() as {
//             createdAt?: { toDate?: () => Date };
//             mood?: unknown;
//             title?: unknown;
//           };

//           const ts = data.createdAt?.toDate?.();
//           const entryMood =
//             typeof data.mood === "string" ? data.mood : null;
//           const title =
//             typeof data.title === "string" && data.title.trim()
//               ? data.title.trim()
//               : "Untitled entry";
//           const when = formatRelative(ts);

//           return {
//             id: docSnap.id,
//             title,
//             meta: entryMood ? `${entryMood} · ${when}` : when,
//           };
//         });

//         setRecent(rows.length ? rows : []);
//       } finally {
//         setBusy(false);
//       }
//     }

//     loadRecent();
//   }, [user, loading]);

//   function persistCustomMoods(next: string[]) {
//     setCustomMoods(next);

//     const key = getCustomMoodKey(user?.uid);
//     if (!key) return;

//     window.localStorage.setItem(key, JSON.stringify(next));
//   }

//   function handleMoodSelect(nextMood: string) {
//     setMood(nextMood);
//     window.sessionStorage.setItem(CURRENT_MOOD_KEY, nextMood);
//     setShowCustomMoodInput(false);
//     setCustomMoodInput("");
//     setEditingMood(null);
//     setEditingMoodValue("");
//   }

//   function handleAddCustomMood() {
//     const normalized = normalizeMoodLabel(customMoodInput);
//     if (!normalized) return;

//     const alreadyExists = allMoods.some(
//       (existing) => existing.toLowerCase() === normalized.toLowerCase()
//     );

//     if (!alreadyExists) {
//       const updated = [...customMoods, normalized];
//       persistCustomMoods(updated);
//     }

//     setMood(normalized);
//     window.sessionStorage.setItem(CURRENT_MOOD_KEY, normalized);
//     setCustomMoodInput("");
//     setShowCustomMoodInput(false);
//   }

//   function startEditingMood(targetMood: string) {
//     setEditingMood(targetMood);
//     setEditingMoodValue(targetMood);
//     setShowCustomMoodInput(false);
//   }

//   function handleSaveEditedMood(originalMood: string) {
//     const normalized = normalizeMoodLabel(editingMoodValue);
//     if (!normalized) return;

//     const alreadyExists = allMoods.some(
//       (existing) =>
//         existing.toLowerCase() === normalized.toLowerCase() &&
//         existing.toLowerCase() !== originalMood.toLowerCase()
//     );

//     if (alreadyExists) return;

//     const updated = customMoods.map((item) =>
//       item === originalMood ? normalized : item
//     );

//     persistCustomMoods(updated);

//     if (mood === originalMood) {
//       setMood(normalized);
//       window.sessionStorage.setItem(CURRENT_MOOD_KEY, normalized);
//     }

//     setEditingMood(null);
//     setEditingMoodValue("");
//   }

//   function handleRemoveMood(targetMood: string) {
//     const updated = customMoods.filter((item) => item !== targetMood);
//     persistCustomMoods(updated);

//     if (mood === targetMood) {
//       setMood(null);
//       window.sessionStorage.removeItem(CURRENT_MOOD_KEY);
//     }

//     if (editingMood === targetMood) {
//       setEditingMood(null);
//       setEditingMoodValue("");
//     }
//   }

//   const hasCustomMoods = customMoods.length > 0;

//   return (
//     <AppShell title="Dashboard">
//       <section className="grid gap-4 md:grid-cols-2">
//         <div className="ink-card p-4">
//           <div className="flex items-start justify-between gap-3">
//             <div>
//               <h2
//                 className="text-sm font-semibold"
//                 style={{ color: "rgb(var(--ink-text))" }}
//               >
//                 How are we feeling right now?
//               </h2>
//               <p className="ink-subtext mt-1 text-sm">{helperText}</p>
//             </div>

//             {hasCustomMoods ? (
//               <button
//                 type="button"
//                 onClick={() => setManageCustomMoods((prev) => !prev)}
//                 className="ink-btn ink-btn-secondary"
//               >
//                 {manageCustomMoods ? "Done" : "Manage"}
//               </button>
//             ) : null}
//           </div>

//           <div className="mt-3 flex flex-wrap gap-2">
//             {defaultMoods.map((m) => {
//               const selected = m === mood;

//               return (
//                 <button
//                   key={m}
//                   type="button"
//                   onClick={() => handleMoodSelect(m)}
//                   className={`ink-chip ${selected ? "ink-chip-active" : ""}`}
//                   aria-pressed={selected}
//                 >
//                   {m}
//                 </button>
//               );
//             })}

//             {customMoods.map((m) => {
//               const selected = m === mood;

//               return (
//                 <div key={m} className="flex items-center gap-1">
//                   <button
//                     type="button"
//                     onClick={() => handleMoodSelect(m)}
//                     className={`ink-chip ${selected ? "ink-chip-active" : ""}`}
//                     aria-pressed={selected}
//                   >
//                     {m}
//                   </button>

//                   {manageCustomMoods ? (
//                     <>
//                       <button
//                         type="button"
//                         onClick={() => startEditingMood(m)}
//                         className="ink-chip ink-chip-danger"
//                         aria-label={`Edit ${m}`}
//                         title={`Edit ${m}`}
//                       >
//                         ✎
//                       </button>
//                       <button
//                         type="button"
//                         onClick={() => handleRemoveMood(m)}
//                         className="ink-chip ink-chip-danger"
//                         aria-label={`Remove ${m}`}
//                         title={`Remove ${m}`}
//                       >
//                         ×
//                       </button>
//                     </>
//                   ) : null}
//                 </div>
//               );
//             })}

//             <button
//               type="button"
//               onClick={() => {
//                 setShowCustomMoodInput((prev) => !prev);
//                 setEditingMood(null);
//                 setEditingMoodValue("");
//               }}
//               className={`ink-chip ink-chip-action ${
//                 showCustomMoodInput ? "ink-chip-active" : ""
//               }`}
//               aria-pressed={showCustomMoodInput}
//             >
//               + Custom mood
//             </button>
//           </div>

//           {showCustomMoodInput ? (
//             <div className="mt-3 flex flex-col gap-2 sm:flex-row">
//               <label className="block flex-1">
//                 <span className="sr-only">Add a custom mood</span>
//                 <input
//                   type="text"
//                   value={customMoodInput}
//                   onChange={(e) => setCustomMoodInput(e.target.value)}
//                   onKeyDown={(e) => {
//                     if (e.key === "Enter") {
//                       e.preventDefault();
//                       handleAddCustomMood();
//                     }
//                   }}
//                   placeholder="Add your own mood"
//                   className="ink-input"
//                   maxLength={24}
//                 />
//               </label>

//               <button
//                 type="button"
//                 onClick={handleAddCustomMood}
//                 disabled={!customMoodInput.trim()}
//                 className="ink-btn ink-btn-primary"
//               >
//                 Add mood
//               </button>
//             </div>
//           ) : null}

//           {editingMood ? (
//             <div className="mt-3 flex flex-col gap-2 sm:flex-row">
//               <label className="block flex-1">
//                 <span className="sr-only">Edit custom mood</span>
//                 <input
//                   type="text"
//                   value={editingMoodValue}
//                   onChange={(e) => setEditingMoodValue(e.target.value)}
//                   onKeyDown={(e) => {
//                     if (e.key === "Enter") {
//                       e.preventDefault();
//                       handleSaveEditedMood(editingMood);
//                     }
//                   }}
//                   placeholder="Rename custom mood"
//                   className="ink-input"
//                   maxLength={24}
//                 />
//               </label>

//               <button
//                 type="button"
//                 onClick={() => handleSaveEditedMood(editingMood)}
//                 disabled={!editingMoodValue.trim()}
//                 className="ink-btn ink-btn-primary"
//               >
//                 Save
//               </button>
//             </div>
//           ) : null}

//           {showCustomMoodInput ? (
//             <p className="mt-2 text-xs ink-subtext">
//               Add a mood that feels more true to you. It will stay here for later.
//             </p>
//           ) : editingMood ? (
//             <p className="mt-2 text-xs ink-subtext">
//               Rename your custom mood without losing it from your dashboard.
//             </p>
//           ) : manageCustomMoods ? (
//             <p className="mt-2 text-xs ink-subtext">
//               Use edit or remove to keep your custom moods feeling like you.
//             </p>
//           ) : null}
//         </div>

//         <div className="ink-card p-4">
//           <h2
//             className="text-sm font-semibold"
//             style={{ color: "rgb(var(--ink-text))" }}
//           >
//             One next action
//           </h2>
//           <p className="ink-subtext mt-1 text-sm">
//             Begin when you're ready.
//           </p>

//           <Link href="/app/new" className="ink-btn ink-btn-primary mt-4 inline-flex">
//             Time to write it out
//           </Link>
//         </div>

//         <div className="ink-card p-4 md:col-span-2">
//           <div className="flex items-baseline justify-between gap-3">
//             <h2
//               className="text-sm font-semibold"
//               style={{ color: "rgb(var(--ink-text))" }}
//             >
//               Recent feels
//             </h2>

//             <Link className="ink-link text-sm" href="/app/entries">
//               View all
//             </Link>
//           </div>

//           <div className="mt-4 grid gap-3 md:grid-cols-3">
//             {busy ? (
//               <div className="ink-subtext text-sm">Loading…</div>
//             ) : recent.length === 0 ? (
//               <div className="ink-card-soft p-4 text-sm md:col-span-3">
//                 <span className="ink-subtext">
//                   Nothing here yet. Start when you feel ready.
//                 </span>
//               </div>
//             ) : (
//               recent.map((e) => {
//                 const href = e.id.startsWith("demo-") ? "/auth" : `/app/entries/${e.id}`;

//                 return (
//                   <Link key={e.id} href={href} className="ink-card ink-card-link p-4">
//                     <div
//                       className="text-sm font-semibold"
//                       style={{ color: "rgb(var(--ink-text))" }}
//                     >
//                       {e.title}
//                     </div>
//                     <div className="mt-1 text-xs ink-subtext">{e.meta}</div>
//                   </Link>
//                 );
//               })
//             )}
//           </div>
//         </div>
//       </section>
//     </AppShell>
//   );
// }

// src/app/app/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
} from "firebase/firestore";

const defaultMoods = [
  "Calm",
  "Anxious",
  "Low",
  "Overwhelmed",
  "Energized",
  "Sad",
] as const;

type DefaultMood = (typeof defaultMoods)[number];
type Mood = DefaultMood | string;

type CardEntry = {
  id: string;
  title: string;
  meta: string;
};

type MoodPlan = {
  emoji: string;
  helper: string;
  mode: string;
  action: string;
  prompt: string;
};

const CURRENT_MOOD_KEY = "ink_mood";

const demoRecent: CardEntry[] = [
  {
    id: "demo-1",
    title: "A small win",
    meta: "Calm · One sentence · Today",
  },
  {
    id: "demo-2",
    title: "Overthinking spiral",
    meta: "Anxious · Brain dump · Yesterday",
  },
  {
    id: "demo-3",
    title: "Soft reset",
    meta: "Low · Gentle check-in · 2 days ago",
  },
];

const moodPlans: Record<DefaultMood, MoodPlan> = {
  Calm: {
    emoji: "🌿",
    helper: "Stay soft. Keep it simple.",
    mode: "One sentence",
    action: "Write one honest sentence",
    prompt: "What feels okay enough right now?",
  },
  Anxious: {
    emoji: "🌀",
    helper: "Let it spill out. No structure needed.",
    mode: "Brain dump",
    action: "Unload the spiral",
    prompt: "What thought keeps circling back?",
  },
  Low: {
    emoji: "🌙",
    helper: "One sentence is enough today.",
    mode: "Tiny check-in",
    action: "Name the smallest truth",
    prompt: "What is one thing you can admit gently?",
  },
  Overwhelmed: {
    emoji: "🌫️",
    helper: "Tiny steps. Two minutes max.",
    mode: "Two-minute release",
    action: "Make the noise smaller",
    prompt: "What feels like too much right now?",
  },
  Energized: {
    emoji: "⚡",
    helper: "Capture momentum while it’s here.",
    mode: "Momentum note",
    action: "Catch the spark",
    prompt: "What do you want to use this energy for?",
  },
  Sad: {
    emoji: "💧",
    helper: "Be gentle. Name what hurts.",
    mode: "Soft reflection",
    action: "Write with care",
    prompt: "What needs comfort, not fixing?",
  },
};

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

function normalizeMoodLabel(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

function getMoodPlan(mood: Mood | null): MoodPlan {
  if (mood && defaultMoods.includes(mood as DefaultMood)) {
    return moodPlans[mood as DefaultMood];
  }

  if (mood) {
    return {
      emoji: "✍️",
      helper: `Start with ${String(
        mood
      ).toLowerCase()}. Let that be enough for now.`,
      mode: "Free note",
      action: "Write what feels true",
      prompt: `What does ${String(mood).toLowerCase()} need you to hear?`,
    };
  }

  return {
    emoji: "🌱",
    helper: "Choose one word. No deep thinking required.",
    mode: "Gentle entry",
    action: "Begin when you’re ready",
    prompt: "What is here right now?",
  };
}

export default function DashboardPage() {
  const { user, loading } = useAuth();

  const [profileName, setProfileName] = useState("");
  const [mood, setMood] = useState<Mood | null>(null);
  const [customMoods, setCustomMoods] = useState<string[]>([]);
  const [showCustomMoodInput, setShowCustomMoodInput] = useState(false);
  const [customMoodInput, setCustomMoodInput] = useState("");
  const [editingMood, setEditingMood] = useState<string | null>(null);
  const [editingMoodValue, setEditingMoodValue] = useState("");
  const [manageCustomMoods, setManageCustomMoods] = useState(false);

  const [recent, setRecent] = useState<CardEntry[]>(demoRecent);
  const [busy, setBusy] = useState(false);

  const allMoods = useMemo(() => {
    return [...defaultMoods, ...customMoods] as string[];
  }, [customMoods]);

  const selectedMoodPlan = useMemo(() => getMoodPlan(mood), [mood]);

  const writeHref = useMemo(() => {
    const params = new URLSearchParams();

    if (mood) params.set("mood", mood);
    if (selectedMoodPlan.mode) params.set("mode", selectedMoodPlan.mode);
    if (selectedMoodPlan.prompt) params.set("prompt", selectedMoodPlan.prompt);

    const queryString = params.toString();

    return queryString ? `/app/new?${queryString}` : "/app/new";
  }, [mood, selectedMoodPlan]);

  const hasCustomMoods = customMoods.length > 0;

  const greetingName =
    profileName ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "there";

  useEffect(() => {
    const savedMood = window.sessionStorage.getItem(CURRENT_MOOD_KEY);
    setMood(savedMood || null);
  }, []);

  useEffect(() => {
    async function loadProfileName() {
      if (!user) {
        setProfileName("");
        return;
      }

      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setProfileName("");
          return;
        }

        const data = snap.data() as {
          displayName?: unknown;
        };

        if (typeof data.displayName === "string" && data.displayName.trim()) {
          setProfileName(data.displayName.trim());
        } else {
          setProfileName("");
        }
      } catch {
        setProfileName("");
      }
    }

    loadProfileName();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setCustomMoods([]);
      setManageCustomMoods(false);
      setShowCustomMoodInput(false);
      setCustomMoodInput("");
      setEditingMood(null);
      setEditingMoodValue("");
      return;
    }

    const key = getCustomMoodKey(user.uid);
    if (!key) {
      setCustomMoods([]);
      return;
    }

    const stored = window.localStorage.getItem(key);
    if (!stored) {
      setCustomMoods([]);
      return;
    }

    try {
      const parsed = JSON.parse(stored) as string[];
      setCustomMoods(Array.isArray(parsed) ? parsed : []);
    } catch {
      setCustomMoods([]);
    }
  }, [user]);

  useEffect(() => {
    async function loadRecent() {
      if (loading) return;

      if (!user) {
        setRecent(demoRecent);
        setBusy(false);
        return;
      }

      setBusy(true);

      try {
        const q = query(
          collection(db, "users", user.uid, "entries"),
          orderBy("createdAt", "desc"),
          limit(3)
        );

        const snap = await getDocs(q);

        const rows = snap.docs.map((docSnap) => {
          const data = docSnap.data() as {
            createdAt?: { toDate?: () => Date };
            mood?: unknown;
            title?: unknown;
            mode?: unknown;
          };

          const ts = data.createdAt?.toDate?.();
          const entryMood = typeof data.mood === "string" ? data.mood : null;
          const entryMode = typeof data.mode === "string" ? data.mode : null;

          const title =
            typeof data.title === "string" && data.title.trim()
              ? data.title.trim()
              : "Untitled entry";

          const when = formatRelative(ts);

          const metaParts = [entryMood, entryMode, when].filter(Boolean);

          return {
            id: docSnap.id,
            title,
            meta: metaParts.join(" · "),
          };
        });

        setRecent(rows.length ? rows : []);
      } catch {
        setRecent([]);
      } finally {
        setBusy(false);
      }
    }

    loadRecent();
  }, [user, loading]);

  function persistCustomMoods(next: string[]) {
    setCustomMoods(next);

    const key = getCustomMoodKey(user?.uid);
    if (!key) return;

    window.localStorage.setItem(key, JSON.stringify(next));
  }

  function handleMoodSelect(nextMood: string) {
    setMood(nextMood);
    window.sessionStorage.setItem(CURRENT_MOOD_KEY, nextMood);
    setShowCustomMoodInput(false);
    setCustomMoodInput("");
    setEditingMood(null);
    setEditingMoodValue("");
  }

  function handleAddCustomMood() {
    const normalized = normalizeMoodLabel(customMoodInput);
    if (!normalized) return;

    const alreadyExists = allMoods.some(
      (existing) => existing.toLowerCase() === normalized.toLowerCase()
    );

    if (!alreadyExists) {
      persistCustomMoods([...customMoods, normalized]);
    }

    setMood(normalized);
    window.sessionStorage.setItem(CURRENT_MOOD_KEY, normalized);
    setCustomMoodInput("");
    setShowCustomMoodInput(false);
  }

  function startEditingMood(targetMood: string) {
    setEditingMood(targetMood);
    setEditingMoodValue(targetMood);
    setShowCustomMoodInput(false);
  }

  function handleSaveEditedMood(originalMood: string) {
    const normalized = normalizeMoodLabel(editingMoodValue);
    if (!normalized) return;

    const alreadyExists = allMoods.some(
      (existing) =>
        existing.toLowerCase() === normalized.toLowerCase() &&
        existing.toLowerCase() !== originalMood.toLowerCase()
    );

    if (alreadyExists) return;

    const updated = customMoods.map((item) =>
      item === originalMood ? normalized : item
    );

    persistCustomMoods(updated);

    if (mood === originalMood) {
      setMood(normalized);
      window.sessionStorage.setItem(CURRENT_MOOD_KEY, normalized);
    }

    setEditingMood(null);
    setEditingMoodValue("");
  }

  function handleRemoveMood(targetMood: string) {
    const updated = customMoods.filter((item) => item !== targetMood);
    persistCustomMoods(updated);

    if (mood === targetMood) {
      setMood(null);
      window.sessionStorage.removeItem(CURRENT_MOOD_KEY);
    }

    if (editingMood === targetMood) {
      setEditingMood(null);
      setEditingMoodValue("");
    }
  }

  return (
    <AppShell title="Dashboard">
      <section className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] ink-subtext">
            Welcome back
          </p>

          <h1
            className="mt-1 text-3xl font-semibold tracking-tight"
            style={{ color: "rgb(var(--ink-text))" }}
          >
            Hi, {greetingName}.
          </h1>

          <p className="ink-subtext mt-2 max-w-xl text-sm">
            Check in softly. One honest note is enough.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="ink-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] ink-subtext">
                  Check in
                </p>

                <h2
                  className="mt-1 text-xl font-semibold tracking-tight"
                  style={{ color: "rgb(var(--ink-text))" }}
                >
                  How are we feeling right now?
                </h2>

                <p className="ink-subtext mt-2 text-sm">
                  {selectedMoodPlan.helper}
                </p>
              </div>

              {hasCustomMoods ? (
                <button
                  type="button"
                  onClick={() => setManageCustomMoods((prev) => !prev)}
                  className="ink-btn ink-btn-secondary"
                >
                  {manageCustomMoods ? "Done" : "Manage"}
                </button>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {defaultMoods.map((m) => {
                const selected = m === mood;
                const plan = moodPlans[m];

                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleMoodSelect(m)}
                    className={`ink-chip ${selected ? "ink-chip-active" : ""}`}
                    aria-pressed={selected}
                  >
                    <span aria-hidden="true">{plan.emoji}</span>
                    <span>{m}</span>
                  </button>
                );
              })}

              {customMoods.map((m) => {
                const selected = m === mood;

                return (
                  <div key={m} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMoodSelect(m)}
                      className={`ink-chip ${
                        selected ? "ink-chip-active" : ""
                      }`}
                      aria-pressed={selected}
                    >
                      ✍️ {m}
                    </button>

                    {manageCustomMoods ? (
                      <>
                        <button
                          type="button"
                          onClick={() => startEditingMood(m)}
                          className="ink-chip ink-chip-danger"
                          aria-label={`Edit ${m}`}
                          title={`Edit ${m}`}
                        >
                          ✎
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveMood(m)}
                          className="ink-chip ink-chip-danger"
                          aria-label={`Remove ${m}`}
                          title={`Remove ${m}`}
                        >
                          ×
                        </button>
                      </>
                    ) : null}
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  setShowCustomMoodInput((prev) => !prev);
                  setEditingMood(null);
                  setEditingMoodValue("");
                }}
                className={`ink-chip ink-chip-action ${
                  showCustomMoodInput ? "ink-chip-active" : ""
                }`}
                aria-pressed={showCustomMoodInput}
              >
                + Custom mood
              </button>
            </div>

            {showCustomMoodInput ? (
              <div
                className="mt-4 rounded-2xl border p-3"
                style={{ borderColor: "rgb(var(--ink-border))" }}
              >
                <div className="flex flex-col gap-2 sm:flex-row">
                  <label className="block flex-1">
                    <span className="sr-only">Add a custom mood</span>
                    <input
                      type="text"
                      value={customMoodInput}
                      onChange={(event) =>
                        setCustomMoodInput(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleAddCustomMood();
                        }
                      }}
                      placeholder="Add your own mood"
                      className="ink-input"
                      maxLength={24}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleAddCustomMood}
                    disabled={!customMoodInput.trim()}
                    className="ink-btn ink-btn-primary"
                  >
                    Add mood
                  </button>
                </div>

                <p className="mt-2 text-xs ink-subtext">
                  Add a mood that feels more true to you. It will stay here for
                  later.
                </p>
              </div>
            ) : null}

            {editingMood ? (
              <div
                className="mt-4 rounded-2xl border p-3"
                style={{ borderColor: "rgb(var(--ink-border))" }}
              >
                <div className="flex flex-col gap-2 sm:flex-row">
                  <label className="block flex-1">
                    <span className="sr-only">Edit custom mood</span>
                    <input
                      type="text"
                      value={editingMoodValue}
                      onChange={(event) =>
                        setEditingMoodValue(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleSaveEditedMood(editingMood);
                        }
                      }}
                      placeholder="Rename custom mood"
                      className="ink-input"
                      maxLength={24}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => handleSaveEditedMood(editingMood)}
                    disabled={!editingMoodValue.trim()}
                    className="ink-btn ink-btn-primary"
                  >
                    Save
                  </button>
                </div>

                <p className="mt-2 text-xs ink-subtext">
                  Rename your custom mood without losing it from your dashboard.
                </p>
              </div>
            ) : null}

            {manageCustomMoods && !editingMood ? (
              <p className="mt-3 text-xs ink-subtext">
                Use edit or remove to keep your custom moods feeling like you.
              </p>
            ) : null}
          </div>

          <div className="ink-card p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] ink-subtext">
              One next action
            </p>

            <div className="mt-3 flex items-start gap-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl"
                style={{
                  background: "rgb(var(--ink-muted-surface))",
                  color: "rgb(var(--ink-text))",
                }}
                aria-hidden="true"
              >
                {selectedMoodPlan.emoji}
              </div>

              <div>
                <h2
                  className="text-xl font-semibold tracking-tight"
                  style={{ color: "rgb(var(--ink-text))" }}
                >
                  {selectedMoodPlan.action}
                </h2>

                <p className="ink-subtext mt-2 text-sm">
                  {selectedMoodPlan.prompt}
                </p>
              </div>
            </div>

            <div
              className="mt-5 rounded-2xl p-4"
              style={{ background: "rgb(var(--ink-muted-surface))" }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.12em] ink-subtext">
                Suggested mode
              </p>

              <p
                className="mt-1 text-base font-semibold"
                style={{ color: "rgb(var(--ink-text))" }}
              >
                {selectedMoodPlan.mode}
              </p>

              <p className="ink-subtext mt-2 text-sm">
                No perfect entry needed. Start with what’s already in your head.
              </p>
            </div>

            <Link
              href={writeHref}
              className="ink-btn ink-btn-primary mt-5 inline-flex"
            >
              Start gentle entry
            </Link>
          </div>

          <div className="ink-card p-5 xl:col-span-2">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] ink-subtext">
                  Recent feels
                </p>

                <h2
                  className="mt-1 text-lg font-semibold tracking-tight"
                  style={{ color: "rgb(var(--ink-text))" }}
                >
                  Your recent check-ins
                </h2>
              </div>

              <Link className="ink-link text-sm" href="/app/entries">
                View all
              </Link>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {busy ? (
                <div className="ink-card-soft p-4 text-sm md:col-span-3">
                  <span className="ink-subtext">
                    Loading your recent entries…
                  </span>
                </div>
              ) : recent.length === 0 ? (
                <div className="ink-card-soft p-4 text-sm md:col-span-3">
                  <div
                    className="font-semibold"
                    style={{ color: "rgb(var(--ink-text))" }}
                  >
                    No check-ins yet.
                  </div>

                  <p className="ink-subtext mt-1">
                    When you write, this space will gently collect your recent
                    moods.
                  </p>
                </div>
              ) : (
                recent.map((entry) => {
                  const href = entry.id.startsWith("demo-")
                    ? "/auth"
                    : `/app/entries/${entry.id}`;

                  return (
                    <Link
                      key={entry.id}
                      href={href}
                      className="ink-card ink-card-link p-4"
                    >
                      <div
                        className="text-sm font-semibold"
                        style={{ color: "rgb(var(--ink-text))" }}
                      >
                        {entry.title}
                      </div>

                      <div className="mt-1 text-xs ink-subtext">
                        {entry.meta}
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}