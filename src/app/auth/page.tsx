// src/app/auth/page.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

function getFriendlyAuthError(error: unknown) {
  const firebaseError = error as { code?: string; message?: string };

  switch (firebaseError?.code) {
    case "auth/invalid-email":
      return "That email address does not look right.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "That email or password did not work.";
    case "auth/email-already-in-use":
      return "An account already exists with that email.";
    case "auth/weak-password":
      return "Use a stronger password with at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Please pause for a moment and try again.";
    default:
      return firebaseError?.message ?? "Something went wrong.";
  }
}

function getPasswordStrength(password: string) {
  const hasMinimum = password.length >= 6;
  const hasLongerLength = password.length >= 10;
  const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  const score = [
    hasMinimum,
    hasLongerLength,
    hasMixedCase,
    hasNumber,
    hasSymbol,
  ].filter(Boolean).length;

  if (!password) {
    return {
      score: 0,
      percent: 0,
      label: "Not started",
      helper: "Use at least 6 characters.",
      hasMinimum,
    };
  }

  if (!hasMinimum) {
    return {
      score,
      percent: 20,
      label: "Too short",
      helper: "Use at least 6 characters.",
      hasMinimum,
    };
  }

  if (score <= 2) {
    return {
      score,
      percent: 40,
      label: "Soft start",
      helper: "Add a number, symbol, or mixed case to strengthen it.",
      hasMinimum,
    };
  }

  if (score === 3) {
    return {
      score,
      percent: 65,
      label: "Okay",
      helper: "This works. A little more variety would make it stronger.",
      hasMinimum,
    };
  }

  if (score === 4) {
    return {
      score,
      percent: 85,
      label: "Strong",
      helper: "Good password strength.",
      hasMinimum,
    };
  }

  return {
    score,
    percent: 100,
    label: "Very strong",
    helper: "This password has strong variety.",
    hasMinimum,
  };
}

export default function AuthPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"signin" | "create">("signin");

  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignIn = mode === "signin";

  const passwordStrength = useMemo(() => {
    return getPasswordStrength(password);
  }, [password]);

  const canSubmit = Boolean(
    email.trim() &&
      password.trim() &&
      !busy &&
      (isSignIn || (displayName.trim() && passwordStrength.hasMinimum))
  );

  function resetFields() {
    setDisplayName("");
    setPhone("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setError(null);
  }

  function switchMode(nextMode: "signin" | "create") {
    if (nextMode === mode) return;

    setMode(nextMode);
    resetFields();
  }

  async function submit(event?: React.FormEvent) {
    event?.preventDefault();

    const cleanedName = displayName.trim();
    const cleanedPhone = phone.trim();
    const cleanedEmail = email.trim();

    if (!cleanedEmail || !password.trim()) {
      setError("Enter your email and password.");
      return;
    }

    if (!isSignIn && !cleanedName) {
      setError("Enter the name you want Inkspression to use.");
      return;
    }

    if (!isSignIn && !passwordStrength.hasMinimum) {
      setError("Use at least 6 characters for your password.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      if (isSignIn) {
        await signInWithEmailAndPassword(auth, cleanedEmail, password);
      } else {
        const credential = await createUserWithEmailAndPassword(
          auth,
          cleanedEmail,
          password
        );

        await updateProfile(credential.user, {
          displayName: cleanedName,
        });

        await setDoc(
          doc(db, "users", credential.user.uid),
          {
            displayName: cleanedName,
            email: cleanedEmail,
            phone: cleanedPhone || null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      router.push("/app");
    } catch (err) {
      setError(getFriendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-16">
        <div className="grid w-full gap-6 md:grid-cols-2">
          <section className="ink-card p-6 md:p-8">
            <div className="text-xs uppercase tracking-[0.14em] ink-subtext">
              Inkspression
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Save your entries when you’re ready.
            </h1>

            <p className="mt-4 max-w-lg text-base ink-subtext">
              Explore the app in demo mode. Sign in when you want to save and
              sync your writing.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/app" className="ink-btn ink-btn-primary">
                Continue demo
              </Link>

              <Link href="/" className="ink-btn ink-btn-secondary">
                Back to landing
              </Link>
            </div>

            <div
              className="mt-6 rounded-2xl p-4"
              style={{
                border: "1px solid rgb(var(--ink-border))",
                background: "rgb(var(--ink-muted-surface))",
              }}
            >
              <div
                className="text-sm font-semibold"
                style={{ color: "rgb(var(--ink-text))" }}
              >
                Low pressure account setup
              </div>

              <p className="ink-subtext mt-1 text-sm">
                No streaks. No guilt mechanics. Your account only helps you
                return to what you wrote.
              </p>
            </div>
          </section>

          <section className="ink-card p-6 md:p-8">
            <div
              className="flex gap-2"
              role="tablist"
              aria-label="Authentication mode"
            >
              <button
                type="button"
                role="tab"
                aria-selected={isSignIn}
                onClick={() => switchMode("signin")}
                className="rounded-2xl px-4 py-2 text-sm font-medium transition"
                style={{
                  background: isSignIn
                    ? "rgb(var(--ink-accent))"
                    : "rgb(var(--ink-surface))",
                  color: isSignIn
                    ? "rgb(var(--ink-accent-contrast))"
                    : "rgb(var(--ink-text))",
                  border: isSignIn
                    ? "1px solid rgb(var(--ink-accent))"
                    : "1px solid rgb(var(--ink-border))",
                }}
              >
                Sign in
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={!isSignIn}
                onClick={() => switchMode("create")}
                className="rounded-2xl px-4 py-2 text-sm font-medium transition"
                style={{
                  background: !isSignIn
                    ? "rgb(var(--ink-accent))"
                    : "rgb(var(--ink-surface))",
                  color: !isSignIn
                    ? "rgb(var(--ink-accent-contrast))"
                    : "rgb(var(--ink-text))",
                  border: !isSignIn
                    ? "1px solid rgb(var(--ink-accent))"
                    : "1px solid rgb(var(--ink-border))",
                }}
              >
                Create account
              </button>
            </div>

            <h2 className="mt-6 text-xl font-semibold">
              {isSignIn ? "Welcome back" : "Create your account"}
            </h2>

            <p className="mt-1 text-sm ink-subtext">
              {isSignIn
                ? "Sign in when you’re ready to save your writing."
                : "Create an account to keep your entries with you."}
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              {!isSignIn ? (
                <div>
                  <label htmlFor="auth-name" className="text-sm font-medium">
                    Name
                  </label>

                  <input
                    id="auth-name"
                    value={displayName}
                    onChange={(event) => {
                      setDisplayName(event.target.value);
                      setError(null);
                    }}
                    type="text"
                    placeholder="What should we call you?"
                    className="ink-input mt-2"
                    autoComplete="name"
                    required
                    aria-describedby={error ? "auth-error" : undefined}
                  />
                </div>
              ) : null}

              <div>
                <label htmlFor="auth-email" className="text-sm font-medium">
                  Email
                </label>

                <input
                  id="auth-email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError(null);
                  }}
                  type="email"
                  placeholder="you@example.com"
                  className="ink-input mt-2"
                  autoComplete="email"
                  required
                  aria-describedby={error ? "auth-error" : undefined}
                />
              </div>

              {!isSignIn ? (
                <div>
                  <label htmlFor="auth-phone" className="text-sm font-medium">
                    Phone number{" "}
                    <span className="text-xs font-normal ink-subtext">
                      optional
                    </span>
                  </label>

                  <input
                    id="auth-phone"
                    value={phone}
                    onChange={(event) => {
                      setPhone(event.target.value);
                      setError(null);
                    }}
                    type="tel"
                    placeholder="+1 555 555 5555"
                    className="ink-input mt-2"
                    autoComplete="tel"
                    aria-describedby="auth-phone-note"
                  />

                  <p id="auth-phone-note" className="mt-2 text-xs ink-subtext">
                    For now, phone is saved as profile info, not used for SMS
                    sign-in.
                  </p>
                </div>
              ) : null}

              <div>
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="auth-password" className="text-sm font-medium">
                    Password
                  </label>

                  {isSignIn ? (
                    <Link
                      href="/auth/forgot-password"
                      className="ink-link text-sm"
                    >
                      Forgot password?
                    </Link>
                  ) : null}
                </div>

                <div className="relative mt-2">
                  <input
                    id="auth-password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError(null);
                    }}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="ink-input pr-20"
                    autoComplete={isSignIn ? "current-password" : "new-password"}
                    required
                    aria-describedby={
                      error
                        ? "auth-error"
                        : !isSignIn
                          ? "password-strength"
                          : undefined
                    }
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium ink-link"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>

                {!isSignIn ? (
                  <div id="password-strength" className="mt-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold uppercase tracking-[0.1em] ink-subtext">
                        Password strength
                      </span>

                      <span
                        className="text-xs font-semibold"
                        style={{ color: "rgb(var(--ink-text))" }}
                      >
                        {passwordStrength.label}
                      </span>
                    </div>

                    <div
                      className="mt-2 h-2 overflow-hidden rounded-full"
                      style={{
                        background: "rgb(var(--ink-muted-surface))",
                        border: "1px solid rgb(var(--ink-border))",
                      }}
                      aria-hidden="true"
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${passwordStrength.percent}%`,
                          background: passwordStrength.hasMinimum
                            ? "rgb(var(--ink-accent))"
                            : "rgb(var(--ink-border))",
                        }}
                      />
                    </div>

                    <p className="mt-2 text-xs ink-subtext">
                      {passwordStrength.helper}
                    </p>
                  </div>
                ) : null}
              </div>

              {error ? (
                <div id="auth-error" className="ink-alert text-sm" role="alert">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={!canSubmit}
                className="ink-btn ink-btn-primary w-full"
              >
                {busy
                  ? "Please wait…"
                  : isSignIn
                    ? "Sign in"
                    : "Create account"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}