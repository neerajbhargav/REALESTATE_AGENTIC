import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import HeroSearch from "../components/HeroSearch";
import LoadingPipeline from "../components/LoadingPipeline";
import AssessmentReport from "../components/AssessmentReport";
import SiteComparison from "../components/SiteComparison";
import { useAnalysis } from "../hooks/useAnalysis";

export default function Analyzer() {
  const [address, setAddress] = useState("");
  const [compareIds, setCompareIds] = useState([]);
  const [compareMode, setCompareMode] = useState(false);
  const {
    loading,
    report,
    reports,
    runAnalysis,
    selectHistory,
    deleteReport,
    reset,
  } = useAnalysis();

  // If a report starts loading, exit compare mode
  useEffect(() => {
    if (loading) {
      setCompareMode(false);
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
  };

  const handleSelectHistory = (id) => {
    selectHistory(id);
    setCompareMode(false);
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
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-[#f4f4f5]">
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
      <main className="flex-1 overflow-y-auto">{renderMain()}</main>
    </div>
  );
}
