import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Download, 
  Palette, 
  Layers, 
  User, 
  Sliders, 
  Check, 
  Sparkles, 
  RefreshCw 
} from "lucide-react";

import { 
  AvatarConfig, 
  DEFAULT_AVATAR_CONFIG, 
  drawCompositedAvatar, 
  generateSpritesheetDataUrl,
  AvatarColors
} from "../utils/avatarDrawer";

interface AvatarCustomizerProps {
  onClose: () => void;
  onSave: (config: AvatarConfig) => void;
  currentConfig?: AvatarConfig;
}

// 10 Color palette presets as defined on the asset specs
const PALETTE_PRESETS = [
  {
    id: "palette-ocean-scholar",
    name: "🌊 Ocean Scholar",
    colors: {
      primary: "#1e40af", // cobalt
      secondary: "#f8fafc", // white scholar robe
      accent: "#fbbf24", // gold detail
      skin: "#fed7aa", // pale sand skin
      hair: "#1d4ed8" // deep royal blue
    }
  },
  {
    id: "palette-forest-explorer",
    name: "🌲 Forest Explorer",
    colors: {
      primary: "#15803d", // forest green
      secondary: "#78350f", // wood brown
      accent: "#f59e0b", // glowing amber
      skin: "#fed7aa", // fair skin
      hair: "#451a03" // dark chestnut
    }
  },
  {
    id: "palette-twilight-sage",
    name: "🔮 Twilight Sage",
    colors: {
      primary: "#6b21a8", // royal purple
      secondary: "#475569", // slate grey
      accent: "#94a3b8", // silver accent
      skin: "#f8fafc", // pale white skin
      hair: "#581c87" // deep amethyst
    }
  },
  {
    id: "palette-sunset-seeker",
    name: "🌇 Sunset Seeker",
    colors: {
      primary: "#ea580c", // fiery sunset orange
      secondary: "#ca8a04", // yellow-gold belt
      accent: "#f59e0b", // warm amber
      skin: "#ffedd5", // cream peach skin
      hair: "#7c2d12" // warm auburn/mahogany
    }
  },
  {
    id: "palette-frost-mage",
    name: "❄️ Frost Mage",
    colors: {
      primary: "#2563eb", // ocean blue
      secondary: "#f1f5f9", // ice-white fleece
      accent: "#38bdf8", // bright cyan frosting
      skin: "#eff6ff", // pale frost skin
      hair: "#93c5fd" // soft icy blue
    }
  },
  {
    id: "palette-ember-heart",
    name: "🔥 Ember Heart",
    colors: {
      primary: "#dc2626", // volcanic red coat
      secondary: "#d97706", // warm copper trim
      accent: "#f97316", // glowing neon orange
      skin: "#ffedd5", // warm skin
      hair: "#7c2d12" // charcoal red mahogany
    }
  },
  {
    id: "palette-moss-wanderer",
    name: "🌿 Moss Wanderer",
    colors: {
      primary: "#3f6212", // dark moss olive
      secondary: "#b45309", // autumn tan
      accent: "#84cc16", // neon lime sprouts
      skin: "#ffded3", // soft rosy tan skin
      hair: "#1e3a1e" // deep mossy pine hair
    }
  },
  {
    id: "palette-void-watcher",
    name: "🌌 Void Watcher",
    colors: {
      primary: "#0f172a", // black obsidian
      secondary: "#581c87", // void purple
      accent: "#a855f7", // cyber neon violet
      skin: "#e2e8f0", // ghostly steel pale
      hair: "#3b0764" // deep dark shadow hair
    }
  },
  {
    id: "palette-dawn-pilgrim",
    name: "🌸 Dawn Pilgrim",
    colors: {
      primary: "#ec4899", // pink sakura twilight
      secondary: "#fff7ed", // soft silk linen
      accent: "#facc15", // dawn morning gold
      skin: "#fed7aa", // cozy skin
      hair: "#f472b6" // soft peach pink hair
    }
  },
  {
    id: "palette-neutral-seeker",
    name: "⚖️ Neutral Seeker",
    colors: {
      primary: "#475569", // slate blue-grey
      secondary: "#64748b", // steel grey
      accent: "#f8fafc", // chalk white
      skin: "#fed7aa", // traditional travelers skin
      hair: "#334155" // storm cloud charcoal hair
    }
  }
];

const HAIR_OPTIONS = [
  { id: "hair-short", name: "💇 Short neat" },
  { id: "hair-long", name: "💇‍♀️ Long flowing" },
  { id: "hair-spiky", name: "⚡ Anime spiky" },
  { id: "hair-curly", name: "🌀 Curly Afro" },
  { id: "hair-mohawk", name: "🐓 Punk Mohawk" },
  { id: "hair-bun", name: "🍡 Top Bun" },
  { id: "hat-scholar", name: "🎓 Scholar cap" },
  { id: "hat-crown", name: "👑 Golden Crown" },
  { id: "hat-headphones", name: "🎧 DJ Headphones" },
  { id: "hat-antenna", name: "📡 Sci-Fi Antenna" },
  { id: "hat-flame", name: "🔥 Living Flame" },
  { id: "hair-bald", name: "🥚 Smooth Bald" }
];

const EYES_OPTIONS = [
  { id: "eyes-round", name: "👀 Big Round" },
  { id: "eyes-sharp", name: "😠 Determined Sharp" },
  { id: "eyes-closed", name: "😌 Zen Closed" },
  { id: "eyes-glasses", name: "👓 Smart Glasses" },
  { id: "eyes-sunglasses", name: "🕶️ Cool Shades" },
  { id: "eyes-eyepatch", name: "🏴‍☠️ Pirate Eyepatch" },
  { id: "eyes-starry", name: "✨ Starry Sparkles" },
  { id: "eyes-spiral", name: "🌀 Hypnotic Spiral" },
  { id: "eyes-robot", name: "🤖 Cyber visors" },
  { id: "eyes-blindfold", name: "🙈 Martial Blindfold" }
];

const TORSO_OPTIONS = [
  { id: "torso-rope", name: "🧥 Socratic Robe" },
  { id: "torso-jacket", name: "🧥 Adventure Jacket" },
  { id: "torso-hoodie", name: "🧥 Cozy Hoodie" },
  { id: "torso-armor", name: "🛡️ Heavy Plate Armor" },
  { id: "torso-cape", name: "🧥 Royal Cape Wrap" },
  { id: "torso-vest", name: "🧥 Traveler Vest" },
  { id: "torso-turtleneck", name: "🧥 Winter Turtleneck" },
  { id: "torso-kimono", name: "🥋 Silk Yukata" },
  { id: "torso-spacesuit", name: "🚀 Puffy Spacesuit" },
  { id: "torso-rags", name: "🧥 Scavenger Rags" },
  { id: "torso-suit", name: "💼 Formal Suit" },
  { id: "torso-tattoo", name: "💪 Bare Chest Tattoos" }
];

const LEGS_OPTIONS = [
  { id: "legs-pants", name: "👖 Long Pants" },
  { id: "legs-shorts", name: "🩳 Casual Shorts" },
  { id: "legs-skirt", name: "👗 Flowing Skirt" },
  { id: "legs-robe-bottom", name: "🧙‍♂️ Robe Bottoms" },
  { id: "legs-robot", name: "⚙️ Robot Steel legs" },
  { id: "legs-bandaged", name: "🩹 Wrapped Bandages" },
  { id: "legs-fishtail", name: "🧜‍♀️ Mermaid Fish Tail" },
  { id: "legs-ghost", name: "👻 Ghostly Wisp Tail" }
];

const ACCESSORY_OPTIONS = [
  { id: "acc-scarf", name: "🧣 Flutter Scarf" },
  { id: "acc-backpack", name: "🎒 Explorer Backpack" },
  { id: "acc-wings-small", name: "🪶 Holy Angel Wings" },
  { id: "acc-cape-shoulder", name: "🧥 Draping Rear Cape" },
  { id: "acc-pauldron", name: "🛡️ Single Pauldron" },
  { id: "acc-cat", name: "🐱 shoulder Companion Cat" },
  { id: "acc-parrot", name: "🦜 Pirate Parrot Bird" },
  { id: "acc-book-floating", name: "📖 Floating Socratic Codex" },
  { id: "acc-lantern", name: "🏮 Waistbelt Lantern" },
  { id: "acc-none", name: "❌ None Accessory" }
];

export const AvatarCustomizer: React.FC<AvatarCustomizerProps> = ({
  onClose,
  onSave,
  currentConfig
}) => {
  const [config, setConfig] = useState<AvatarConfig>(
    currentConfig || { ...DEFAULT_AVATAR_CONFIG }
  );

  const [activeTab, setActiveTab] = useState<"presets" | "colors" | "hair" | "eyes" | "torso" | "legs" | "accessory">(
    "presets"
  );

  // Animating States for Preview Board
  const [previewDirection, setPreviewDirection] = useState<"down" | "left" | "right" | "up">("down");
  const [isWalking, setIsWalking] = useState<boolean>(true);
  const [walkFrame, setWalkFrame] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Walk loop ticker
  useEffect(() => {
    let intervalId = setInterval(() => {
      setWalkFrame((f) => (f + 1) % 4);
    }, 180);
    return () => clearInterval(intervalId);
  }, []);

  // Sync canvas redraw when selections change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear and draw composited single frame in center of Zoom preview (padded/scaled)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    // Zoom in on our character (draw multiple pixel-art scale)
    ctx.scale(3, 3); // 3x zoom rendering
    // Frame is centered. Canvas size is 192x144, 192/3 = 64, 144/3 = 48 - matches exactly!
    drawCompositedAvatar(ctx, 0, 0, config, previewDirection, walkFrame, isWalking);
    ctx.restore();
  }, [config, previewDirection, walkFrame, isWalking]);

  // Handle Palette Selection
  const selectPreset = (preset: typeof PALETTE_PRESETS[0]) => {
    setConfig((prev) => ({
      ...prev,
      paletteId: preset.id,
      colors: { ...preset.colors }
    }));
  };

  // Color picker helper
  const updateColor = (slot: keyof AvatarColors, value: string) => {
    setConfig((prev) => ({
      ...prev,
      paletteId: "custom",
      colors: {
        ...prev.colors,
        [slot]: value
      }
    }));
  };

  // Triggers transparent PNG spritesheet download (256x192) matching the specs criteria!
  const triggerDownload = (
    layer: "assembled" | "mannequin" | "hair" | "eyes" | "torso" | "legs" | "accessory",
    saveName: string
  ) => {
    const url = generateSpritesheetDataUrl(layer, config);
    if (!url) return;
    
    const dLink = document.createElement("a");
    dLink.href = url;
    dLink.download = `${saveName}.png`;
    document.body.appendChild(dLink);
    dLink.click();
    document.body.removeChild(dLink);
  };

  return (
    <div className="fixed inset-0 bg-[#3c2f2f]/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-mono select-none">
      <motion.div
        initial={{ scale: 0.93, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.93, opacity: 0 }}
        className="bg-[#fcd34d]/10 bg-[#fdf6e2] border-[6px] border-[#7c2d12] max-w-5xl w-full rounded-2xl shadow-3xl flex flex-col h-[90vh] overflow-hidden text-[#3c2f2f]"
      >
        {/* Top Header timber line */}
        <div className="bg-[#7c2d12] text-amber-100 px-5 py-4 flex justify-between items-center select-none border-b-4 border-amber-950/80">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
            <span className="font-extrabold text-sm md:text-base tracking-widest uppercase">
              FieldVoyager Paper-Doll Character Creator
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-amber-200 hover:text-white hover:scale-108 transition-all bg-amber-950/40 p-1.5 rounded-full border border-amber-900/30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Studio Content Row */}
        <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-[#faf1da]">
          
          {/* Left Panel: Preview Arena & download control */}
          <div className="md:w-[35%] bg-[#eedba5] border-r-4 border-[#7c2d12]/30 p-5 flex flex-col items-center justify-between text-center space-y-4 overflow-y-auto">
            
            <div className="w-full flex justify-between items-center border-b border-[#7c2d12]/25 pb-2">
              <span className="text-[10px] font-black uppercase text-[#7c2d12]">
                📽️ Overworld Preview
              </span>
              <div className="flex items-center bg-amber-950/10 px-2 py-0.5 rounded text-[9.5px] font-black">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                <span>Zoom Scale: 3x</span>
              </div>
            </div>

            {/* Canvas screen rendering */}
            <div className="relative border-4 border-[#7c2d12] bg-[#fdf6e2] rounded-xl shadow-md p-3 w-[196px] h-[148px] flex items-center justify-center select-none">
              <canvas
                ref={canvasRef}
                width={192}
                height={144}
                className="pixelated block h-[120px] w-[160px]"
                style={{ imageRendering: "pixelated" }}
              />
            </div>

            {/* Overworld Movement Controllers Simulators */}
            <div className="space-y-2 w-full">
              <span className="text-[9px] font-bold text-[#7c2d12] uppercase tracking-wider block">
                Simulate Facing direction
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {(["down", "left", "right", "up"] as const).map((dir) => (
                  <button
                    key={dir}
                    onClick={() => setPreviewDirection(dir)}
                    className={`text-[9.5px] font-black py-1.5 rounded-lg border-2 transition-all capitalize shadow-sm ${
                      previewDirection === dir
                        ? "bg-[#7c2d12] text-amber-100 border-[#7c2d12]"
                        : "bg-amber-100 hover:bg-amber-200 border-amber-900/10"
                    }`}
                  >
                    {dir}
                  </button>
                ))}
              </div>

              {/* Toggle walks */}
              <div className="flex justify-between items-center text-[10.5px] font-bold pt-1.5 border-t border-[#7c2d12]/15">
                <span>Play Walking Loops:</span>
                <button
                  onClick={() => setIsWalking(!isWalking)}
                  className={`px-3 py-1 rounded-full text-[9px] font-black border-2 transition-colors ${
                    isWalking 
                      ? "bg-emerald-700 text-white border-emerald-800" 
                      : "bg-[#7c2d12]/20 text-[#7c2d12] border-[#7c2d12]/30"
                  }`}
                >
                  {isWalking ? "● WALKING CORE" : "○ IDLE FRAME"}
                </button>
              </div>
            </div>

            {/* ASSET COMPOSITING EXPORTER PANEL */}
            <div className="w-full space-y-2 bg-[#fdf6e2] p-3 rounded-xl border-2 border-[#7c2d12]/20 shadow-sm">
              <span className="text-[10px] font-black text-[#7c2d12] uppercase tracking-wider flex items-center justify-center gap-1">
                💾 High-fidelity export hub
              </span>
              <p className="text-[8.5px] text-[#713f12] font-semibold">
                Generate and download individual sprite layers (256x192 specs pixel layout, 4x4 loops) as transparent PNG assets:
              </p>

              <div className="grid grid-cols-2 gap-1.5 text-[8.5px]">
                <button
                  onClick={() => triggerDownload("mannequin", "mannequin")}
                  className="bg-amber-900/10 hover:bg-[#7c2d12]/80 hover:text-white p-1.5 rounded font-black border border-amber-900/20 text-center transition-colors shadow-2xs"
                >
                  Mannequin base
                </button>
                <button
                  onClick={() => triggerDownload("hair", config.hairId)}
                  className="bg-amber-900/10 hover:bg-[#7c2d12]/80 hover:text-white p-1.5 rounded font-black border border-amber-900/20 text-center transition-colors shadow-2xs"
                >
                  Hair / Hat layer
                </button>
                <button
                  onClick={() => triggerDownload("eyes", config.eyesId)}
                  className="bg-amber-900/10 hover:bg-[#7c2d12]/80 hover:text-white p-1.5 rounded font-black border border-amber-900/20 text-center transition-colors shadow-2xs"
                >
                  Face Eyes layer
                </button>
                <button
                  onClick={() => triggerDownload("torso", config.torsoId)}
                  className="bg-amber-900/10 hover:bg-[#7c2d12]/80 hover:text-white p-1.5 rounded font-black border border-amber-900/20 text-center transition-colors shadow-2xs"
                >
                  Torso upper
                </button>
                <button
                  onClick={() => triggerDownload("legs", config.legsId)}
                  className="bg-amber-900/10 hover:bg-[#7c2d12]/80 hover:text-white p-1.5 rounded font-black border border-amber-900/20 text-center transition-colors shadow-2xs"
                >
                  Legs lower
                </button>
                <button
                  onClick={() => triggerDownload("accessory", config.accessoryId)}
                  className="bg-amber-900/10 hover:bg-[#7c2d12]/80 hover:text-white p-1.5 rounded font-black border border-amber-900/20 text-center transition-colors shadow-2xs"
                >
                  Accessory layer
                </button>
              </div>

              <button
                onClick={() => triggerDownload("assembled", "fieldvoyager-spritesheet")}
                className="w-full bg-[#7c2d12] hover:bg-[#9a3412] text-amber-100 font-extrabold text-[10px] py-1.5 rounded-lg border-2 border-amber-950 flex items-center justify-center gap-1 transition-all active:scale-[0.98] shadow mt-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Assembled Spritesheet (256x192)</span>
              </button>
            </div>

          </div>

          {/* Right Panel: Workspace Tabs Selection */}
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Horizontal Tabs Selection bar */}
            <div className="flex bg-[#eedba5]/40 border-b-2 border-[#7c2d12]/20 overflow-x-auto text-xs no-scrollbar select-none">
              {[
                { id: "presets", label: "🎨 Presets", icon: Palette },
                { id: "colors", label: "⚙️ Custom colors", icon: Sliders },
                { id: "hair", label: "💇 Hair & Hats", icon: User },
                { id: "eyes", label: "👁️ Eyes / Facial", icon: User },
                { id: "torso", label: "👕 Torso clothes", icon: Layers },
                { id: "legs", label: "👖 Legs body", icon: Layers },
                { id: "accessory", label: "🎒 Accessories", icon: Layers }
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-3 font-extrabold flex items-center space-x-1 border-r border-[#7c2d12]/15 shrink-0 transition-colors cursor-pointer ${
                      isActive
                        ? "bg-[#7c2d12] text-amber-100"
                        : "text-[#7c2d12] hover:bg-[#eedba5]/35"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Content Grid Area */}
            <div className="flex-1 overflow-y-auto p-5">
              
              <AnimatePresence mode="wait">
                
                {/* 1. PALETTE PRESETS TAB */}
                {activeTab === "presets" && (
                  <motion.div
                    key="presets"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-4"
                  >
                    <div className="border-b border-[#7c2d12]/15 pb-2">
                      <h3 className="text-sm font-black text-[#7c2d12] uppercase">
                        Spec-Matched Color Palettes (10 Presets)
                      </h3>
                      <p className="text-[11px] text-[#5e2207] italic mt-0.5">
                        These presets map the 5 core layer slots to distinct thematic colors. Choose one as a starting template!
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {PALETTE_PRESETS.map((p) => {
                        const isSelected = config.paletteId === p.id;
                        return (
                          <button
                            key={p.id}
                            onClick={() => selectPreset(p)}
                            className={`p-3.5 rounded-xl border-2 text-left transition-all hover:scale-[1.01] flex flex-col justify-between space-y-2.5 items-stretch ${
                              isSelected
                                ? "bg-amber-100/80 border-[#7c2d12] ring-2 ring-[#7c2d12]/30"
                                : "bg-white border-[#7c2d12]/15 hover:border-[#7c2d12]/40"
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-extrabold text-xs">{p.name}</span>
                              {isSelected && (
                                <span className="bg-[#7c2d12] text-amber-100 rounded-full p-0.5">
                                  <Check className="w-3 h-3" />
                                </span>
                              )}
                            </div>
                            
                            {/* Visual boxes of palette colors mapping */}
                            <div className="grid grid-cols-5 gap-1.5 h-6">
                              <div className="rounded border border-[#3c2f2f]/10" style={{ backgroundColor: p.colors.primary }} title="Primary Color" />
                              <div className="rounded border border-[#3c2f2f]/10" style={{ backgroundColor: p.colors.secondary }} title="Secondary Color" />
                              <div className="rounded border border-[#3c2f2f]/10" style={{ backgroundColor: p.colors.accent }} title="Accent Detail" />
                              <div className="rounded border border-[#3c2f2f]/10" style={{ backgroundColor: p.colors.skin }} title="Mannequin Skin" />
                              <div className="rounded border border-[#3c2f2f]/10" style={{ backgroundColor: p.colors.hair }} title="Hair Fibers" />
                            </div>

                            <span className="text-[9px] text-slate-400 capitalize bg-slate-900/5 px-2 py-0.5 rounded text-center">
                              ID: {p.id}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* 2. CUSTOM COLOR PICKERS TAB */}
                {activeTab === "colors" && (
                  <motion.div
                    key="colors"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-4"
                  >
                    <div className="border-b border-[#7c2d12]/15 pb-2">
                      <h3 className="text-sm font-black text-[#7c2d12] uppercase">
                        Fine-Tune Custom Color Knobs
                      </h3>
                      <p className="text-[11px] text-[#5e2207] italic mt-0.5">
                        Customize hex color overrides manually for individual slots. Retains full vector compatibility on the fly!
                      </p>
                    </div>

                    <div className="bg-white rounded-xl p-5 border-2 border-[#7c2d12]/15 space-y-4 max-w-xl">
                      
                      {/* Color list customizer */}
                      {[
                        { key: "primary", label: "👕 Primary Garment", desc: "Main tunic jacket, robes or spacesuit layout" },
                        { key: "secondary", label: "👖 Secondary Garment", desc: "Shorts, vest outlines, bands or boots trim" },
                        { key: "accent", label: "⚡ Accent accessory detail", desc: "Belts, shiny buckles, buttons or crowns peak" },
                        { key: "skin", label: "👶 Base mannequin skin", desc: "Nude body shadow peach colors" },
                        { key: "hair", label: "💇 Hair fibers tint", desc: "Locks, hair buns, bangs or mohawk styles" }
                      ].map((item) => {
                        const curVal = config.colors[item.key as keyof AvatarColors];
                        return (
                          <div key={item.key} className="flex items-center justify-between gap-4 border-b border-[#7c2d12]/10 pb-3 last:border-0 last:pb-0">
                            <div>
                              <span className="text-[11px] font-black uppercase text-[#7c2d12] block">
                                {item.label}
                              </span>
                              <span className="text-[9.5px] text-[#713f12]">
                                {item.desc}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2.5">
                              <input
                                type="text"
                                value={curVal}
                                onChange={(e) => updateColor(item.key as keyof AvatarColors, e.target.value)}
                                className="w-[84px] bg-slate-50 border border-amber-900/25 px-2 py-1 text-center font-mono text-[10.5px] rounded-md font-bold text-[#3c2f2f] uppercase"
                              />
                              <input
                                type="color"
                                value={curVal}
                                onChange={(e) => updateColor(item.key as keyof AvatarColors, e.target.value)}
                                className="w-9 h-8 cursor-pointer border border-[#7c2d12]/20 rounded"
                              />
                            </div>
                          </div>
                        );
                      })}

                    </div>
                  </motion.div>
                )}

                {/* 3. HAIR & HATS SELECTION TAB */}
                {activeTab === "hair" && (
                  <motion.div
                    key="hair"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-4"
                  >
                    <div className="border-b border-[#7c2d12]/15 pb-2">
                      <h3 className="text-sm font-black text-[#7c2d12] uppercase">
                        Choose Hair & Hat crown variants (12 Options)
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {HAIR_OPTIONS.map((item) => {
                        const isSelected = config.hairId === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setConfig((prev) => ({ ...prev, hairId: item.id }))}
                            className={`p-3 rounded-lg border-2 text-left font-bold text-[11px] transition-colors ${
                              isSelected
                                ? "bg-[#7c2d12] text-amber-100 border-[#7c2d12]"
                                : "bg-white hover:bg-amber-50 border-[#7c2d12]/15"
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span>{item.name}</span>
                              {isSelected && <span className="text-[8.5px] font-black uppercase tracking-wider text-yellow-300">● ON</span>}
                            </div>
                            <span className="text-[8.5px] text-slate-400 block font-mono font-medium mt-1">{item.id}.png</span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* 4. EYES / EXPRESSIONS SELECTION TAB */}
                {activeTab === "eyes" && (
                  <motion.div
                    key="eyes"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-4"
                  >
                    <div className="border-b border-[#7c2d12]/15 pb-2">
                      <h3 className="text-sm font-black text-[#7c2d12] uppercase">
                        Select Eye Facial Expressions (10 Options)
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {EYES_OPTIONS.map((item) => {
                        const isSelected = config.eyesId === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setConfig((prev) => ({ ...prev, eyesId: item.id }))}
                            className={`p-3 rounded-lg border-2 text-left font-bold text-[11px] transition-colors ${
                              isSelected
                                ? "bg-[#7c2d12] text-amber-100 border-[#7c2d12]"
                                : "bg-white hover:bg-amber-50 border-[#7c2d12]/15"
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span>{item.name}</span>
                              {isSelected && <span className="text-[8.5px] font-black uppercase tracking-wider text-yellow-300">● ON</span>}
                            </div>
                            <span className="text-[8.5px] text-slate-400 block font-mono font-medium mt-1">{item.id}.png</span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* 5. TORSO CLOTHES TAB */}
                {activeTab === "torso" && (
                  <motion.div
                    key="torso"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-4"
                  >
                    <div className="border-b border-[#7c2d12]/15 pb-2">
                      <h3 className="text-sm font-black text-[#7c2d12] uppercase">
                        Equip Chest Upperbody robes (12 Options)
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {TORSO_OPTIONS.map((item) => {
                        const isSelected = config.torsoId === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setConfig((prev) => ({ ...prev, torsoId: item.id }))}
                            className={`p-3 rounded-lg border-2 text-left font-bold text-[11px] transition-colors ${
                              isSelected
                                ? "bg-[#7c2d12] text-amber-100 border-[#7c2d12]"
                                : "bg-white hover:bg-amber-50 border-[#7c2d12]/15"
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span>{item.name}</span>
                              {isSelected && <span className="text-[8.5px] font-black uppercase tracking-wider text-yellow-300">● ON</span>}
                            </div>
                            <span className="text-[8.5px] text-slate-400 block font-mono font-medium mt-1">{item.id}.png</span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* 6. LEGS DIVISION TAB */}
                {activeTab === "legs" && (
                  <motion.div
                    key="legs"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-4"
                  >
                    <div className="border-b border-[#7c2d12]/15 pb-2">
                      <h3 className="text-sm font-black text-[#7c2d12] uppercase">
                        Attach Pants & Lowerbody items (8 Options)
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {LEGS_OPTIONS.map((item) => {
                        const isSelected = config.legsId === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setConfig((prev) => ({ ...prev, legsId: item.id }))}
                            className={`p-3 rounded-lg border-2 text-left font-bold text-[11px] transition-colors ${
                              isSelected
                                ? "bg-[#7c2d12] text-amber-100 border-[#7c2d12]"
                                : "bg-white hover:bg-amber-50 border-[#7c2d12]/15"
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span>{item.name}</span>
                              {isSelected && <span className="text-[8.5px] font-black uppercase tracking-wider text-yellow-300">● ON</span>}
                            </div>
                            <span className="text-[8.5px] text-slate-400 block font-mono font-medium mt-1">{item.id}.png</span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* 7. ACCESSORIES TAB */}
                {activeTab === "accessory" && (
                  <motion.div
                    key="accessory"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-4"
                  >
                    <div className="border-b border-[#7c2d12]/15 pb-2">
                      <h3 className="text-sm font-black text-[#7c2d12] uppercase">
                        Select Companion accessories (10 Options)
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {ACCESSORY_OPTIONS.map((item) => {
                        const isSelected = config.accessoryId === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setConfig((prev) => ({ ...prev, accessoryId: item.id }))}
                            className={`p-3 rounded-lg border-2 text-left font-bold text-[11px] transition-colors ${
                              isSelected
                                ? "bg-[#7c2d12] text-amber-100 border-[#7c2d12]"
                                : "bg-white hover:bg-amber-50 border-[#7c2d12]/15"
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span>{item.name}</span>
                              {isSelected && <span className="text-[8.5px] font-black uppercase tracking-wider text-yellow-300">● ON</span>}
                            </div>
                            <span className="text-[8.5px] text-slate-400 block font-mono font-medium mt-1">{item.id}.png</span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* Save timber ribbon footer */}
            <div className="bg-[#eedba5] border-t-2 border-[#7c2d12]/30 p-4 flex justify-between items-center">
              <div className="text-[9.5px] text-[#713f12] font-black hidden sm:block uppercase">
                🌻 Complete customizer profiles saved locally to browser
              </div>
              <div className="flex space-x-3.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setConfig({ ...DEFAULT_AVATAR_CONFIG })}
                  className="px-4 py-2 text-xs font-black bg-white hover:bg-red-50 text-red-800 border-2 border-red-900/35 rounded-lg shadow cursor-pointer transition-colors flex items-center space-x-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Default</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSave(config)}
                  className="flex-1 sm:flex-initial bg-[#7c2d12] hover:bg-[#9a3412] active:bg-amber-950 text-white font-black text-xs px-6 py-2 rounded-lg border-2 border-amber-950 transition-all cursor-pointer shadow-md text-center"
                >
                  SAVE & SYNC TO FIELDWORLD
                </button>
              </div>
            </div>

          </div>

        </div>

      </motion.div>
    </div>
  );
};
