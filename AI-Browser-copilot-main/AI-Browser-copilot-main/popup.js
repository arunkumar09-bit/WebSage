const modeEl = document.querySelector("#mode");
const runEl = document.querySelector("#run");
const statusEl = document.querySelector("#status");
const resultEl = document.querySelector("#result");
const activityEl = document.querySelector("#activity");
const activityTextEl = document.querySelector("#activityText");

const BACKEND_URL = "https://ai-browser-copilot.onrender.com";
const MIN_PAGE_TEXT_LENGTH = 30;

const setStatus = (message) => {
  statusEl.textContent = message;
};

const setLoading = (isLoading, message = "Thinking...") => {
  activityEl.hidden = !isLoading;
  activityTextEl.textContent = message;
  runEl.disabled = isLoading;
  document.body.toggleAttribute("aria-busy", isLoading);
};

const setResult = (message, type = "normal") => {
  resultEl.textContent = message;
  resultEl.dataset.type = type;
};

async function getCurrentTabPageData() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id) {
    throw new Error("Could not find the active tab.");
  }

  let injection;

  try {
    [injection] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });
  } catch (error) {
    throw new Error(
      "I could not read this page. Try a normal website tab instead of Chrome settings, the Chrome Web Store, or a protected browser page."
    );
  }

  if (!injection?.result?.text) {
    if (injection?.result?.error) {
      throw new Error(injection.result.error);
    }

    throw new Error("No page content found. Try reloading the page, selecting a real article/problem/video tab, then running again.");
  }

  return injection.result;
}

async function analyzePage() {
  setStatus("Reading");
  setResult("");
  setLoading(true, "Reading page...");

  try {
    const pageData = await getCurrentTabPageData();
    const pageText = (pageData.text || "").trim();

    if (pageText.length < MIN_PAGE_TEXT_LENGTH) {
      throw new Error("This page has very little readable text. Open a page with more content, or type more text into the active composer.");
    }

    setStatus("Thinking");
    setLoading(true, "Thinking...");
    const response = await fetch(`${BACKEND_URL}/api/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        mode: modeEl.value,
        title: pageData.title,
        text: pageText
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.error) {
      throw new Error(data.error ? `Gemini API error: ${data.error}` : `Backend returned HTTP ${response.status}.`);
    }

    if (!data.result || !data.result.trim()) {
      throw new Error("Gemini returned an empty result. Try again, or use a page with more readable text.");
    }

    setResult(data.result);
    setStatus("Done");
  } catch (error) {
    const message =
      error instanceof TypeError
        ? "Backend not running. Start the local server with `npm start` in the server folder, then try again."
        : error.message;
    setResult(message, "error");
    setStatus("Error");
  } finally {
    setLoading(false);
  }
}

runEl.addEventListener("click", analyzePage);
