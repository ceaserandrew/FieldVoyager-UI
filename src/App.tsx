import { useState, useEffect } from "react";
import { Position, LandmarkNode, PlayerStats } from "./types";
import { LANDMARKS } from "./landmarksData";
import { MapCanvas } from "./components/MapCanvas";
import { DialoguePanel } from "./components/DialoguePanel";
import { StatsOverlays } from "./components/StatsOverlays";
import { motion, AnimatePresence } from "motion/react";
import { Flame, Compass, Star, HelpCircle, Book, Award, Check } from "lucide-react";
import { AvatarConfig, DEFAULT_AVATAR_CONFIG } from "./utils/avatarDrawer";
import { AvatarCustomizer } from "./components/AvatarCustomizer";

export default function App() {
  // Coordinates in the central tranquil ocean between the continents
  const [avatarPos, setAvatarPos] = useState<Position>({ x: 395, y: 310 });
  const [targetPos, setTargetPos] = useState<Position>({ x: 395, y: 310 });
  const [solvedNodeIds, setSolvedNodeIds] = useState<string[]>([]);
  const [activeDialogueNode, setActiveDialogueNode] = useState<LandmarkNode | null>(null);
  
  // Codex / Details modal node state
  const [examineNode, setExamineNode] = useState<LandmarkNode | null>(null);

  // Avatar customizer system
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(DEFAULT_AVATAR_CONFIG);
  const [showCustomizer, setShowCustomizer] = useState<boolean>(false);

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

    const savedAvatar = localStorage.getItem("fv_avatar_config");
    if (savedAvatar) {
      try {
        setAvatarConfig(JSON.parse(savedAvatar));
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
    <div className="min-h-screen bg-[#f5ebd0] text-[#3c2f2f] flex flex-col antialiased select-none selection:bg-[#7c2d12]/20">
      {/* 1. TOP HEADER OVERVIEW BAR - Elegant Timber Board look */}
      <header className="bg-[#7c2d12] border-b-8 border-[#5e1e07] py-4 px-6 flex justify-between items-center relative z-30 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-[#fdf6e2] border-2 border-amber-900 flex items-center justify-center shadow-md">
            <Compass className="w-5 h-5 text-[#7c2d12] rotate-12" />
          </div>
          <div className="flex flex-col md:flex-row md:items-center">
            <span className="font-sans font-black tracking-widest text-yellow-300 text-lg md:text-xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">FIELDVOYAGER</span>
            <span className="font-mono text-[9px] bg-amber-950/60 border border-amber-800/80 text-amber-100 font-extrabold px-1.5 py-0.5 rounded md:ml-3 uppercase tracking-wider w-fit mt-0.5 md:mt-0">
              Cozy Pixel Engine
            </span>
          </div>
        </div>

        <nav className="flex space-x-3.5">
          <button
            onClick={() => setShowCustomizer(true)}
            className="text-xs bg-emerald-700 hover:bg-emerald-600 hover:scale-105 active:scale-95 text-white font-black py-1.5 px-3.5 rounded-lg border-2 border-emerald-900 cursor-pointer transition-transform shadow flex items-center space-x-1"
          >
            <span>🎨 Customize Avatar</span>
          </button>
          <button
            onClick={() => setShowWelcome(true)}
            className="text-xs bg-[#fdf6e2] border-2 border-amber-900/80 hover:bg-amber-100 text-[#7c2d12] font-black py-1.5 px-3.5 rounded-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
          >
            Quest Guide
          </button>
          <button
            onClick={handleResetProgress}
            className="text-xs bg-red-850 hover:bg-red-800 text-rose-100 font-black py-1.5 px-3.5 rounded-lg border-2 border-red-950 transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-sm bg-[#9a3412]"
            title="Reset Game Sandbox"
          >
            Reset
          </button>
        </nav>
      </header>

      {/* 2. CORE PLAYABLE MAIN PANEL CONTAINER */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 flex flex-col space-y-5">
        
        {/* Dynamic Instructional Welcome Card - Cozy Parchment Scroll theme */}
        <AnimatePresence>
          {showWelcome && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-[#fef9c3] border-l-8 border-[#7c2d12] border-t border-r border-b border-[#7c2d12]/30 p-5 rounded-xl text-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden font-mono shadow-md"
            >
              <div className="space-y-1.5 max-w-4xl z-10 relative">
                <h2 className="text-[#7c2d12] font-black tracking-wider uppercase text-sm flex items-center gap-1.5">
                  🌻 Welcome, Voyager! Explore Academic Continents
                </h2>
                <p className="text-amber-950 leading-relaxed text-[11px] font-semibold">
                  You are steering an avatar across islands of human knowledge. Click anywhere on the map grid to move.
                  Walk near active glowing landmarks to challenge Socrates' socratic dialogue.
                  Correct responses award you XP, level up your rank, and permanently master that landmark.
                </p>
                <div className="flex flex-wrap gap-4 pt-1 font-mono text-[10.5px] font-bold text-[#713f12]">
                  <span>🔮 West: Logic & Math Plains</span>
                  <span>🌽 East: Economics Valleys</span>
                  <span>🏛️ South: Philosophy Peaks</span>
                </div>
              </div>
              <button
                onClick={() => setShowWelcome(false)}
                className="bg-[#7c2d12] hover:bg-[#9a3412] active:bg-amber-950 text-white font-black text-xs py-1.5 px-4 rounded-lg border-2 border-[#5e1e07] cursor-pointer shrink-0 shadow transition-all hover:scale-105"
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
            avatarConfig={avatarConfig}
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
          <div className="fixed inset-0 bg-[#3c2f2f]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-mono">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#fdf6e2] border-4 border-[#7c2d12] max-w-lg w-full rounded-xl overflow-hidden shadow-2xl flex flex-col text-[#3c2f2f]"
            >
              {/* Header */}
              <div className="bg-[#7c2d12] border-b-2 border-amber-950 p-4 flex justify-between items-center text-amber-100">
                <span className="text-yellow-300 text-xs font-black uppercase tracking-wider">
                  📖 Codex: {examineNode.discipline}
                </span>
                <button
                  onClick={() => setExamineNode(null)}
                  className="text-amber-200 hover:text-white hover:scale-110 cursor-pointer transition-all bg-amber-950/40 p-1 rounded-full border border-amber-900/30"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4 text-xs bg-[#faf1da]">
                <div>
                  <h3 className="text-sm font-black text-[#7c2d12]">{examineNode.name}</h3>
                  <span className={`uppercase text-[10px] tracking-widest mt-1 block font-black ${solvedNodeIds.includes(examineNode.id) ? "text-emerald-700" : "text-amber-700"}`}>
                    {solvedNodeIds.includes(examineNode.id) ? "✦ MASTERED" : "○ UNCONQUERED"}
                  </span>
                </div>

                <div className="h-0.5 bg-[#7c2d12]/15" />

                <div className="space-y-1">
                  <span className="text-[10px] text-[#7c2d12]/65 block font-black uppercase">Theoretical Registry:</span>
                  <p className="text-[#3c2f2f] leading-relaxed text-[11px] font-semibold bg-[#fffbeb] p-3 rounded-lg border border-[#7c2d12]/10">{examineNode.details}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-[#7c2d12]/65 block font-black uppercase">Thematic Obstacle:</span>
                  <p className="text-[#3c2f2f] italic text-[11px] font-bold bg-[#eedba5]/30 p-2.5 rounded-lg border border-[#7c2d12]/5">"{examineNode.hint}"</p>
                </div>

                <div className="bg-[#eedba5]/40 p-3 rounded-lg border border-[#7c2d12]/15 flex items-center justify-between font-bold text-[10.5px]">
                  <span className="text-[#713f12]">Map coordinate:</span>
                  <span className="text-[#7c2d12]">X: {examineNode.x} | Y: {examineNode.y}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-[#eedba5] p-4 border-t-2 border-[#7c2d12]/20 flex justify-end space-x-2.5">
                <button
                  onClick={() => {
                    handleTeleport({ x: examineNode.x, y: examineNode.y });
                    setExamineNode(null);
                  }}
                  className="bg-[#7c2d12] hover:bg-[#9a3412] active:bg-amber-950 text-white font-black text-xs px-4 py-2 rounded-lg border-2 border-amber-950 transition-all cursor-pointer shadow hover:scale-103"
                >
                  Teleport Avatar Here
                </button>
                <button
                  onClick={() => setExamineNode(null)}
                  className="bg-[#fdf6e2] hover:bg-amber-100 text-[#7c2d12] font-black text-xs px-4 py-2 rounded-lg border-2 border-amber-900/60 cursor-pointer shadow"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Level Up Celebration Toast Modal - Harvest Wood & Gold banner */}
      <AnimatePresence>
        {levelUpMessage && (
          <div className="fixed inset-0 bg-[#3c2f2f]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-mono">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-[#faf1da] border-8 border-amber-500/80 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl relative overflow-hidden"
            >
              <Award className="w-16 h-16 text-amber-600 mx-auto animate-bounce mb-3" />
              <h2 className="text-xl font-black text-[#5e1e07] tracking-widest uppercase">✨ RANK UP! ✨</h2>
              <div className="text-[10px] text-[#713f12] font-extrabold uppercase tracking-widest mt-1">Learner Level Increased!</div>
              
              <p className="text-amber-950 text-xs font-bold leading-relaxed mt-4 bg-[#fdf6e2] p-4 rounded-xl border-2 border-[#7c2d12]/20">
                {levelUpMessage}
              </p>

              <button
                onClick={() => setLevelUpMessage(null)}
                className="mt-5 w-full bg-[#7c2d12] hover:bg-[#9a3412] active:bg-amber-950 text-white font-black text-xs py-2.5 rounded-lg border-2 border-amber-950 shadow-md cursor-pointer transition-transform hover:scale-103"
              >
                PROCEED ON VOYAGE
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Meditation / Rest Dialog Splash banner */}
      <AnimatePresence>
        {showMeditationAlert && (
          <div className="fixed inset-0 bg-[#3c2f2f]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-mono">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#fdf6e2] border-4 border-[#7c2d12] max-w-md w-full p-6 rounded-2xl text-center shadow-2xl flex flex-col items-center text-[#3c2f2f]"
            >
              <div className="w-12 h-12 bg-[#eedba5] rounded-full flex items-center justify-center border-2 border-[#7c2d12] mb-4">
                <Flame className="w-6 h-6 text-red-600 fill-red-600 animate-pulse" />
              </div>
              <h3 className="text-[#7c2d12] text-sm font-black uppercase tracking-wider">Tranquil Meditation Completed</h3>
              
              <p className="text-amber-900 text-xs italic font-bold leading-relaxed mt-4 bg-[#faf1da] p-4 rounded-xl border border-[#7c2d12]/15 max-w-sm">
                "{currentQuote}"
              </p>
              
              <div className="text-[10px] text-emerald-800 mt-3 font-extrabold bg-emerald-100 px-3 py-1 rounded border border-emerald-500/20">
                🌱 +40 THOUGHT ENERGY REPLENISHED (RESTING MINDS FLOURISH)
              </div>

              <button
                onClick={() => setShowMeditationAlert(false)}
                className="mt-5 w-full bg-[#7c2d12] hover:bg-[#9a3412] text-white font-black text-xs py-2.5 rounded-lg border-2 border-amber-950 cursor-pointer transition-colors shadow"
              >
                Return to Overworld
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Custom paper doll avatar customizer modal */}
      <AnimatePresence>
        {showCustomizer && (
          <AvatarCustomizer
            currentConfig={avatarConfig}
            onClose={() => setShowCustomizer(false)}
            onSave={(newVal) => {
              setAvatarConfig(newVal);
              localStorage.setItem("fv_avatar_config", JSON.stringify(newVal));
              setShowCustomizer(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* 4. Humbler Footer credits - Shelved Wooden Plate */}
      <footer className="bg-[#7c2d12] border-t-4 border-[#5e1e07] py-4 text-center text-[10.5px] text-amber-100 font-mono font-bold">
        🌿 FieldVoyager Overworld Simulator © 2026. Made with Socratic Sincerity. Click to explore & learn!
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
