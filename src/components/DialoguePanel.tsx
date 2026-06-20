import React, { useState, useEffect, useRef } from "react";
import { LandmarkNode, Message } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, AlertCircle, Compass, HelpCircle, CheckCircle, Flame, Send, X, ShieldAlert } from "lucide-react";

interface DialoguePanelProps {
  node: LandmarkNode | null;
  onClose: () => void;
  onMasterNode: (nodeId: string) => void;
  reduceEnergy: (amount: number) => void;
  awardXp: (amount: number) => void;
  currentEnergy: number;
}

export const DialoguePanel: React.FC<DialoguePanelProps> = ({
  node,
  onClose,
  onMasterNode,
  reduceEnergy,
  awardXp,
  currentEnergy,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isMastered, setIsMastered] = useState(false);
  const [isOnlineMode, setIsOnlineMode] = useState(true);
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  // Load initial question when node is entered
  useEffect(() => {
    if (!node) return;

    setMessages([]);
    setIsLoading(true);
    setIsError(false);
    setIsMastered(false);

    fetch("/api/socratic/question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nodeId: node.id }),
    })
      .then((res) => res.json())
      .then((data) => {
        setIsOnlineMode(data.mode === "online");
        setMessages([
          {
            id: "initial-system",
            sender: "system",
            text: `You have approached ${node.name}. Feel the ancient Socratic winds blow.`,
            timestamp: new Date(),
          },
          {
            id: "initial-question",
            sender: "ai",
            text: data.question,
            timestamp: new Date(),
          },
        ]);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsError(true);
        setIsLoading(false);
        // Fallback local query
        setMessages([
          {
            id: "fallback-question",
            sender: "ai",
            text: node.details + " " + node.hint,
            timestamp: new Date(),
          },
        ]);
      });
  }, [node]);

  // Scroll to bottom on updates
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!node) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    if (currentEnergy <= 0) {
      alert("Your Thought Energy is depleted! Rest at a continent or wait for recharge.");
      return;
    }

    const typedAnswer = inputValue.trim();
    setInputValue("");
    setIsLoading(true);
    setIsError(false);

    // Deduct 15 thought energy per reflection effort
    reduceEnergy(15);

    // Add user message to history
    const userMsg: Message = {
      id: Math.random().toString(),
      sender: "user",
      text: typedAnswer,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      // Format history
      const prevHistory = messages
        .filter((m) => m.sender !== "system")
        .map((m) => ({
          sender: m.sender,
          text: m.text,
        }));

      // Submit respond payload to API
      const response = await fetch("/api/socratic/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodeId: node.id,
          question: messages[messages.length - 1]?.text || "",
          userAnswer: typedAnswer,
          history: prevHistory,
        }),
      });

      const data = await response.json();
      setIsOnlineMode(data.mode === "online");

      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: "ai",
          text: data.feedback,
          timestamp: new Date(),
        },
      ]);

      if (data.isMastered) {
        setIsMastered(true);
        onMasterNode(node.id);
        awardXp(120); // Award XP for mastering node
      }
    } catch (err) {
      console.error(err);
      setIsError(true);
      // Offline fallback evaluation
      const simpleVal = typedAnswer.length > 10;
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: "ai",
          text: `A thoughtful response: "${typedAnswer}". Is it possible that this holds true in most conditions, yet faces critical limits in others? Contemplate this path!`,
          timestamp: new Date(),
        },
      ]);

      if (simpleVal) {
        setIsMastered(true);
        onMasterNode(node.id);
        awardXp(80);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ y: 350, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 350, opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="absolute bottom-0 inset-x-0 bg-slate-900 border-t-4 border-amber-600 shadow-2xl z-20 flex flex-col h-[280px] font-mono leading-relaxed overflow-hidden"
    >
      {/* Dialogue Header */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 py-2 flex justify-between items-center select-none text-xs">
        <div className="flex items-center space-x-2 text-amber-500">
          <BookOpen className="w-4 h-4 animate-pulse" />
          <span className="font-bold tracking-wider">SOCRATIC LANDMARK: {node.name} ({node.discipline})</span>
        </div>
        <div className="flex items-center space-x-3 text-slate-400">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>{isOnlineMode ? "Gemini AI Live" : "Offline Sandbox Fallback"}</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close dialogue"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body section Split (Left Details / Right Conversation Scroll) */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Hand: Landmark Codex Details (Desktop only, responsive hidden on tiny screens) */}
        <div className="hidden md:flex flex-col w-1/4 bg-slate-950/80 border-r border-slate-800 p-3 select-none text-xs text-slate-400 space-y-2.5 overflow-y-auto">
          <div className="flex items-center space-x-1.5 text-slate-300 border-b border-slate-800 pb-1.5 font-bold">
            <Compass className="w-4 h-4 text-slate-400" />
            <span>EXAMINING LANDMARK</span>
          </div>
          <div>
            <span className="text-amber-500/90 font-bold block">Landmark Codex:</span>
            <p className="mt-1 text-slate-300 leading-normal text-[11px] bg-slate-900/60 p-2 border border-slate-900 rounded select-text">
              {node.details}
            </p>
          </div>
          <div>
            <span className="text-indigo-400 font-bold block">Philosophical Quest:</span>
            <span className="text-slate-300 block italic leading-normal text-[11px] mt-0.5">
              "{node.hint}"
            </span>
          </div>
          {isMastered && (
            <div className="mt-auto bg-emerald-950/40 p-2 border border-emerald-900 rounded text-emerald-400 text-[10px] flex gap-1.5 items-center">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Landmark mastered successfully! Permanent flame added to grid.</span>
            </div>
          )}
        </div>

        {/* Right Hand: Active Chat Board */}
        <div className="flex-1 flex flex-col bg-slate-900 relative">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => {
              if (message.sender === "system") {
                return (
                  <div key={message.id} className="text-center text-[10px] text-slate-500 tracking-wider">
                    --- {message.text} ---
                  </div>
                );
              }

              const isSocrates = message.sender === "ai";
              return (
                <div
                  key={message.id}
                  className={`flex ${isSocrates ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[85%] rounded p-2.5 text-xs border ${
                      isSocrates
                        ? "bg-slate-950/50 border-amber-900/50 text-amber-200"
                        : "bg-indigo-950/65 border-indigo-900 text-slate-200"
                    }`}
                  >
                    <div className="flex justify-between items-center text-[9px] text-slate-500 mb-1 select-none font-bold">
                      <span>{isSocrates ? "SOCRATES" : "VOYAGER TRAVELER"}</span>
                      <span>
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="whitespace-pre-line leading-relaxed text-[11px]">{message.text}</p>
                  </div>
                </div>
              );
            })}

            {/* Socratic reflective contemplation Loader */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-950/40 border border-slate-800 text-amber-300/80 rounded p-2.5 max-w-[85%] flex items-center space-x-2.5 text-xs animate-pulse">
                  <Flame className="w-4 h-4 text-amber-500 animate-spin" />
                  <span>Socrates is contemplating your premises...</span>
                </div>
              </div>
            )}

            {isError && (
              <div className="bg-rose-950/30 border border-rose-900/50 p-2.5 rounded text-rose-400 text-xs flex gap-2 items-center">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>Philosophical dialogue interrupted. Reconnecting sandbox channels...</span>
              </div>
            )}

            <div ref={messageEndRef} />
          </div>

          {/* dialogue typing input bar */}
          <div className="p-3 bg-slate-950/90 border-t border-slate-800 select-none">
            {isMastered ? (
              <div className="flex justify-between items-center gap-2">
                <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold">
                  <CheckCircle className="w-5 h-5 animate-bounce" />
                  <span>PREMISE INTEGRATED & LANDMARK UNLOCKED (+120 XP)</span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-slate-950 font-black text-xs px-4 py-1.5 rounded transition-transform cursor-pointer shadow-lg hover:scale-105"
                >
                  CONTINUE VOYAGE
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isLoading}
                  placeholder={
                    currentEnergy <= 0
                      ? "Low Thought Energy! Recharge required..."
                      : "Reflect onocrates' question and type your thoughts..."
                  }
                  className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 text-xs px-3 py-2 rounded focus:outline-none focus:border-amber-500 disabled:opacity-50 placeholder-slate-500"
                  maxLength={500}
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputValue.trim() || currentEnergy <= 0}
                  className="bg-amber-600 text-slate-950 font-black px-4.5 py-1.5 rounded text-xs flex items-center space-x-1.5 hover:bg-amber-500 active:bg-amber-700 transition-all disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer shrink-0 shadow-md"
                >
                  <span>REFLECT</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
