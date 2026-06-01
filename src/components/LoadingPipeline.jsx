import React, { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

const STEPS = [
  { key: "geo", label: "GEOSEARCH", detail: "resolving address → BBL" },
  { key: "pluto", label: "PLUTO", detail: "fetching zoning, FAR, lot data" },
  { key: "acris", label: "ACRIS", detail: "scanning deed records for comps" },
  { key: "compute", label: "COMPUTE", detail: "buildable SF + residual value" },
  { key: "claude", label: "CLAUDE", detail: "synthesizing cited assessment" },
];

// Cumulative timeline (ms) at which each subsequent step becomes active.
const STEP_TIMELINE = [900, 2300, 4900, 6100];

const StepIcon = ({ done, running }) => {
  if (done) return <Check className="w-4 h-4 text-zinc-900" strokeWidth={3} />;
  if (running) return <Loader2 className="w-4 h-4 text-zinc-900 animate-spin" />;
  return <span className="w-2 h-2 rounded-full bg-zinc-300" />;
};

export const LoadingPipeline = ({ address }) => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timers = STEP_TIMELINE.map((at, i) =>
      setTimeout(() => setActive(i + 1), at)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div
      data-testid="loading-pipeline"
      className="max-w-3xl mx-auto w-full px-6 lg:px-12 py-20 animate-rise"
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500 mb-2">
        Running underwriting pipeline
      </p>
      <h2 className="font-display font-black tracking-tighter text-2xl lg:text-3xl mb-8 truncate">
        {address}
      </h2>

      <div className="border border-zinc-200 bg-white rounded-sm divide-y divide-zinc-200 font-mono text-sm">
        {STEPS.map((step, idx) => {
          const done = idx < active;
          const running = idx === active;
          return (
            <div
              key={step.key}
              className={`flex items-center gap-3 px-4 py-3 ${running ? "bg-zinc-50" : ""}`}
            >
              <span className="w-5 flex justify-center">
                <StepIcon done={done} running={running} />
              </span>
              <span
                className={`uppercase tracking-widest text-xs w-28 ${
                  done || running ? "text-zinc-900 font-semibold" : "text-zinc-400"
                }`}
              >
                {step.label}
              </span>
              <span className={`text-xs ${running ? "text-zinc-700" : "text-zinc-400"}`}>
                {step.detail}
                {running && <span className="cursor-blink ml-1">▋</span>}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-4 font-mono text-[11px] text-zinc-400">
        $ analyzing live NYC public data — no synthetic numbers.
      </p>
    </div>
  );
};

export default LoadingPipeline;
