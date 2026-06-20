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

  // Predefined Socratic Nodes data and fallback questions
  const fallbacks: Record<string, { discipline: string; landmark: string; question: string; context: string }> = {
    "paradox-gate": {
      discipline: "Logic & Math",
      landmark: "The Gate of Paradox",
      question: "If a liar says 'I am lying', are they telling the truth? How can a statement be neither true nor false?",
      context: "The Liar Paradox and the foundations of formal logic."
    },
    "infinitude": {
      discipline: "Logic & Math",
      landmark: "The Infinitude Monolith",
      question: "How can one infinity be larger than another? If we have an infinite number of apples and an infinite number of odd numbers, are they the same size?",
      context: "Cantor's Set Theory and the concept of transfinite numbers."
    },
    "invisible-hand": {
      discipline: "Economics",
      landmark: "The Invisible Hand Bazaar",
      question: "If everyone acts purely out of self-interest in a free market, how can society as a whole benefit? Can self-interest ever destroy the market itself?",
      context: "Adam Smith's Invisible Hand theory and negative externalities."
    },
    "game-arena": {
      discipline: "Economics",
      landmark: "The Game Theory Arena",
      question: "In a scenario where cooperating guarantees a good outcome, but betraying guarantees the best outcome for yourself, why do we default to betrayal? How do we build trust?",
      context: "The Prisoner's Dilemma and Nash Equilibrium."
    },
    "cave-shadows": {
      discipline: "Philosophy",
      landmark: "The Cave of Shadows",
      question: "If you lived your whole life watching reflections on a wall, and then saw the real objects, would you believe they are real? How do we know our own world isn't a reflection of something greater?",
      context: "Plato's Allegory of the Cave and epistemology."
    },
    "golden-mean": {
      discipline: "Philosophy",
      landmark: "The Golden Mean Lyceum",
      question: "Is courage always a virtue? What happens if someone is too courageous, to the point of foolishness? Where is the line between virtue and vice?",
      context: "Aristotle's Virtue Ethics and Nicomachean Ethics."
    }
  };

  // API endpoint to generate / fetch the initial question
  app.post("/api/socratic/question", async (req, res) => {
    const { nodeId } = req.body;
    const info = fallbacks[nodeId];
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
      console.error("Gemini query failed, falling back:", err);
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
    const info = fallbacks[nodeId];
    if (!info) {
      return res.status(404).json({ error: "Node not found" });
    }

    if (!ai) {
      // Simple offline heuristic response
      const isSimpleMastered = userAnswer.trim().length > 10;
      return res.json({
        feedback: `I hear your thoughts about this riddle. "${userAnswer}" is a thoughtful reflection. Let us consider: if this is true, what are its implications? You have demonstrated earnest consideration!`,
        isMastered: isSimpleMastered,
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
      console.error("Gemini evaluation error, falling back:", err);
      const isSimpleMastered = userAnswer.trim().length > 10;
      res.json({
        feedback: `Your formulation is intriguing: "${userAnswer}". Tell me, if we follow this premise, does it meet all objections? I declare your exploration mastered!`,
        isMastered: isSimpleMastered,
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
