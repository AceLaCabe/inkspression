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
import {
  Activity,
  ArrowRight,
  BookOpenText,
  Check,
  CloudRain,
  Leaf,
  Moon,
  Pencil,
  Plus,
  Sprout,
  Trash2,
  Waves,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

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
type Mood = string;

type CardEntry = {
  id: string;
  title: string;
  mood: string | null;
  mode: string | null;
  date: Date | null;
  demo?: boolean;
};

type MoodPlan = {
  icon: LucideIcon;
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
    mood: "Calm",
    mode: "One sentence",
    date: null,
    demo: true,
  },
  {
    id: "demo-2",
    title: "Overthinking spiral",
    mood: "Anxious",
    mode: "Brain dump",
    date: null,
    demo: true,
  },
  {
    id: "demo-3",
    title: "Soft reset",
    mood: "Low",
    mode: "Gentle check-in",
    date: null,
    demo: true,
  },
];

const moodPlans: Record<DefaultMood, MoodPlan> = {
  Calm: {
    icon: Leaf,
    helper: "Stay soft. Keep it simple.",
    mode: "One sentence",
    action: "Write one honest sentence",
    prompt: "What feels okay enough right now?",
  },
  Anxious: {
    icon: Activity,
    helper: "Let it spill out. No structure needed.",
    mode: "Brain dump",
    action: "Unload the spiral",
    prompt: "What thought keeps circling back?",
  },
  Low: {
    icon: Moon,
    helper: "One sentence is enough today.",
    mode: "Tiny check-in",
    action: "Name the smallest truth",
    prompt: "What is one thing you can admit gently?",
  },
  Overwhelmed: {
    icon: Waves,
    helper: "Tiny steps. Two minutes max.",
    mode: "Two-minute release",
    action: "Make the noise smaller",
    prompt: "What feels like too much right now?",
  },
  Energized: {
    icon: Zap,
    helper: "Capture momentum while it's here.",
    mode: "Momentum note",
    action: "Catch the spark",
    prompt: "What do you want to use this energy for?",
  },
  Sad: {
    icon: CloudRain,
    helper: "Be gentle. Name what hurts.",
    mode: "Soft reflection",
    action: "Write with care",
    prompt: "What needs comfort, not fixing?",
  },
};

function getMoodPlan(mood: Mood | null): MoodPlan {
  if (mood && defaultMoods.includes(mood as DefaultMood)) {
    return moodPlans[mood as DefaultMood];
  }

  if (mood) {
    return {
      icon: Pencil,
      helper: "There's room for whatever this feeling means.",
      mode: "Free note",
      action: "Write what feels true",
      prompt: `What does ${mood.toLowerCase()} need you to hear?`,
    };
  }

  return {
    icon: Sprout,
    helper: "You don't need to find the perfect word.",
    mode: "Gentle entry",
    action: "Begin when you're ready",
    prompt: "What is here right now?",
  };
}

function getCustomMoodKey(uid?: string | null) {
  return uid ? `ink_custom_moods_${uid}` : null;
}

function normalizeMoodLabel(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return "";

  return (
    trimmed.charAt(0).toUpperCase() +
    trimmed.slice(1).toLowerCase()
  );
}

function formatDate(date: Date | null) {
  if (!date || Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function DashboardPage() {
  const { user, loading } = useAuth();

  const [profileName, setProfileName] = useState("");
  const [mood, setMood] = useState<Mood | null>(null);

  const [customMoods, setCustomMoods] = useState<string[]>([]);
  const [showCustomMoodInput, setShowCustomMoodInput] =
    useState(false);
  const [customMoodInput, setCustomMoodInput] = useState("");

  const [editingMood, setEditingMood] =
    useState<string | null>(null);
  const [editingMoodValue, setEditingMoodValue] =
    useState("");
  const [manageCustomMoods, setManageCustomMoods] =
    useState(false);

  const [recent, setRecent] = useState<CardEntry[]>([]);
  const [busy, setBusy] = useState(true);
  const [recentError, setRecentError] = useState(false);

  const allMoods = useMemo(
    () => [...defaultMoods, ...customMoods] as string[],
    [customMoods]
  );

  const selectedMoodPlan = useMemo(
    () => getMoodPlan(mood),
    [mood]
  );

  // Preserve your existing journal-entry URL contract.
  const writeHref = useMemo(() => {
    const params = new URLSearchParams();

    if (mood) params.set("mood", mood);
    if (selectedMoodPlan.mode) {
      params.set("mode", selectedMoodPlan.mode);
    }
    if (selectedMoodPlan.prompt) {
      params.set("prompt", selectedMoodPlan.prompt);
    }

    const search = params.toString();

    return search ? `/app/new?${search}` : "/app/new";
  }, [mood, selectedMoodPlan]);

  const greetingName = (
    profileName ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "there"
  )
    .trim()
    .split(/\s+/)[0];

  const SelectedIcon = selectedMoodPlan.icon;

  // Restore selected mood.
  useEffect(() => {
    const saved = sessionStorage.getItem(CURRENT_MOOD_KEY);
    setMood(saved || null);
  }, []);

  // Load the user's display name.
  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!user) {
        setProfileName("");
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", user.uid));

        if (!active) return;

        const name = snap.data()?.displayName;

        setProfileName(
          typeof name === "string" ? name.trim() : ""
        );
      } catch {
        if (active) setProfileName("");
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [user]);

  // Load custom moods for the signed-in user.
  useEffect(() => {
    setManageCustomMoods(false);
    setShowCustomMoodInput(false);
    setCustomMoodInput("");
    setEditingMood(null);
    setEditingMoodValue("");

    if (!user) {
      setCustomMoods([]);
      return;
    }

    const key = getCustomMoodKey(user.uid);
    if (!key) return;

    try {
      const saved = localStorage.getItem(key);
      const parsed = saved ? JSON.parse(saved) : [];

      setCustomMoods(
        Array.isArray(parsed)
          ? parsed.filter(
              (value): value is string =>
                typeof value === "string"
            )
          : []
      );
    } catch {
      setCustomMoods([]);
    }
  }, [user]);

  // Recent entries: demo or Firestore.
  useEffect(() => {
    let active = true;

    async function loadRecent() {
      if (loading) return;

      setBusy(true);
      setRecentError(false);

      if (!user) {
        setRecent(demoRecent);
        setBusy(false);
        return;
      }

      try {
        const entriesQuery = query(
          collection(db, "users", user.uid, "entries"),
          orderBy("createdAt", "desc"),
          limit(3)
        );

        const snapshot = await getDocs(entriesQuery);

        if (!active) return;

        const rows: CardEntry[] = snapshot.docs.map(
          (entryDoc) => {
            const data = entryDoc.data();

            return {
              id: entryDoc.id,
              title:
                typeof data.title === "string" &&
                data.title.trim()
                  ? data.title.trim()
                  : "Untitled entry",
              mood:
                typeof data.mood === "string"
                  ? data.mood
                  : null,
              mode:
                typeof data.mode === "string"
                  ? data.mode
                  : null,
              date: data.createdAt?.toDate?.() ?? null,
            };
          }
        );

        setRecent(rows);
      } catch {
        if (active) {
          setRecent([]);
          setRecentError(true);
        }
      } finally {
        if (active) setBusy(false);
      }
    }

    loadRecent();

    return () => {
      active = false;
    };
  }, [user, loading]);

  function persistCustomMoods(next: string[]) {
    setCustomMoods(next);

    const key = getCustomMoodKey(user?.uid);

    if (key) {
      localStorage.setItem(key, JSON.stringify(next));
    }
  }

  function handleMoodSelect(next: string) {
    // Press the selected mood again to clear it.
    const updated = mood === next ? null : next;

    setMood(updated);

    if (updated) {
      sessionStorage.setItem(CURRENT_MOOD_KEY, updated);
    } else {
      sessionStorage.removeItem(CURRENT_MOOD_KEY);
    }

    setShowCustomMoodInput(false);
    setEditingMood(null);
    setEditingMoodValue("");
  }

  function handleAddCustomMood() {
    const normalized = normalizeMoodLabel(customMoodInput);

    if (!normalized) return;

    const existing = allMoods.find(
      (value) =>
        value.toLowerCase() === normalized.toLowerCase()
    );

    const nextMood = existing || normalized;

    if (!existing) {
      persistCustomMoods([...customMoods, normalized]);
    }

    setMood(nextMood);
    sessionStorage.setItem(CURRENT_MOOD_KEY, nextMood);

    setCustomMoodInput("");
    setShowCustomMoodInput(false);
  }

  function startEditingMood(target: string) {
    setEditingMood(target);
    setEditingMoodValue(target);
    setShowCustomMoodInput(false);
  }

  function handleSaveEditedMood(original: string) {
    const normalized = normalizeMoodLabel(editingMoodValue);

    if (!normalized) return;

    const duplicate = allMoods.some(
      (value) =>
        value.toLowerCase() === normalized.toLowerCase() &&
        value.toLowerCase() !== original.toLowerCase()
    );

    if (duplicate) return;

    persistCustomMoods(
      customMoods.map((value) =>
        value === original ? normalized : value
      )
    );

    if (mood === original) {
      setMood(normalized);
      sessionStorage.setItem(CURRENT_MOOD_KEY, normalized);
    }

    setEditingMood(null);
    setEditingMoodValue("");
  }

  function handleRemoveMood(target: string) {
    persistCustomMoods(
      customMoods.filter((value) => value !== target)
    );

    if (mood === target) {
      setMood(null);
      sessionStorage.removeItem(CURRENT_MOOD_KEY);
    }

    if (editingMood === target) {
      setEditingMood(null);
      setEditingMoodValue("");
    }
  }

  return (
    <AppShell title="Dashboard">
      <div className="space-y-6">

        {/* Greeting */}
        <header>
          <span className="ink-eyebrow">
            A moment for yourself
          </span>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Hi, {greetingName}.
          </h1>

          <p className="ink-subtext mt-2 text-sm">
            There's no rush. Begin wherever you are.
          </p>
        </header>

        {/* Main experience */}
        <section
          className="ink-card p-5 sm:p-7"
          aria-labelledby="checkin-heading"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="ink-eyebrow">
                Your check-in
              </span>

              <h2
                id="checkin-heading"
                className="mt-2 text-2xl font-semibold"
              >
                How are you feeling?
              </h2>

              <p className="ink-subtext mt-2 text-sm">
                Choose what feels closest.
                There's no wrong answer.
              </p>
            </div>

            {customMoods.length > 0 && (
              <button
                type="button"
                className="ink-btn ink-btn-secondary"
                onClick={() =>
                  setManageCustomMoods((value) => !value)
                }
                aria-pressed={manageCustomMoods}
              >
                {manageCustomMoods
                  ? "Done"
                  : "Manage moods"}
              </button>
            )}
          </div>

          {/* Mood options */}
          <div
            className="mt-6 flex flex-wrap gap-3"
            role="group"
            aria-label="Choose your mood"
          >
            {defaultMoods.map((item) => {
              const Icon = moodPlans[item].icon;
              const selected = mood === item;

              return (
                <button
                  key={item}
                  type="button"
                  className="ink-chip"
                  aria-pressed={selected}
                  onClick={() => handleMoodSelect(item)}
                >
                  <Icon
                    className="ink-icon-sm"
                    aria-hidden="true"
                  />
                  {item}
                  {selected && (
                    <Check
                      className="ink-icon-sm"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}

            {customMoods.map((item) => {
              const selected = mood === item;

              return (
                <div
                  key={item}
                  className="flex flex-wrap items-center gap-1"
                >
                  <button
                    type="button"
                    className="ink-chip"
                    aria-pressed={selected}
                    onClick={() => handleMoodSelect(item)}
                  >
                    <Pencil
                      className="ink-icon-sm"
                      aria-hidden="true"
                    />
                    {item}
                    {selected && (
                      <Check
                        className="ink-icon-sm"
                        aria-hidden="true"
                      />
                    )}
                  </button>

                  {manageCustomMoods && (
                    <>
                      <button
                        type="button"
                        className="ink-chip ink-chip-danger"
                        aria-label={`Edit ${item}`}
                        onClick={() => startEditingMood(item)}
                      >
                        <Pencil
                          className="ink-icon-sm"
                          aria-hidden="true"
                        />
                      </button>

                      <button
                        type="button"
                        className="ink-chip ink-chip-danger"
                        aria-label={`Remove ${item}`}
                        onClick={() => handleRemoveMood(item)}
                      >
                        <Trash2
                          className="ink-icon-sm"
                          aria-hidden="true"
                        />
                      </button>
                    </>
                  )}
                </div>
              );
            })}

            <button
              type="button"
              className="ink-chip ink-chip-action"
              aria-expanded={showCustomMoodInput}
              onClick={() => {
                setShowCustomMoodInput((value) => !value);
                setEditingMood(null);
              }}
            >
              <Plus
                className="ink-icon-sm"
                aria-hidden="true"
              />
              Another feeling
            </button>
          </div>

          {/* Add custom mood */}
          {showCustomMoodInput && (
            <div className="ink-card-soft mt-5 p-4">
              <label
                htmlFor="new-custom-mood"
                className="block text-sm font-semibold"
              >
                What would you call this feeling?
              </label>

              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  id="new-custom-mood"
                  className="ink-input"
                  value={customMoodInput}
                  maxLength={24}
                  placeholder="Your own word"
                  onChange={(event) =>
                    setCustomMoodInput(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleAddCustomMood();
                    }
                  }}
                />

                <button
                  type="button"
                  className="ink-btn ink-btn-primary"
                  disabled={!customMoodInput.trim()}
                  onClick={handleAddCustomMood}
                >
                  Add mood
                </button>
              </div>

              {!user && (
                <p className="ink-subtext mt-3 text-sm">
                  Sign in to keep custom moods between visits.
                </p>
              )}
            </div>
          )}

          {/* Edit custom mood */}
          {editingMood && (
            <div className="ink-card-soft mt-5 p-4">
              <label
                htmlFor="edit-custom-mood"
                className="block text-sm font-semibold"
              >
                Rename {editingMood}
              </label>

              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  id="edit-custom-mood"
                  className="ink-input"
                  value={editingMoodValue}
                  maxLength={24}
                  onChange={(event) =>
                    setEditingMoodValue(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleSaveEditedMood(editingMood);
                    }
                  }}
                />

                <button
                  type="button"
                  className="ink-btn ink-btn-primary"
                  disabled={!editingMoodValue.trim()}
                  onClick={() =>
                    handleSaveEditedMood(editingMood)
                  }
                >
                  Save changes
                </button>
              </div>
            </div>
          )}

          {/* Connected writing recommendation */}
          <div
            className="mt-8 border-t pt-7"
            style={{
              borderColor: "rgb(var(--ink-border))",
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="ink-icon-badge shrink-0"
                aria-hidden="true"
              >
                <SelectedIcon className="ink-icon-lg" />
              </div>

              <div className="min-w-0 flex-1">
                <span className="ink-eyebrow">
                  {mood
                    ? `Your next step · ${mood}`
                    : "A gentle place to start"}
                </span>

                <h3 className="mt-2 text-xl font-semibold">
                  {selectedMoodPlan.action}
                </h3>

                <p className="ink-subtext mt-2 text-sm">
                  {selectedMoodPlan.helper}
                </p>
              </div>
            </div>

            <div className="ink-card-soft mt-5 p-5">
              <span className="ink-eyebrow">
                Suggested writing mode
              </span>

              <p className="mt-2 font-semibold">
                {selectedMoodPlan.mode}
              </p>

              <p className="ink-subtext mt-3 text-sm">
                {selectedMoodPlan.prompt}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link
                href={writeHref}
                className="ink-btn ink-btn-primary"
              >
                {mood
                  ? `Start a ${mood.toLowerCase()} check-in`
                  : "Start a gentle entry"}

                <ArrowRight
                  className="ink-icon-sm"
                  aria-hidden="true"
                />
              </Link>

              {mood && (
                <button
                  type="button"
                  className="ink-btn ink-btn-secondary"
                  onClick={() => {
                    setMood(null);
                    sessionStorage.removeItem(
                      CURRENT_MOOD_KEY
                    );
                  }}
                >
                  Clear selection
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Recent entries */}
        <section
          className="ink-card p-5 sm:p-6"
          aria-labelledby="recent-heading"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="ink-eyebrow">
                Your reflections
              </span>

              <h2
                id="recent-heading"
                className="mt-2 text-xl font-semibold"
              >
                Recent check-ins
              </h2>
            </div>

            <Link
              href="/app/entries"
              className="ink-link text-sm"
            >
              View all
            </Link>
          </div>

          {busy ? (
            <div
              className="ink-empty-state mt-5"
              role="status"
            >
              Loading your reflections…
            </div>
          ) : recentError ? (
            <div className="ink-empty-state mt-5">
              <p className="font-semibold">
                We couldn't load your entries.
              </p>

              <p className="ink-subtext mt-2 text-sm">
                Your entries haven't been changed.
                Please try again later.
              </p>
            </div>
          ) : recent.length === 0 ? (
            <div className="ink-empty-state mt-5">
              <BookOpenText
                className="ink-icon-lg"
                aria-hidden="true"
              />

              <h3 className="mt-4 font-semibold">
                A fresh page, whenever you're ready.
              </h3>

              <p className="ink-subtext mt-2 text-sm">
                Nothing to catch up on.
                Your reflections will appear here
                after you save your first entry.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {recent.map((entry) => {
                const formattedDate = formatDate(entry.date);

                return (
                  <Link
                    key={entry.id}
                    href={
                      entry.demo
                        ? "/auth"
                        : `/app/entries/${entry.id}`
                    }
                    className="ink-entry-card"
                  >
                    <h3 className="font-semibold">
                      {entry.title}
                    </h3>

                    <p className="ink-subtext mt-2 text-sm">
                      {[entry.mood, entry.mode]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>

                    <p className="ink-subtext mt-2 text-xs">
                      {entry.demo ? (
                        "Example entry"
                      ) : formattedDate ? (
                        <time
                          dateTime={entry.date!.toISOString()}
                          title={entry.date!.toLocaleString()}
                        >
                          {formattedDate}
                        </time>
                      ) : (
                        "Date unavailable"
                      )}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}

          {!busy && !recentError && recent.length > 0 && user && (
            <p className="ink-subtext mt-5 text-sm">
              Whether your last entry was yesterday
              or months ago, you're welcome here.
            </p>
          )}
        </section>

      </div>
    </AppShell>
  );
}