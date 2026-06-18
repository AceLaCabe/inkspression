// src/app/app/settings/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  deleteUser,
  signOut,
  updateEmail,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/components/AuthProvider";
import { auth, db } from "@/lib/firebase";

function getFriendlySettingsError(error: unknown) {
  const firebaseError = error as { code?: string; message?: string };

  switch (firebaseError?.code) {
    case "auth/requires-recent-login":
      return "For security, please sign out and sign back in before changing email, password, or deleting your account.";
    case "auth/invalid-email":
      return "That email address does not look right.";
    case "auth/email-already-in-use":
      return "That email is already being used by another account.";
    case "auth/weak-password":
      return "Use a stronger password with at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Please pause for a moment and try again.";
    default:
      return firebaseError?.message ?? "Something went wrong.";
  }
}

export default function SettingsPage() {
  const { user, loading } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [message, setMessage] = useState<string | null>(null);

  const isDemo = !loading && !user;
  const canSaveProfile = Boolean(user && displayName.trim());
  const canSaveEmail = Boolean(user && email.trim() && email.trim() !== user.email);
  const canSavePassword = Boolean(user && newPassword.trim().length >= 6);

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setDisplayName("");
        setPhone("");
        setEmail("");
        return;
      }

      setDisplayName(user.displayName || "");
      setEmail(user.email || "");

      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);

        if (!snap.exists()) return;

        const data = snap.data() as {
          displayName?: unknown;
          phone?: unknown;
        };

        if (typeof data.displayName === "string") {
          setDisplayName(data.displayName);
        }

        if (typeof data.phone === "string") {
          setPhone(data.phone);
        }
      } catch {
        // Keep auth values if profile doc cannot load.
      }
    }

    loadProfile();
  }, [user]);

  async function handleSaveProfile() {
    if (!user) return;

    const cleanedName = displayName.trim();
    const cleanedPhone = phone.trim();

    if (!cleanedName) {
      setMessage("Name cannot be empty.");
      return;
    }

    setIsSavingProfile(true);
    setMessage(null);

    try {
      await updateProfile(user, {
        displayName: cleanedName,
      });

      await setDoc(
        doc(db, "users", user.uid),
        {
          displayName: cleanedName,
          email: user.email || null,
          phone: cleanedPhone || null,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setMessage("Profile updated.");
    } catch (error) {
      setMessage(getFriendlySettingsError(error));
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleSaveEmail() {
    if (!user) return;

    const cleanedEmail = email.trim();

    if (!cleanedEmail) {
      setMessage("Email cannot be empty.");
      return;
    }

    setIsSavingEmail(true);
    setMessage(null);

    try {
      await updateEmail(user, cleanedEmail);

      await setDoc(
        doc(db, "users", user.uid),
        {
          email: cleanedEmail,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setMessage("Email updated.");
    } catch (error) {
      setMessage(getFriendlySettingsError(error));
    } finally {
      setIsSavingEmail(false);
    }
  }

  async function handleSavePassword() {
    if (!user) return;

    if (newPassword.trim().length < 6) {
      setMessage("Use at least 6 characters for your new password.");
      return;
    }

    setIsSavingPassword(true);
    setMessage(null);

    try {
      await updatePassword(user, newPassword.trim());
      setNewPassword("");
      setShowPassword(false);
      setMessage("Password updated.");
    } catch (error) {
      setMessage(getFriendlySettingsError(error));
    } finally {
      setIsSavingPassword(false);
    }
  }

  async function handleSignOut() {
    setMessage(null);
    setIsSigningOut(true);

    try {
      await signOut(auth);
      setMessage("Signed out. You can keep exploring in demo mode.");
    } catch {
      setMessage("Something went wrong while signing out.");
    } finally {
      setIsSigningOut(false);
    }
  }

  async function handleDeleteAccount() {
    if (!user) return;

    const confirmed = window.confirm(
      "Delete your account? This cannot be undone. Saved app data may need production backend cleanup."
    );

    if (!confirmed) return;

    setMessage(null);
    setIsDeleting(true);

    try {
      await deleteUser(user);
      setMessage("Your account was deleted.");
    } catch (error) {
      setMessage(getFriendlySettingsError(error));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AppShell title="Settings">
      <section className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] ink-subtext">
            Preferences
          </p>

          <h1
            className="mt-1 text-3xl font-semibold tracking-tight"
            style={{ color: "rgb(var(--ink-text))" }}
          >
            Your space
          </h1>

          <p className="ink-subtext mt-2 max-w-xl text-sm">
            Manage your profile, account access, and calm app preferences.
          </p>
        </div>

        {message ? (
          <div
            className="rounded-2xl px-4 py-3 text-sm ink-subtext"
            style={{
              border: "1px solid rgb(var(--ink-border))",
              background: "rgb(var(--ink-muted-surface))",
            }}
            role="status"
          >
            {message}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="space-y-4">
            <div className="ink-card p-5 md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] ink-subtext">
                    Profile
                  </p>

                  <h2
                    className="mt-1 text-xl font-semibold tracking-tight"
                    style={{ color: "rgb(var(--ink-text))" }}
                  >
                    Name and contact
                  </h2>

                  <p className="ink-subtext mt-2 text-sm">
                    This name can be used to greet you across Inkspression.
                  </p>
                </div>

                <StatusBadge label={loading ? "Checking" : user ? "Signed in" : "Demo"} />
              </div>

              {isDemo ? (
                <div className="ink-card-soft mt-5 p-4">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "rgb(var(--ink-text))" }}
                  >
                    Sign in to edit profile info.
                  </p>

                  <p className="ink-subtext mt-1 text-sm">
                    Demo mode lets you explore without saving account details.
                  </p>

                  <Link href="/auth" className="ink-btn ink-btn-primary mt-4">
                    Sign in to save
                  </Link>
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  <label className="block">
                    <span className="text-sm font-medium">Name</span>

                    <input
                      value={displayName}
                      onChange={(event) => {
                        setDisplayName(event.target.value);
                        setMessage(null);
                      }}
                      placeholder="What should we call you?"
                      className="ink-input mt-2"
                      autoComplete="name"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium">
                      Phone number{" "}
                      <span className="text-xs font-normal ink-subtext">
                        optional
                      </span>
                    </span>

                    <input
                      value={phone}
                      onChange={(event) => {
                        setPhone(event.target.value);
                        setMessage(null);
                      }}
                      placeholder="+1 555 555 5555"
                      className="ink-input mt-2"
                      type="tel"
                      autoComplete="tel"
                    />

                    <p className="ink-subtext mt-2 text-xs">
                      Saved as profile info only. SMS sign-in can be added later.
                    </p>
                  </label>

                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={!canSaveProfile || isSavingProfile}
                    className="ink-btn ink-btn-primary"
                  >
                    {isSavingProfile ? "Saving profile…" : "Save profile"}
                  </button>
                </div>
              )}
            </div>

            <div className="ink-card p-5 md:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] ink-subtext">
                Account access
              </p>

              <h2
                className="mt-1 text-xl font-semibold tracking-tight"
                style={{ color: "rgb(var(--ink-text))" }}
              >
                Email and password
              </h2>

              <p className="ink-subtext mt-2 text-sm">
                Email and password changes may require a recent sign-in.
              </p>

              {isDemo ? (
                <div className="ink-card-soft mt-5 p-4">
                  <p className="ink-subtext text-sm">
                    Account access controls appear after sign in.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-5">
                  <div>
                    <label className="block">
                      <span className="text-sm font-medium">Email</span>

                      <input
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          setMessage(null);
                        }}
                        placeholder="you@example.com"
                        className="ink-input mt-2"
                        type="email"
                        autoComplete="email"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleSaveEmail}
                      disabled={!canSaveEmail || isSavingEmail}
                      className="ink-btn ink-btn-secondary mt-3"
                    >
                      {isSavingEmail ? "Updating email…" : "Update email"}
                    </button>
                  </div>

                  <div>
                    <label className="block">
                      <span className="text-sm font-medium">New password</span>

                      <div className="relative mt-2">
                        <input
                          value={newPassword}
                          onChange={(event) => {
                            setNewPassword(event.target.value);
                            setMessage(null);
                          }}
                          type={showPassword ? "text" : "password"}
                          placeholder="At least 6 characters"
                          className="ink-input pr-20"
                          autoComplete="new-password"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword((current) => !current)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium ink-link"
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </label>

                    <button
                      type="button"
                      onClick={handleSavePassword}
                      disabled={!canSavePassword || isSavingPassword}
                      className="ink-btn ink-btn-secondary mt-3"
                    >
                      {isSavingPassword
                        ? "Updating password…"
                        : "Update password"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="ink-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] ink-subtext">
                Appearance
              </p>

              <h2
                className="mt-1 text-xl font-semibold tracking-tight"
                style={{ color: "rgb(var(--ink-text))" }}
              >
                Calm controls
              </h2>

              <p className="ink-subtext mt-2 text-sm">
                Use the sidebar to change display mode and color theme. These
                controls stay nearby so you do not have to search for them.
              </p>

              <div className="mt-4 space-y-3">
                <PreferenceRow label="Ultra calm" value="Available in sidebar" />
                <PreferenceRow label="Color theme" value="Available in sidebar" />
                <PreferenceRow label="No streaks" value="Always on" />
              </div>
            </div>

            <div className="ink-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] ink-subtext">
                Data tools
              </p>

              <h2
                className="mt-1 text-xl font-semibold tracking-tight"
                style={{ color: "rgb(var(--ink-text))" }}
              >
                Planned controls
              </h2>

              <p className="ink-subtext mt-2 text-sm">
                Strong portfolio features to add after the core journaling flow.
              </p>

              <div className="mt-4 space-y-3">
                <PreferenceRow label="Export entries" value="Planned" />
                <PreferenceRow label="Download backup" value="Planned" />
                <PreferenceRow label="Delete all entries" value="Planned" />
              </div>
            </div>

            <div
              className="rounded-2xl p-4"
              style={{
                border: "1px solid rgb(var(--ink-border))",
                background: "rgb(var(--ink-muted-surface))",
              }}
            >
              <p
                className="text-sm font-semibold"
                style={{ color: "rgb(var(--ink-text))" }}
              >
                Low pressure by design
              </p>

              <p className="ink-subtext mt-1 text-sm">
                Inkspression avoids streaks, shame loops, and dense tracking.
                The goal is returnability, not perfect consistency.
              </p>
            </div>

            <div
              className="rounded-2xl p-4"
              style={{
                border: "1px solid rgb(var(--ink-border))",
                background: "rgb(var(--ink-surface))",
              }}
            >
              <p
                className="text-sm font-semibold"
                style={{ color: "rgb(var(--ink-text))" }}
              >
                Danger zone
              </p>

              <p className="ink-subtext mt-1 text-sm">
                {user
                  ? "Delete your authentication account. Production data cleanup should be handled with backend rules."
                  : "Account deletion becomes available after you sign in."}
              </p>

              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={!user || loading || isDeleting}
                className="mt-4 inline-flex rounded-xl px-4 py-2 text-sm font-semibold transition"
                style={{
                  border: "1px solid rgb(var(--ink-border))",
                  background: user
                    ? "rgb(var(--ink-surface-soft))"
                    : "rgb(var(--ink-surface))",
                  color: user
                    ? "rgb(var(--ink-text))"
                    : "rgb(var(--ink-text-soft))",
                  cursor:
                    !user || loading || isDeleting ? "not-allowed" : "pointer",
                  opacity: !user || loading ? 0.65 : 1,
                }}
              >
                {isDeleting ? "Deleting…" : "Delete account"}
              </button>
            </div>

            {!isDemo ? (
              <button
                type="button"
                onClick={handleSignOut}
                disabled={loading || isSigningOut}
                className="ink-btn ink-btn-secondary w-full"
              >
                {isSigningOut ? "Signing out…" : "Sign out"}
              </button>
            ) : null}
          </section>
        </div>
      </section>
    </AppShell>
  );
}

function StatusBadge({ label }: { label: string }) {
  return (
    <span
      className="rounded-full px-3 py-1 text-xs font-semibold"
      style={{
        border: "1px solid rgb(var(--ink-border))",
        background: "rgb(var(--ink-surface))",
        color: "rgb(var(--ink-text))",
      }}
    >
      {label}
    </span>
  );
}

function PreferenceRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 rounded-2xl px-4 py-3"
      style={{
        border: "1px solid rgb(var(--ink-border))",
        background: "rgb(var(--ink-surface-soft))",
      }}
    >
      <span
        className="text-sm font-semibold"
        style={{ color: "rgb(var(--ink-text))" }}
      >
        {label}
      </span>

      <span className="text-xs ink-subtext">{value}</span>
    </div>
  );
}