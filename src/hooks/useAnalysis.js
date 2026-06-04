import { useCallback, useState } from "react";
import { toast } from "sonner";

export function useAnalysis() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [reports, setReports] = useState(() => {
    try {
      const saved = localStorage.getItem("cre_reports_history");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load reports history", e);
      return [];
    }
  });

  const runAnalysis = useCallback(async (address) => {
    const target = (address || "").trim();
    if (!target) return;

    setReport(null);
    setLoading(true);

    const startTime = Date.now();

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: target }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "Unknown error");
        throw new Error(`Server returned ${response.status}: ${errText}`);
      }

      setLoading(false);

      // Initialize an empty report shell
      let currentText = "";
      let statusText = "";
      let finalData = null;

      setReport({
        id: target + "-" + Date.now(),
        address: target,
        bbl: "Resolving via Agent...",
        borough: "NYC",
        processing_time_ms: 0,
        streamingText: "",
        statusText: "",
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE lines
        const lines = buffer.split("\n");
        buffer = lines.pop(); // keep incomplete last line in buffer

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (!data || data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);

            if (parsed.type === "content_chunk" && parsed.content) {
              currentText += parsed.content;
              setReport((prev) => ({
                ...prev,
                streamingText: currentText,
                processing_time_ms: Date.now() - startTime,
              }));
            } else if (parsed.type === "status" && parsed.content) {
              statusText = parsed.content;
              setReport((prev) => ({
                ...prev,
                statusText: statusText,
                processing_time_ms: Date.now() - startTime,
              }));
            } else if (parsed.type === "final_report" && parsed.content) {
              finalData = parsed.content;
              setReport((prev) => ({
                ...prev,
                assessment: parsed.content,
                statusText: "Complete",
                processing_time_ms: Date.now() - startTime,
              }));
            } else if (parsed.type === "error") {
              throw new Error(parsed.content || "Agent error");
            } else if (parsed.type === "done") {
              // Stream finished
            }
          } catch (parseErr) {
            if (parseErr.message && !parseErr.message.includes("JSON")) {
              throw parseErr;
            }
          }
        }
      }

      const totalTime = Date.now() - startTime;
      setReport((prev) => {
        const finishedReport = {
          ...prev,
          processing_time_ms: totalTime,
        };

        if (finishedReport.assessment) {
          finishedReport.statusText = "Complete";
          setReports((oldReports) => {
            const exists = oldReports.some(
              (r) => r.address === finishedReport.address
            );
            if (exists) return oldReports;
            const newHistory = [finishedReport, ...oldReports].slice(0, 10);
            try {
              localStorage.setItem("cre_reports_history", JSON.stringify(newHistory));
            } catch (e) {
              console.error("Storage save failed", e);
            }
            return newHistory;
          });
          
          toast.success("Agentic Assessment Complete", {
            description: `Analysis finished in ${(totalTime / 1000).toFixed(1)}s`,
          });
        } else {
          toast.error("Analysis Timeout", { 
            description: "The Vercel Serverless Function timed out (60s limit). Try a simpler address with fewer comps." 
          });
          finishedReport.statusText = "Timeout Error";
        }

        return finishedReport;
      });

      toast.success("Agentic Assessment Complete", {
        description: `${target} · ${(totalTime / 1000).toFixed(1)}s`,
      });
    } catch (err) {
      setLoading(false);
      setReport(null);
      toast.error("Analysis failed", { description: err.message });
    }
  }, []);

  const selectHistory = useCallback((id) => {
    setReports((currentReports) => {
      const found = currentReports.find((r) => r.id === id);
      if (found) {
        setReport(found);
      }
      return currentReports;
    });
  }, []);

  const deleteReport = useCallback((id) => {
    setReports((oldReports) => {
      const filtered = oldReports.filter((r) => r.id !== id);
      try {
        localStorage.setItem("cre_reports_history", JSON.stringify(filtered));
      } catch (e) {
        console.error("Failed to update history in localStorage", e);
      }
      return filtered;
    });
    setReport((currentReport) => {
      if (currentReport?.id === id) {
        return null;
      }
      return currentReport;
    });
  }, []);

  const reset = useCallback(() => setReport(null), []);

  return { loading, report, reports, runAnalysis, selectHistory, deleteReport, reset };
}
