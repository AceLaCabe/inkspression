// src/components/AppearanceSettings.tsx
"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  Check,
  Moon,
  Palette,
  Sparkles,
  Sun,
} from "lucide-react";

type Mode = "light" | "dark";
type Theme = "sand" | "sage" | "dusk" | "rose";

const APPEARANCE_EVENT = "ink-appearance-change";

const themes: {
  value: Theme;
  label: string;
  description: string;
  swatch: string;
}[] = [
  {
    value: "sand",
    label: "Sand",
    description: "Warm and grounded",
    swatch: "#7a5c48",
  },
  {
    value: "sage",
    label: "Sage",
    description: "Quiet and earthy",
    swatch: "#4b6557",
  },
  {
    value: "dusk",
    label: "Dusk",
    description: "Soft and reflective",
    swatch: "#574c8a",
  },
  {
    value: "rose",
    label: "Rose",
    description: "Warm and gentle",
    swatch: "#874859",
  },
];

function isTheme(value: string | null): value is Theme {
  return themes.some((item) => item.value === value);
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(APPEARANCE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(APPEARANCE_EVENT, callback);
  };
}

function readPreference(key: string, fallback: string) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function savePreference(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Keep the app usable if storage is unavailable.
  }

  window.dispatchEvent(new Event(APPEARANCE_EVENT));
}

function usePreference(key: string, fallback: string) {
  return useSyncExternalStore(
    subscribe,
    () => readPreference(key, fallback),
    () => fallback
  );
}

export default function AppearanceSettings() {
  const storedMode = usePreference("ink_mode", "light");
  const storedTheme = usePreference("ink_theme", "sand");
  const storedCalm = usePreference("ink_calm", "false");

  const mode: Mode =
    storedMode === "dark" ? "dark" : "light";

  const theme: Theme = isTheme(storedTheme)
    ? storedTheme
    : "sand";

  const calm = storedCalm === "true";

  // Apply preferences to the application.
  useEffect(() => {
    const root = document.documentElement;

    root.setAttribute("data-mode", mode);
    root.setAttribute("data-theme", theme);
    root.setAttribute("data-calm", String(calm));
  }, [mode, theme, calm]);

  function updateMode(next: Mode) {
    savePreference("ink_mode", next);
  }

  function updateTheme(next: Theme) {
    savePreference("ink_theme", next);
  }

  function updateCalm(next: boolean) {
    savePreference("ink_calm", String(next));
  }

  return (
    <section
      className="ink-card space-y-7 p-5 md:p-6"
      aria-labelledby="appearance-title"
    >
      {/* Heading */}
      <div>
        <span className="ink-eyebrow">
          Appearance
        </span>

        <h2
          id="appearance-title"
          className="mt-2 text-xl font-semibold"
        >
          Make this space yours
        </h2>

        <p className="ink-subtext mt-2 text-sm">
          Choose what feels comfortable today.
          You can change these settings anytime.
        </p>
      </div>

      {/* Color themes */}
      <fieldset>
        <legend className="flex items-center gap-2 text-base font-semibold">
          <Palette
            className="ink-icon"
            aria-hidden="true"
          />
          Color theme
        </legend>

        <p className="ink-subtext mt-2 text-sm">
          A different tone, the same gentle space.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {themes.map((option) => {
            const selected = theme === option.value;

            return (
              <label
                key={option.value}
                className="
                  relative flex min-h-[88px]
                  cursor-pointer items-center
                  gap-3 rounded-2xl border
                  p-3 transition
                  focus-within:outline
                  focus-within:outline-2
                  focus-within:outline-offset-2
                "
                style={{
                  borderColor: selected
                    ? "rgb(var(--ink-accent))"
                    : "rgb(var(--ink-border))",
                  background: selected
                    ? "rgb(var(--ink-accent) / 0.08)"
                    : "rgb(var(--ink-surface))",
                }}
              >
                <input
                  type="radio"
                  name="color-theme"
                  value={option.value}
                  checked={selected}
                  onChange={() =>
                    updateTheme(option.value)
                  }
                  className="sr-only"
                />

                <span
                  className="h-8 w-8 shrink-0 rounded-full"
                  style={{
                    background: option.swatch,
                    border:
                      "1px solid rgb(var(--ink-border))",
                  }}
                  aria-hidden="true"
                />

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">
                    {option.label}
                  </span>

                  <span className="ink-subtext mt-1 block text-xs">
                    {option.description}
                  </span>
                </span>

                {selected && (
                  <Check
                    className="ink-icon shrink-0"
                    aria-hidden="true"
                  />
                )}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div
        className="border-t"
        style={{
          borderColor: "rgb(var(--ink-border))",
        }}
      />

      {/* Light and dark mode */}
      <fieldset>
        <legend className="text-base font-semibold">
          Display appearance
        </legend>

        <p className="ink-subtext mt-2 text-sm">
          Choose between a light and dark interface.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {([
            {
              value: "light",
              label: "Light",
              icon: Sun,
            },
            {
              value: "dark",
              label: "Dark",
              icon: Moon,
            },
          ] as const).map((option) => {
            const Icon = option.icon;
            const selected = mode === option.value;

            return (
              <label
                key={option.value}
                className="
                  flex min-h-[64px] cursor-pointer
                  items-center justify-between
                  gap-2 rounded-2xl border
                  p-3 focus-within:outline
                  focus-within:outline-2
                  focus-within:outline-offset-2
                "
                style={{
                  borderColor: selected
                    ? "rgb(var(--ink-accent))"
                    : "rgb(var(--ink-border))",
                  background: selected
                    ? "rgb(var(--ink-accent) / 0.08)"
                    : "rgb(var(--ink-surface))",
                }}
              >
                <input
                  type="radio"
                  name="display-mode"
                  value={option.value}
                  checked={selected}
                  onChange={() =>
                    updateMode(option.value)
                  }
                  className="sr-only"
                />

                <span className="flex items-center gap-2">
                  <Icon
                    className="ink-icon"
                    aria-hidden="true"
                  />

                  <span className="text-sm font-semibold">
                    {option.label}
                  </span>
                </span>

                {selected && (
                  <Check
                    className="ink-icon-sm"
                    aria-hidden="true"
                  />
                )}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div
        className="border-t"
        style={{
          borderColor: "rgb(var(--ink-border))",
        }}
      />

      {/* Ultra calm */}
      <div>
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3
              id="ultra-calm-label"
              className="flex items-center gap-2 text-base font-semibold"
            >
              <Sparkles
                className="ink-icon"
                aria-hidden="true"
              />
              Ultra calm
            </h3>

            <p
              id="ultra-calm-description"
              className="ink-subtext mt-2 text-sm"
            >
              Reduce animations, movement,
              and decorative shadows.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={calm}
            aria-labelledby="ultra-calm-label"
            aria-describedby="ultra-calm-description"
            onClick={() => updateCalm(!calm)}
            className="
              flex min-h-[48px] min-w-[72px]
              shrink-0 items-center justify-center
              rounded-full border px-3
              text-sm font-bold
            "
            style={{
              background: calm
                ? "rgb(var(--ink-accent))"
                : "rgb(var(--ink-surface-soft))",
              color: calm
                ? "rgb(var(--ink-accent-contrast))"
                : "rgb(var(--ink-text))",
              borderColor: calm
                ? "rgb(var(--ink-accent))"
                : "rgb(var(--ink-border))",
            }}
          >
            {calm ? "On" : "Off"}
          </button>
        </div>

        <div
          className="mt-4 rounded-xl p-3 text-sm"
          style={{
            background:
              "rgb(var(--ink-surface-soft))",
            border:
              "1px solid rgb(var(--ink-border))",
          }}
        >
          <p>
            Ultra calm is{" "}
            <strong>{calm ? "on" : "off"}</strong>.
          </p>

          <p className="ink-subtext mt-1">
            Your color theme and display appearance
            will stay the same.
          </p>
        </div>
      </div>
    </section>
  );
}