import { useState, useEffect } from "react";
import { Position, LandmarkNode, PlayerStats, ScholarCottage, CollectibleChest } from "./types";
import { LANDMARKS } from "./landmarksData";
import { MapCanvas } from "./components/MapCanvas";
import { DialoguePanel } from "./components/DialoguePanel";
import { StatsOverlays } from "./components/StatsOverlays";
import { motion, AnimatePresence } from "motion/react";
import { Flame, Compass, Star, HelpCircle, Book, Award, Check, Camera, Sparkles } from "lucide-react";
import { AvatarConfig, DEFAULT_AVATAR_CONFIG, drawCompositedAvatar } from "./utils/avatarDrawer";
import { AvatarCustomizer } from "./components/AvatarCustomizer";
import { PocketPhone, Photo, PhoneSettings } from "./components/PocketPhone";

const SCHOLAR_COTTAGES: ScholarCottage[] = [
  { 
    id: "turing-cottage", 
    x: 450, 
    y: 690, 
    name: "Alan Turing's Autumn Orchard Studio", 
    scholar: "Alan Turing", 
    text: "Welcome, traveler. Out here in the golden autumn orchards of Logic, we harvest truth from binary roots. Seek the Gate of Paradox, and remember that any logical garden is bounded by what can be cultivated." 
  },
  { 
    id: "smith-cottage", 
    x: 2490, 
    y: 465, 
    name: "Adam Smith's Wealth Homestead", 
    scholar: "Adam Smith", 
    text: "Greetings, voyager! Welcome to the Eastern Economics Pastures. Here we observe the quiet, magnificent dance of the invisible hand. Every cottage and market specializes in division of labor to enrich our common welfare." 
  },
  { 
    id: "plato-retreat", 
    x: 1550, 
    y: 2170, 
    name: "Plato's Lyceum Hermitage", 
    scholar: "Plato", 
    text: "Be welcomed, seeker. In this southern high peak of absolute philosophy, we step out of the shadowy caves of illusion into the bright sun of universal Forms. Let our dialogue uncover the true, the beautiful, and the good." 
  }
];

export default function App() {
  // Coordinates of the start position on the scenic wooden overworld bridge
  const [avatarPos, setAvatarPos] = useState<Position>({ x: 1600, y: 720 });
  const [targetPos, setTargetPos] = useState<Position>({ x: 1600, y: 720 });
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

  // --- POCKET PHONE SYSTEM STATES ---
  const [isPhoneOpen, setIsPhoneOpen] = useState<boolean>(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [featuredPhotoId, setFeaturedPhotoId] = useState<string | null>(null);
  const [phoneSettings, setPhoneSettings] = useState<PhoneSettings>({
    sfx: true,
    lang: "CN",
    aionTone: "cozy",
    energyMode: "percent",
    vibrate: true,
  });

  // Photo-capturing workflow states
  const [isTakingPhoto, setIsTakingPhoto] = useState<boolean>(false);
  const [photoCaption, setPhotoCaption] = useState<string>("");
  const [capturedPhotoData, setCapturedPhotoData] = useState<string | null>(null);
  const [photoFlashActive, setPhotoFlashActive] = useState<boolean>(false);

  // Scholars & Chests Exploration States
  const [activeCottage, setActiveCottage] = useState<ScholarCottage | null>(null);
  const [chests, setChests] = useState<CollectibleChest[]>([
    { id: "logic-chest", x: 750, y: 600, name: "Pi Gold Chest", opened: false, rewardXp: 50 },
    { id: "market-chest", x: 2600, y: 560, name: "Coin Chest", opened: false, rewardXp: 50 },
    { id: "philosophy-chest", x: 1420, y: 1850, name: "Ivy Chest", opened: false, rewardXp: 50 },
  ]);
  const [chestAlert, setChestAlert] = useState<string | null>(null);

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

    const savedChests = localStorage.getItem("fv_chests");
    if (savedChests) {
      try {
        setChests(JSON.parse(savedChests));
      } catch (e) {
        console.error(e);
      }
    }

    const savedPhotos = localStorage.getItem("fv_gallery_photos");
    if (savedPhotos) {
      try {
        setPhotos(JSON.parse(savedPhotos));
      } catch (e) {
        console.error(e);
      }
    }

    const savedFeatured = localStorage.getItem("fv_featured_photo_id");
    if (savedFeatured) {
      setFeaturedPhotoId(savedFeatured);
    }

    const savedSettings = localStorage.getItem("fv_phone_settings");
    if (savedSettings) {
      try {
        setPhoneSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Sync phone-related states to localStorage
  useEffect(() => {
    localStorage.setItem("fv_gallery_photos", JSON.stringify(photos));
  }, [photos]);

  useEffect(() => {
    if (featuredPhotoId) {
      localStorage.setItem("fv_featured_photo_id", featuredPhotoId);
    } else {
      localStorage.removeItem("fv_featured_photo_id");
    }
  }, [featuredPhotoId]);

  useEffect(() => {
    localStorage.setItem("fv_phone_settings", JSON.stringify(phoneSettings));
  }, [phoneSettings]);

  // Listen for global keyboard ArrowUp event to toggle Pocket Phone
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // If we are in interactive modals or dialogs, do not trigger phone
      if (activeDialogueNode || showCustomizer || activeCottage || isTakingPhoto) return;
      
      if (e.key === "ArrowUp" || e.code === "ArrowUp") {
        // Toggle phone open
        setIsPhoneOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [activeDialogueNode, showCustomizer, activeCottage, isTakingPhoto]);

  // Save changes to local storage
  const saveGameState = (solvedIds: string[], currentStats: PlayerStats) => {
    localStorage.setItem("fv_solved_nodes", JSON.stringify(solvedIds));
    localStorage.setItem("fv_player_stats", JSON.stringify(currentStats));
  };

  // Chest opener callback
  const handleOpenChest = (chestId: string) => {
    setChests((prev) => {
      const idx = prev.findIndex((c) => c.id === chestId);
      if (idx === -1 || prev[idx].opened) return prev;
      const copy = [...prev];
      copy[idx] = { ...copy[idx], opened: true };
      
      const xpAmount = copy[idx].rewardXp;
      setChestAlert(`🎉 YOU DISCOVERED THE ${copy[idx].name.toUpperCase()}! You retrieved lost thinker relics: +${xpAmount} Mastery XP and fully replenished your Thought Energy!`);
      
      setStats((s) => ({ ...s, energy: 100 }));
      handleAwardXp(xpAmount);
      
      localStorage.setItem("fv_chests", JSON.stringify(copy));
      return copy;
    });
  };

  // Scholar Cabin dialogue opener callback
  const handleOpenCottageDialogue = (cottage: ScholarCottage | null) => {
    setActiveCottage(cottage);
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

  // Retro Sound generator for snap and success triggers
  const playRetroSound = (type: "snap" | "success") => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      if (type === "snap") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      } else {
        // success chime
        osc.type = "triangle";
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      }
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + (type === "snap" ? 0.15 : 0.4));
    } catch (e) {
      // Audio context error fallback
    }
  };

  // Generate a procedural retro pixel-style scenic snapshot postcard
  const generateScenicSnapshot = (
    time: "Morning" | "Noon" | "Sunset" | "Night",
    weather: "Sunny" | "Rain" | "Snow" | "Storm" | "Sakura"
  ): string => {
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 240;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    // Disable image smoothing for beautiful retro pixelated crisp look
    ctx.imageSmoothingEnabled = false;

    // 1. Draw beautiful atmospheric background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 240);
    if (time === "Morning") {
      grad.addColorStop(0, "#ffe4e6"); // soft pinkish rose sunrise
      grad.addColorStop(1, "#bae6fd"); // light sky blue
    } else if (time === "Sunset") {
      grad.addColorStop(0, "#fb923c"); // glowing deep orange
      grad.addColorStop(1, "#5b21b6"); // warm royal purple
    } else if (time === "Night") {
      grad.addColorStop(0, "#090d16"); // cosmic obsidian
      grad.addColorStop(1, "#1e1b4b"); // deep indigo sky
    } else {
      // Noon
      grad.addColorStop(0, "#38bdf8"); // crisp azure sky
      grad.addColorStop(1, "#0369a1"); // deep sea sky blue
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 400, 240);

    // 2. Draw procedural celestial spheres
    if (time === "Night") {
      // Luminous silver moon
      ctx.fillStyle = "#f1f5f9";
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(310, 50, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0; // reset shadow

      // Star constellations
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 24; i++) {
        const starX = (i * 97 + 13) % 400;
        const starY = (i * 37 + 19) % 110;
        ctx.fillRect(starX, starY, (i % 3 === 0) ? 2 : 1, (i % 3 === 0) ? 2 : 1);
      }
    } else {
      // Bright sun or warm setting sun disk
      ctx.fillStyle = time === "Sunset" ? "#ea580c" : "#fef08a";
      ctx.shadowColor = time === "Sunset" ? "#ef4444" : "#facc15";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(310, 60, time === "Sunset" ? 22 : 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0; // reset
    }

    // 3. Draw gorgeous scenic overworld layered mountains/hills
    // Deep back hills
    ctx.fillStyle = time === "Night" ? "#064e3b" : time === "Sunset" ? "#14532d" : "#166534";
    ctx.beginPath();
    ctx.ellipse(140, 260, 240, 90, 0, 0, Math.PI * 2);
    ctx.ellipse(340, 270, 200, 100, 0, 0, Math.PI * 2);
    ctx.fill();

    // Medium-depth sweet autumn hills
    ctx.fillStyle = time === "Night" ? "#022c22" : time === "Sunset" ? "#854d0e" : "#15803d"; // Golden orchard hills for autumn/sunset, lush green for noon
    ctx.beginPath();
    ctx.ellipse(60, 275, 180, 85, 0, 0, Math.PI * 2);
    ctx.ellipse(260, 280, 220, 95, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Draw weather atmospheric details
    if (weather === "Rain" || weather === "Storm") {
      ctx.strokeStyle = "rgba(186, 230, 253, 0.45)";
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 35; i++) {
        const rx = (i * 137) % 400;
        const ry = (i * 89) % 240;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 4, ry + 12);
        ctx.stroke();
      }
    } else if (weather === "Snow") {
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      for (let i = 0; i < 40; i++) {
        const sx = (i * 127) % 400;
        const sy = (i * 73) % 240;
        ctx.beginPath();
        ctx.arc(sx, sy, (i % 4 === 0) ? 2.5 : 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (weather === "Sakura") {
      ctx.fillStyle = "rgba(251, 113, 133, 0.8)"; // sweet cherry blossom petals
      for (let i = 0; i < 28; i++) {
        const sx = (i * 149) % 400;
        const sy = (i * 83) % 240;
        ctx.beginPath();
        ctx.ellipse(sx, sy, 3, 1.5, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 5. Draw the player's custom avatar sprite right in the center!
    drawCompositedAvatar(ctx, 200, 168, avatarConfig, "down", 0, false);

    // 6. Draw elegant retro borders
    ctx.strokeStyle = "#fef3c7"; // Warm cream frame
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, 394, 234);

    ctx.strokeStyle = "#7c2d12"; // Inner terracotta board border
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, 384, 224);

    // 7. Stamping vintage exploration grid information
    ctx.fillStyle = "rgba(254, 243, 199, 0.9)";
    ctx.fillRect(16, 16, 215, 24);
    ctx.strokeStyle = "#7c2d12";
    ctx.lineWidth = 1;
    ctx.strokeRect(16, 16, 215, 24);

    ctx.fillStyle = "#7c2d12";
    ctx.font = "bold 7px monospace";
    ctx.fillText(`FIELDVOYAGER STAMP // GRID (${Math.round(avatarPos.x)}, ${Math.round(avatarPos.y)})`, 22, 26);
    ctx.fillText(`ATMOSPHERE: ${time.toUpperCase()} / ${weather.toUpperCase()}`, 22, 34);

    return canvas.toDataURL("image/png");
  };

  const handleTakePhoto = (
    time: "Morning" | "Noon" | "Sunset" | "Night",
    weather: "Sunny" | "Rain" | "Snow" | "Storm" | "Sakura"
  ) => {
    // 1. Play vintage shutter click
    playRetroSound("snap");

    // 2. Trigger instant full screen white screen flash animation
    setPhotoFlashActive(true);
    setTimeout(() => {
      setPhotoFlashActive(false);
    }, 250);

    // 3. Render procedural postcard snapshot
    const dataUrl = generateScenicSnapshot(time, weather);
    setCapturedPhotoData(dataUrl);
    setPhotoCaption("");
    setIsTakingPhoto(true);
  };

  const handleSavePhoto = () => {
    if (!capturedPhotoData) return;

    // Build the photo object
    const newPhoto: Photo = {
      id: "photo-" + Date.now(),
      url: capturedPhotoData,
      x: avatarPos.x,
      y: avatarPos.y,
      timestamp: new Date().toLocaleDateString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }),
      caption: photoCaption.trim() || "在旷野里的短暂停留。"
    };

    // Update state and persistence
    setPhotos((prev) => {
      const updated = [newPhoto, ...prev];
      localStorage.setItem("fv_gallery_photos", JSON.stringify(updated));
      return updated;
    });

    // Award cozy explorer points (Mastery XP!)
    handleAwardXp(15);

    // Play successful saving sound
    playRetroSound("success");

    // Clear and close
    setIsTakingPhoto(false);
    setCapturedPhotoData(null);
    setPhotoCaption("");
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
      const defaultChests = [
        { id: "logic-chest", x: 750, y: 600, name: "Pi Gold Chest", opened: false, rewardXp: 50 },
        { id: "market-chest", x: 2600, y: 560, name: "Coin Chest", opened: false, rewardXp: 50 },
        { id: "philosophy-chest", x: 1420, y: 1850, name: "Ivy Chest", opened: false, rewardXp: 50 },
      ];
      setSolvedNodeIds(resetSolved);
      setStats(resetStats);
      setChests(defaultChests);
      setAvatarPos({ x: 395, y: 310 });
      setTargetPos({ x: 395, y: 310 });
      setActiveDialogueNode(null);
      setActiveCottage(null);
      saveGameState(resetSolved, resetStats);
      localStorage.removeItem("fv_chests");
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
            cottages={SCHOLAR_COTTAGES}
            chests={chests}
            onNearCottage={handleOpenCottageDialogue}
            activeCottageId={activeCottage?.id || null}
            onOpenChest={handleOpenChest}
            onTakePhoto={handleTakePhoto}
            setIsPhoneOpen={setIsPhoneOpen}
            isPhoneOpen={isPhoneOpen}
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

      {/* Interactive Scholar Cottage Modal - Parchment Scroll style */}
      <AnimatePresence>
        {activeCottage && (
          <div className="fixed inset-0 bg-[#3c2f2f]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-mono">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#fef9c3] border-4 border-[#7c2d12] max-w-lg w-full rounded-2xl overflow-hidden shadow-2xl flex flex-col text-[#3c2f2f]"
            >
              {/* Header */}
              <div className="bg-[#7c2d12] border-b-2 border-amber-950 p-4 flex justify-between items-center text-amber-100">
                <span className="text-yellow-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  🏫 INTERACTIVE SCHOLAR RESIDENCE
                </span>
                <button
                  onClick={() => setActiveCottage(null)}
                  className="text-amber-200 hover:text-white hover:scale-110 cursor-pointer transition-all bg-amber-950/40 p-1 rounded-full border border-amber-900/30"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 text-xs bg-[#faf1da]">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-full bg-amber-900/15 border-2 border-[#7c2d12]/40 flex items-center justify-center text-xl font-bold">
                    {activeCottage.scholar === "Alan Turing" ? "🧠" : activeCottage.scholar === "Adam Smith" ? "🌽" : "🏛️"}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#5e1e07]">{activeCottage.name}</h3>
                    <div className="text-[10px] text-amber-800 font-extrabold uppercase mt-0.5">Resident Scholar: {activeCottage.scholar}</div>
                  </div>
                </div>

                <div className="h-0.5 bg-[#7c2d12]/15" />

                <div className="space-y-2">
                  <span className="text-[10px] text-amber-800 font-black uppercase">Scholar Greeting:</span>
                  <p className="text-[#3c2f2f] leading-relaxed text-[11px] font-semibold bg-[#fffbeb] p-3.5 rounded-lg border border-[#7c2d12]/10 shadow-inner">
                    "{activeCottage.text}"
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-[#eedba5] p-4 border-t-2 border-[#7c2d12]/20 flex justify-between items-center gap-2.5">
                <button
                  onClick={() => {
                    setStats((prev) => {
                      const nextStats = {
                        ...prev,
                        energy: Math.min(100, prev.energy + 25)
                      };
                      return nextStats;
                    });
                    alert("✨ The scholar shares a spark of wisdom! You feel restored: +25 Thought Energy!");
                    setActiveCottage(null);
                  }}
                  className="bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-950 text-white font-black text-xs px-3.5 py-2.5 rounded-lg border-2 border-emerald-950 transition-all cursor-pointer shadow hover:scale-103"
                >
                  Request Wisdom Blessing (+25 Energy)
                </button>
                <button
                  onClick={() => setActiveCottage(null)}
                  className="bg-[#fdf6e2] hover:bg-amber-100 text-[#7c2d12] font-black text-xs px-4 py-2.5 rounded-lg border-2 border-amber-900/60 cursor-pointer shadow whitespace-nowrap"
                >
                  Bid Farewell
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interactive Item/Chest Open Alert */}
      <AnimatePresence>
        {chestAlert && (
          <div className="fixed inset-0 bg-[#3c2f2f]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-mono">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="bg-[#fdf6e2] border-8 border-yellow-500/80 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl relative overflow-hidden text-[#3c2f2f]"
            >
              <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center border-2 border-yellow-600 mx-auto mb-4 animate-pulse">
                <Award className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-black text-amber-950 uppercase tracking-widest">TREASURE ACQUIRED</h3>
              <div className="text-[10px] text-amber-700 font-extrabold uppercase tracking-wider mt-1">Overworld Collectible Chest Opened</div>
              
              <p className="text-amber-900 text-xs font-bold leading-relaxed mt-4 bg-[#faf1da] p-4 rounded-xl border border-yellow-250 shadow-inner">
                {chestAlert}
              </p>

              <button
                onClick={() => setChestAlert(null)}
                className="mt-5 w-full bg-[#7c2d12] hover:bg-[#9a3412] active:bg-amber-950 text-white font-black text-xs py-2.5 rounded-lg border-2 border-amber-950 shadow cursor-pointer transition-colors"
              >
                HEED THE PATHWAY
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

      {/* Instant Camera Shutter Flash Overlay */}
      <AnimatePresence>
        {photoFlashActive && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 bg-white z-[9999] pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* 📸 Scenic Postcard Captioning Modal */}
      <AnimatePresence>
        {isTakingPhoto && capturedPhotoData && (
          <div className="fixed inset-0 bg-[#0c111d]/85 backdrop-blur-md flex items-center justify-center p-4 z-50 font-mono text-amber-950">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#faf1da] border-4 border-[#7c2d12] max-w-md w-full rounded-2xl overflow-hidden shadow-2xl flex flex-col p-5"
            >
              <div className="flex items-center space-x-2.5 text-[#7c2d12] mb-3 border-b-2 border-[#7c2d12]/15 pb-2.5">
                <Camera className="w-5 h-5 text-pink-600 animate-pulse" />
                <h3 className="text-sm font-black uppercase tracking-wider">Scenic Snapshot Captured</h3>
              </div>

              {/* Postcard Preview Frame */}
              <div className="border-4 border-[#7c2d12] bg-[#0c1320] rounded-xl overflow-hidden shadow-lg mb-4.5 aspect-[5/3] w-full select-none relative">
                <img
                  src={capturedPhotoData}
                  alt="Scenic Postcard Preview"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-2.5 right-2.5 bg-[#7c2d12] text-amber-100 text-[8px] font-bold px-1.5 py-0.5 rounded border border-[#fef3c7]/20 uppercase">
                  Snap OK
                </div>
              </div>

              {/* Caption write up input field */}
              <div className="space-y-1.5 mb-4">
                <label className="text-[10px] text-[#7c2d12]/80 uppercase font-black tracking-wider block">
                  ✍️ Write a memoir caption for this place:
                </label>
                <input
                  type="text"
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value.slice(0, 45))}
                  placeholder="Write down your thoughts... (e.g. 漫步在金黄的悖论之门旁。)"
                  className="w-full bg-[#fdf6e2] border-2 border-[#7c2d12] text-xs font-semibold px-3 py-2 rounded-lg text-[#3c2f2f] placeholder-[#3c2f2f]/35 focus:outline-hidden focus:ring-2 focus:ring-pink-400"
                />
                <span className="text-[8.5px] text-[#713f12]/60 font-bold block text-right animate-pulse">
                  {photoCaption.length} / 45 characters
                </span>
              </div>

              {/* Action button triggers */}
              <div className="flex items-center space-x-2 border-t border-[#7c2d12]/10 pt-3">
                <button
                  onClick={handleSavePhoto}
                  className="flex-1 bg-emerald-750 hover:bg-emerald-650 active:bg-emerald-950 text-white font-black text-xs py-2.5 rounded-lg border-2 border-emerald-950 shadow-md cursor-pointer transition-transform hover:scale-102 flex items-center justify-center space-x-1.5 bg-emerald-800"
                >
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>Save to Photo Album (+15 XP)</span>
                </button>
                
                <button
                  onClick={() => {
                    setIsTakingPhoto(false);
                    setCapturedPhotoData(null);
                  }}
                  className="bg-[#fdf6e2] hover:bg-amber-100 text-[#7c2d12] font-black text-xs px-4 py-2.5 rounded-lg border-2 border-amber-900/60 cursor-pointer shadow-sm transition-colors"
                >
                  Discard
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 📱 Socratic Pocket Phone 万能接口 (Slides in from the right edge like a physical pocket pull-out) */}
      <PocketPhone
        isOpen={isPhoneOpen}
        onClose={() => setIsPhoneOpen(false)}
        avatarPos={avatarPos}
        stats={stats}
        solvedNodeIds={solvedNodeIds}
        onTeleport={handleTeleport}
        reduceEnergy={handleReduceEnergy}
        photos={photos}
        setPhotos={setPhotos}
        featuredPhotoId={featuredPhotoId}
        setFeaturedPhotoId={setFeaturedPhotoId}
        phoneSettings={phoneSettings}
        setPhoneSettings={setPhoneSettings}
      />

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
