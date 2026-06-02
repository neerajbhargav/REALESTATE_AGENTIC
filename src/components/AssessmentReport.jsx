import React, { useState } from "react";
import { ArrowLeft, FileText, Sparkles, Loader2, Landmark, Ruler, Printer, MessageSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";

import CitationChip from "./CitationChip";
import Stat from "./report/Stat";
import DevelopmentCard from "./report/DevelopmentCard";
import LandValueCard from "./report/LandValueCard";
import CompsTable from "./report/CompsTable";
import FlagsCard from "./report/FlagsCard";
import PropertyMap from "./report/PropertyMap";
import ExecutiveSummary from "./report/ExecutiveSummary";
import MetricsBar from "./report/MetricsBar";
import ProFormaCard from "./report/ProFormaCard";
import MassingVisualizer from "./report/MassingVisualizer";
import PropertyChat from "./report/PropertyChat";

const fmtNum = (num) => {
  if (num === null || num === undefined) return "—";
  return new Intl.NumberFormat("en-US").format(Math.round(num));
};

const ReportHeader = ({ address, bbl, borough, ms, statusText, onReset }) => (
  <div className="border-b border-zinc-200 bg-white print:border-none">
    <div className="px-6 lg:px-12 py-6">
      <button
        data-testid="back-button"
        onClick={onReset}
        className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-zinc-500 hover:text-zinc-900 transition-colors mb-4 print:hidden"
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
        {bbl && bbl !== "Resolving via Agent..." && (
          <span className="border border-zinc-300 text-zinc-600 uppercase tracking-widest px-2 py-1 rounded-sm">
            BBL {bbl}
          </span>
        )}
        {borough && borough !== "NYC" && (
          <span className="border border-zinc-300 text-zinc-600 uppercase tracking-widest px-2 py-1 rounded-sm">
            {borough}
          </span>
        )}
        <span className="border border-zinc-300 text-zinc-600 uppercase tracking-widest px-2 py-1 rounded-sm">
          {(ms / 1000).toFixed(1)}s
        </span>
        <span className="text-zinc-400 ml-1">
          Sources: Anthropic Claude · NYC PLUTO · ACRIS · GeoSearch
        </span>
      </div>
      {statusText && statusText !== "Complete" && (
        <div className="mt-3 flex items-center gap-2 font-mono text-xs text-zinc-500 animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          {statusText}
        </div>
      )}
    </div>
  </div>
);

const ZoningCard = ({ zoning }) => (
  <div className="bg-white border border-zinc-200 rounded-sm p-6">
    <div className="flex items-center gap-2 mb-4">
      <Landmark className="w-4 h-4" />
      <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-700">
        Zoning Summary
      </h2>
    </div>
    <div
      data-testid="zoning-district"
      className="font-display font-black tracking-tighter text-4xl text-zinc-950"
    >
      {zoning?.district || "—"}
    </div>
    <div className="mt-1">
      <CitationChip label="PLUTO zonedist1" />
    </div>
    <p className="mt-4 text-sm text-zinc-600 leading-relaxed">
      {zoning?.description || "No description available."}
    </p>
  </div>
);

const LotCard = ({ lot, bsf }) => (
  <div className="bg-white border border-zinc-200 rounded-sm p-6">
    <div className="flex items-center gap-2 mb-2">
      <Ruler className="w-4 h-4" />
      <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-700">
        Lot Characteristics
      </h2>
    </div>
    <div className="divide-y divide-zinc-100">
      <Stat label="Lot Area" value={
        (lot?.lot_area_sf || bsf?.lot_area_sf)
          ? `${fmtNum(lot?.lot_area_sf || bsf?.lot_area_sf)} SF`
          : "—"
      } citation="PLUTO lotarea" />
      <Stat
        label="Existing Building"
        value={
          (lot?.building_area_sf || bsf?.currently_built_sf)
            ? `${fmtNum(lot?.building_area_sf || bsf?.currently_built_sf)} SF`
            : "—"
        }
        citation="PLUTO bldgarea"
      />
      <Stat label="Year Built" value={lot?.year_built || "—"} citation="PLUTO yearbuilt" />
      <Stat label="Land Use" value={lot?.land_use_description || "—"} citation="PLUTO landuse" />
      <Stat label="Owner" value={lot?.owner || "—"} citation="PLUTO ownername" />
      {lot?.num_floors && <Stat label="Floors" value={lot.num_floors} citation="PLUTO numfloors" />}
      {lot?.num_units && <Stat label="Units" value={lot.num_units} citation="PLUTO unitsres" />}
    </div>
  </div>
);

export const AssessmentReport = ({ report, onReset }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [mapTab, setMapTab] = useState("map");

  const { address, bbl, borough, processing_time_ms, streamingText, statusText, assessment } = report;

  // If we have the final structured assessment, render the visual dashboard
  if (assessment) {
    const bsf = assessment.development_potential || {};
    const reportBbl = assessment.bbl || bbl;
    const reportBorough = assessment.borough || borough;

    return (
      <div data-testid="assessment-report" className="w-full animate-rise">
        <ReportHeader
          address={address}
          bbl={reportBbl}
          borough={reportBorough}
          ms={processing_time_ms}
          statusText={statusText}
          onReset={onReset}
        />

        {/* Print + Chat buttons */}
        <div className="px-6 lg:px-12 pt-4 flex gap-3 justify-end print:hidden">
          <button
            onClick={() => setIsChatOpen(true)}
            className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-white bg-zinc-950 hover:bg-zinc-800 border border-transparent px-3 py-1.5 rounded-sm transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Chat with Underwriter
          </button>
          
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-zinc-500 hover:text-zinc-900 border border-zinc-300 px-3 py-1.5 rounded-sm hover:bg-zinc-50 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Export PDF
          </button>
        </div>

        {/* Executive Summary */}
        <div className="px-6 lg:px-12 pt-4">
          <ExecutiveSummary summary={assessment.executive_summary} />
        </div>

        {/* Key Metrics Bar */}
        <div className="px-6 lg:px-12 pt-4">
          <MetricsBar assessment={assessment} />
        </div>

        {/* Map / 3D Tab + Zoning side by side */}
        <div className="px-6 lg:px-12 py-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex flex-col h-[430px]">
            <div className="flex bg-zinc-100 p-0.5 rounded-sm self-start mb-2 print:hidden shrink-0">
              <button
                onClick={() => setMapTab("map")}
                className={`px-3 py-1 font-mono text-[10px] uppercase tracking-wider rounded-sm transition-all ${
                  mapTab === "map"
                    ? "bg-white text-zinc-950 font-bold shadow-sm"
                    : "text-zinc-500 hover:text-zinc-950"
                }`}
              >
                Map Location
              </button>
              <button
                onClick={() => setMapTab("3d")}
                className={`px-3 py-1 font-mono text-[10px] uppercase tracking-wider rounded-sm transition-all ${
                  mapTab === "3d"
                    ? "bg-white text-zinc-950 font-bold shadow-sm"
                    : "text-zinc-500 hover:text-zinc-950"
                }`}
              >
                3D Envelope Model
              </button>
            </div>
            
            <div className="flex-1 min-h-0">
              {mapTab === "map" ? (
                <PropertyMap
                  coordinates={assessment.coordinates}
                  address={address}
                  bbl={reportBbl}
                  comps={assessment.comparable_sales}
                />
              ) : (
                <MassingVisualizer bsf={bsf} />
              )}
            </div>
          </div>
          
          <ZoningCard zoning={assessment.zoning_summary || {}} />
        </div>

        {/* Development + Lot Cards */}
        <div className="px-6 lg:px-12 pb-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <DevelopmentCard bsf={bsf} methodology={bsf.methodology} />
          <LotCard lot={assessment.lot_characteristics || {}} bsf={bsf} />
        </div>

        {/* Land Value */}
        <div className="px-6 lg:px-12 pb-4 grid grid-cols-1 gap-4">
          <LandValueCard
            value={assessment.land_value_estimate || {}}
            narrative={assessment.land_value_estimate?.narrative || ""}
          />
        </div>

        {/* Interactive Pro Forma */}
        <div className="px-6 lg:px-12 pb-4 grid grid-cols-1 gap-4 print:hidden">
          <ProFormaCard
            bsf={bsf}
            estimatedLandValue={assessment.land_value_estimate?.total_estimated_value}
          />
        </div>

        {/* Comps Table */}
        <div className="px-6 lg:px-12 pb-4">
          <CompsTable comps={assessment.comparable_sales || []} />
        </div>

        {/* Flags */}
        {assessment.flags && assessment.flags.length > 0 && (
          <div className="px-6 lg:px-12 pb-6">
            <FlagsCard flags={assessment.flags} />
          </div>
        )}

        {/* Data Sources Footer */}
        <div className="px-6 lg:px-12 pb-12">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            <FileText className="w-3 h-3" />
            {(assessment.data_sources || ["NYC PLUTO", "ACRIS", "GeoSearch"]).join("  ·  ")}
          </div>
        </div>

        {/* Property Chat Drawer */}
        <PropertyChat
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          address={address}
          assessment={assessment}
        />
      </div>
    );
  }

  // Otherwise, render the streaming thought process
  return (
    <div data-testid="assessment-report" className="w-full animate-rise">
      <ReportHeader
        address={address}
        bbl={bbl}
        borough={borough}
        ms={processing_time_ms}
        statusText={statusText}
        onReset={onReset}
      />

      <div className="px-6 lg:px-12 py-8 max-w-4xl">
        <div className="bg-white border border-zinc-200 rounded-sm p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-xs font-mono text-zinc-500 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            Agent Thought Process
          </div>
          <div className="prose prose-zinc max-w-none prose-headings:font-display prose-headings:tracking-tight prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3 prose-p:text-sm prose-p:leading-relaxed prose-li:text-sm prose-table:text-xs">
            {streamingText ? (
              <ReactMarkdown>{streamingText}</ReactMarkdown>
            ) : (
              <div className="flex items-center gap-3 text-zinc-400 font-mono text-sm py-8">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>
                  Agent is autonomously gathering data from NYC public
                  records...
                </span>
              </div>
            )}
            {streamingText && statusText !== "Complete" && (
              <span className="cursor-blink text-zinc-400 text-lg">▋</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentReport;
