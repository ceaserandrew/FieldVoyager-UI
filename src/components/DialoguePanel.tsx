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
      className="absolute bottom-0 inset-x-0 bg-[#fdf6e2] border-t-8 border-x-4 border-b-4 border-[#7c2d12] shadow-2xl z-20 flex flex-col h-[290px] font-mono leading-relaxed overflow-hidden rounded-t-xl"
    >
      {/* Dialogue Header - Wooden Timber Board Style */}
      <div className="bg-[#7c2d12] border-b border-[#5e1e07] px-4 py-2.5 flex justify-between items-center select-none text-xs">
        <div className="flex items-center space-x-2 text-yellow-300">
          <BookOpen className="w-4 h-4 animate-bounce" />
          <span className="font-extrabold tracking-wider uppercase">SOCRATIC QUEST: {node.name}</span>
        </div>
        <div className="flex items-center space-x-3 text-amber-100">
          <div className="flex items-center gap-1.5 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="text-[10px] font-bold">{isOnlineMode ? "Gemini AI" : "Local Sandbox Mode"}</span>
          </div>
          <button
            onClick={onClose}
            className="text-amber-200 hover:text-white hover:scale-110 transition-all cursor-pointer bg-[#9a3412] p-0.5 rounded-full"
            title="Close dialogue"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body section Split (Left Details / Right Conversation Scroll) */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Hand: Landmark Codex Details (Desktop only, warm timber parchment) */}
        <div className="hidden md:flex flex-col w-1/4 bg-[#eedba5]/80 border-r-2 border-[#7c2d12]/30 p-3.5 select-none text-xs text-[#3c2f2f] space-y-2 overflow-y-auto">
          <div className="flex items-center space-x-1.5 text-[#5c1d07] border-b-2 border-[#7c2d12]/20 pb-1.5 font-bold">
            <Compass className="w-4 h-4" />
            <span className="font-black text-[11px] uppercase tracking-wider">Landmark Info</span>
          </div>
          <div>
            <span className="text-[#9a3412] font-black block">Description:</span>
            <p className="mt-1 text-[#451a03] leading-normal text-[10.5px] bg-[#fdf6e2]/80 p-2.5 border border-[#7c2d12]/20 rounded-lg select-text">
              {node.details}
            </p>
          </div>
          <div>
            <span className="text-[#1e3a8a] font-black block">Hint:</span>
            <span className="text-[#3c2f2f] font-bold block italic leading-normal text-[10.5px] mt-0.5">
              "{node.hint}"
            </span>
          </div>
          {isMastered && (
            <div className="mt-auto bg-emerald-100 p-2 border border-emerald-600 rounded-lg text-emerald-800 text-[10px] flex gap-1.5 items-center font-bold">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-700 font-bold" />
              <span>Integrated! Landmark mastered permanently.</span>
            </div>
          )}
        </div>

        {/* Right Hand: Active Chat Board */}
        <div className="flex-1 flex flex-col bg-[#faf1da] relative">
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {messages.map((message) => {
              if (message.sender === "system") {
                return (
                  <div key={message.id} className="text-center text-[10px] text-[#7c2d12]/60 font-bold tracking-widest uppercase">
                    === {message.text} ===
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
                    className={`max-w-[85%] rounded-lg p-3 text-xs border-2 shadow-sm ${
                      isSocrates
                        ? "bg-[#fffbeb] border-[#d97706]/35 text-[#451a03]"
                        : "bg-white border-[#1e3a8a]/20 text-[#1e1b4b]"
                    }`}
                  >
                    <div className="flex justify-between items-center text-[9px] text-slate-500 mb-1 select-none font-bold gap-3 pb-1 border-b border-[#7c2d12]/10">
                      <span className={isSocrates ? "text-[#9a3412] font-black" : "text-[#1e3a8a] font-black"}>
                        {isSocrates ? "SOCRATES" : "VOYAGER TRAVELER"}
                      </span>
                      <span className="text-slate-400">
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="whitespace-pre-line leading-relaxed text-[11px] font-bold">{message.text}</p>
                  </div>
                </div>
              );
            })}

            {/* Socratic reflective contemplation Loader */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#fffbeb] border-2 border-[#d97706]/20 text-[#9a3412] rounded-lg p-2.5 max-w-[85%] flex items-center space-x-2.5 text-xs animate-pulse font-bold">
                  <Flame className="w-4 h-4 text-orange-500 animate-bounce" />
                  <span>Socrates is reflecting on your thoughts...</span>
                </div>
              </div>
            )}

            {isError && (
              <div className="bg-[#fee2e2] border-2 border-[#ef4444]/30 p-2.5 rounded-lg text-red-800 text-xs flex gap-2 items-center font-bold">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>Interrupted. Reconnecting local pathways...</span>
              </div>
            )}

            <div ref={messageEndRef} />
          </div>

          {/* dialogue typing input bar */}
          <div className="p-3 bg-[#eedba5]/80 border-t-2 border-[#7c2d12]/40 select-none">
            {isMastered ? (
              <div className="flex justify-between items-center gap-2">
                <div className="flex items-center space-x-2 text-emerald-800 text-[11px] font-black">
                  <CheckCircle className="w-5 h-5 text-emerald-700 animate-bounce" />
                  <span>PREMISE UNLOCKED! Permanent Node Mastered (+120 XP)</span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-[#7c2d12] hover:bg-[#9a3412] active:bg-amber-950 text-white font-black text-xs px-5 py-2 rounded-lg border-2 border-[#5e1e07] transition-all cursor-pointer shadow-md hover:scale-105"
                >
                  CONTINUE JOURNEY
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
                      ? "Depleted Energy! Regenerate or rest..."
                      : "Contemplate and formulate your philosophical response..."
                  }
                  className="flex-1 bg-white border-2 border-[#7c2d12]/30 text-[#3c2f2f] text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-[#7c2d12] disabled:opacity-50 placeholder-slate-400 font-bold"
                  maxLength={500}
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputValue.trim() || currentEnergy <= 0}
                  className="bg-[#7c2d12] hover:bg-[#9a3412] disabled:bg-slate-400 text-white font-black px-4.5 py-1.5 rounded-lg text-xs flex items-center space-x-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 shadow-md border border-[#5e1e07]"
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
