import React from "react";
import { ArrowLeft, FileText, Sparkles } from "lucide-react";
import ReactMarkdown from 'react-markdown';

const ReportHeader = ({ address, bbl, borough, ms, onReset }) => (
  <div className="border-b border-zinc-200 bg-white">
    <div className="px-6 lg:px-12 py-6">
      <button
        data-testid="back-button"
        onClick={onReset}
        className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-zinc-500 hover:text-zinc-900 transition-colors mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> New analysis
      </button>
      <h1 className="font-display font-black tracking-tighter text-3xl lg:text-5xl leading-none text-zinc-950">
        {address}
      </h1>
      <div className="mt-4 flex items-center gap-2 flex-wrap font-mono text-[11px]">
        <span className="bg-zinc-950 text-white uppercase tracking-widest px-2 py-1 rounded-sm flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> AGENTIC WORKFLOW
        </span>
        <span className="border border-zinc-300 text-zinc-600 uppercase tracking-widest px-2 py-1 rounded-sm">
          BBL: {bbl}
        </span>
        <span className="border border-zinc-300 text-zinc-600 uppercase tracking-widest px-2 py-1 rounded-sm">
          {(ms / 1000).toFixed(1)}s
        </span>
        <span className="text-zinc-400 ml-1">Sources: LangGraph · NYC PLUTO · ACRIS</span>
      </div>
    </div>
  </div>
);

export const AssessmentReport = ({ report, onReset }) => {
  const { address, bbl, borough, processing_time_ms, streamingText } = report;

  return (
    <div data-testid="assessment-report" className="w-full animate-rise">
      <ReportHeader
        address={address}
        bbl={bbl}
        borough={borough}
        ms={processing_time_ms}
        onReset={onReset}
      />

      <div className="px-6 lg:px-12 py-8 max-w-4xl">
        <div className="bg-white border border-zinc-200 rounded-sm p-8 shadow-sm">
          <div className="prose prose-zinc max-w-none">
            {streamingText ? (
               <ReactMarkdown>{streamingText}</ReactMarkdown>
            ) : (
               <div className="flex items-center gap-2 text-zinc-400 font-mono text-sm">
                 <span className="cursor-blink">▋</span> Agent is synthesizing data...
               </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 lg:px-12 pb-12">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-zinc-400">
          <FileText className="w-3 h-3" />
          Autonomous Real Estate Agentic Engine
        </div>
      </div>
    </div>
  );
};

export default AssessmentReport;
