import React from "react";
import { PlayerStats, LandmarkNode } from "../types";
import { LANDMARKS } from "../landmarksData";
import { Flame, Star, Award, Compass, Zap, HelpCircle, MapPin } from "lucide-react";
import { motion } from "motion/react";

interface StatsOverlaysProps {
  stats: PlayerStats;
  solvedNodeIds: string[];
  openedNode: LandmarkNode | null;
  onSelectNode: (node: LandmarkNode) => void;
  onTeleport: (pos: { x: number; y: number }) => void;
  onMeditate: () => void;
}

export const StatsOverlays: React.FC<StatsOverlaysProps> = ({
  stats,
  solvedNodeIds,
  openedNode,
  onSelectNode,
  onTeleport,
  onMeditate,
}) => {
  // Group landmarks by discipline
  const disciplines = ["Logic & Math", "Economics", "Philosophy"];

  return (
    <div className="flex flex-col lg:flex-row gap-6 mt-4 w-full select-none font-mono">
      {/* 1. Left Profile & Thought Energy Indicator */}
      <div className="flex-1 bg-slate-900 border-2 border-slate-700/60 rounded-xl p-4 flex flex-col space-y-4">
        <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center border border-orange-500/35 shadow-inner">
            <Award className="w-6 h-6 text-orange-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-yellow-400 text-sm font-bold tracking-widest uppercase">FieldVoyager</h2>
            <div className="text-[10px] text-slate-400 mt-0.5">Lifelong Learner Rank: III</div>
          </div>
        </div>

        {/* Level and XP progress HUD */}
        <div className="space-y-1.5 text-xs text-slate-300">
          <div className="flex justify-between font-bold text-[11px]">
            <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" /> LEVEL {stats.level}</span>
            <span className="text-slate-400">{stats.xp} / {stats.xpNeeded} XP</span>
          </div>
          <div className="w-full bg-slate-950 h-3 border border-slate-800 rounded overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full transition-all duration-500"
              style={{ width: `${(stats.xp / stats.xpNeeded) * 100}%` }}
            />
          </div>
        </div>

        {/* Thought Energy Indicator (Flame Icon and Retro meter bar) */}
        <div className="space-y-2 border-t border-slate-800/80 pt-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="relative">
                {/* Simulated retro flame glow */}
                <motion.div
                  animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute inset-0 bg-red-600 rounded-full blur-sm"
                />
                <Flame className="w-4.5 h-4.5 text-orange-500 fill-orange-500 relative z-10 animate-bounce" />
              </div>
              <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">Thought Energy</span>
            </div>
            <span className="font-mono text-xs font-bold text-orange-300">{stats.energy}%</span>
          </div>

          <div className="w-full bg-slate-950 h-3.5 border border-slate-800 rounded flex overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                stats.energy > 50
                  ? "bg-gradient-to-r from-rose-500 to-orange-400"
                  : stats.energy > 20
                  ? "bg-amber-500"
                  : "bg-red-600 animate-pulse"
              }`}
              style={{ width: `${stats.energy}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
            <span>Power needed per challenge: 15%</span>
            {stats.energy < 30 ? (
              <button
                onClick={onMeditate}
                className="text-[10px] bg-indigo-950 border border-indigo-700 hover:bg-indigo-900 active:bg-indigo-950 text-indigo-300 px-2 py-1 rounded cursor-pointer transition-colors hover:text-white"
              >
                ☯ REST & MEDITATE (+40)
              </button>
            ) : (
              <span>Standby: Fully Charged</span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Middle and Right: Discipline Quest Log and Codex Tracker */}
      <div className="flex-[2] bg-slate-900 border-2 border-slate-700/60 rounded-xl p-4 flex flex-col space-y-3">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2 text-indigo-400">
            <Compass className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Academic Disciplines & Landmarks</h3>
          </div>
          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
            Mastery: {solvedNodeIds.length} / {LANDMARKS.length}
          </span>
        </div>

        {/* Display Disciplines Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {disciplines.map((disc) => {
            const discNodes = LANDMARKS.filter((n) => n.discipline === disc);
            const discColor =
              disc === "Logic & Math"
                ? "border-purple-900 bg-purple-950/20"
                : disc === "Economics"
                ? "border-emerald-900 bg-emerald-950/20"
                : "border-blue-900 bg-blue-950/20";
            
            const txtColor =
              disc === "Logic & Math"
                ? "text-purple-400"
                : disc === "Economics"
                ? "text-emerald-400"
                : "text-blue-400";

            return (
              <div key={disc} className={`border rounded-lg p-2.5 flex flex-col ${discColor}`}>
                <span className={`text-[11px] font-black uppercase tracking-wider ${txtColor} mb-2`}>
                  {disc}
                </span>

                <div className="flex-1 flex flex-col space-y-2">
                  {discNodes.map((node) => {
                    const isSolved = solvedNodeIds.includes(node.id);
                    return (
                      <div
                        key={node.id}
                        className="flex flex-col p-1.5 rounded bg-slate-950/40 border border-slate-850/60 text-[10px] space-y-1"
                      >
                        <div className="flex justify-between items-center gap-1">
                          <span className="font-bold text-slate-200 truncate pr-1" title={node.name}>
                            {node.name}
                          </span>
                          <span
                            className={isSolved ? "text-emerald-400 shrink-0 font-bold" : "text-slate-500 shrink-0"}
                          >
                            {isSolved ? "✦ MASTERED" : "○ LOCK"}
                          </span>
                        </div>
                        
                        <div className="flex gap-1 mt-1 justify-between items-center">
                          <button
                            onClick={() => onSelectNode(node)}
                            className="bg-slate-800 hover:bg-slate-750 text-slate-300 text-[8.5px] px-1.5 py-0.5 rounded cursor-pointer"
                          >
                            Read Codex
                          </button>
                          
                          {/* Teleport shortcut for quick testing */}
                          <button
                            onClick={() => onTeleport({ x: node.x, y: node.y })}
                            className="flex items-center gap-0.5 text-indigo-400 hover:text-white transition-colors text-[8.5px] border border-indigo-900/40 bg-indigo-950/20 hover:bg-indigo-900/20 px-1 py-0.5 rounded cursor-pointer"
                            title="Fast-travel player avatar to this Socratic landmark coordinate"
                          >
                            <MapPin className="w-2.5 h-2.5" />
                            <span>Travel</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
