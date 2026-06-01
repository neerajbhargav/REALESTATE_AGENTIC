import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import HeroSearch from "../components/HeroSearch";
import LoadingPipeline from "../components/LoadingPipeline";
import AssessmentReport from "../components/AssessmentReport";
import { useAnalysis } from "../hooks/useAnalysis";

export default function Analyzer() {
  const [address, setAddress] = useState("");
  const { loading, report, reports, runAnalysis, selectHistory, reset } = useAnalysis();

  const analyze = (addr) => {
    const target = addr || address;
    setAddress(target);
    runAnalysis(target);
  };

  const handleReset = () => {
    reset();
    setAddress("");
  };

  const renderMain = () => {
    if (loading) return <LoadingPipeline address={address} />;
    if (report) return <AssessmentReport report={report} onReset={handleReset} />;
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
        onSelect={selectHistory}
        onSample={analyze}
        activeId={report?.id}
        loading={loading}
      />
      <main className="flex-1 overflow-y-auto">{renderMain()}</main>
    </div>
  );
}
