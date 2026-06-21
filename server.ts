import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini safely
  let ai: GoogleGenAI | null = null;
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
    try {
      ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
      console.log("Gemini API initialized successfully.");
    } catch (e) {
      console.error("Failed to initialize Gemini API:", e);
    }
  } else {
    console.log("GEMINI_API_KEY is not set or is a placeholder. Defaulting to high-quality fallback questions.");
  }

  // Predefined Socratic Nodes data, questions, and progressive counter-arguments (Step-by-step)
  interface OfflineDialogue {
    discipline: string;
    landmark: string;
    question: string;
    context: string;
    steps: string[];
  }

  const offlineDialogues: Record<string, OfflineDialogue> = {
    "paradox-gate": {
      discipline: "Logic & Math",
      landmark: "The Gate of Paradox",
      question: "If a liar says 'I am lying', are they telling the truth? How can a statement be neither true nor false?",
      context: "The Liar Paradox and the foundations of formal logic.",
      steps: [
        "Fascinating. If the liar is indeed telling the truth, then they must be lying, which makes their statement false. But if it is false, then they are not lying, which makes it true! You see how we spin in a wheel? Does this indicate that certain self-referential statements must transcend our standard 'true/false' binary logic?",
        "Indeed! If logic must be extended with a third state, or if some statements are simply invalid, we face profound questions about the limits of language. You have grasped the essence of self-referential crisis. Tell me, can we ever build a perfect logical system free of such traps?",
        "Excellent reasoning, traveler. You have wrestled with the edges of formal truth and emerged with a deeper awareness. The Gate of Paradox opens wide for you!"
      ]
    },
    "infinitude": {
      discipline: "Logic & Math",
      landmark: "The Infinitude Monolith",
      question: "How can one infinity be larger than another? If we have an infinite number of apples and an infinite number of odd numbers, are they the same size?",
      context: "Cantor's Set Theory and the concept of transfinite numbers.",
      steps: [
        "A thoughtful gaze! Notice that we can pair every odd number (1, 3, 5, ...) perfectly with every counting number (1, 2, 3, ...), showing they have the exact same cardinality. And yet, if we try to pair counting numbers with real decimal numbers, we find Cantor's 'diagonal' proof revealing a larger, uncountably infinite realm. How does it make you feel to realize that infinity is not a single destination, but an endless ladder?",
        "Marvelous. Your intuition begins to see the landscape of Cantor's Paradise. When we accept that there are different magnitudes of infinity, do we realize that our finite minds can still map the transfinite? What does this say about the human capacity to touch the unlimited?",
        "Superb. Your intellect has ascended the ladder of transfinite sets. The Monolith shines brightly, signaling your mastery over the infinite!"
      ]
    },
    "invisible-hand": {
      discipline: "Economics",
      landmark: "The Invisible Hand Bazaar",
      question: "If everyone acts purely out of self-interest in a free market, how can society as a whole benefit? Can self-interest ever destroy the market itself?",
      context: "Adam Smith's Invisible Hand theory and negative externalities.",
      steps: [
        "An elegant starting premise. By wishing to maximize our own survival and prosperity, we create goods and services that others need, guided as if by an 'invisible hand'. But consider: if a factory owner dumps toxic waste in the shared river because it reduces their costs and serves their self-interest, the community suffers. How do we balance private pursuit with the tragedy of the commons?",
        "Precisely. The market cannot exist in a vacuum; without shared virtues, trust, and common rules, self-interest devolves into plunder. Thus, our self-interest must be bound by empathy and moral sentiments. Do you agree that the 'invisible hand' is only as good as the visible hearts of its players?",
        "Outstanding. Your synthesis of market dynamics and civic virtue is excellent. The golden scale of the Bazaar balances in your honor!"
      ]
    },
    "game-arena": {
      discipline: "Economics",
      landmark: "The Game Theory Arena",
      question: "In a scenario where cooperating guarantees a good outcome, but betraying guarantees the best outcome for yourself, why do we default to betrayal? How do we build trust?",
      context: "The Prisoner's Dilemma and Nash Equilibrium.",
      steps: [
        "Ah, the Prisoner's Dilemma! If we both stay silent, we get a minor sentence. But if I betray you, I go free while you suffer. Since neither of us can be sure of the other, our rational self-interest drives us to both betray, leading to a worse outcome for everyone! If one-off interactions doom us to distrust, how does repeating this 'game' over generations change our strategy?",
        "Magnificent! Iteration changes everything. When the game is repeated, 'Tit-for-Tat'—cooperating first, then copying the other's previous move—fosters trust and punishes betrayal. Trust is built not by blind hope, but by the continuous reciprocity of our choices. How does this apply to our journey across these islands?",
        "Beautifully summarized. You have solved the equilibrium of strategic trust. The Arena cells collapse, and the master path is unlocked!"
      ]
    },
    "cave-shadows": {
      discipline: "Philosophy",
      landmark: "The Cave of Shadows",
      question: "If you lived your whole life watching reflections on a wall, and then saw the real objects, would you believe they are real? How do we know our own world isn't a reflection of something greater?",
      context: "Plato's Allegory of the Cave and epistemology.",
      steps: [
        "Ah, you feel the darkness of the cave. When a captive is dragged up into the bright sunlight, the glare blinds them, and they desperately wish to return to the familiar shadows. Do we cling to our comfortable biases and illusions because the blinding light of truth is too painful to bear at first?",
        "Insightful. The task of the explorer is not just to see the sun, but to cultivate the courage to withstand the glare and understand the source of light. If we realize our world index is filled with shadows of sensory perceptions, how does philosophy serve as the training of the soul to see the ideal forms?",
        "Brilliant. You have exited the cave and gazed upon the midday sun of wisdom. The shadows hold no more dominion over your mind!"
      ]
    },
    "golden-mean": {
      discipline: "Philosophy",
      landmark: "The Golden Mean Lyceum",
      question: "Is courage always a virtue? What happens if someone is too courageous, to the point of foolishness? Where is the line between virtue and vice?",
      context: "Aristotle's Virtue Ethics and Nicomachean Ethics.",
      steps: [
        "Bravo! Aristotelian wisdom tells us that virtue is always a golden mean situated between two dangerous extremes. Deficient courage is cowardice, while excessive courage is rash recklessness. Thus, virtue is supreme balance. How does one dynamically determine this balance point in a chaotic, changing world?",
        "Yes! We need practical wisdom (Phronesis)—trained through habit, reflection, and experience. Balancing our impulses is a continuous art, much like navigating a vessel across shifting seas. Tell me, how does this search for balance shape your own quest for mastery?",
        "Exquisite. You have walked the tightrope of the Lyceum and found the perfect equilibrium of spirit. The Golden Mean welcomes you as an integrated philosopher!"
      ]
    }
  };

  const getOfflineDialogueResponse = (nodeId: string, history: any[]) => {
    const dialog = offlineDialogues[nodeId];
    if (!dialog) {
      return {
        feedback: "A profound formulation! Proceed with Socratic balance.",
        isMastered: true
      };
    }
    
    // Count how many messages in history were sent by the user
    const userMsgCount = history.filter((h: any) => h.sender === "user").length;
    
    if (userMsgCount === 0) {
      return {
        feedback: dialog.steps[0],
        isMastered: false
      };
    } else if (userMsgCount === 1) {
      return {
        feedback: dialog.steps[1],
        isMastered: false
      };
    } else {
      return {
        feedback: dialog.steps[2],
        isMastered: true
      };
    }
  };

  // API endpoint to generate / fetch the initial question
  app.post("/api/socratic/question", async (req, res) => {
    const { nodeId } = req.body;
    const info = offlineDialogues[nodeId];
    if (!info) {
      return res.status(404).json({ error: "Node not found" });
    }

    if (!ai) {
      return res.json({
        question: info.question,
        context: info.context,
        landmark: info.landmark,
        discipline: info.discipline,
        mode: "offline"
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `You are Socrates, a classical Greek philosopher guiding a traveler through "${info.landmark}" in the continent of "${info.discipline}". 
        The context is: ${info.context}.
        Craft an engaging, immersive, and brief Socratic opening question (max 3 sentences) that begins this traveler's quest. 
        Adopt a warm, encouraging, but deeply analytical classical persona. Do not include introductory text like "Sure, here is your question:". Directly speak as Socrates.`,
      });

      const questionText = response.text || info.question;
      res.json({
        question: questionText,
        context: info.context,
        landmark: info.landmark,
        discipline: info.discipline,
        mode: "online"
      });
    } catch (err: any) {
      // Capture 429 and others gracefully under a clean warning flag
      console.warn(`[Gemini API Warning] Quota exceeded or network issue. Utilizing high-quality Socratic fallback.`);
      res.json({
        question: info.question,
        context: info.context,
        landmark: info.landmark,
        discipline: info.discipline,
        mode: "offline"
      });
    }
  });

  // API endpoint to respond to Socratic answer
  app.post("/api/socratic/respond", async (req, res) => {
    const { nodeId, question, userAnswer, history = [] } = req.body;
    const info = offlineDialogues[nodeId];
    if (!info) {
      return res.status(404).json({ error: "Node not found" });
    }

    if (!ai) {
      const fallbackResult = getOfflineDialogueResponse(nodeId, history);
      return res.json({
        feedback: fallbackResult.feedback,
        isMastered: fallbackResult.isMastered,
        mode: "offline"
      });
    }

    try {
      // Compile discussion history
      const formattedHistory = history.map((h: any) => `${h.sender === "ai" ? "Socrates" : "Traveler"}: ${h.text}`).join("\n");

      const systemInstruction = `You are Socrates, guiding a student through the concepts of ${info.context} at "${info.landmark}". 
      Keep your response very short (max 4 sentences) and deeply Socratic. 
      Analyze their argument or response. Do NOT tell them they are "right" or "wrong" directly. 
      Instead, ask a probing question to make them see the next layer, challenge their assumptions, or point out an interesting nuance.
      
      Your output must be a JSON structure. It should be exact JSON format (and DO NOT put markdown block around it if possible, just pure JSON text, or standard JSON structure):
      {
        "feedback": "your vocalized reaction and next Socratic query here",
        "isMastered": true or false
      }
      
      Determine "isMastered" based on if the user has engaged earnestly or answered with a reasonable line of reasoning. If this is their first attempt and they wrote less than 8 words, set it to false. Otherwise, set it to true to let them master and complete the node. Be encouraging and nurturing.`;

      const prompt = `Current Socratic landmark: ${info.landmark} (${info.discipline}).
      Current question posed: ${question}
      User's response: ${userAnswer}
      
      Prior conversation context:
      ${formattedHistory}
      
      Analyze this, formulate your reaction, and decide if they have earned mastery. Return only valid JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
        }
      });

      const responseText = response.text || "";
      const resultObj = JSON.parse(responseText.trim());
      res.json({
        feedback: resultObj.feedback || "A fascinating perspective. Tell me more about your reasoning...",
        isMastered: resultObj.isMastered ?? true,
        mode: "online"
      });
    } catch (err) {
      console.warn(`[Gemini API Warning] Quota exceeded or network issue during response. Running progressive offline fallback.`);
      const fallbackResult = getOfflineDialogueResponse(nodeId, history);
      res.json({
        feedback: fallbackResult.feedback,
        isMastered: fallbackResult.isMastered,
        mode: "offline"
      });
    }
  });

  // Vite development vs production asset delivery
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
