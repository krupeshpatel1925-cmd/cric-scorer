"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme, THEMES, ThemeId } from "./ThemeProvider";
import { Sun, Moon, Palette, Check, Sparkles } from "lucide-react";

export default function ThemeSwitcher() {
  const { theme, setTheme, isDark, toggleLightDark, currentThemeConfig } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex items-center gap-1.5" ref={dropdownRef}>
      {/* Quick Light / Dark 1-Click Toggle */}
      <button
        type="button"
        onClick={toggleLightDark}
        title={isDark ? "Switch to Daylight (Light Mode)" : "Switch to Midnight (Dark Mode)"}
        aria-label="Toggle light/dark mode"
        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700/60 transition-all cursor-pointer"
      >
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-400 hover:-rotate-12 transition-transform" />
        )}
      </button>

      {/* Palette Dropdown Toggle */}
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        title="Choose Theme Palette"
        aria-label="Choose Theme Palette"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
          dropdownOpen
            ? "bg-slate-800 text-white border-slate-700 shadow-md"
            : "text-slate-300 hover:text-white hover:bg-slate-800/80 border-slate-800/60 hover:border-slate-700/80"
        }`}
      >
        <span
          className="w-3 h-3 rounded-full border border-white/20 shadow-sm shrink-0"
          style={{ backgroundColor: currentThemeConfig.primaryColor }}
        />
        <span className="hidden xl:inline text-[11px] font-medium">Theme</span>
        <Palette className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-slate-800 p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-2 border-b border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Select Visual Theme
            </span>
          </div>

          <div className="space-y-1 pt-1.5">
            {THEMES.map((opt) => {
              const isSelected = opt.id === theme;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setTheme(opt.id);
                    setDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-slate-800/90 text-white border border-slate-700 shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-slate-900/80 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Visual Preview Swatch Pill */}
                    <div
                      className="w-6 h-6 rounded-lg border border-white/20 flex items-center justify-center p-0.5 shadow-sm shrink-0"
                      style={{ backgroundColor: opt.bgPreview }}
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: opt.primaryColor }}
                      />
                    </div>

                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        {opt.name}
                        {opt.mode === "light" && (
                          <span className="text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            Light
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">{opt.subtitle}</div>
                    </div>
                  </div>

                  {isSelected && (
                    <Check
                      className="w-4 h-4 shrink-0"
                      style={{ color: opt.primaryColor }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function MobileThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="pt-2 pb-1 border-t border-slate-800/80 mt-2 space-y-2">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center gap-1.5">
        <Palette className="w-3 h-3 text-emerald-400" /> Color Theme
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {THEMES.map((opt) => {
          const isSelected = opt.id === theme;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTheme(opt.id)}
              className={`flex items-center gap-2 p-2 rounded-lg text-xs font-semibold border transition-all text-left ${
                isSelected
                  ? "bg-slate-800 text-white border-slate-600 shadow-sm"
                  : "bg-slate-900/60 text-slate-300 border-slate-800 hover:bg-slate-800"
              }`}
            >
              <div
                className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                style={{ backgroundColor: opt.primaryColor }}
              />
              <span className="truncate">{opt.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
