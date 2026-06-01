import React from "react";
import { ArrowRight } from "lucide-react";

export const HeroSearch = ({ value, onChange, onSubmit, loading }) => {
  const handleKey = (e) => {
    if (e.key === "Enter" && value.trim() && !loading) onSubmit();
  };

  return (
    <div className="max-w-5xl mx-auto w-full px-6 lg:px-12 py-16 lg:py-28 animate-rise">
      <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500 mb-6">
        AI-Powered Underwriting · Source-Cited Output
      </p>
      <h1 className="font-display font-black tracking-tighter text-4xl sm:text-5xl lg:text-6xl leading-[0.95] text-zinc-950">
        Price any NYC development site
        <br />
        in under a minute.
      </h1>
      <p className="mt-6 text-base lg:text-lg text-zinc-600 max-w-2xl">
        Type a property address. We resolve the lot, pull zoning &amp; FAR from
        PLUTO, find recent arm's-length comps in ACRIS, compute buildable square
        footage, and synthesize a cited assessment — every claim traceable to a
        public record.
      </p>

      {/* Architectural bottom-bordered input */}
      <div className="mt-12 border-b-2 border-zinc-900 flex items-end gap-4 pb-3">
        <input
          data-testid="address-input"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKey}
          disabled={loading}
          placeholder="21-48 44th Drive, Long Island City, NY"
          className="flex-1 bg-transparent font-display font-medium text-2xl lg:text-4xl tracking-tight placeholder:text-zinc-300 outline-none disabled:opacity-50"
        />
        <button
          data-testid="analyze-button"
          onClick={onSubmit}
          disabled={loading || !value.trim()}
          className="group shrink-0 bg-zinc-950 text-white font-mono uppercase text-xs tracking-widest px-5 py-3 rounded-sm hover:bg-zinc-700 transition-colors disabled:opacity-30 flex items-center gap-2"
        >
          Analyze
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
      <p className="mt-3 font-mono text-[11px] text-zinc-400">
        Try a sample site from the sidebar, or enter any NYC tax lot address.
      </p>
    </div>
  );
};

export default HeroSearch;
