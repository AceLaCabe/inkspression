// src/hooks/useEntryDraft.ts
"use client";

import { useEffect, useRef, useState } from "react";

export type EntryDraft = {
  title: string;
  body: string;
  mood: string | null;
  mode: string;
  prompt: string;
  showPrompt: boolean;
  updatedAt: number;
};

type DraftFields = Omit<EntryDraft, "updatedAt">;

type Recovery = {
  key: string;
  draft: EntryDraft;
};

type Options = {
  uid: string | null;
  loading: boolean;
  fields: DraftFields;
  onRestore: (draft: EntryDraft) => void;
};

type SaveStatus =
  | "idle"
  | "saving"
  | "saved"
  | "unavailable";

const DEMO_KEY = "ink_entry_draft_demo";
const DRAFT_VERSION = 1;

function userKey(uid: string) {
  return `ink_entry_draft_user_${uid}`;
}

function hasWriting(fields: DraftFields) {
  return Boolean(fields.title.trim() || fields.body.trim());
}

function readDraft(key: string): EntryDraft | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const data = parsed as Record<string, unknown>;

    if (
      data.version !== DRAFT_VERSION ||
      typeof data.title !== "string" ||
      typeof data.body !== "string" ||
      typeof data.mode !== "string" ||
      typeof data.prompt !== "string"
    ) {
      return null;
    }

    const draft: EntryDraft = {
      title: data.title,
      body: data.body,
      mood:
        typeof data.mood === "string"
          ? data.mood
          : null,
      mode: data.mode,
      prompt: data.prompt,
      showPrompt: data.showPrompt !== false,
      updatedAt:
        typeof data.updatedAt === "number" &&
        Number.isFinite(data.updatedAt)
          ? data.updatedAt
          : Date.now(),
    };

    return hasWriting(draft) ? draft : null;
  } catch {
    return null;
  }
}

function writeDraft(
  key: string,
  fields: DraftFields
): boolean {
  if (!hasWriting(fields)) return false;

  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        ...fields,
        version: DRAFT_VERSION,
        updatedAt: Date.now(),
      })
    );

    return true;
  } catch {
    return false;
  }
}

function removeDraft(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Storage may be unavailable.
  }
}

export function useEntryDraft({
  uid,
  loading,
  fields,
  onRestore,
}: Options) {
  const [ready, setReady] = useState(false);

  const [recovery, setRecovery] =
    useState<Recovery | null>(null);

  const [saveStatus, setSaveStatus] =
    useState<SaveStatus>("idle");

  const activeKeyRef = useRef<string | null>(null);
  const initializedRef = useRef(false);
  const blockedRef = useRef(true);
  const completedRef = useRef(false);

  const latestFieldsRef = useRef(fields);

  // Prevent autosave from writing old editor values
  // immediately after a draft is restored.
  const restorePendingRef =
    useRef<DraftFields | null>(null);

  // Track whether a demo draft was carried into
  // the current signed-in account.
  const transferredDemoRef = useRef(false);

  const onRestoreRef = useRef(onRestore);

  useEffect(() => {
    latestFieldsRef.current = fields;
    onRestoreRef.current = onRestore;
  }, [fields, onRestore]);

  /*
   * INITIALIZATION
   *
   * Read existing drafts before allowing autosave.
   * Do not delete drafts during initialization.
   */
  useEffect(() => {
    if (loading) return;

    const key = uid ? userKey(uid) : DEMO_KEY;

    activeKeyRef.current = key;
    initializedRef.current = false;
    blockedRef.current = true;
    completedRef.current = false;
    restorePendingRef.current = null;
    transferredDemoRef.current = false;

    const ownDraft = readDraft(key);
    const demoDraft = uid ? readDraft(DEMO_KEY) : null;

    const found: Recovery | null = ownDraft
      ? { key, draft: ownDraft }
      : demoDraft
        ? {
            key: DEMO_KEY,
            draft: demoDraft,
          }
        : null;

    blockedRef.current = Boolean(found);
    initializedRef.current = true;

    // Recovery must be presented before autosave
    // is allowed to replace anything.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecovery(found);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaveStatus("idle");
  }, [uid, loading]);

  /*
   * RESTORE SYNCHRONIZATION
   *
   * Wait until the editor reflects the restored
   * values before autosave resumes.
   */
  useEffect(() => {
    const pending = restorePendingRef.current;
    if (!pending) return;

    const matches =
      fields.title === pending.title &&
      fields.body === pending.body &&
      fields.mood === pending.mood &&
      fields.mode === pending.mode &&
      fields.prompt === pending.prompt &&
      fields.showPrompt === pending.showPrompt;

    if (matches) {
      restorePendingRef.current = null;
      blockedRef.current = false;
    }
  }, [fields]);

  /*
   * AUTOSAVE
   *
   * Debounce writing by 500ms.
   * Never delete a draft merely because
   * the editor is empty.
   */
  useEffect(() => {
    if (
      !ready ||
      loading ||
      !initializedRef.current ||
      blockedRef.current ||
      completedRef.current ||
      recovery ||
      restorePendingRef.current
    ) {
      return;
    }

    if (!hasWriting(fields)) {
      return;
    }

    const key = activeKeyRef.current;
    if (!key) return;

    const timer = window.setTimeout(() => {
      if (
        blockedRef.current ||
        completedRef.current ||
        restorePendingRef.current
      ) {
        return;
      }

      const success = writeDraft(
        key,
        latestFieldsRef.current
      );

      setSaveStatus(
        success ? "saved" : "unavailable"
      );
    }, 500);

    return () => window.clearTimeout(timer);
  }, [
    fields,
    ready,
    recovery,
    loading,
  ]);

  /*
   * PAGE EXIT
   *
   * Save immediately when the browser page
   * is being unloaded.
   *
   * IMPORTANT:
   * Do not flush in the effect cleanup.
   */
  useEffect(() => {
    function flushDraft() {
      if (
        !initializedRef.current ||
        blockedRef.current ||
        completedRef.current ||
        restorePendingRef.current
      ) {
        return;
      }

      const key = activeKeyRef.current;
      const current = latestFieldsRef.current;

      if (key && hasWriting(current)) {
        writeDraft(key, current);
      }
    }

    window.addEventListener("pagehide", flushDraft);

    return () => {
      window.removeEventListener("pagehide", flushDraft);
    };
  }, []);

  /*
   * RESTORE
   *
   * Keep the stored draft intact until the editor
   * receives the recovered content.
   */
  function restoreDraft() {
    if (!recovery) return;

    const sourceKey = recovery.key;
    const targetKey = activeKeyRef.current;

    if (!targetKey) return;

    if (sourceKey !== targetKey) {
      const copied = writeDraft(
        targetKey,
        recovery.draft
      );

      if (!copied) {
        setSaveStatus("unavailable");
        return;
      }

      transferredDemoRef.current =
        sourceKey === DEMO_KEY;

      // Don't remove the demo copy until the
      // completed entry is successfully saved.
    }

    restorePendingRef.current = recovery.draft;
    blockedRef.current = true;

    onRestoreRef.current(recovery.draft);

    setRecovery(null);
    setSaveStatus("saved");
  }

  /*
   * START FRESH
   *
   * This is an explicit user decision.
   */
  function discardDraft() {
    if (!recovery) return;

    removeDraft(recovery.key);

    blockedRef.current = false;
    restorePendingRef.current = null;
    transferredDemoRef.current = false;

    setRecovery(null);
    setSaveStatus("idle");
  }

  /*
   * SUCCESSFUL FIREBASE SAVE
   *
   * Never call this before addDoc resolves.
   */
  function clearSavedDraft() {
    completedRef.current = true;
    blockedRef.current = true;
    restorePendingRef.current = null;

    const key = activeKeyRef.current;

    if (key) {
      removeDraft(key);
    }

    if (transferredDemoRef.current) {
      removeDraft(DEMO_KEY);
    }

    transferredDemoRef.current = false;
    setSaveStatus("idle");
  }

  return {
    ready,
    recovery,
    saveStatus,
    restoreDraft,
    discardDraft,
    clearSavedDraft,
  };
}