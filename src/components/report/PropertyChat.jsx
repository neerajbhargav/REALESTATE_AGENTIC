import React, { useState, useEffect, useRef } from "react";
import { Send, X, MessageSquare, Loader2, Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

export const PropertyChat = ({ isOpen, onClose, address, assessment }) => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hi! I've loaded the public records for **${address}**. Ask me any underwriting questions, such as setback limits, year built, owner details, or recent comparable deed prices nearby.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    const query = input.trim();
    if (!query || loading) return;

    setInput("");
    setLoading(true);

    // Append user message
    const newMessages = [...messages, { role: "user", content: query }];
    setMessages(newMessages);

    // Create space for assistant streaming answer
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: query,
          address: address,
          context: assessment,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let answerText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop(); // keep last incomplete line

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (!data || data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "chunk" && parsed.content) {
              answerText += parsed.content;
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { role: "assistant", content: answerText };
                return next;
              });
            } else if (parsed.type === "error") {
              throw new Error(parsed.content || "Agent error");
            }
          } catch (err) {
            // Ignore parse errors on partial JSON
          }
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "assistant",
          content: `⚠️ Failed to get answer: ${err.message}`,
        };
        return next;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-white border-l border-zinc-200 shadow-2xl flex flex-col z-50 animate-slide-in">
      {/* Header */}
      <div className="px-5 py-4 border-b border-zinc-150 flex items-center justify-between bg-zinc-50 shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-zinc-900" />
          <div>
            <h3 className="font-display font-black text-sm tracking-tight text-zinc-950">
              Ask Underwriting Agent
            </h3>
            <p className="font-mono text-[9px] text-zinc-400 truncate max-w-[280px]">
              {address}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-zinc-800 p-1 transition-colors"
          title="Close chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Message History */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={idx}
              className={`flex gap-3 max-w-[85%] ${
                isUser ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] ${
                  isUser ? "bg-zinc-950 text-white" : "bg-blue-100 text-blue-700"
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>
              <div
                className={`p-3 rounded-md text-[13px] leading-relaxed shadow-sm border ${
                  isUser
                    ? "bg-zinc-900 text-white border-zinc-800 rounded-tr-none"
                    : "bg-zinc-50 text-zinc-800 border-zinc-200/80 rounded-tl-none"
                }`}
              >
                {msg.content ? (
                  <div className="prose prose-zinc max-w-none text-inherit prose-headings:font-display prose-headings:text-sm prose-p:my-1 prose-ul:list-disc prose-ul:pl-4">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 py-1 text-zinc-400 font-mono text-[10px]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Streaming...
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSend}
        className="p-4 border-t border-zinc-150 bg-zinc-50 flex gap-2 shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          placeholder="Ask about FAR limits, owners, setback..."
          className="flex-1 bg-white border border-zinc-250 rounded px-3 py-2 text-xs outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-zinc-950 text-white p-2 rounded hover:bg-zinc-800 disabled:opacity-30 transition-all flex items-center justify-center shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

export default PropertyChat;
