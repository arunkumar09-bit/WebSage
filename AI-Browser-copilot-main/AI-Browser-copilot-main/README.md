<div align="center">
# 🧭 AI Browser Copilot
 
**A Chrome Extension that helps you understand any webpage using AI**
 
[![Manifest V3](https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Gemini API](https://img.shields.io/badge/AI-Google%20Gemini-8E75B2?logo=googlegemini&logoColor=white)](https://aistudio.google.com/)
[![Render](https://img.shields.io/badge/Deployed%20on-Render-46E3B7?logo=render&logoColor=white)](https://render.com/)
[![License](https://img.shields.io/badge/License-MIT-lightgrey)](#)
 
</div>
---
 
AI Browser Copilot is a Chrome Extension that helps users understand webpage content using AI. It extracts useful text from the active browser tab and sends it to a Node.js backend, where **Google Gemini** generates responses for tasks such as summarizing, explaining, giving hints, and improving writing.
 
The extension is designed for technical reading and learning workflows across GitHub READMEs, documentation pages, YouTube transcripts, and LeetCode problem statements.
 
---
 
## ✨ Features
 
| | Feature | Description |
|---|---|---|
| 📝 | **Summarize** | Condense webpage content into a short summary |
| 💡 | **Explain** | Break down technical content in simpler terms |
| 🧩 | **Hint** | Generate helpful hints without giving away the answer |
| ✍️ | **Improve** | Improve writing clarity |
| ⚡ | **Dynamic extraction** | Handles dynamic pages like LeetCode and YouTube |
| ⏳ | **Clear states** | Shows clean loading and error states |
| 🔒 | **Fails safely** | Skips unsupported pages instead of scraping unrelated data |
 
---
 
## 🛠️ Tech Stack

![Manifest V3](https://img.shields.io/badge/Manifest%20V3-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Gemini API](https://img.shields.io/badge/Gemini_API-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)

- Chrome Extension (**Manifest V3**)
- HTML5, CSS3, Vanilla JavaScript
- Node.js Backend
- Google Gemini API
- Render Deployment
- GitHub
## 📁 Project Structure
 
```text
.
├── manifest.json
├── popup.html
├── popup.js
├── content.js
├── styles.css
├── render.yaml
└── server
    ├── server.js
    ├── package.json
    ├── package-lock.json
    └── .env.example
```
 
---
 
## 🚀 Local Development Setup
 
**1. Install Node.js 18 or newer.**
 
**2. Create a Gemini API key** from Google AI Studio:
 
```text
https://aistudio.google.com/apikey
```
 
**3. Create a `server/.env` file:**
 
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
PORT=3000
```
 
**4. Start the backend:**
 
```bash
cd server
npm install
npm start
```
 
**5. Load the Chrome extension:**
 
- Open `chrome://extensions`
- Turn on **Developer mode**
- Click **Load unpacked**
- Select the top-level `AI Browser Copilot` folder
**6. Test on a normal webpage:**
 
- Open a GitHub README or documentation page
- Click the **AI Browser Copilot** extension icon
- Choose a mode
- Click **Run**
---
 
## 🌐 Using the Deployed Backend
 
The backend is deployed on Render:
 
```text
https://ai-browser-copilot.onrender.com
```
 
In `popup.js`, the backend URL is configured as:
 
```js
const BACKEND_URL = "https://ai-browser-copilot.onrender.com";
```
 
For local development, this can be changed back to:
 
```js
const BACKEND_URL = "http://localhost:3000";
```
 
The extension manifest allows both local and Render-hosted backend URLs:
 
```json
"host_permissions": [
  "http://localhost:3000/*",
  "http://127.0.0.1:3000/*",
  "https://*.onrender.com/*"
]
```
 
> ⚠️ After changing `popup.js`, reload the extension from `chrome://extensions`.
 
---
 
## ☁️ Render Deployment
 
The backend is configured using `render.yaml`:
 
```yaml
services:
  - type: web
    name: ai-browser-copilot-server
    runtime: node
    rootDir: server
    buildCommand: npm install
    startCommand: npm start
```
 
The server reads Render's dynamic port from:
 
```js
process.env.PORT
```
 
This allows the backend to run both locally and on Render.
 
Environment variables must be added in the **Render dashboard**:
 
```text
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```
 
> 🚫 Do not commit `server/.env`.
 
---
 
## 🧩 Site Support
 
| Site | Extraction Approach |
|---|---|
| 🐙 **GitHub / Docs pages** | Extracts visible DOM text |
| 🧮 **LeetCode** | Waits for dynamically loaded problem descriptions before extraction |
| ▶️ **YouTube** | Reads transcript segments when the transcript panel is open, otherwise falls back to description or visible page text |
| 💼 **LinkedIn** | Fails safely if the post composer cannot be read, instead of scraping unrelated profile content |
 
---
 
## 🧭 Known Limitations / Future Work
 
- 📧 **Gmail integration** is not built — it would require OAuth 2.0 and a separate authentication flow beyond this project's scope.
- 💼 **LinkedIn composer extraction** is partially working — the extension correctly detects when it cannot read the composer and fails safely with a clear error instead of falling back to unrelated profile data.
- 📄 **PDF and PPT support** is not built — Chrome's PDF viewer and canvas-rendered slides require different extraction techniques than DOM text scraping.
- ▶️ **YouTube transcript extraction** works best when the transcript panel is manually opened before running the extension.
---
 
## 🔐 Security Notes
 
- Keep `server/.env` **local only**.
- Never commit Gemini API keys.
- The extension sends extracted page text to the configured backend, which then sends it to Gemini.
- LinkedIn fallback behavior was designed with **privacy in mind** to avoid sending unrelated profile data.
---
 
## ✅ Quick Verification Checklist
 
- [ ] **Backend off** → popup shows a clear backend-not-running error
- [ ] **Backend on** → GitHub README summarizes successfully
- [ ] **YouTube** → open transcript panel first, then summarize
- [ ] **LeetCode** → open a problem page and summarize or explain it
- [ ] **LinkedIn** → if composer extraction fails, popup shows a safe error instead of summarizing profile/page text
---
 
<div align="center">
Built with ⚡ Manifest V3, 🟢 Node.js, and 🤖 Google Gemini
 
</div>
