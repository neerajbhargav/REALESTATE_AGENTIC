import { useCallback, useState } from "react";
import { toast } from "sonner";

export function useAnalysis() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [reports, setReports] = useState([]); // History stub

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
      setReport({
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
            } else if (parsed.type === "error") {
              throw new Error(parsed.content || "Agent error");
            } else if (parsed.type === "done") {
              // Stream finished
            }
          } catch (parseErr) {
            // If it's a re-thrown error from above, propagate it
            if (parseErr.message && !parseErr.message.includes("JSON")) {
              throw parseErr;
            }
            // Otherwise ignore partial JSON
          }
        }
      }

      setReport((prev) => ({
        ...prev,
        processing_time_ms: Date.now() - startTime,
        statusText: "Complete",
      }));
      toast.success("Agentic Assessment Complete", {
        description: `${target} · ${((Date.now() - startTime) / 1000).toFixed(1)}s`,
      });
    } catch (err) {
      setLoading(false);
      setReport(null);
      toast.error("Analysis failed", { description: err.message });
    }
  }, []);

  const selectHistory = useCallback(async (id) => {}, []);

  const reset = useCallback(() => setReport(null), []);

  return { loading, report, reports, runAnalysis, selectHistory, reset };
}
