import React, { useState, useEffect, useRef } from "react";
import { PlayerStats, LandmarkNode, Position } from "../types";
import { LANDMARKS } from "../landmarksData";
import { motion, AnimatePresence } from "motion/react";
import { 
  Compass, Map, BookOpen, Image as ImageIcon, Sparkles, Award, 
  Settings as SettingsIcon, Info, Volume2, VolumeX, Globe, 
  RotateCcw, Zap, RefreshCw, Smartphone, Check, Lock, ChevronLeft,
  Flame, Home
} from "lucide-react";

// Synthetic SFX engine using Web Audio API for 100% asset-free retro sound
const playSynthSound = (type: "click" | "success" | "warp" | "vibrate") => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    if (type === "click") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === "success") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(261.63, ctx.currentTime); // C4
      osc.frequency.setValueAtTime(329.63, ctx.currentTime + 0.08); // E4
      osc.frequency.setValueAtTime(392.00, ctx.currentTime + 0.16); // G4
      osc.frequency.setValueAtTime(523.25, ctx.currentTime + 0.24); // C5
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === "warp") {
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(100, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 1.2);
      
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(200, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 1.2);
      
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      
      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc2.start();
      osc.stop(ctx.currentTime + 1.2);
      osc2.stop(ctx.currentTime + 1.2);
    } else if (type === "vibrate") {
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    }
  } catch (e) {
    // Audio context blocker fallback
  }
};

export interface Photo {
  id: string;
  url: string;
  x: number;
  y: number;
  timestamp: string;
  caption: string;
}

export interface Achievement {
  id: string;
  nameCN: string;
  nameEN: string;
  descCN: string;
  descEN: string;
  earned: boolean;
  icon: string;
}

export interface PhoneSettings {
  sfx: boolean;
  lang: "CN" | "EN";
  aionTone: "cozy" | "strict";
  energyMode: "percent" | "flame";
  vibrate: boolean;
}

interface PocketPhoneProps {
  isOpen: boolean;
  onClose: () => void;
  avatarPos: Position;
  stats: PlayerStats;
  solvedNodeIds: string[];
  onTeleport: (pos: Position) => void;
  reduceEnergy: (amount: number) => void;
  photos: Photo[];
  setPhotos: React.Dispatch<React.SetStateAction<Photo[]>>;
  featuredPhotoId: string | null;
  setFeaturedPhotoId: (id: string | null) => void;
  phoneSettings: PhoneSettings;
  setPhoneSettings: React.Dispatch<React.SetStateAction<PhoneSettings>>;
}

// Full 7-part metadata for all landmarks for the Diary (日志) application
const FIELD_GUIDE_DATA: Record<string, {
  authorCN: string;
  authorEN: string;
  partsCN: string[];
  partsEN: string[];
}> = {
  "paradox-gate": {
    authorCN: "阿兰·图灵 (Alan Turing)",
    authorEN: "Alan Turing",
    partsCN: [
      "1. 发现命名：悖论之门 (Gate of Paradox) • 坐标 (540, 580)",
      "2. 思想源头：自指命题。从古希腊的克里特人‘所有人都在撒谎’到哥德尔不完备定理，图灵将此转化为停机问题。",
      "3. 核心解释：系统无法在自身内部证明所有的真理。若一个机器试图判定所有命题，必将陷入无限震荡。",
      "4. 旷野线索：由深邃的黑曜石构筑的宏伟拱门，上刻金光闪烁的自指公式，周围环绕着乱码和死循环。 ",
      "5. 苏格拉底挑战：‘这句话是假的。’若其为真则为假，若其为假则为真。理性在边界上悲鸣。",
      "6. 学术回响：奠定了现代计算机科学中‘可计算性’与边界的理论。它告诉我们，有些问题注定无法被算法攻克。",
      "7. 关联洞察：在哲学中这属于语义自指危机，在经济学中它演变为‘理性预期陷阱’——当所有人都试图预测市场，市场预测本身便失效了。"
    ],
    partsEN: [
      "1. Discovery Name: The Gate of Paradox • Grid (540, 580)",
      "2. Origins of Thought: Self-referential propositions. Formulated from Epimenides the Cretan to Kurt Gödel, and converted into the Halting Problem by Alan Turing.",
      "3. Core Explanation: A formal logical system cannot prove all truths within its own framework. If a machine tries to evaluate all statements, it will enter infinite oscillation.",
      "4. Overworld Clues: A monolithic arch made of deep obsidian, glowing with logical symbols that shift dynamically.",
      "5. Socratic Challenge: 'This sentence is false.' If it is true, then it is false. If it is false, then it is true. Rationality breaks at the border.",
      "6. Academic Echoes: Laid the foundational boundary of computability. It proves mathematically that certain problems can never be solved by algorithms.",
      "7. Interconnected Insight: In philosophy, this is a crisis of semantic self-reference. In economics, it echoes the 'Rational Expectations Trap' where market forecasts invalidate themselves once made public."
    ]
  },
  "infinitude": {
    authorCN: "乔治·康托尔 (Georg Cantor)",
    authorEN: "Georg Cantor",
    partsCN: [
      "1. 发现命名：无穷单体 (The Infinitude Monolith) • 坐标 (690, 840)",
      "2. 思想源头：超穷集合论。康托尔通过对角线证明法，粉碎了‘所有无穷都一样大’的直觉。",
      "3. 核心解释：实数无穷（不可数）绝对大于自然数无穷（可数）。无穷中包含着不可逾越的层级阶梯。",
      "4. 旷野线索：耸立在平原之上的分形结晶石碑。光线在多维晶面上折射出无穷深度的折角。",
      "5. 苏格拉底挑战：通过将实数在[0,1]内排列并修改第n位上的数字，你永远能创造一个不在列表中的新数。",
      "6. 学术回响：重构了现代数学分析的基础，让数学家们踏入康托尔创建的‘超穷乐园’。",
      "7. 关联洞察：哲学上呼应了绝对无限的本源探析；经济学上启发了无穷视阈下的代际分配与贴现平衡分析。"
    ],
    partsEN: [
      "1. Discovery Name: The Infinitude Monolith • Grid (690, 840)",
      "2. Origins of Thought: Transfinite Set Theory. Georg Cantor shattered the intuition that 'all infinities are equal' using his Diagonal Argument.",
      "3. Core Explanation: The infinity of real numbers (uncountable) is strictly larger than the infinity of natural numbers (countable). There is a hierarchy of infinities.",
      "4. Overworld Clues: A towering fractal crystal monolith refracting light in multiple geometric dimensions.",
      "5. Socratic Challenge: By listing real numbers between 0 and 1, and modifying the nth digit of the nth number, we construct a new number never on the list.",
      "6. Academic Echoes: Reconstructed the foundations of modern mathematical analysis, providing mathematical rigor to Cantor's Paradise.",
      "7. Interconnected Insight: Philosophically mirrors the nature of absolute infinite divinity. Economically inspires the analysis of infinite-horizon growth model equilibriums."
    ]
  },
  "invisible-hand": {
    authorCN: "亚当·斯密 (Adam Smith)",
    authorEN: "Adam Smith",
    partsCN: [
      "1. 发现命名：看不见的手集市 (The Invisible Hand Bazaar) • 坐标 (2580, 550)",
      "2. 思想源头：古典自由主义经济学。亚当·斯密在《国富论》中提出，个人的利己行为能汇聚为利他的社会财富。",
      "3. 核心解释：价格机制（供需天平）是无形的协调者。在竞争市场下，买卖双方自发达成均衡，无需中央干预。",
      "4. 旷野线索：一个摆满天平、货架和风向标的像素风繁华集市。一个巨大的纯金天平在半空中自发调节高低。",
      "5. 苏格拉底挑战：面包师提供面包并非出于纯粹的善意，而是出于自利。正是这种利己创造了集市的丰盈。",
      "6. 学术回响：现代微观经济学和市场自由竞争理论的开山基石，阐明了自发秩序的优越性。",
      "7. 关联洞察：在哲学上讨论了利己与利他的道德情操论；在逻辑学上展示了简单的局部规则如何自发涌现复杂的全局秩序。"
    ],
    partsEN: [
      "1. Discovery Name: The Invisible Hand Bazaar • Grid (2580, 550)",
      "2. Origins of Thought: Classical Liberal Economics. Adam Smith formulated that individual self-interest aggregate to benefit the whole community.",
      "3. Core Explanation: The price system acts as a natural coordinating force. Free markets coordinate supply and demand organically without central planning.",
      "4. Overworld Clues: A bustling medieval village market styled with merchant scales, coin chests, and an ethereal hovering golden scale.",
      "5. Socratic Challenge: The butcher and baker provide dinner out of self-love, not benevolence. Self-interest fosters optimal abundance.",
      "6. Academic Echoes: The foundational pillar of modern microeconomics and market efficiency theory.",
      "7. Interconnected Insight: Philosophically links to the 'Theory of Moral Sentiments'. Logically, it demonstrates emergent complexity where simple local rules yield efficient global order."
    ]
  },
  "game-arena": {
    authorCN: "约翰·纳什 (John Nash)",
    authorEN: "John Nash",
    partsCN: [
      "1. 发现命名：博弈竞技场 (The Game Theory Arena) • 坐标 (2750, 850)",
      "2. 思想源头：非合作博弈论与纳什均衡。由数学家约翰·纳什建立。",
      "3. 核心解释：在不沟通的博弈中，每个玩家选择自己最优策略，达致任何人都无意单方面改变决策的稳态。但这往往导致局部利己损害全局最优（囚徒困境）。",
      "4. 旷野线索：一块由黑白棋盘铺设的地板，两面冰冷的铁壁遥遥相对。半空中的收益矩阵散发着复杂的红绿光流。",
      "5. 苏格拉底挑战：两个被捕的囚犯，坦白是各自的最优选，却最终招致了共同坐牢的悲惨结局。合作的信任在理性的防线前崩塌。",
      "6. 学术回响：横跨经济、演化生物学、计算机对抗领域。是理解人类竞争、冷战博弈、反垄断政策的中枢。",
      "7. 关联洞察：哲学上展示了契约主义的重要意义；逻辑上体现了多主体联合决策的系统循环悖论。"
    ],
    partsEN: [
      "1. Discovery Name: The Game Theory Arena • Grid (2750, 850)",
      "2. Origins of Thought: Non-cooperative game theory and Nash Equilibrium. Formalized by mathematician John F. Nash.",
      "3. Core Explanation: A state where each player chooses their best strategy given others' choices. No player has incentive to unilaterally deviate, often leading to sub-optimal social outcomes (Prisoner's Dilemma).",
      "4. Overworld Clues: A black-and-white tiled arena with cell walls. A digital payoff matrix floats in space, pulsing with green and red light.",
      "5. Socratic Challenge: Two prisoners, acting in pure self-interest, confess and receive a heavy sentence rather than staying silent. Trust breaks under rational calculation.",
      "6. Academic Echoes: Revolutionized modern economics, evolutionary biology, and computer science security protocols.",
      "7. Interconnected Insight: Philosophically supports social contract theories. Logically demonstrates the recursive complexity of multi-agent strategic action."
    ]
  },
  "cave-shadows": {
    authorCN: "柏拉图 (Plato)",
    authorEN: "Plato",
    partsCN: [
      "1. 发现命名：洞穴之影 (The Cave of Shadows) • 坐标 (1320, 1820)",
      "2. 思想源头：柏拉图《理想国》中的‘洞穴比喻’。",
      "3. 核心解释：凡人面对的世界只是理想实体投射出的 imperfect 阴影。感官经验是虚幻的锁链，唯有理性方能窥见实在。",
      "4. 旷野线索：一处笼罩于苍茫迷雾之中的洞穴入口。其内部粗糙的石壁上映照出火光与模糊几何图形的皮影戏。",
      "5. 苏格拉底挑战：一生被绑架于洞穴中、面壁而居的囚徒。当其挣脱锁链走入烈日之下，他最初会感到刺眼和恐惧，但最终将获得启蒙。",
      "6. 学术回响：西方唯心主义与形而上学的源头。开启了关于‘本体论’与‘认识论’的长达两千年的思辨之旅。",
      "7. 关联洞察：在数学中印证了对绝对几何概念（完美的圆）的探寻；在经济学中反映了消费者偏好模型与真实幸福之间的感官鸿沟。"
    ],
    partsEN: [
      "1. Discovery Name: The Cave of Shadows • Grid (1320, 1820)",
      "2. Origins of Thought: Plato's famous Allegory of the Cave, from 'The Republic'.",
      "3. Core Explanation: The material world perceived through senses consists of mere shadows of absolute geometric and moral Truths (Forms). Reason is the only tool to escape the cave.",
      "4. Overworld Clues: A misty cave opening where shifting flame-lit shadows of shapes dance on the raw stone back-wall.",
      "5. Socratic Challenge: A prisoner chained in the dark mistake shadows for reality. Released into daylight, he experiences pain and blindness before beholding the Sun.",
      "6. Academic Echoes: The foundation of Western idealism, ontology, and epistemology.",
      "7. Interconnected Insight: Anchors the pursuit of perfect mathematical abstractions (ideal circles). Economically reflects the difference between shadow utilities and genuine human well-being."
    ]
  },
  "golden-mean": {
    authorCN: "亚里士多德 (Aristotle)",
    authorEN: "Aristotle",
    partsCN: [
      "1. 发现命名：中庸讲堂 (The Golden Mean Lyceum) • 坐标 (1850, 1880)",
      "2. 思想源头：亚里士多德德性伦理学。‘中庸之道’并非懦弱折中，而是理性的至善境界。",
      "3. 核心解释：美德处于两个极端（匮乏与过度）的几何中心。勇敢是鲁莽与懦弱的中庸；慷慨是挥霍与吝啬的中庸。",
      "4. 旷野线索：坐落于嶙峋绝壁之上的古典爱奥尼亚式神殿。殿前云雾缭绕，漂浮着一杆精密调节的黄铜天平。",
      "5. 苏格拉底挑战：面对战乱，鲁莽者送死，懦弱者逃跑，唯有勇敢者在适宜的时机、出于高尚的目的而战斗。",
      "6. 学术回响：开辟了美德伦理学派。它是后世道德哲学、品格教育以及理性人格培养的指南。",
      "7. 关联洞察：在经济学上呼应了投资组合的风险偏好与适度资产配置；在逻辑学上映射了模糊命题的黄金平衡域。"
    ],
    partsEN: [
      "1. Discovery Name: The Golden Mean Lyceum • Grid (1850, 1880)",
      "2. Origins of Thought: Aristotelian Virtue Ethics. The Golden Mean is the pinnacle of moral excellence, defined by rational action.",
      "3. Core Explanation: Virtue exists as a harmonious state between excess and deficiency. Courage is the mean between rashness and cowardice; generosity between wastefulness and stinginess.",
      "4. Overworld Clues: A majestic marble temple standing tall on a philosophy peak. A floating balance scale hovers calmly inside the columns.",
      "5. Socratic Challenge: In battle, the rash throw their life away, the coward runs, while the courageous person fights for the right reason at the right moment.",
      "6. Academic Echoes: Formed the school of Virtue Ethics, steering moral philosophy from rules (deontology) to character development.",
      "7. Interconnected Insight: Economically mirrors the optimal risk portfolio balance (neither reckless risk nor sterile hoarding). Logically correlates to fuzzy logic membership parameters."
    ]
  }
};

export const PocketPhone: React.FC<PocketPhoneProps> = ({
  isOpen,
  onClose,
  avatarPos,
  stats,
  solvedNodeIds,
  onTeleport,
  reduceEnergy,
  photos,
  setPhotos,
  featuredPhotoId,
  setFeaturedPhotoId,
  phoneSettings,
  setPhoneSettings,
}) => {
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);
  const [expandedPhotoId, setExpandedPhotoId] = useState<string | null>(null);
  const [warpAnimationActive, setWarpAnimationActive] = useState<boolean>(false);
  const [warpDestination, setWarpDestination] = useState<Position | null>(null);
  
  // Ref for the mini-map canvas rendering
  const miniMapCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Save changes locally
  const savePhotosState = (newPhotos: Photo[]) => {
    localStorage.setItem("fv_gallery_photos", JSON.stringify(newPhotos));
  };

  const saveSettingsState = (newSettings: PhoneSettings) => {
    localStorage.setItem("fv_phone_settings", JSON.stringify(newSettings));
  };

  // Sound and Vibrate trigger wrap
  const triggerSFX = (type: "click" | "success" | "warp" | "vibrate") => {
    if (type === "click" && !phoneSettings.sfx) return;
    if (type === "success" && !phoneSettings.sfx) return;
    if (type === "warp" && !phoneSettings.sfx) return;
    if (type === "vibrate" && !phoneSettings.vibrate) return;
    playSynthSound(type);
  };

  // Dynamically determine geography label
  const getGeographicRegion = (pos: Position): string => {
    const { x, y } = pos;
    if (phoneSettings.lang === "CN") {
      if (x < 1200) return "知识荒野 • 逻辑与数学平原 (西部)";
      if (x >= 1200 && x < 2000 && y < 1200) return "知识荒野 • 真理学识之丘 (中部)";
      if (x >= 2000) return "知识荒野 • 斯密与纳什经济谷地 (东部)";
      return "知识荒野 • 柏拉图与亚里士多德哲学之巅 (南部)";
    } else {
      if (x < 1200) return "Logic & Math Plains (Western Region)";
      if (x >= 1200 && x < 2000 && y < 1200) return "Highlands of Truth (Central Region)";
      if (x >= 2000) return "Economics Valleys (Eastern Region)";
      return "Philosophy Peaks (Southern Region)";
    }
  };

  // Generate accomplishments list
  const getAchievementsList = (): Achievement[] => {
    const l = phoneSettings.lang;
    const isCN = l === "CN";
    return [
      {
        id: "first-step",
        nameCN: "探索者的第一步",
        nameEN: "First Exploration Step",
        descCN: "点亮任意 1 个学术界标",
        descEN: "Master any 1 academic landmark",
        earned: solvedNodeIds.length >= 1,
        icon: "🧭"
      },
      {
        id: "logic-scholar",
        nameCN: "逻辑信徒",
        nameEN: "Logic Believer",
        descCN: "完成并点亮“悖论之门”或“无穷单体”",
        descEN: "Solve Gate of Paradox or Infinitude Monolith",
        earned: solvedNodeIds.includes("paradox-gate") || solvedNodeIds.includes("infinitude"),
        icon: "🧠"
      },
      {
        id: "logic-master",
        nameCN: "图灵的得意门生",
        nameEN: "Turing's Apprentice",
        descCN: "完整主宰所有的逻辑数学学说",
        descEN: "Master all Logic & Math landmarks",
        earned: solvedNodeIds.includes("paradox-gate") && solvedNodeIds.includes("infinitude"),
        icon: "🪐"
      },
      {
        id: "market-mechanic",
        nameCN: "市场协调者",
        nameEN: "Market Coordinator",
        descCN: "解开看不见的手集市之谜",
        descEN: "Unlock the Invisible Hand Bazaar riddle",
        earned: solvedNodeIds.includes("invisible-hand"),
        icon: "⚖️"
      },
      {
        id: "nash-gamer",
        nameCN: "零和博弈家",
        nameEN: "Zero-Sum Game Strategist",
        descCN: "参破博弈论的困境收益",
        descEN: "Deconstruct Nash Equilibrium arena",
        earned: solvedNodeIds.includes("game-arena"),
        icon: "⚔️"
      },
      {
        id: "cave-philosopher",
        nameCN: "挣脱锁链者",
        nameEN: "Unchained Cave Seeker",
        descCN: "走出柏拉图的皮影戏洞穴",
        descEN: "Master the Plato Cave of Shadows",
        earned: solvedNodeIds.includes("cave-shadows"),
        icon: "🕯️"
      },
      {
        id: "meditation-flow",
        nameCN: "心流常在",
        nameEN: "Infinite Flow State",
        descCN: "恢复脑力（当前 Thought Energy 为 100%）",
        descEN: "Maximize Thought Energy to 100%",
        earned: stats.energy >= 100,
        icon: "🌱"
      },
      {
        id: "warp-wanderer",
        nameCN: "虚空跳跃者",
        nameEN: "Quantum Teleporter",
        descCN: "使用手机传送功能进行一次快速移动",
        descEN: "Use phone Teleport app to travel",
        earned: stats.activeDials > 0, // Mock heuristic: if they played around, we grant this easily
        icon: "🌌"
      },
      {
        id: "shutterbug",
        nameCN: "真理之影捕手",
        nameEN: "Truth Silhouette Catcher",
        descCN: "在旅途中拍摄并保存至少一张照片",
        descEN: "Snap and save at least 1 gallery photo",
        earned: photos.length >= 1,
        icon: "📸"
      },
      {
        id: "omnipotent",
        nameCN: "全知觉醒",
        nameEN: "Aion's Enlightened One",
        descCN: "点亮所有的 6 个理性质询之塔",
        descEN: "Master all 6 Socratic landmarks!",
        earned: solvedNodeIds.length === LANDMARKS.length,
        icon: "👑"
      }
    ];
  };

  // Render Mini Map Canvas when the Map app is open
  useEffect(() => {
    if (activeApp === "map" && miniMapCanvasRef.current) {
      const canvas = miniMapCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Clear background
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw region background shapes
        // Logic (left)
        ctx.fillStyle = "rgba(168, 85, 247, 0.1)";
        ctx.fillRect(0, 0, 96, canvas.height);
        // Economics (right)
        ctx.fillStyle = "rgba(34, 197, 94, 0.1)";
        ctx.fillRect(160, 0, 96, canvas.height);
        // Philosophy (bottom)
        ctx.fillStyle = "rgba(59, 130, 246, 0.1)";
        ctx.fillRect(96, 120, 160, 80);

        // Grid boundaries helper lines
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 32) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 32) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }

        // Draw starting home / bridge (1600, 720) -> Scale (1600/3200 * 256, 720/2000 * 200) -> scaled roughly
        // Full grid size in MapCanvas is 3200 x 2560. Map size is 256 x 200. Scale factor = 256 / 3200 = 0.08
        const scaleX = (x: number) => x * 0.08;
        const scaleY = (y: number) => y * 0.08;

        // Draw start bridge / center home anchor
        const hX = scaleX(1600);
        const hY = scaleY(720);
        ctx.fillStyle = "#22c55e";
        ctx.beginPath();
        ctx.arc(hX, hY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Draw Landmarks
        LANDMARKS.forEach((node) => {
          const nX = scaleX(node.x);
          const nY = scaleY(node.y);
          const isMastered = solvedNodeIds.includes(node.id);

          ctx.fillStyle = isMastered ? "#ecc94b" : "#4a5568";
          ctx.beginPath();
          ctx.arc(nX, nY, 4, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.strokeStyle = isMastered ? "#b7791f" : "#2d3748";
          ctx.lineWidth = 1;
          ctx.stroke();

          // Outer glowing aura for unvisited or visited
          ctx.strokeStyle = isMastered ? "rgba(236, 201, 75, 0.3)" : "rgba(255,255,255,0.1)";
          ctx.beginPath();
          ctx.arc(nX, nY, 8, 0, Math.PI * 2);
          ctx.stroke();
        });

        // Draw player avatar (flashing/pulsing green/gold target dot)
        const aX = scaleX(avatarPos.x);
        const aY = scaleY(avatarPos.y);

        ctx.fillStyle = "rgba(239, 68, 68, 0.2)";
        ctx.beginPath();
        ctx.arc(aX, aY, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(aX, aY, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(aX, aY, 4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }, [activeApp, avatarPos, solvedNodeIds]);

  // Handle Random Teleport action
  const handleRandomTeleportAction = () => {
    triggerSFX("click");
    if (stats.energy < 15) {
      alert(phoneSettings.lang === "CN" 
        ? "Thought Energy (思想能量) 不足 15%，思维困顿，无法开启虫洞！" 
        : "Insufficient Thought Energy (requires 15%) to travel through the cognitive ether!");
      return;
    }

    // List of possible teleport points (near landmarks or random scenic zones)
    const points: Position[] = [
      { x: 500, y: 620 },
      { x: 700, y: 880 },
      { x: 2500, y: 580 },
      { x: 2800, y: 820 },
      { x: 1380, y: 1780 },
      { x: 1900, y: 1940 },
      { x: 1600, y: 1300 }, // Center wildwoods
      { x: 900, y: 1400 },  // West marsh
      { x: 2300, y: 1250 }, // East plains
    ];

    // Pick one point that player has not necessarily mastered or just a random spot
    const randomIndex = Math.floor(Math.random() * points.length);
    const dest = points[randomIndex];

    // Deduct 15 energy
    reduceEnergy(15);
    triggerSFX("vibrate");

    // Play star map spin animation for 2 seconds
    setWarpAnimationActive(true);
    setWarpDestination(dest);
    triggerSFX("warp");

    setTimeout(() => {
      setWarpAnimationActive(false);
      onTeleport(dest);
      setWarpDestination(null);
      triggerSFX("success");
    }, 2000);
  };

  // Handle Home Teleport
  const handleHomeTeleportAction = () => {
    triggerSFX("click");
    const dest = { x: 1600, y: 720 };
    setWarpAnimationActive(true);
    setWarpDestination(dest);
    triggerSFX("warp");

    setTimeout(() => {
      setWarpAnimationActive(false);
      onTeleport(dest);
      setWarpDestination(null);
      triggerSFX("success");
    }, 1800);
  };

  // Handle deleting a photo from gallery
  const handleDeletePhoto = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(phoneSettings.lang === "CN" ? "确认删除这张回忆相片吗？" : "Are you sure you want to delete this memory photo?")) {
      const updated = photos.filter(p => p.id !== id);
      setPhotos(updated);
      savePhotosState(updated);
      if (featuredPhotoId === id) {
        setFeaturedPhotoId(null);
      }
      triggerSFX("click");
    }
  };

  // Toggle showcase photo on home walls
  const handleToggleFeaturedPhoto = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerSFX("click");
    if (featuredPhotoId === id) {
      setFeaturedPhotoId(null);
    } else {
      setFeaturedPhotoId(id);
      alert(phoneSettings.lang === "CN" 
        ? "✨ 已成功设为展示照片！它现在会悬挂在学者的家外墙上作为你探索生命的见证。"
        : "✨ Photo featured successfully! This image is now showcased on the cottage walls as a relic of your journey.");
    }
  };

  // Render App Contents
  const renderAppContent = () => {
    const isCN = phoneSettings.lang === "CN";

    if (!activeApp) {
      // Home Screen - 8 Apps 4x2 Grid
      return (
        <div className="flex-1 flex flex-col p-4 bg-slate-900 overflow-y-auto">
          {/* Signal and time top header bar inside screen */}
          <div className="flex justify-between items-center text-[9px] text-emerald-400 font-mono border-b border-emerald-950 pb-1.5 mb-4 select-none">
            <span className="flex items-center gap-1">
              <span className="animate-pulse">●</span> FieldService
            </span>
            <span>LTE • {stats.energy}%🔋</span>
          </div>

          <div className="grid grid-cols-4 gap-x-2 gap-y-4 justify-items-center mt-2">
            {/* Map */}
            <button 
              onClick={() => { triggerSFX("click"); setActiveApp("map"); }}
              className="flex flex-col items-center group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 border border-emerald-400/40 flex items-center justify-center text-white shadow-md active:scale-95 transition-transform">
                <Map className="w-6 h-6" />
              </div>
              <span className="text-[10px] text-slate-300 font-bold mt-1.5 group-hover:text-emerald-400 transition-colors">
                {isCN ? "地图" : "Map"}
              </span>
            </button>

            {/* Logs */}
            <button 
              onClick={() => { triggerSFX("click"); setActiveApp("logs"); }}
              className="flex flex-col items-center group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 border border-orange-400/40 flex items-center justify-center text-white shadow-md active:scale-95 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <span className="text-[10px] text-slate-300 font-bold mt-1.5 group-hover:text-amber-400 transition-colors">
                {isCN ? "日志" : "Logs"}
              </span>
            </button>

            {/* Photos */}
            <button 
              onClick={() => { triggerSFX("click"); setActiveApp("photos"); }}
              className="flex flex-col items-center group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-pink-600 border border-indigo-400/40 flex items-center justify-center text-white shadow-md active:scale-95 transition-transform">
                <ImageIcon className="w-6 h-6" />
              </div>
              <span className="text-[10px] text-slate-300 font-bold mt-1.5 group-hover:text-pink-400 transition-colors">
                {isCN ? "图景" : "Photos"}
              </span>
            </button>

            {/* Teleport */}
            <button 
              onClick={() => { triggerSFX("click"); setActiveApp("teleport"); }}
              className="flex flex-col items-center group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 border border-purple-400/40 flex items-center justify-center text-white shadow-md active:scale-95 transition-transform">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <span className="text-[10px] text-slate-300 font-bold mt-1.5 group-hover:text-purple-400 transition-colors">
                {isCN ? "传送" : "Teleport"}
              </span>
            </button>

            {/* Achievements */}
            <button 
              onClick={() => { triggerSFX("click"); setActiveApp("achievements"); }}
              className="flex flex-col items-center group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 border border-yellow-400/40 flex items-center justify-center text-white shadow-md active:scale-95 transition-transform">
                <Award className="w-6 h-6" />
              </div>
              <span className="text-[10px] text-slate-300 font-bold mt-1.5 group-hover:text-yellow-400 transition-colors">
                {isCN ? "成就" : "Badges"}
              </span>
            </button>

            {/* Constellation / Star Map */}
            <button 
              onClick={() => { triggerSFX("click"); setActiveApp("constellation"); }}
              className="flex flex-col items-center group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 border border-cyan-400/40 flex items-center justify-center text-white shadow-md active:scale-95 transition-transform">
                <Compass className="w-6 h-6" />
              </div>
              <span className="text-[10px] text-slate-300 font-bold mt-1.5 group-hover:text-cyan-400 transition-colors">
                {isCN ? "星图" : "Constellations"}
              </span>
            </button>

            {/* Settings */}
            <button 
              onClick={() => { triggerSFX("click"); setActiveApp("settings"); }}
              className="flex flex-col items-center group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-500 to-zinc-600 border border-slate-400/40 flex items-center justify-center text-white shadow-md active:scale-95 transition-transform">
                <SettingsIcon className="w-6 h-6" />
              </div>
              <span className="text-[10px] text-slate-300 font-bold mt-1.5 group-hover:text-slate-400 transition-colors">
                {isCN ? "设置" : "Settings"}
              </span>
            </button>

            {/* About */}
            <button 
              onClick={() => { triggerSFX("click"); setActiveApp("about"); }}
              className="flex flex-col items-center group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 border border-rose-400/40 flex items-center justify-center text-white shadow-md active:scale-95 transition-transform">
                <Info className="w-6 h-6" />
              </div>
              <span className="text-[10px] text-slate-300 font-bold mt-1.5 group-hover:text-rose-400 transition-colors">
                {isCN ? "关于" : "About"}
              </span>
            </button>
          </div>

          {/* Socratic Wisdom lockup */}
          <div className="mt-auto bg-slate-950/40 border border-slate-800 rounded-xl p-3 text-center">
            <span className="text-[8.5px] uppercase tracking-widest text-emerald-500 font-bold block mb-1">
              Voyager Personal Ledger
            </span>
            <p className="text-[10px] text-slate-400 font-semibold italic leading-relaxed">
              {isCN 
                ? "“未经审视的生活是不值得过的。”——苏格拉底"
                : "“An unexamined life is not worth living.” — Socrates"}
            </p>
          </div>
        </div>
      );
    }

    // MAP APP
    if (activeApp === "map") {
      return (
        <div className="flex-1 flex flex-col bg-slate-950 text-white font-mono text-xs select-none relative">
          {/* Header */}
          <div className="bg-slate-900 border-b border-slate-800 p-3 flex items-center justify-between">
            <button 
              onClick={() => { triggerSFX("click"); setActiveApp(null); }}
              className="flex items-center gap-1 text-teal-400 font-bold text-xs hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{isCN ? "主页" : "Home"}</span>
            </button>
            <span className="font-extrabold text-emerald-400 uppercase tracking-widest">{isCN ? "简化大略图" : "Simplified Map"}</span>
            <span className="w-4"></span>
          </div>

          {/* Canvas Wrapper */}
          <div className="flex-1 flex items-center justify-center p-3 relative bg-slate-900/50">
            <canvas 
              ref={miniMapCanvasRef} 
              width={256} 
              height={200}
              className="border border-slate-800 rounded-lg shadow-inner bg-slate-950" 
            />
          </div>

          {/* Footer location info */}
          <div className="bg-slate-900 p-3.5 border-t border-slate-800 text-center space-y-1.5">
            <div className="text-[10px] text-amber-400 font-extrabold flex justify-center items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>{isCN ? "当前坐标：" : "Current Location:"} X: {Math.round(avatarPos.x)}, Y: {Math.round(avatarPos.y)}</span>
            </div>
            <p className="text-[10.5px] text-slate-300 font-extrabold bg-slate-950 py-1.5 px-3 rounded border border-slate-850">
              {getGeographicRegion(avatarPos)}
            </p>
          </div>
        </div>
      );
    }

    // LOGS APP (Field Guide Diary)
    if (activeApp === "logs") {
      return (
        <div className="flex-1 flex flex-col bg-slate-950 text-white font-mono text-xs">
          {/* Header */}
          <div className="bg-slate-900 border-b border-slate-800 p-3 flex items-center justify-between shrink-0">
            <button 
              onClick={() => { 
                triggerSFX("click"); 
                if (selectedGuideId) {
                  setSelectedGuideId(null);
                } else {
                  setActiveApp(null);
                }
              }}
              className="flex items-center gap-1 text-amber-400 font-bold text-xs hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{selectedGuideId ? (isCN ? "列表" : "Back") : (isCN ? "主页" : "Home")}</span>
            </button>
            <span className="font-extrabold text-amber-400 uppercase tracking-widest">
              {selectedGuideId ? (isCN ? "详细思想日志" : "Diary Card") : (isCN ? "思想行囊日志" : "Explorer Logs")}
            </span>
            <span className="w-4"></span>
          </div>

          {selectedGuideId ? (
            // Full 7-part flipped open version of the Mastered Diary card
            <div className="flex-1 overflow-y-auto p-4 bg-amber-50 text-[#3c2f2f] flex flex-col space-y-3.5">
              <div className="border-b-2 border-amber-900/10 pb-2 flex justify-between items-center text-[10px] font-bold text-amber-800">
                <span>{isCN ? "界标卡片解密" : "LANDMARK UNRAVELED"}</span>
                <span>{solvedNodeIds.includes(selectedGuideId) ? "✦ MASTERED" : "○ LOCKED"}</span>
              </div>

              <div>
                <h3 className="text-sm font-black text-[#7c2d12]">
                  {LANDMARKS.find(n => n.id === selectedGuideId)?.name}
                </h3>
                <span className="text-[10px] text-[#713f12] font-black uppercase">
                  {isCN ? "贤哲研究者：" : "Scholar Origin: "} {FIELD_GUIDE_DATA[selectedGuideId]?.authorCN || "Unknown"}
                </span>
              </div>

              <div className="h-0.5 bg-amber-900/10" />

              <div className="space-y-3 pr-1 text-[11px] leading-relaxed font-serif text-justify">
                {FIELD_GUIDE_DATA[selectedGuideId]?.[isCN ? "partsCN" : "partsEN"].map((part, index) => {
                  const isUnlocked = solvedNodeIds.includes(selectedGuideId) || index < 1; // Only title unlocked if locked
                  return (
                    <div 
                      key={index} 
                      className={`p-2.5 rounded-lg border transition-all ${
                        isUnlocked 
                          ? "bg-amber-100/50 border-amber-900/10 text-slate-800" 
                          : "bg-slate-100 border-slate-300 text-slate-400 select-none blur-[0.7px]"
                      }`}
                    >
                      {isUnlocked ? (
                        <p className="font-bold">{part}</p>
                      ) : (
                        <div className="flex items-center gap-2 font-mono text-[9.5px]">
                          <Lock className="w-3.5 h-3.5" />
                          <span>{isCN ? `[第 ${index+1} 部分：需通过对话挑战并点亮此界标方可破译]` : `[Part ${index+1}: Solve dialog challenge at landmark to decipher]`}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {!solvedNodeIds.includes(selectedGuideId) && (
                <div className="mt-auto bg-amber-100 border border-amber-300 p-2 text-center text-[10px] font-mono font-bold text-amber-900 rounded">
                  {isCN ? "📌 前往大地图该界标，完成苏格拉底问答后解锁完整学说！" : "📌 Visit this landmark on the map and solve Socrates' dialogs to unlock!"}
                </div>
              )}
            </div>
          ) : (
            // Grid of 6 Discovery Cards
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-900">
              <span className="text-[9.5px] text-slate-400 font-extrabold uppercase block mb-1">
                {isCN ? "全部发现卡片及探索进度" : "Discovery cards & progression"}
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                {LANDMARKS.map((node) => {
                  const isSolved = solvedNodeIds.includes(node.id);
                  return (
                    <button
                      key={node.id}
                      onClick={() => { triggerSFX("click"); setSelectedGuideId(node.id); }}
                      className={`flex flex-col text-left p-3 rounded-xl border-2 transition-all cursor-pointer ${
                        isSolved 
                          ? "bg-amber-900/20 border-amber-500/80 hover:border-yellow-300 text-amber-100" 
                          : "bg-slate-950 border-slate-800 hover:border-slate-600 text-slate-400"
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-[8.5px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                          {node.discipline}
                        </span>
                        <span className="text-[9px] font-bold">
                          {isSolved ? "✦ MASTERED" : "○ LOCK"}
                        </span>
                      </div>
                      <h4 className="text-[11px] font-black tracking-wide mt-2.5 truncate w-full">{node.name}</h4>
                      <p className="text-[9.5px] opacity-75 mt-1 line-clamp-2 leading-relaxed">{node.description}</p>
                      
                      <div className="text-[8.5px] text-amber-500/80 font-bold mt-auto pt-2 border-t border-slate-800/50 flex justify-between w-full">
                        <span>Coord: ({node.x}, {node.y})</span>
                        <span className="underline">{isCN ? "翻阅 &rarr;" : "Flip &rarr;"}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    }

    // PHOTOS APP (Gallery)
    if (activeApp === "photos") {
      return (
        <div className="flex-1 flex flex-col bg-slate-950 text-white font-mono text-xs">
          {/* Header */}
          <div className="bg-slate-900 border-b border-slate-800 p-3 flex items-center justify-between shrink-0">
            <button 
              onClick={() => { 
                triggerSFX("click"); 
                if (expandedPhotoId) {
                  setExpandedPhotoId(null);
                } else {
                  setActiveApp(null);
                }
              }}
              className="flex items-center gap-1 text-pink-400 font-bold text-xs hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{expandedPhotoId ? (isCN ? "画廊" : "Gallery") : (isCN ? "主页" : "Home")}</span>
            </button>
            <span className="font-extrabold text-pink-400 uppercase tracking-widest">{isCN ? "图景管理器" : "Photos Book"}</span>
            <span className="w-4"></span>
          </div>

          {expandedPhotoId ? (
            // Full expanded view of a photo
            (() => {
              const p = photos.find(pic => pic.id === expandedPhotoId);
              if (!p) return null;
              const isFeatured = featuredPhotoId === p.id;
              return (
                <div className="flex-1 overflow-y-auto p-4 bg-slate-900 flex flex-col space-y-3.5 text-xs text-slate-300">
                  <div className="border border-slate-800 bg-black rounded-lg overflow-hidden flex items-center justify-center p-1.5 aspect-video relative shadow-2xl">
                    <img referrerPolicy="no-referrer" src={p.url} alt="Capt" className="max-h-full max-w-full object-contain" />
                    <span className="absolute bottom-2.5 right-2.5 bg-black/75 px-2.5 py-1 rounded text-[9.5px] border border-slate-700/60 font-bold">
                      📸 Grid ({p.x}, {p.y})
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-black uppercase">{isCN ? "快照时间：" : "Timestamp:"} {p.timestamp}</span>
                      <span className="text-[10px] text-pink-400 font-bold">Coord: ({p.x}, {p.y})</span>
                    </div>
                    <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 shadow-inner">
                      <span className="text-[9px] text-slate-500 font-extrabold uppercase block mb-1">{isCN ? "探索者备注" : "Voyager Memoir Caption"}</span>
                      <p className="text-[11px] text-slate-200 leading-relaxed font-semibold">"{p.caption || (isCN ? "无备注" : "No caption recorded")}"</p>
                    </div>
                  </div>

                  <div className="mt-auto grid grid-cols-2 gap-2.5 pt-4 border-t border-slate-800">
                    <button
                      onClick={(e) => handleToggleFeaturedPhoto(p.id, e)}
                      className={`font-black text-xs py-2 rounded-lg border cursor-pointer flex justify-center items-center space-x-1 transition-colors ${
                        isFeatured 
                          ? "bg-yellow-600/20 text-yellow-300 border-yellow-500 hover:bg-yellow-600/30" 
                          : "bg-slate-850 hover:bg-slate-800 text-slate-200 border-slate-750"
                      }`}
                    >
                      <Check className={`w-3.5 h-3.5 ${isFeatured ? "opacity-100" : "opacity-30"}`} />
                      <span>{isFeatured ? (isCN ? "已设为展示照" : "Featured") : (isCN ? "设为展示照" : "Set Featured")}</span>
                    </button>
                    <button
                      onClick={(e) => { handleDeletePhoto(p.id, e); setExpandedPhotoId(null); }}
                      className="bg-red-950/40 text-red-400 hover:bg-red-950/70 hover:text-red-300 border border-red-900/60 font-black text-xs py-2 rounded-lg cursor-pointer flex items-center justify-center space-x-1"
                    >
                      <span>{isCN ? "删除此相片" : "Delete Photo"}</span>
                    </button>
                  </div>
                </div>
              );
            })()
          ) : (
            // Photo Gallery grid
            <div className="flex-1 overflow-y-auto p-3.5 bg-slate-900">
              <div className="border border-slate-800 bg-slate-950/50 p-2.5 rounded-xl text-center text-slate-400 text-[10px] leading-relaxed mb-4">
                {isCN 
                  ? "💡 地图场景下双击头像，或点击地图右上方的相机，即可截取风景，记录下你和苏格拉底相遇的一瞬。"
                  : "💡 Double-click your avatar on the map, or tap the Floating Camera overlay, to capture scenic intellectual fragments!"}
              </div>

              {photos.length === 0 ? (
                <div className="h-[200px] flex flex-col justify-center items-center text-center text-slate-500 font-bold space-y-2">
                  <span className="text-3xl">📸</span>
                  <p className="text-[11px] font-semibold">{isCN ? "暂无图景相册" : "Empty photobook folder"}</p>
                  <p className="text-[9px] font-medium opacity-70 leading-relaxed max-w-[190px]">
                    {isCN ? "在旅途中双击角色化身拍照！" : "Capture beautiful maps by double-clicking your character!"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {photos.map((pic) => {
                    const isFeatured = featuredPhotoId === pic.id;
                    return (
                      <div
                        key={pic.id}
                        onClick={() => { triggerSFX("click"); setExpandedPhotoId(pic.id); }}
                        className="bg-slate-950 border border-slate-800 hover:border-pink-600 rounded-xl overflow-hidden shadow-md flex flex-col transition-all cursor-pointer group"
                      >
                        <div className="aspect-video bg-black flex items-center justify-center overflow-hidden p-0.5 border-b border-slate-900 relative">
                          <img referrerPolicy="no-referrer" src={pic.url} alt="Cap" className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform" />
                          {isFeatured && (
                            <span className="absolute top-1.5 left-1.5 bg-yellow-500 text-slate-950 font-black text-[7px] px-1.5 py-0.5 rounded shadow">
                              ★ DISPLAYED
                            </span>
                          )}
                          <span className="absolute bottom-1 right-1 bg-black/60 px-1 py-0.5 rounded text-[7.5px] border border-slate-800">
                            ({pic.x}, {pic.y})
                          </span>
                        </div>
                        <div className="p-2 flex-1 flex flex-col justify-between space-y-1">
                          <p className="text-[9.5px] text-slate-300 font-extrabold truncate italic">"{pic.caption || (isCN ? "无备注" : "Untitled caption")}"</p>
                          <span className="text-[7.5px] text-slate-500 font-black block">{pic.timestamp}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // TELEPORT APP
    if (activeApp === "teleport") {
      return (
        <div className="flex-1 flex flex-col bg-slate-950 text-white font-mono text-xs">
          {/* Header */}
          <div className="bg-slate-900 border-b border-slate-800 p-3 flex items-center justify-between">
            <button 
              onClick={() => { triggerSFX("click"); setActiveApp(null); }}
              className="flex items-center gap-1 text-purple-400 font-bold text-xs hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{isCN ? "主页" : "Home"}</span>
            </button>
            <span className="font-extrabold text-purple-400 uppercase tracking-widest">{isCN ? "虚空传送器" : "Teleportation"}</span>
            <span className="w-4"></span>
          </div>

          <div className="flex-1 p-4 bg-slate-900 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative w-20 h-20 bg-purple-900/10 border-2 border-purple-500/40 rounded-full flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute inset-2 border border-dashed border-purple-400/40 rounded-full"
              />
              <Sparkles className="w-8 h-8 text-purple-400 animate-pulse relative z-10" />
            </div>

            <div className="space-y-1.5 max-w-[210px]">
              <h4 className="text-[12px] font-black text-purple-300 uppercase">{isCN ? "量子化思维跳跃" : "Quantum Thought Jump"}</h4>
              <p className="text-[9.5px] text-slate-400 font-medium leading-relaxed">
                {isCN 
                  ? "利用认知能量扭曲旷野空间，进行星际折跃。传送是单向的，带上足够的思想出发吧！"
                  : "Dendrite network teleportation allows fast travel. Quantum warp is one-way only!"}
              </p>
            </div>

            <div className="h-0.5 bg-slate-800 w-full" />

            <div className="w-full space-y-2.5 pt-2">
              {/* Random Teleport button */}
              <button
                onClick={handleRandomTeleportAction}
                className="w-full bg-gradient-to-r from-purple-700 to-fuchsia-700 hover:from-purple-600 hover:to-fuchsia-600 border-2 border-purple-950 text-white font-black text-xs py-2.5 px-4 rounded-xl flex items-center justify-between shadow active:scale-[0.99] transition-transform cursor-pointer"
              >
                <div className="flex items-center space-x-1.5">
                  <RefreshCw className="w-4 h-4 text-purple-200" />
                  <span>{isCN ? "随机传送" : "Random Warp"}</span>
                </div>
                <div className="bg-purple-900 text-purple-200 text-[8.5px] px-1.5 py-0.5 rounded font-black border border-purple-500/30">
                  ⚡ 15% {isCN ? "能量" : "Energy"}
                </div>
              </button>

              {/* Go Home button */}
              <button
                onClick={handleHomeTeleportAction}
                className="w-full bg-slate-800 hover:bg-slate-750 text-slate-100 border-2 border-slate-950 font-black text-xs py-2.5 px-4 rounded-xl flex items-center justify-between shadow active:scale-[0.99] transition-transform cursor-pointer"
              >
                <div className="flex items-center space-x-1.5">
                  <Home className="w-4 h-4 text-slate-300" />
                  <span>{isCN ? "回到始点 (起源之桥)" : "Go Home (Scenic Bridge)"}</span>
                </div>
                <div className="bg-slate-950 text-emerald-400 text-[8px] px-1.5 py-0.5 rounded font-black border border-slate-800 uppercase">
                  {isCN ? "免费" : "Free"}
                </div>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // ACHIEVEMENTS APP
    if (activeApp === "achievements") {
      const achievements = getAchievementsList();
      const earnedCount = achievements.filter(a => a.earned).length;

      return (
        <div className="flex-1 flex flex-col bg-slate-950 text-white font-mono text-xs">
          {/* Header */}
          <div className="bg-slate-900 border-b border-slate-800 p-3 flex items-center justify-between shrink-0">
            <button 
              onClick={() => { triggerSFX("click"); setActiveApp(null); }}
              className="flex items-center gap-1 text-yellow-400 font-bold text-xs hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{isCN ? "主页" : "Home"}</span>
            </button>
            <span className="font-extrabold text-yellow-400 uppercase tracking-widest">{isCN ? "勋章成就榜" : "Badge Ledger"}</span>
            <span className="w-4"></span>
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 bg-slate-900 space-y-3">
            {/* Progress metrics */}
            <div className="bg-slate-950 border border-slate-800/80 p-3 rounded-xl flex justify-between items-center shadow-inner">
              <span className="font-extrabold text-[10px] text-slate-400 uppercase">{isCN ? "成就点亮进度：" : "Progression Score:"}</span>
              <span className="bg-yellow-500/10 border border-yellow-500/40 text-yellow-300 font-black text-xs px-2.5 py-0.5 rounded-full">
                {earnedCount} / {achievements.length} ⭐
              </span>
            </div>

            <div className="space-y-2">
              {achievements.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center p-2.5 rounded-xl border-2 transition-all ${
                    item.earned 
                      ? "bg-slate-950 border-yellow-500/50 text-slate-200" 
                      : "bg-slate-950/40 border-slate-850 text-slate-500 select-none"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-inner border shrink-0 ${
                    item.earned 
                      ? "bg-yellow-500/10 border-yellow-500/30" 
                      : "bg-slate-900 border-slate-800 filter grayscale"
                  }`}>
                    {item.earned ? item.icon : "🔒"}
                  </div>

                  <div className="ml-3 flex-1 min-w-0">
                    <h5 className={`text-[10.5px] font-black truncate ${item.earned ? "text-slate-100" : "text-slate-500"}`}>
                      {isCN ? item.nameCN : item.nameEN}
                    </h5>
                    <p className="text-[9px] opacity-75 leading-relaxed font-semibold">
                      {isCN ? item.descCN : item.descEN}
                    </p>
                  </div>
                  
                  {item.earned && (
                    <span className="text-[8px] bg-emerald-900/40 text-emerald-400 border border-emerald-800/40 px-1.5 py-0.5 rounded font-black uppercase shrink-0">
                      {isCN ? "已达成" : "Done"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // CONSTELLATION / STAR MAP APP
    if (activeApp === "constellation") {
      return (
        <div className="flex-1 flex flex-col bg-slate-950 text-white font-mono text-xs">
          {/* Header */}
          <div className="bg-slate-900 border-b border-slate-800 p-3 flex items-center justify-between shrink-0">
            <button 
              onClick={() => { triggerSFX("click"); setActiveApp(null); }}
              className="flex items-center gap-1 text-cyan-400 font-bold text-xs hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{isCN ? "主页" : "Home"}</span>
            </button>
            <span className="font-extrabold text-cyan-400 uppercase tracking-widest">{isCN ? "思维知识星图" : "Cognitive Constellation"}</span>
            <span className="w-4"></span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-slate-950 flex flex-col text-slate-300 select-none">
            <div className="border border-slate-850 p-2.5 rounded-xl text-center bg-slate-900/50 text-[10px] text-slate-400 leading-relaxed mb-4">
              {isCN 
                ? "🌟 你的大脑是一片星空。金色节点代表已完全点亮的主体，灰色代表未探索。桥梁连接不同学科的认知之弦。"
                : "🌟 Your mind is a cosmic tapestry. Golden stars are mastered concepts, gray are unexplored. Solid lines represent bridges between thoughts."}
            </div>

            {/* Constellation Canvas View - drawing interactive path representation */}
            <div className="flex-1 border border-slate-800 bg-slate-950/80 rounded-xl flex flex-col p-4 space-y-4 relative shadow-inner h-[220px]">
              {/* Star connections lines */}
              <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none select-none overflow-hidden text-[9px] font-mono text-slate-600">
                <div className="flex justify-between w-full h-full relative">
                  {/* Vector background stars simulation in CSS */}
                  <div className="absolute top-4 left-6 text-purple-400/40 animate-pulse font-extrabold">🧠 Logic Cluster</div>
                  <div className="absolute bottom-6 right-6 text-emerald-400/40 animate-pulse font-extrabold">⚖️ Economics</div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400/30 font-extrabold">🏛️ Philosophy Peaks</div>
                </div>
              </div>

              {/* Stars Grid list representation */}
              <div className="relative z-10 flex-1 grid grid-cols-1 gap-2 overflow-y-auto pr-1">
                {LANDMARKS.map((node) => {
                  const isSolved = solvedNodeIds.includes(node.id);
                  const isMarked = !isSolved && stats.level > 1; // Heuristic for amber marked
                  
                  return (
                    <div 
                      key={node.id} 
                      className={`p-2 rounded-lg border flex justify-between items-center ${
                        isSolved 
                          ? "bg-amber-950/20 border-yellow-500/50 text-slate-200" 
                          : isMarked 
                          ? "bg-amber-950/10 border-amber-600/30 text-amber-300"
                          : "bg-slate-900/50 border-slate-850 text-slate-500"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">
                          {isSolved ? "⭐" : isMarked ? "✦" : "○"}
                        </span>
                        <div>
                          <span className="text-[10.5px] font-black">{node.name}</span>
                          <span className="text-[8px] uppercase tracking-wider block opacity-70">
                            {node.discipline}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 text-[8.5px] font-black">
                        {isSolved ? (
                          <span className="text-yellow-400 uppercase tracking-widest">✦ LIT (金色)</span>
                        ) : isMarked ? (
                          <span className="text-amber-500 uppercase tracking-widest">○ MARKED (琥珀)</span>
                        ) : (
                          <span className="text-slate-600 uppercase tracking-widest">● UNEXPLORED (灰色)</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // SETTINGS APP
    if (activeApp === "settings") {
      return (
        <div className="flex-1 flex flex-col bg-slate-950 text-white font-mono text-xs">
          {/* Header */}
          <div className="bg-slate-900 border-b border-slate-800 p-3 flex items-center justify-between">
            <button 
              onClick={() => { triggerSFX("click"); setActiveApp(null); }}
              className="flex items-center gap-1 text-slate-400 font-bold text-xs hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{isCN ? "主页" : "Home"}</span>
            </button>
            <span className="font-extrabold text-slate-400 uppercase tracking-widest">{isCN ? "系统设定" : "Settings"}</span>
            <span className="w-4"></span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-slate-900 space-y-4">
            {/* Setting items */}
            <div className="space-y-3 text-slate-300 font-semibold text-[11px]">
              
              {/* Sound toggle */}
              <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-2">
                  {phoneSettings.sfx ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                  <span>{isCN ? "游戏复古音效" : "Retro Game Synthesizer"}</span>
                </div>
                <button
                  onClick={() => {
                    const next = { ...phoneSettings, sfx: !phoneSettings.sfx };
                    setPhoneSettings(next);
                    saveSettingsState(next);
                    triggerSFX("click");
                  }}
                  className={`font-black text-[9.5px] px-2.5 py-1.5 rounded-lg border-2 cursor-pointer transition-colors ${
                    phoneSettings.sfx 
                      ? "bg-emerald-950 text-emerald-300 border-emerald-800" 
                      : "bg-slate-900 text-slate-500 border-slate-800"
                  }`}
                >
                  {phoneSettings.sfx ? "ENABLED" : "MUTED"}
                </button>
              </div>

              {/* Language Selector */}
              <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span>{isCN ? "系统语言 / Language" : "Interface Language"}</span>
                </div>
                <button
                  onClick={() => {
                    const next = { ...phoneSettings, lang: phoneSettings.lang === "CN" ? "EN" : "CN" };
                    setPhoneSettings(next);
                    saveSettingsState(next);
                    triggerSFX("click");
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-cyan-300 border-2 border-slate-850 font-black text-[9.5px] px-3.5 py-1.5 rounded-lg cursor-pointer"
                >
                  {phoneSettings.lang === "CN" ? "简体中文 (ZH)" : "ENGLISH (EN)"}
                </button>
              </div>

              {/* Aion Tone Temperature */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>{isCN ? "Aion 引导语气与追问频率" : "Aion Tone & Pacing"}</span>
                  </div>
                  <span className="text-[9px] text-amber-400 font-extrabold uppercase">
                    {phoneSettings.aionTone === "cozy" ? (isCN ? "暖心启发" : "COZY") : (isCN ? "严格挑战" : "STRICT")}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      const next = { ...phoneSettings, aionTone: "cozy" as const };
                      setPhoneSettings(next);
                      saveSettingsState(next);
                      triggerSFX("click");
                    }}
                    className={`text-[9px] py-2 font-black rounded-lg border-2 cursor-pointer ${
                      phoneSettings.aionTone === "cozy"
                        ? "bg-amber-950 text-amber-300 border-amber-800"
                        : "bg-slate-900 text-slate-500 border-slate-800"
                    }`}
                  >
                    <span>{isCN ? "压力小，少挑战" : "Cozy Support"}</span>
                  </button>
                  <button
                    onClick={() => {
                      const next = { ...phoneSettings, aionTone: "strict" as const };
                      setPhoneSettings(next);
                      saveSettingsState(next);
                      triggerSFX("click");
                    }}
                    className={`text-[9px] py-2 font-black rounded-lg border-2 cursor-pointer ${
                      phoneSettings.aionTone === "strict"
                        ? "bg-amber-950 text-amber-300 border-amber-800"
                        : "bg-slate-900 text-slate-500 border-slate-800"
                    }`}
                  >
                    <span>{isCN ? "我想被狠狠追问" : "Deep Challenge"}</span>
                  </button>
                </div>
              </div>

              {/* Energy display mode */}
              <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-2">
                  <Flame className="w-4 h-4 text-red-500" />
                  <span>{isCN ? "认知能量槽显示模式" : "Thought Energy HUD"}</span>
                </div>
                <button
                  onClick={() => {
                    const next = { ...phoneSettings, energyMode: phoneSettings.energyMode === "percent" ? "flame" : "percent" };
                    setPhoneSettings(next);
                    saveSettingsState(next);
                    triggerSFX("click");
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-red-300 border-2 border-slate-850 font-black text-[9.5px] px-3.5 py-1.5 rounded-lg cursor-pointer"
                >
                  {phoneSettings.energyMode === "percent" ? (isCN ? "百分比模式 (%)" : "Percentage") : (isCN ? "复古火苗强度 (🔥)" : "Flame level")}
                </button>
              </div>

              {/* Vibration Toggle */}
              <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-indigo-400" />
                  <span>{isCN ? "手机虚拟震动反馈" : "Haptic Vibration"}</span>
                </div>
                <button
                  onClick={() => {
                    const next = { ...phoneSettings, vibrate: !phoneSettings.vibrate };
                    setPhoneSettings(next);
                    saveSettingsState(next);
                    triggerSFX("vibrate");
                    triggerSFX("click");
                  }}
                  className={`font-black text-[9.5px] px-2.5 py-1.5 rounded-lg border-2 cursor-pointer transition-colors ${
                    phoneSettings.vibrate 
                      ? "bg-indigo-950 text-indigo-300 border-indigo-800" 
                      : "bg-slate-900 text-slate-500 border-slate-800"
                  }`}
                >
                  {phoneSettings.vibrate ? "ON" : "OFF"}
                </button>
              </div>

            </div>
          </div>
        </div>
      );
    }

    // ABOUT APP
    if (activeApp === "about") {
      return (
        <div className="flex-1 flex flex-col bg-slate-950 text-white font-mono text-xs">
          {/* Header */}
          <div className="bg-slate-900 border-b border-slate-800 p-3 flex items-center justify-between shrink-0">
            <button 
              onClick={() => { triggerSFX("click"); setActiveApp(null); }}
              className="flex items-center gap-1 text-rose-400 font-bold text-xs hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{isCN ? "主页" : "Home"}</span>
            </button>
            <span className="font-extrabold text-rose-400 uppercase tracking-widest">{isCN ? "奇点岛传说" : "Island Lore"}</span>
            <span className="w-4"></span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-slate-900 space-y-4">
            
            {/* Legend card */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] text-rose-400 font-black uppercase block tracking-wider">
                {isCN ? "✦ 奇点岛的遗失传说" : "✦ LORE OF SINGULARITY ISLAND"}
              </span>
              <p className="text-[10.5px] text-slate-300 leading-relaxed font-semibold italic text-justify">
                {isCN 
                  ? "“万理之海中央耸立着一座孤岛。三个文明的支柱交汇在此——逻辑计算之环、自由贸易天平、以及终极之善的洞穴。当探索者点亮六芒界标，理智的晨曦将刺破蒙昧之雾，引领人类走向真正清澈的未来。”"
                  : "“In the center of the rational sea stands an isolated sanctuary where three intellectual domains converge. When all six beacons are fully unraveled, the morning light of enlightenment will pierce the cloud of ignorance.”"}
              </p>
            </div>

            {/* Achievement counts and unlockable story snippets */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
              <span className="text-[10px] text-amber-400 font-black uppercase block tracking-wider">
                {isCN ? "✦ 破译出的历史残片" : "✦ DECIPHERED HISTORY FRAGMENTS"}
              </span>

              {/* Fragment 1: unlock at 1 node */}
              <div className="border-b border-slate-900 pb-2">
                <span className="text-[9px] text-slate-500 font-bold block mb-1">
                  Fragment I (1 {isCN ? "界标解锁" : "Landmark Needed"})
                </span>
                {solvedNodeIds.length >= 1 ? (
                  <p className="text-[10px] text-emerald-400 font-semibold leading-relaxed">
                    {isCN 
                      ? "“亚里士多德在神殿中铸造一秤，非量黄金，只量世人之胸怀与中庸。”"
                      : "“Aristotle forged a scale inside his shrine, measuring not gold, but temperance.”"}
                  </p>
                ) : (
                  <p className="text-[9.5px] text-slate-600 italic">
                    {isCN ? "🔒 点亮 1 个界标以破译此碎片故事" : "🔒 Master 1 landmark node to decrypt"}
                  </p>
                )}
              </div>

              {/* Fragment 2: unlock at 3 nodes */}
              <div className="border-b border-slate-900 pb-2">
                <span className="text-[9px] text-slate-500 font-bold block mb-1">
                  Fragment II (3 {isCN ? "界标解锁" : "Landmarks Needed"})
                </span>
                {solvedNodeIds.length >= 3 ? (
                  <p className="text-[10px] text-emerald-400 font-semibold leading-relaxed">
                    {isCN 
                      ? "“图灵曾在小木屋的苹果林前叹息：完美的逻辑犹如璀璨黄金，却终归无法自行证明其绝对完好。”"
                      : "“Turing sighed under the apple boughs: perfect logic is brilliant, yet can never prove its own absolute completeness.”"}
                  </p>
                ) : (
                  <p className="text-[9.5px] text-slate-600 italic">
                    {isCN ? "🔒 点亮 3 个界标以破译此碎片故事" : "🔒 Master 3 landmark nodes to decrypt"}
                  </p>
                )}
              </div>

              {/* Fragment 3: unlock at 6 nodes */}
              <div>
                <span className="text-[9px] text-slate-500 font-bold block mb-1">
                  Fragment III (6 {isCN ? "全部解密解锁" : "All 6 Nodes Mastered"})
                </span>
                {solvedNodeIds.length === LANDMARKS.length ? (
                  <p className="text-[10px] text-emerald-400 font-semibold leading-relaxed">
                    {isCN 
                      ? "“六芒齐亮之时，洞穴的皮影、集市的竞争、无限的对角线与图灵的停机声自发融合，幻化为指引智人前行不辍的星辉！”"
                      : "“As all six stars shine, Plato's shadows, Smith's market forces, Cantor's infinitudes, and Turing's haltings harmonize into the cosmic light of wisdom!”"}
                  </p>
                ) : (
                  <p className="text-[9.5px] text-slate-600 italic">
                    {isCN ? "🔒 点亮全部 6 个界标以解密终极传说故事" : "🔒 Master all 6 landmark nodes to decrypt the final story"}
                  </p>
                )}
              </div>

            </div>

            {/* Version and engineering credits */}
            <div className="text-center font-mono text-[9px] text-slate-500 space-y-0.5 pt-2 select-none border-t border-slate-850">
              <span className="block font-bold">FieldVoyager Device Model • FV-2026.0</span>
              <span className="block">Version 1.0.4 (MVP Engine)</span>
              <span className="block">Signal: COZY_NET • 0.0.0.0:3000 Ingress</span>
            </div>

          </div>
        </div>
      );
    }

    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 bottom-0 right-0 w-[340px] z-[45] font-mono select-none flex items-center justify-end p-4 pointer-events-none">
      {/* Absolute sliding background mask overlay to click to dismiss */}
      <div 
        onClick={() => { triggerSFX("click"); onClose(); }} 
        className="fixed inset-0 bg-[#000000]/15 pointer-events-auto backdrop-blur-[0.5px]" 
      />

      {/* Rotating Star map teleportation portal overlay inside the phone screen */}
      {warpAnimationActive && (
        <div className="absolute inset-4 rounded-[32px] bg-slate-950/90 z-[100] pointer-events-auto flex flex-col items-center justify-center space-y-4">
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* Spinning glowing concentric star field indicators */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="absolute inset-0 border-4 border-dashed border-yellow-500/50 rounded-full"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              className="absolute inset-4 border border-dashed border-purple-500/60 rounded-full"
            />
            <motion.div
              animate={{ scale: [0.8, 1.2, 0.8] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute inset-10 bg-yellow-500/20 rounded-full blur flex items-center justify-center text-2xl font-black"
            >
              🌟
            </motion.div>
          </div>
          <div className="text-center space-y-1.5 font-bold">
            <h4 className="text-yellow-400 text-xs tracking-widest animate-pulse uppercase">
              {phoneSettings.lang === "CN" ? "量子星图极速折跃中" : "QUANTUM WARPING..."}
            </h4>
            <p className="text-slate-400 text-[8.5px] uppercase">
              {phoneSettings.lang === "CN" 
                ? `折跃坐标: (${Math.round(warpDestination?.x || 0)}, ${Math.round(warpDestination?.y || 0)})`
                : `Destination: (${Math.round(warpDestination?.x || 0)}, ${Math.round(warpDestination?.y || 0)})`}
            </p>
          </div>
        </div>
      )}

      {/* The physical device frame */}
      <div className="w-[310px] h-[550px] bg-slate-950 border-[6px] border-[#334155] rounded-[36px] shadow-2xl flex flex-col relative z-10 pointer-events-auto overflow-hidden ring-4 ring-[#1e293b] select-none text-slate-200">
        
        {/* Notch details / camera lens spacer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-950 border-b border-slate-900 rounded-b-xl z-50 flex items-center justify-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#0c1320] border border-slate-800 shadow-inner" />
          <div className="w-8 h-1 bg-slate-800 rounded-full" />
        </div>

        {/* Physical Volume button triggers mocked on bezel */}
        <div className="absolute top-24 -left-[6px] w-1.5 h-10 bg-[#334155] border-r border-slate-950 rounded-r z-50" />
        <div className="absolute top-36 -left-[6px] w-1.5 h-10 bg-[#334155] border-r border-slate-950 rounded-r z-50" />
        {/* Physical Power button trigger mocked on bezel */}
        <div className="absolute top-28 -right-[6px] w-1.5 h-12 bg-[#334155] border-l border-slate-950 rounded-l z-50" />

        {/* Inner screen content */}
        <div className="flex-1 flex flex-col mt-4 pt-1 mb-6 overflow-hidden rounded-[26px] bg-slate-900">
          {renderAppContent()}
        </div>

        {/* Home swipe bar button at the bottom of device */}
        <div className="absolute bottom-1.5 inset-x-0 h-4 flex items-center justify-center">
          <button 
            onClick={() => { triggerSFX("click"); setActiveApp(null); }}
            className="w-24 h-1.5 bg-slate-700/60 hover:bg-slate-500 rounded-full cursor-pointer transition-colors"
            title="Return to Phone Homescreen"
          />
        </div>

      </div>
    </div>
  );
};
