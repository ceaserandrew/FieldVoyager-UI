import { useState, useEffect } from "react";
import { Position, LandmarkNode, PlayerStats } from "./types";
import { LANDMARKS } from "./landmarksData";
import { MapCanvas } from "./components/MapCanvas";
import { DialoguePanel } from "./components/DialoguePanel";
import { StatsOverlays } from "./components/StatsOverlays";
import { motion, AnimatePresence } from "motion/react";
import { Flame, Compass, Star, HelpCircle, Book, Award, Check } from "lucide-react";

export default function App() {
  // Coordinates in the central tranquil ocean between the continents
  const [avatarPos, setAvatarPos] = useState<Position>({ x: 395, y: 310 });
  const [targetPos, setTargetPos] = useState<Position>({ x: 395, y: 310 });
  const [solvedNodeIds, setSolvedNodeIds] = useState<string[]>([]);
  const [activeDialogueNode, setActiveDialogueNode] = useState<LandmarkNode | null>(null);
  
  // Codex / Details modal node state
  const [examineNode, setExamineNode] = useState<LandmarkNode | null>(null);

  // Gamified Player Stats State
  const [stats, setStats] = useState<PlayerStats>({
    level: 1,
    xp: 0,
    xpNeeded: 200,
    energy: 100, // Thought Energy
    activeDials: 0,
  });

  const [levelUpMessage, setLevelUpMessage] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showMeditationAlert, setShowMeditationAlert] = useState(false);

  // Socratic random meditation wisdom quote
  const socratesQuotes = [
    "An unexamined life is not worth living. - Socrates",
    "Wonder is the beginning of wisdom. - Socrates",
    "To know, is to know that you know nothing. That is the meaning of true knowledge. - Socrates",
    "I cannot teach anybody anything. I can only make them think. - Socrates",
    "Be kind, for everyone you meet is fighting a hard battle. - Socrates",
    "Wisdom begins in wonder. - Socrates",
    "The secret of happiness, you see, is not found in seeking more, but in developing the capacity to enjoy less. - Socrates",
  ];
  const [currentQuote, setCurrentQuote] = useState(socratesQuotes[0]);

  // Load state from local storage on mount (for robust persistent cloud/local sandbox safety)
  useEffect(() => {
    const savedSolved = localStorage.getItem("fv_solved_nodes");
    if (savedSolved) {
      try {
        setSolvedNodeIds(JSON.parse(savedSolved));
      } catch (e) {
        console.error(e);
      }
    }

    const savedStats = localStorage.getItem("fv_player_stats");
    if (savedStats) {
      try {
        setStats(JSON.parse(savedStats));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Save changes to local storage
  const saveGameState = (solvedIds: string[], currentStats: PlayerStats) => {
    localStorage.setItem("fv_solved_nodes", JSON.stringify(solvedIds));
    localStorage.setItem("fv_player_stats", JSON.stringify(currentStats));
  };

  // Close Socratic dialogue panel
  const handleCloseDialogue = () => {
    setActiveDialogueNode(null);
  };

  // Solve/master node trigger
  const handleMasterNode = (nodeId: string) => {
    if (solvedNodeIds.includes(nodeId)) return;

    const newSolved = [...solvedNodeIds, nodeId];
    setSolvedNodeIds(newSolved);

    // Sync stats and save
    const updatedStats = { ...stats, activeDials: newSolved.length };
    setStats(updatedStats);
    saveGameState(newSolved, updatedStats);
  };

  // Award XP and manage Level up
  const handleAwardXp = (amount: number) => {
    setStats((prev) => {
      let newXp = prev.xp + amount;
      let newLevel = prev.level;
      let newXpNeeded = prev.xpNeeded;
      let leveledUp = false;

      if (newXp >= newXpNeeded) {
        newLevel += 1;
        newXp = newXp - newXpNeeded;
        newXpNeeded = Math.round(newXpNeeded * 1.35); // ramp up
        leveledUp = true;
      }

      const nextStats = {
        ...prev,
        level: newLevel,
        xp: newXp,
        xpNeeded: newXpNeeded,
        // Restore 30 thought energy automatically when gaining mastery XP
        energy: Math.min(100, prev.energy + 30),
      };

      if (leveledUp) {
        setLevelUpMessage(`LEVEL UP! You have advanced to Level ${newLevel}! Inner intellect enhanced! (+30 Thought Energy)`);
      }

      saveGameState(solvedNodeIds, nextStats);
      return nextStats;
    });
  };

  // Reduce Thought Energy on Socratic reflection trigger
  const handleReduceEnergy = (amount: number) => {
    setStats((prev) => {
      const nextStats = {
        ...prev,
        energy: Math.max(0, prev.energy - amount),
      };
      saveGameState(solvedNodeIds, nextStats);
      return nextStats;
    });
  };

  // Rest & Meditate to restore mental flame
  const handleMeditate = () => {
    const randomQuote = socratesQuotes[Math.floor(Math.random() * socratesQuotes.length)];
    setCurrentQuote(randomQuote);
    setShowMeditationAlert(true);

    setStats((prev) => {
      const nextStats = {
        ...prev,
        energy: Math.min(100, prev.energy + 40),
      };
      saveGameState(solvedNodeIds, nextStats);
      return nextStats;
    });
  };

  // Teleport Avatar directly (convenience for testing landmarks quickly)
  const handleTeleport = (pos: Position) => {
    // Stop interactive active dialogs if moving away
    setActiveDialogueNode(null);

    // Set positions slightly offset from node so the proximity collider detects immediately!
    const offsetPos = { x: pos.x, y: pos.y + 16 };
    setAvatarPos(offsetPos);
    setTargetPos(offsetPos);
  };

  // Reset Game progress for sandboxed replay value
  const handleResetProgress = () => {
    if (confirm("Reset your voyager journey, learned nodes, and level status?")) {
      const resetStats: PlayerStats = {
        level: 1,
        xp: 0,
        xpNeeded: 200,
        energy: 100,
        activeDials: 0,
      };
      const resetSolved: string[] = [];
      setSolvedNodeIds(resetSolved);
      setStats(resetStats);
      setAvatarPos({ x: 395, y: 310 });
      setTargetPos({ x: 395, y: 310 });
      setActiveDialogueNode(null);
      saveGameState(resetSolved, resetStats);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased select-none selection:bg-indigo-500/30">
      {/* 1. TOP HEADER OVERVIEW BAR */}
      <header className="bg-slate-900 border-b border-slate-800 py-3.5 px-6 flex justify-between items-center relative z-30 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center">
            <Compass className="w-5 h-5 text-indigo-400 rotate-12" />
          </div>
          <div>
            <span className="font-sans font-black tracking-widest text-[#facc15] text-base">FIELDVOYAGER</span>
            <span className="font-mono text-[9px] bg-slate-950 border border-slate-800 text-indigo-400 px-1.5 py-0.5 rounded ml-2 uppercase">
              UI Prototype
            </span>
          </div>
        </div>

        <nav className="flex space-x-3">
          <button
            onClick={() => setShowWelcome(true)}
            className="text-xs bg-slate-800/80 border border-slate-700/60 hover:bg-slate-700 hover:text-white text-slate-300 font-mono py-1 px-3 rounded-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            Guide List
          </button>
          <button
            onClick={handleResetProgress}
            className="text-xs bg-rose-950/40 border border-rose-900/60 hover:bg-rose-900 hover:text-white text-rose-300 font-mono py-1 px-3 rounded-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            title="Reset Game Sandbox"
          >
            Reset
          </button>
        </nav>
      </header>

      {/* 2. CORE PLAYABLE MAIN PANEL CONTAINER */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 flex flex-col space-y-5">
        
        {/* Dynamic Instructional Welcome Card */}
        <AnimatePresence>
          {showWelcome && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-slate-900 border-l-4 border-[#3a86c8] p-4.5 rounded-xl text-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden font-mono shadow"
            >
              <div className="space-y-1.5 max-w-4xl z-10 relative">
                <h2 className="text-yellow-400 font-black tracking-wider uppercase text-sm">
                  Welcome, Voyager! Explore Academic Continents
                </h2>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  You are steering an avatar across islands of human knowledge. Click anywhere on the map grid to move.
                  Walk near high spots (glowing landmarks) to challenge the Socratic AI on key theories.
                  Correct deliberation awards you XP, levels you up, and permanently lights up that landmark on your grid.
                </p>
                <div className="flex gap-4 pt-1 font-mono text-[10.5px] text-[#3a86c8]">
                  <span>💜 West: Logic & Math Plains</span>
                  <span>💚 East: Economics Valleys</span>
                  <span>💙 South: Philosophy Peaks</span>
                </div>
              </div>
              <button
                onClick={() => setShowWelcome(false)}
                className="bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs py-1 px-3 rounded-lg cursor-pointer shrink-0 border border-slate-700/65"
              >
                Got it
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Playable Overworld Stage Panel */}
        <div className="relative">
          <MapCanvas
            avatarPos={avatarPos}
            setAvatarPos={setAvatarPos}
            targetPos={targetPos}
            setTargetPos={setTargetPos}
            solvedNodeIds={solvedNodeIds}
            activeNodeId={activeDialogueNode?.id || null}
            onNearNode={(node) => setActiveDialogueNode(node)}
            isDialogueOpen={activeDialogueNode !== null}
          />

          {/* Dialogue card overlay (slides up nicely) */}
          <AnimatePresence>
            {activeDialogueNode && (
              <DialoguePanel
                node={activeDialogueNode}
                onClose={handleCloseDialogue}
                onMasterNode={handleMasterNode}
                reduceEnergy={handleReduceEnergy}
                awardXp={handleAwardXp}
                currentEnergy={stats.energy}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Dashboard Status HUD and Quest Log */}
        <StatsOverlays
          stats={stats}
          solvedNodeIds={solvedNodeIds}
          openedNode={examineNode}
          onSelectNode={(node) => setExamineNode(node)}
          onTeleport={handleTeleport}
          onMeditate={handleMeditate}
        />
      </main>

      {/* 3. POPUP MODALS & NOTIFICATIONS */}
      
      {/* Socratic Codex Examiner Modal */}
      <AnimatePresence>
        {examineNode && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-mono">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border-2 border-slate-700 max-w-lg w-full rounded-xl overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="bg-slate-950 border-b border-slate-800 p-4 flex justify-between items-center">
                <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">
                  Codex: {examineNode.discipline}
                </span>
                <button
                  onClick={() => setExamineNode(null)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4 text-xs">
                <div>
                  <h3 className="text-sm font-black text-white">{examineNode.name}</h3>
                  <span className="text-indigo-400 uppercase text-[10px] tracking-widest mt-1 block">
                    {solvedNodeIds.includes(examineNode.id) ? "● MASTERED" : "○ UNCONQUERED"}
                  </span>
                </div>

                <div className="h-px bg-slate-800" />

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 block uppercase">Theoretical Registry:</span>
                  <p className="text-slate-300 leading-relaxed text-[11px]">{examineNode.details}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 block uppercase">Thematic Obstacle:</span>
                  <p className="text-slate-300 italic text-[11px]">"{examineNode.hint}"</p>
                </div>

                <div className="bg-slate-950 p-3 rounded border border-slate-850 flex items-center justify-between">
                  <span className="text-slate-400">Map coordinate:</span>
                  <span className="text-indigo-300 text-[10.5px]">X: {examineNode.x} | Y: {examineNode.y}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-slate-950 p-4 border-t border-slate-800 flex justify-end space-x-2.5">
                <button
                  onClick={() => {
                    handleTeleport({ x: examineNode.x, y: examineNode.y });
                    setExamineNode(null);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded transition-colors cursor-pointer"
                >
                  Teleport Avatar Here
                </button>
                <button
                  onClick={() => setExamineNode(null)}
                  className="bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs px-4 py-2 rounded cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Level Up Celebration Toast Modal */}
      <AnimatePresence>
        {levelUpMessage && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-mono">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gradient-to-b from-slate-900 to-indigo-950 border-2 border-yellow-500 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl relative overflow-hidden"
            >
              {/* Star sparkles */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 opacity-10 scale-[2.5]" />
              
              <Award className="w-16 h-16 text-yellow-400 mx-auto animate-bounce mb-3" />
              <h2 className="text-xl font-black text-yellow-400 tracking-widest uppercase">LEVEL INCREASED!</h2>
              <div className="text-[10px] text-[#ffbe0b] uppercase tracking-widest mt-1">Voyager Level-Up Triumphant</div>
              
              <p className="text-slate-300 text-xs leading-relaxed mt-4 bg-slate-950/60 p-3 rounded border border-indigo-950/60">
                {levelUpMessage}
              </p>

              <button
                onClick={() => setLevelUpMessage(null)}
                className="mt-5 w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black text-xs py-2.5 rounded-lg shadow-lg cursor-pointer transition-transform hover:scale-103"
              >
                PROCEED VOYAGER
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Meditation / Rest Dialog Splash banner */}
      <AnimatePresence>
        {showMeditationAlert && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-mono">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-900 border-2 border-slate-700/80 max-w-md w-full p-6 rounded-2xl text-center shadow-2xl flex flex-col items-center"
            >
              <div className="w-12 h-12 bg-indigo-950 rounded-full flex items-center justify-center border border-indigo-500/30 mb-4 animate-spin-slow">
                <Flame className="w-6 h-6 text-indigo-400 fill-indigo-400" />
              </div>
              <h3 className="text-[#60a5fa] text-sm font-black uppercase tracking-wider">Tranquil Meditation Completed</h3>
              
              <p className="text-slate-300 text-xs italic leading-relaxed mt-4 bg-slate-950 p-4 rounded border border-slate-850 max-w-sm">
                "{currentQuote}"
              </p>
              
              <div className="text-[10px] text-emerald-400 mt-3 font-bold">
                +40 THOUGHT ENERGY SECURED (RESTING MINDS FLOURISH)
              </div>

              <button
                onClick={() => setShowMeditationAlert(false)}
                className="mt-5 w-full bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs py-2.5 rounded-lg cursor-pointer transition-colors"
              >
                Return to Overworld
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Humbler Footer credits */}
      <footer className="bg-slate-950 border-t border-slate-900 py-3.5 text-center text-[10px] text-slate-600 font-mono">
        FieldVoyager overworld simulator. Responsive HTML5 Canvas game loops. Crafted with Socratic Sincerity.
      </footer>
    </div>
  );
}

// Simple absolute cross-icon helper if we didn't import it
const X = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);
