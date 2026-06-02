import React, { useState, useEffect, useRef } from "react";
import { ArrowRight, Search, MapPin } from "lucide-react";

export const HeroSearch = ({ value, onChange, onSubmit, loading }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch suggestions with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value || value.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(value.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
          setShowSuggestions(true);
          setSelectedIdx(-1);
        }
      } catch {
        // silently fail
      }
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [value]);

  const handleKey = (e) => {
    if (e.key === "Escape") {
      setShowSuggestions(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((prev) => Math.min(prev + 1, suggestions.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((prev) => Math.max(prev - 1, -1));
      return;
    }
    if (e.key === "Enter") {
      if (selectedIdx >= 0 && suggestions[selectedIdx]) {
        onChange(suggestions[selectedIdx].label);
        setShowSuggestions(false);
        setTimeout(() => onSubmit(), 50);
      } else if (value.trim()) {
        setShowSuggestions(false);
        onSubmit();
      }
    }
  };

  const selectSuggestion = (s) => {
    onChange(s.label);
    setShowSuggestions(false);
    setTimeout(() => onSubmit(), 50);
  };

  return (
    <div className="max-w-5xl mx-auto w-full px-6 lg:px-12 py-16 lg:py-24 animate-rise">
      {/* Eyebrow */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1 max-w-[40px] bg-zinc-300" />
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">
          Autonomous Underwriting · Source-Cited
        </p>
      </div>

      {/* Headline */}
      <h1 className="font-display font-black tracking-tighter text-4xl sm:text-5xl lg:text-[3.5rem] leading-[0.95] text-zinc-950">
        Price any NYC
        <br />
        development site.
      </h1>
      <p className="mt-6 text-[15px] lg:text-base text-zinc-500 max-w-2xl leading-relaxed">
        Enter a property address. The agent resolves the lot, pulls zoning &amp;
        FAR from PLUTO, finds recent arm's-length comps in ACRIS, computes
        buildable SF, and synthesizes a cited assessment — every claim traceable
        to a public record.
      </p>

      {/* Search input */}
      <div className="mt-10 relative" ref={wrapperRef}>
        <div className="relative flex items-center border-b-2 border-zinc-900 pb-3 gap-3">
          <Search className="w-5 h-5 text-zinc-400 shrink-0" />
          <input
            data-testid="address-input"
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKey}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            disabled={loading}
            placeholder="21-48 44th Drive, Long Island City, NY"
            autoComplete="off"
            className="flex-1 bg-transparent font-display font-medium text-xl lg:text-3xl tracking-tight placeholder:text-zinc-300 outline-none disabled:opacity-50"
          />
          <button
            data-testid="analyze-button"
            onClick={() => {
              setShowSuggestions(false);
              onSubmit();
            }}
            disabled={loading || !value.trim()}
            className="group shrink-0 bg-zinc-950 text-white font-mono uppercase text-[11px] tracking-widest px-5 py-2.5 rounded-sm hover:bg-zinc-800 transition-all disabled:opacity-30 flex items-center gap-2"
          >
            Analyze
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Autocomplete dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-md shadow-lg z-50 overflow-hidden animate-rise">
            {suggestions.map((s, i) => (
              <button
                key={s.label}
                onClick={() => selectSuggestion(s)}
                className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors border-b border-zinc-100 last:border-0 ${
                  i === selectedIdx
                    ? "bg-zinc-100"
                    : "hover:bg-zinc-50"
                }`}
              >
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-zinc-400" />
                <div>
                  <p className="text-sm font-medium text-zinc-800">{s.label}</p>
                  {s.bbl && (
                    <p className="font-mono text-[10px] text-zinc-400 mt-0.5">
                      BBL {s.bbl}
                      {s.borough && ` · ${s.borough}`}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="mt-3 font-mono text-[11px] text-zinc-400">
        Start typing to see NYC address suggestions, or pick a sample from the sidebar.
      </p>
    </div>
  );
};

export default HeroSearch;
