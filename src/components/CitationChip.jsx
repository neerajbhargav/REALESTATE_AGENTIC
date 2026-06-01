import React from "react";

/**
 * A tiny monospace citation chip placed next to every numeric claim.
 * If `href` is provided it renders as a link (e.g. ACRIS record).
 */
export const CitationChip = ({ label = "NYC PLUTO", href, title, testId }) => {
  const base =
    "inline-flex items-center font-mono uppercase text-[10px] tracking-widest " +
    "border border-zinc-300 bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded-sm " +
    "align-middle whitespace-nowrap transition-colors";

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={title || label}
        data-testid={testId}
        className={`${base} hover:border-zinc-900 hover:text-zinc-900`}
      >
        {label}
      </a>
    );
  }
  return (
    <span title={title || label} data-testid={testId} className={base}>
      {label}
    </span>
  );
};

export default CitationChip;
