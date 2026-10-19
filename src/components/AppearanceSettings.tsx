"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Moon,
  Palette,
  Sparkles,
  Sun,
} from "lucide-react";

type Mode = "light" | "dark";
type Theme = "sand" | "sage" | "dusk" | "rose";

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
  return themes.some((theme) => theme.value === value);
}

export default function AppearanceSettings() {
  const [mode, setMode] = useState<Mode>("light");
  const [theme, setTheme] = useState<Theme>("sand");
  const [calm, setCalm] = useState(false);
  const [ready, setReady] = useState(false);

  // Restore preferences from the existing app storage.
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem("ink_mode");
      const savedTheme = localStorage.getItem("ink_theme");
      const savedCalm = localStorage.getItem("ink_calm");

      const nextMode: Mode =
        savedMode === "dark" ? "dark" : "light";

      const nextTheme: Theme = isTheme(savedTheme)
        ? savedTheme
        : "sand";

      const nextCalm = savedCalm === "true";

      setMode(nextMode);
      setTheme(nextTheme);
      setCalm(nextCalm);

      const root = document.documentElement;

      root.dataset.mode = nextMode;
      root.dataset.theme = nextTheme;
      root.dataset.calm = String(nextCalm);
    } catch {
      // Continue with default appearance.
    }

    setReady(true);
  }, []);

  function updateMode(next: Mode) {
    setMode(next);
    document.documentElement.dataset.mode = next;

    try {
      localStorage.setItem("ink_mode", next);
    } catch {
      // Preference remains active for this session.
    }
  }

  function updateTheme(next: Theme) {
    setTheme(next);
    document.documentElement.dataset.theme = next;

    try {
      localStorage.setItem("ink_theme", next);
    } catch {
      // Preference remains active for this session.
    }
  }

  function updateCalm(next: boolean) {
    setCalm(next);
    document.documentElement.dataset.calm = String(next);

    try {
      localStorage.setItem("ink_calm", String(next));
    } catch {
      // Preference remains active for this session.
    }
  }

  if (!ready) {
    return (
      <div
        className="ink-card p-5"
        role="status"
      >
        Loading appearance preferences…
      </div>
    );
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
                  onChange={() => updateTheme(option.value)}
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

      {/* Light / dark */}
      <fieldset>
        <legend className="text-base font-semibold">
          Display appearance
        </legend>

        <p className="ink-subtext mt-2 text-sm">
          Choose between a light and dark interface.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {([
            { value: "light", label: "Light", icon: Sun },
            { value: "dark", label: "Dark", icon: Moon },
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
                  onChange={() => updateMode(option.value)}
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
            background: "rgb(var(--ink-surface-soft))",
            border: "1px solid rgb(var(--ink-border))",
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