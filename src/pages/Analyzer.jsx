import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import HeroSearch from "../components/HeroSearch";
import LoadingPipeline from "../components/LoadingPipeline";
import AssessmentReport from "../components/AssessmentReport";
import SiteComparison from "../components/SiteComparison";
import { useAnalysis } from "../hooks/useAnalysis";
import { Menu } from "lucide-react";

export default function Analyzer() {
  const [address, setAddress] = useState("");
  const [compareIds, setCompareIds] = useState([]);
  const [compareMode, setCompareMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const {
    loading,
    report,
    reports,
    runAnalysis,
    selectHistory,
    deleteReport,
    reset,
  } = useAnalysis();

  // If a report starts loading, exit compare mode and close sidebar
  useEffect(() => {
    if (loading) {
      setCompareMode(false);
      setIsSidebarOpen(false);
    }
  }, [loading]);

  const analyze = (addr) => {
    const target = addr || address;
    setAddress(target);
    runAnalysis(target);
  };

  const handleReset = () => {
    reset();
    setAddress("");
    setCompareMode(false);
    setIsSidebarOpen(false);
  };

  const handleSelectHistory = (id) => {
    selectHistory(id);
    setCompareMode(false);
    setIsSidebarOpen(false);
  };

  const handleDeleteReport = (id) => {
    deleteReport(id);
    setCompareIds((prev) => prev.filter((item) => item !== id));
  };

  const handleToggleCompare = (id) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) {
        const filtered = prev.filter((item) => item !== id);
        // If we drop below 2 items compared, exit compare mode
        if (filtered.length < 2 && compareMode) {
          setCompareMode(false);
        }
        return filtered;
      } else {
        return [...prev, id];
      }
    });
  };

  const handleCompareClick = () => {
    if (compareIds.length >= 2) {
      setCompareMode(true);
      setIsSidebarOpen(false);
    }
  };

  const renderMain = () => {
    if (loading) return <LoadingPipeline address={address} />;
    
    if (compareMode) {
      return (
        <SiteComparison
          reports={reports}
          selectedIds={compareIds}
          onClose={() => setCompareMode(false)}
          onSelectReport={(id) => {
            selectHistory(id);
            setCompareMode(false);
          }}
        />
      );
    }

    if (report) {
      return <AssessmentReport report={report} onReset={handleReset} />;
    }

    return (
      <HeroSearch
        value={address}
        onChange={setAddress}
        onSubmit={() => analyze()}
        loading={loading}
      />
    );
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-[#f4f4f5] relative">
      {/* Desktop Sidebar (Inline - Hidden on mobile) */}
      <div className="hidden lg:flex lg:flex-col lg:h-full shrink-0">
        <Sidebar
          reports={reports}
          onSelect={handleSelectHistory}
          onSample={analyze}
          activeId={report?.id}
          loading={loading}
          onDelete={handleDeleteReport}
          selectedCompareIds={compareIds}
          onToggleCompare={handleToggleCompare}
          onCompareClick={handleCompareClick}
          compareMode={compareMode}
        />
      </div>

      {/* Mobile/Tablet Sidebar Drawer Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop blur click to close */}
          <div
            className="absolute inset-0 bg-zinc-950/30 backdrop-blur-sm transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
          {/* Drawer Content container */}
          <div className="relative w-[280px] h-full bg-white flex flex-col shadow-2xl animate-slide-in">
            <Sidebar
              reports={reports}
              onSelect={handleSelectHistory}
              onSample={analyze}
              activeId={report?.id}
              loading={loading}
              onDelete={handleDeleteReport}
              selectedCompareIds={compareIds}
              onToggleCompare={handleToggleCompare}
              onCompareClick={handleCompareClick}
              compareMode={compareMode}
              isMobile={true}
              onCloseMobile={() => setIsSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Pane with Mobile Header */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Mobile Header Bar */}
        <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-zinc-200 shrink-0 select-none">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 rounded-md hover:bg-zinc-50 border border-zinc-200 text-zinc-700 active:bg-zinc-100 transition-colors"
              title="Open menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <span className="font-display font-black tracking-tighter text-base leading-none text-zinc-950">
              CRE Intelligence
            </span>
          </div>
          {compareIds.length >= 2 && (
            <button
              onClick={handleCompareClick}
              className={`font-mono text-[9px] uppercase tracking-wider px-2 py-1.5 rounded-sm font-extrabold border ${
                compareMode
                  ? "bg-emerald-600 text-white border-transparent"
                  : "bg-zinc-950 text-white border-transparent hover:bg-zinc-800"
              }`}
            >
              {compareMode ? "Comparing" : `Compare (${compareIds.length})`}
            </button>
          )}
        </header>

        <main className="flex-1 overflow-y-auto">{renderMain()}</main>
      </div>
    </div>
  );
}
