// src/components/AppShell.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";

import {
  BookOpenText,
  LayoutDashboard,
  LogIn,
  LogOut,
  Moon,
  Settings,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

import { auth } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";

type Props = {
  title: string;
  children: React.ReactNode;
};

type ThemeName = "sand" | "sage" | "dusk" | "rose";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  {
    href: "/app",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/app/entries",
    label: "Entries",
    icon: BookOpenText,
  },
  {
    href: "/app/settings",
    label: "Settings",
    icon: Settings,
  },
];

function isThemeName(
  value: string | null
): value is ThemeName {
  return (
    value === "sand" ||
    value === "sage" ||
    value === "dusk" ||
    value === "rose"
  );
}

function restoreAppearance() {
  try {
    const savedMode = localStorage.getItem("ink_mode");
    const savedTheme = localStorage.getItem("ink_theme");
    const savedCalm = localStorage.getItem("ink_calm");

    const root = document.documentElement;

    root.setAttribute(
      "data-mode",
      savedMode === "dark" ? "dark" : "light"
    );

    root.setAttribute(
      "data-theme",
      isThemeName(savedTheme) ? savedTheme : "sand"
    );

    root.setAttribute(
      "data-calm",
      savedCalm === "true" ? "true" : "false"
    );
  } catch {
    // Keep the default appearance if storage is unavailable.
  }
}

export default function AppShell({
  title,
  children,
}: Props) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const [signingOut, setSigningOut] = useState(false);

  // Restore previously selected appearance preferences.
  useEffect(() => {
    restoreAppearance();
  }, []);

  function isActive(href: string) {
    if (href === "/app") {
      return pathname === "/app";
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  }

  async function handleSignOut() {
    if (signingOut) return;

    setSigningOut(true);

    try {
      const uid = user?.uid;

      sessionStorage.removeItem("ink_mood");

      // Preserve existing sign-out behavior.
      if (uid) {
        localStorage.removeItem(
          `ink_custom_moods_${uid}`
        );
      }

      await signOut(auth);

      window.location.href = "/";
    } catch (error) {
      console.error("Sign out failed:", error);
      setSigningOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Accessible skip link */}
      <a
        href="#main-content"
        className="
          sr-only
          focus:not-sr-only
          focus:fixed
          focus:left-4
          focus:top-4
          focus:z-[100]
          focus:rounded-xl
          focus:bg-background
          focus:px-5
          focus:py-3
          focus:font-semibold
          focus:text-foreground
        "
      >
        Skip to main content
      </a>

      {/* Page container */}
      <div className="mx-auto max-w-6xl px-2 py-3 sm:p-4 md:p-8">

        <div className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-[240px_minmax(0,1fr)]">

          {/* Desktop sidebar */}
          <aside
            className="
              hidden
              self-start
              rounded-2xl
              border
              p-5
              md:sticky
              md:top-8
              md:block
            "
            style={{
              background: "rgb(var(--ink-surface))",
              borderColor: "rgb(var(--ink-border))",
              boxShadow: "var(--ink-shadow-sm)",
            }}
            aria-label="Application sidebar"
          >
            {/* Branding */}
            <Link
              href={user ? "/app" : "/"}
              className="flex min-w-0 items-start gap-3 rounded-xl"
              aria-label="Inkspression home"
            >
              <span
                className="ink-icon-badge shrink-0"
                aria-hidden="true"
              >
                <Moon className="ink-icon-lg" />
              </span>

              <span className="min-w-0">
                <span className="block text-lg font-semibold tracking-tight">
                  Inkspression
                </span>

                <span className="ink-subtext mt-1 block text-sm leading-relaxed">
                  Gentle journaling for busy minds
                </span>
              </span>
            </Link>

            {/* Desktop navigation */}
            <nav
              className="mt-9 space-y-2"
              aria-label="Primary navigation"
            >
              {navItems.map((item) => (
                <SideNavLink
                  key={item.href}
                  item={item}
                  active={isActive(item.href)}
                />
              ))}
            </nav>

            {/* Reassurance */}
            <div className="ink-card-soft mt-12 p-4">
              <p className="text-sm font-semibold">
                No pressure here.
              </p>

              <p className="ink-subtext mt-2 text-sm">
                No streaks to keep.
                Come back whenever.
              </p>
            </div>
          </aside>

          {/* Mobile content column */}
          <div className="min-w-0">

            {/* Compact navigation for high zoom / narrow screens */}
            <nav
              className="ink-narrow-nav"
              aria-label="Compact navigation"
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={
                      active ? "page" : undefined
                    }
                    className="ink-narrow-nav-link"
                  >
                    <Icon
                      className="ink-icon-sm"
                      aria-hidden="true"
                    />

                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Main content */}
            <main
              id="main-content"
              tabIndex={-1}
              className="
                min-w-0
                rounded-2xl
                border
                p-3
                shadow-sm
                sm:p-6
              "
              style={{
                background: "rgb(var(--ink-surface))",
                borderColor: "rgb(var(--ink-border))",
              }}
            >
              {/* Page header */}
              <header className="mb-7 flex flex-wrap items-center justify-between gap-4">

                <div className="min-w-0">
                  <p className="ink-eyebrow">
                    Inkspression
                  </p>

                  <p className="mt-1 text-lg font-semibold">
                    {title}
                  </p>
                </div>

                {/* Authentication */}
                <div className="flex min-w-0 items-center gap-3">
                  {loading ? (
                    <span
                      className="ink-subtext text-sm"
                      role="status"
                    >
                      Checking account…
                    </span>
                  ) : user ? (
                    <button
                      type="button"
                      onClick={handleSignOut}
                      disabled={signingOut}
                      className="ink-btn ink-btn-secondary"
                    >
                      <LogOut
                        className="ink-icon-sm"
                        aria-hidden="true"
                      />

                      {signingOut
                        ? "Signing out…"
                        : "Sign out"}
                    </button>
                  ) : (
                    <Link
                      href="/auth"
                      className="ink-btn ink-btn-secondary"
                    >
                      <LogIn
                        className="ink-icon-sm"
                        aria-hidden="true"
                      />

                      Sign in
                    </Link>
                  )}
                </div>
              </header>

              {/* Route content */}
              <div className="min-w-0 pb-24 min-[361px]:pb-20 md:pb-0">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Standard mobile bottom navigation */}
      <nav
        className="ink-mobile-nav"
        aria-label="Mobile navigation"
      >
        <div className="safe-bottom grid grid-cols-3 gap-1 px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={
                  active ? "page" : undefined
                }
                className="ink-mobile-nav-link"
              >
                <Icon
                  className="ink-icon"
                  aria-hidden="true"
                />

                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function SideNavLink({
  item,
  active,
}: {
  item: NavItem;
  active: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className="ink-nav-link"
    >
      <Icon
        className="ink-icon"
        aria-hidden="true"
      />

      <span>{item.label}</span>
    </Link>
  );
}