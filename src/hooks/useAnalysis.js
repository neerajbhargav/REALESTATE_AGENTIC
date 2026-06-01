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
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: target }),
      });

      if (!response.ok) {
        throw new Error('Failed to start analysis');
      }

      setLoading(false);
      
      // Initialize an empty report shell for AssessmentReport
      let currentText = "";
      setReport({
        address: target,
        bbl: "Resolving via Agent...",
        borough: "NYC",
        processing_time_ms: 0,
        streamingText: "", 
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let startTime = Date.now();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                currentText += parsed.content;
                setReport(prev => ({
                  ...prev,
                  streamingText: currentText,
                  processing_time_ms: Date.now() - startTime
                }));
              }
            } catch (e) {
              // Ignore partial JSON chunks
            }
          }
        }
      }
      
      toast.success("Agentic Assessment Complete");
      
    } catch (err) {
      setLoading(false);
      toast.error("Analysis failed", { description: err.message });
    }
  }, []);

  const selectHistory = useCallback(async (id) => {}, []);

  const reset = useCallback(() => setReport(null), []);

  return { loading, report, reports, runAnalysis, selectHistory, reset };
}
