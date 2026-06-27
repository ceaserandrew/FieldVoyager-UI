import React from "react";
import { LandmarkNode, Position } from "../types";
import { Compass, ZoomIn, ZoomOut, Maximize, BookOpen, Camera, Smartphone } from "lucide-react";

interface MapUIOverlaysProps {
  avatarPos: Position;
  cameraMode: "follow" | "free";
  timeOfDay: "Morning" | "Noon" | "Sunset" | "Night";
  setTimeOfDay: (t: "Morning" | "Noon" | "Sunset" | "Night") => void;
  selectedWeather: "Sunny" | "Rain" | "Snow" | "Storm" | "Sakura";
  setSelectedWeather: (w: "Sunny" | "Rain" | "Snow" | "Storm" | "Sakura") => void;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  handleRecenter: () => void;
  hoveredNode: LandmarkNode | null;
  isDialogueOpen: boolean;
  tooltipProps: { left: number; top: number } | null;
  solvedNodeIds: string[];
  dimensions: { width: number; height: number };
  activeDiary: "turing" | "smith" | "plato" | null;
  setActiveDiary: (d: "turing" | "smith" | "plato" | null) => void;
  onTakePhoto: (time: "Morning" | "Noon" | "Sunset" | "Night", weather: "Sunny" | "Rain" | "Snow" | "Storm" | "Sakura") => void;
  setIsPhoneOpen: (open: boolean) => void;
}

export const MapUIOverlays: React.FC<MapUIOverlaysProps> = ({
  avatarPos,
  cameraMode,
  timeOfDay,
  setTimeOfDay,
  selectedWeather,
  setSelectedWeather,
  zoom,
  setZoom,
  handleRecenter,
  hoveredNode,
  isDialogueOpen,
  tooltipProps,
  solvedNodeIds,
  dimensions,
  activeDiary,
  setActiveDiary,
  onTakePhoto,
  setIsPhoneOpen,
}) => {
  return (
    <>
      {/* FLOATING CONTROLLER WIDGETS */}
      {/* 1. Camera Mode Indicator & Recenter button */}
      <div className="absolute bottom-3 left-3 bg-[#fdf6e2] border-2 border-[#7c2d12] rounded-lg p-2 shadow-md flex flex-col space-y-1.5 z-10 font-mono text-[#3c2f2f] max-w-[155px]">
        <span className="text-[9px] uppercase font-black tracking-wider text-[#7c2d12] border-b border-[#7c2d12]/20 pb-0.5">
          🎥 Cam Options
        </span>
        <div className="flex flex-col space-y-1">
          <div className="flex justify-between items-center text-[9px] px-1">
            <span className="text-[#7c2d12]/70">Mode:</span>
            <span className="font-black text-[#7c2d12] uppercase">{cameraMode}</span>
          </div>
          <button
            onClick={handleRecenter}
            className="flex items-center justify-center space-x-1 bg-amber-100 hover:bg-amber-200 text-[#7c2d12] border border-[#7c2d12]/40 rounded px-1.5 py-1 text-[9px] font-black cursor-pointer transition-colors"
          >
            <Maximize className="w-2.5 h-2.5" />
            <span>Center Avatar</span>
          </button>
        </div>
      </div>

      {/* 2. Diurnal Atmosphere Clock Widget */}
      <div className="absolute top-14 left-3 bg-[#fdf6e2] border-2 border-[#7c2d12] rounded-lg p-2.5 shadow-md flex flex-col space-y-1 z-10 font-mono text-[#3c2f2f] max-w-[150px]">
        <span className="text-[9.5px] uppercase font-black tracking-widest text-[#7c2d12] border-b border-[#7c2d12]/20 pb-1 flex items-center space-x-1">
          <span>🌅 Time of Day</span>
        </span>
        <div className="grid grid-cols-2 gap-1 mt-1">
          {(["Morning", "Noon", "Sunset", "Night"] as const).map((t) => {
            const isActive = timeOfDay === t;
            return (
              <button
                key={t}
                onClick={() => setTimeOfDay(t)}
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                  isActive
                    ? "bg-[#7c2d12] text-amber-100 border-[#7c2d12]"
                    : "bg-amber-100/65 hover:bg-amber-200/80 text-[#3c2f2f] border-amber-990/15"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2.5 Dynamic Weather Box Control HUD */}
      <div className="absolute top-[178px] left-3 bg-[#fdf6e2] border-2 border-[#7c2d12] rounded-lg p-2 shadow-md flex flex-col space-y-1 z-10 font-mono text-[#3c2f2f] max-w-[150px]">
        <span className="text-[9.5px] uppercase font-black tracking-widest text-[#7c2d12] border-b border-[#7c2d12]/20 pb-0.5 flex items-center space-x-1">
          <span>🌀 Weather Box</span>
        </span>
        <div className="grid grid-cols-2 gap-1 mt-1">
          {(["Sunny", "Rain", "Snow", "Storm", "Sakura"] as const).map((w) => {
            const isActive = selectedWeather === w;
            return (
              <button
                key={w}
                onClick={() => setSelectedWeather(w)}
                className={`text-[8px] font-bold px-1.5 py-1 rounded border transition-colors cursor-pointer flex items-center justify-center space-x-0.5 ${
                  isActive
                    ? "bg-[#7c1d12] text-amber-100 border-[#7c1d12]"
                    : "bg-amber-100/65 hover:bg-amber-200/80 text-[#3c2f2f] border-amber-990/15"
                }`}
              >
                <span>{w === "Sunny" ? "☀️" : w === "Rain" ? "🌧️" : w === "Snow" ? "❄️" : w === "Storm" ? "⚡" : "🌸"}</span>
                <span>{w}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2.6 Floating Pocket Phone and Camera HUD Controllers */}
      <div className="absolute top-14 right-3 flex flex-col space-y-2 z-15 font-mono">
        <button
          onClick={() => onTakePhoto(timeOfDay, selectedWeather)}
          className="w-10 h-10 bg-[#fdf6e2] hover:bg-pink-100 border-2 border-[#7c2d12] text-[#7c2d12] rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-all hover:scale-110 active:scale-95"
          title="Take scenic snapshot (双击化身亦可)"
        >
          <Camera className="w-5 h-5 text-pink-600 animate-pulse" />
        </button>

        <button
          onClick={() => setIsPhoneOpen(true)}
          className="w-10 h-12 bg-[#7c2d12] hover:bg-[#9a3412] text-amber-100 border-2 border-[#5e1e07] rounded-b-xl flex flex-col items-center justify-center shadow-lg cursor-pointer transition-all hover:translate-y-1 active:scale-95"
          title="Open Pocket Phone (↑ / 滑动拉出)"
        >
          <Smartphone className="w-4.5 h-4.5 animate-bounce" style={{ animationDuration: '3s' }} />
          <span className="text-[7.5px] font-black tracking-widest uppercase mt-0.5">↑</span>
        </button>
      </div>

      {/* 3. Infinite Zoom Slider Widget */}
      <div className="absolute bottom-3 right-3 bg-[#fdf6e2] border-2 border-[#7c2d12] rounded-lg p-2.5 shadow-md flex items-center space-x-2.5 z-10 font-mono text-[#3c2f2f] min-w-[210px]">
        <button
          onClick={() => setZoom((z) => Math.max(0.45, z - 0.15))}
          className="bg-amber-100/80 p-1 rounded hover:bg-amber-200 border border-[#7c2d12]/30 cursor-pointer text-[#7c2d12]"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1 flex flex-col space-y-0.5 text-center">
          <span className="text-[8px] uppercase tracking-wider text-[#7c2d12]/80 font-black">Zoom Factor</span>
          <input
            type="range"
            min="0.45"
            max="2.2"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-full accent-[#7c2d12] cursor-pointer h-1 bg-amber-950/10 rounded-lg outline-none"
          />
          <span className="text-[9.5px] font-black text-[#7c2d12]">{Math.round(zoom * 100)}%</span>
        </div>
        <button
          onClick={() => setZoom((z) => Math.min(2.2, z + 0.15))}
          className="bg-amber-100/80 p-1 rounded hover:bg-amber-200 border border-[#7c2d12]/30 cursor-pointer text-[#7c2d12]"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Hover Tooltip Overlay with Projected screen coords */}
      {hoveredNode && !isDialogueOpen && tooltipProps && (
        <div
          className="absolute font-mono pointer-events-none p-3.5 bg-[#fdf6e2] border-2 border-[#7c2d12] text-[#3c2f2f] rounded-lg shadow-2xl text-xs flex flex-col space-y-1.5 transition-all duration-75"
          style={{
            left: `${Math.min(dimensions.width - 262, Math.max(12, tooltipProps.left - 120))}px`,
            top: `${Math.min(dimensions.height - 180, Math.max(50, tooltipProps.top - 146))}px`,
            width: "250px",
            zIndex: 30,
          }}
        >
          <div className="flex justify-between items-center bg-amber-100 px-1.5 py-0.5 rounded text-[9.5px] border border-[#7c2d12]/25">
            <span className="uppercase font-black text-[#7c2d12]">{hoveredNode.discipline}</span>
            <span className={solvedNodeIds.includes(hoveredNode.id) ? "text-emerald-700 font-bold" : "text-amber-700 font-bold"}>
              {solvedNodeIds.includes(hoveredNode.id) ? "● MASTERED" : "○ UNEXPLORED"}
            </span>
          </div>
          <span className="font-extrabold text-[#7c2d12] text-sm mt-1 pr-1">{hoveredNode.name}</span>
          <p className="text-[#3c2f2f]/90 text-[11px] leading-relaxed mt-0.5">{hoveredNode.description}</p>
          <div className="text-[9.5px] text-[#7d4115] font-semibold italic mt-1 border-t border-[#7c2d12]/15 pt-1.5 flex items-center justify-between">
            <span>Grid Coordinates: ({hoveredNode.x}, {hoveredNode.y})</span>
            <span className="animate-pulse">Click here &rarr;</span>
          </div>
        </div>
      )}

      {/* 4. Scholar's Historic Research Diary Scroll Overlay */}
      {activeDiary && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-[40] flex items-center justify-center p-6">
          <div className="relative bg-[#f5ecdf] border-4 border-double border-[#5c3317] rounded-xl max-w-lg w-full p-6 shadow-2xl font-serif text-[#2e1a0c] animate-in fade-in zoom-in-95 duration-200">
            {/* Antique Scroll handles top / bottom */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#3e2311] text-[#fef08a] px-3.5 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase border border-[#7c2d12]">
              📜 ANCIENT SCIENTIFIC JOURNAL
            </div>
            
            <button
              onClick={() => setActiveDiary(null)}
              className="absolute top-2.5 right-3 text-[#5c3317]/60 hover:text-[#5c3317] font-sans font-black text-xs cursor-pointer"
            >
              ✕ CLOSE
            </button>

            <div className="border-b-2 border-[#5c3317]/20 pb-2 mb-3 mt-2 text-center">
              <h2 className="text-xl font-bold tracking-tight text-[#5c3317]">
                {activeDiary === "turing"
                  ? "Alan Turing: Decrypting the Infinite"
                  : activeDiary === "smith"
                  ? "Adam Smith: The Wealth Mechanism Ledger"
                  : "Plato: Dialogues on Ideal Forms"}
              </h2>
              <p className="text-[10px] font-mono tracking-wider opacity-60 uppercase mt-0.5">
                Archived Scholar Logs • Deciphered Scroll
              </p>
            </div>

            <div className="max-h-[250px] overflow-y-auto pr-1 text-xs leading-relaxed space-y-3.5 text-justify italic font-serif">
              {activeDiary === "turing" ? (
                <>
                  <p>
                    <strong>Entry Log 101.A:</strong> "We can build a universal machine capable of simulating any discrete state transition sequences. If can encode instruction algorithms directly upon a linear paper ribbon tape, the boundaries between hardware structures and instruction symbols dissolve completely."
                  </p>
                  <p>
                    <strong>Observation On Decidability:</strong> "Alas! The Halting Problem proves forever that no single general algorithm can determine if an arbitrary computation will settle or loop in infinity. The bounds of logic are mathematically absolute. Yet, in this infinite field of the unknown, mechanical intelligence sparkles with endless imitation."
                  </p>
                  <p>
                    <strong>Turing's Reflection:</strong> "Humanity asks, can active machines play the Imitation Game? When looking at responses, do we measure purely physical sparks, or the semantic truth of reasoning? I suspect intelligence is a collective field, much like the ocean surrounding these islands."
                  </p>
                </>
              ) : activeDiary === "smith" ? (
                <>
                  <p>
                    <strong>Chapter IV Ledger:</strong> "The greatest improvement in the productive powers of labor seems to have been the effects of the Division of Labor. Ten men, working in unified concert, can craft thousands of iron pins in a single dusk, whereas a single man alone could scarcely forge but twenty."
                  </p>
                  <p>
                    <strong>The Invisible Hand Hypothesis:</strong> "By pursuing own self-directed interest in the marketplace, the voyager is led by an invisible hand to promote an end which was no part of his original intention. By valuing freedom of commerce, society harvests robust wealth collectively."
                  </p>
                  <p>
                    <strong>A Moral Cautionary Note:</strong> "Yet, let us not forget that commerce without virtue fosters stagnation of character. No society can surely be flourishing and happy, of which the far greater part of the members are poor and miserable. Wealth is but a measure of active utility and mutual trust."
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong>Socrates' Soliloquy (Recorded by Plato):</strong> "Behold there are men living in an underground cave. They have legs and necks chained so they can only gaze forward. Behind them runs a crackling fire, throwing shadows of puppets against the wall. To those voyagers, shadows are the absolute truth."
                  </p>
                  <p>
                    <strong>On Ideal Forms & Geometry:</strong> "The mathematical circle we draw onto sands is imperfect, a mere rough imitation. The true Ideal Circle exists purely in the divine intellect of Forms. To find truth, we must turn the whole soul away from shadows, scaling the rugged peaks of reason into blinding daylight."
                  </p>
                  <p>
                    <strong>Role of the Voyager:</strong> "The philosopher who ascends and beholds the sun must crawl back down into the chained darkness to awaken peers, even if they mock and stone him. To explore is not to collect trinkets, but to liberate the captive mind."
                  </p>
                </>
              )}
            </div>

            <div className="border-t border-[#5c3317]/20 pt-2.5 mt-3 flex justify-between items-center text-[10px] font-mono text-[#5c3317]/80">
              <span className="flex items-center space-x-1">
                <BookOpen className="w-3 h-3 animate-pulse" />
                <span>Scholar Mastery Logs Unlocked</span>
              </span>
              <button
                onClick={() => setActiveDiary(null)}
                className="bg-[#5c3317] text-[#fdf6e2] hover:bg-[#43240f] px-3.5 py-1.5 rounded text-[10px] font-bold tracking-wider cursor-pointer"
              >
                DISMISS SCRIP
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
