// src/app/auth/forgot-password/page.tsx
"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

function getFriendlyError(error: unknown) {
  const firebaseError = error as { code?: string };

  switch (firebaseError?.code) {
    case "auth/invalid-email":
      return "That email address does not look right.";
    case "auth/user-not-found":
      return "No account was found with that email.";
    case "auth/too-many-requests":
      return "Too many attempts. Please pause for a moment and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanedEmail = email.trim();

    if (!cleanedEmail) {
      setError("Enter the email connected to your account.");
      setMessage(null);
      return;
    }

    setSending(true);
    setError(null);
    setMessage(null);

    try {
      await sendPasswordResetEmail(auth, cleanedEmail);

      setMessage(
        "If an account exists for that email, we will send a password reset link."
      );
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <section className="mx-auto max-w-md">
        <Link href="/auth" className="ink-link text-sm">
          ← Back to sign in
        </Link>

        <div className="ink-card mt-6 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] ink-subtext">
            Account help
          </p>

          <h1
            className="mt-1 text-3xl font-semibold tracking-tight"
            style={{ color: "rgb(var(--ink-text))" }}
          >
            Reset your password
          </h1>

          <p className="ink-subtext mt-2 text-sm">
            Enter your email and we’ll send a reset link. Then you can come back
            and sign in softly.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] ink-subtext">
                Email
              </span>

              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError(null);
                  setMessage(null);
                }}
                placeholder="you@example.com"
                className="ink-input mt-2"
                autoComplete="email"
              />
            </label>

            <button
              type="submit"
              disabled={sending || !email.trim()}
              className="ink-btn ink-btn-primary w-full"
            >
              {sending ? "Sending reset link…" : "Send reset link"}
            </button>
          </form>

          {message ? (
            <div
              className="mt-4 rounded-2xl p-4 text-sm ink-subtext"
              style={{
                border: "1px solid rgb(var(--ink-border))",
                background: "rgb(var(--ink-muted-surface))",
              }}
              role="status"
            >
              {message}
            </div>
          ) : null}

          {error ? (
            <div className="ink-alert mt-4 text-sm" role="alert">
              {error}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}