const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

loadEnvFile(path.join(__dirname, ".env"));

const PORT = Number(process.env.PORT || 3000);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const PROMPTS = {
  summarize:
    "Summarize this page clearly and concisely. Focus on the main ideas, important details, and any useful next steps.",
  explain:
    "Explain this page in simple terms for someone who understands the basics but wants a clearer mental model.",
  hint:
    "Give helpful hints based on this page. Do not fully solve tasks unless the page itself is already explanatory.",
  improve:
    "Suggest practical improvements for the writing, structure, clarity, or usefulness of this page."
};

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  });
  res.end(JSON.stringify(payload));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;

      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("Request body is too large."));
      }
    });

    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Request body must be valid JSON."));
      }
    });

    req.on("error", reject);
  });
}

function buildPrompt({ mode, title, text }) {
  return [
    PROMPTS[mode],
    "",
    `Page title: ${title || "Untitled"}`,
    "",
    "Page text:",
    text
  ].join("\n");
}

function getGeminiText(data) {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts.map((part) => part.text || "").join("").trim();
}

async function analyzeWithGemini({ mode, title, text }) {
  if (!GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY. Add it to server/.env and restart the server.");
  }

  if (!PROMPTS[mode]) {
    throw new Error("Invalid mode. Use summarize, explain, hint, or improve.");
  }

  if (!text || typeof text !== "string") {
    throw new Error("Missing page text.");
  }

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(GEMINI_API_KEY)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: buildPrompt({ mode, title, text }) }]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
        thinkingConfig: { thinkingBudget: 0 }
      }
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || `Gemini request failed with status ${response.status}.`;
    throw new Error(message);
  }

  const result = getGeminiText(data);

  if (!result) {
    throw new Error("Gemini returned an empty response.");
  }

  return result;
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  if (req.method !== "POST" || req.url !== "/api/analyze") {
    sendJson(res, 404, { error: "Not found" });
    return;
  }

  try {
    const payload = await readJson(req);
    const result = await analyzeWithGemini(payload);
    sendJson(res, 200, { result });
  } catch (error) {
    sendJson(res, 400, { error: error.message || "Something went wrong." });
  }
});

server.listen(PORT, () => {
  console.log(`AI Browser Copilot server running at http://localhost:${PORT}`);
});
