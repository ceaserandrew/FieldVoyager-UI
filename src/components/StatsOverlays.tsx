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
      <div className="flex-1 bg-[#fdf6e2] border-4 border-[#7c2d12] rounded-xl p-4 flex flex-col space-y-4 shadow-lg text-[#3c2f2f]">
        <div className="flex items-center space-x-3 border-b border-[#7c2d12]/20 pb-3">
          <div className="w-10 h-10 rounded-lg bg-[#eedba5] flex items-center justify-center border-2 border-[#7c2d12] shadow-inner">
            <Award className="w-6 h-6 text-[#7c2d12] animate-pulse" />
          </div>
          <div>
            <h2 className="text-[#7c2d12] text-sm font-black tracking-widest uppercase">FieldVoyager</h2>
            <div className="text-[10px] text-[#5e2207] font-bold mt-0.5">Lifelong Learner Rank: III</div>
          </div>
        </div>

        {/* Level and XP progress HUD */}
        <div className="space-y-1.5 text-xs text-[#3c2f2f]">
          <div className="flex justify-between font-extrabold text-[11px]">
            <span className="flex items-center gap-1 text-[#7c2d12]"><Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> LEVEL {stats.level}</span>
            <span className="text-[#7c2d12]/75">{stats.xp} / {stats.xpNeeded} XP</span>
          </div>
          <div className="w-full bg-[#eedba5]/40 h-3 border border-[#7c2d12]/40 rounded overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-600 to-yellow-500 h-full transition-all duration-500"
              style={{ width: `${(stats.xp / stats.xpNeeded) * 100}%` }}
            />
          </div>
        </div>

        {/* Thought Energy Indicator (Flame Icon and Retro meter bar) */}
        <div className="space-y-2 border-t border-[#7c2d12]/15 pt-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="relative">
                {/* Simulated retro flame glow */}
                <motion.div
                  animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute inset-0 bg-red-500 rounded-full blur-sm"
                />
                <Flame className="w-4.5 h-4.5 text-red-600 fill-red-600 relative z-10 animate-bounce" />
              </div>
              <span className="text-xs font-black text-[#5e1e07] uppercase tracking-wider">Thought Energy</span>
            </div>
            <span className="font-mono text-xs font-black text-[#7c2d12]">{stats.energy}%</span>
          </div>

          <div className="w-full bg-[#eedba5]/40 h-3.5 border border-[#7c2d12]/40 rounded flex overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                stats.energy > 50
                  ? "bg-gradient-to-r from-red-600 to-orange-500"
                  : stats.energy > 20
                  ? "bg-amber-500"
                  : "bg-red-600 animate-pulse"
              }`}
              style={{ width: `${stats.energy}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-[#713f12] pt-1 font-bold">
            <span>Requires: 15% / effort</span>
            {stats.energy < 30 ? (
              <button
                onClick={onMeditate}
                className="text-[9px] font-black bg-[#eedba5] border-2 border-[#7c2d12] hover:bg-[#7c2d12] hover:text-white active:bg-amber-950 text-[#3c2f2f] px-2 py-1 rounded cursor-pointer transition-colors shadow"
              >
                ☯ REST & MEDITATE (+40)
              </button>
            ) : (
              <span className="text-emerald-700 animate-pulse">Fully Charged</span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Middle and Right: Discipline Quest Log and Codex Tracker */}
      <div className="flex-[2] bg-[#fdf6e2] border-4 border-[#7c2d12] rounded-xl p-4 flex flex-col space-y-3 shadow-lg text-[#3c2f2f]">
        <div className="flex justify-between items-center border-b border-[#7c2d12]/20 pb-2">
          <div className="flex items-center space-x-2 text-[#7c2d12]">
            <Compass className="w-4 h-4" />
            <h3 className="text-xs font-black uppercase tracking-wider">Academic Discovery Quest Log</h3>
          </div>
          <span className="text-[10px] bg-[#eedba5] border border-[#7c2d12]/20 font-black text-[#7c2d12] px-2.5 py-0.5 rounded">
            Mastery progress: {solvedNodeIds.length} / {LANDMARKS.length}
          </span>
        </div>

        {/* Display Disciplines Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {disciplines.map((disc) => {
            const discNodes = LANDMARKS.filter((n) => n.discipline === disc);
            const discColor =
              disc === "Logic & Math"
                ? "border-purple-300 bg-purple-50"
                : disc === "Economics"
                ? "border-emerald-300 bg-emerald-50"
                : "border-blue-300 bg-blue-50";
            
            const txtColor =
              disc === "Logic & Math"
                ? "text-purple-800"
                : disc === "Economics"
                ? "text-emerald-800"
                : "text-blue-800";

            return (
              <div key={disc} className={`border-2 rounded-lg p-2.5 flex flex-col ${discColor}`}>
                <span className={`text-[10.5px] font-black uppercase tracking-wider ${txtColor} mb-2 bg-white/70 text-center py-0.5 rounded border border-[#7c2d12]/10`}>
                  {disc}
                </span>

                <div className="flex-1 flex flex-col space-y-2">
                  {discNodes.map((node) => {
                    const isSolved = solvedNodeIds.includes(node.id);
                    return (
                      <div
                        key={node.id}
                        className="flex flex-col p-2 rounded-lg bg-white/60 border border-[#7c2d12]/15 text-[10px] space-y-1.5"
                      >
                        <div className="flex justify-between items-center gap-1">
                          <span className="font-extrabold text-[#3c2f2f] truncate pr-1" title={node.name}>
                            {node.name}
                          </span>
                          <span
                            className={isSolved ? "text-emerald-700 font-bold shrink-0 text-[8.5px]" : "text-slate-400 font-bold shrink-0 text-[8.5px]"}
                          >
                            {isSolved ? "✦ DONE" : "○ LOCK"}
                          </span>
                        </div>
                        
                        <div className="flex gap-1 mt-1 justify-between items-center">
                          <button
                            onClick={() => onSelectNode(node)}
                            className="bg-amber-50 hover:bg-[#eedba5] border border-[#7c2d12]/20 text-[#7c2d12] text-[8px] font-bold px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                          >
                            Read Codex
                          </button>
                          
                          {/* Teleport shortcut for quick testing */}
                          <button
                            onClick={() => onTeleport({ x: node.x, y: node.y })}
                            className="flex items-center gap-0.5 text-[#1e3a8a] hover:text-[#1e3a8a]/80 font-bold text-[8.5px] border border-blue-200 bg-blue-50/50 hover:bg-blue-100 px-1 py-0.5 rounded cursor-pointer transition-colors"
                            title="Fast-travel player avatar to this Socratic landmark coordinate"
                          >
                            <MapPin className="w-2.5 h-2.5 text-[#1e3a8a]" />
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
