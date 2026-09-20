(() => {
  const MAX_TEXT_LENGTH = 14000;
  const DYNAMIC_TIMEOUT_MS = 5000;

  const normalizeText = (value) => (value || "").replace(/\s+/g, " ").trim();

  const limitText = (value) => normalizeText(value).slice(0, MAX_TEXT_LENGTH);

  const getText = (node) => {
    if (!node) {
      return "";
    }

    const shadowText = node.shadowRoot?.textContent || "";
    return normalizeText([node.innerText || node.textContent || "", shadowText].filter(Boolean).join(" "));
  };

  const queryAny = (selectors, root = document) => {
    for (const selector of selectors) {
      const node = root.querySelector(selector);

      if (node) {
        return node;
      }
    }

    return null;
  };

  const isVisible = (node) => {
    if (!node) {
      return false;
    }

    const rect = node.getBoundingClientRect();
    const style = window.getComputedStyle(node);
    return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
  };

  const getBestNodeByText = (selectors, pattern) => {
    for (const selector of selectors) {
      const nodes = Array.from(document.querySelectorAll(selector));
      const match = nodes.find((node) => pattern.test(getText(node)) || pattern.test(node.getAttribute("aria-label") || ""));

      if (match) {
        return match;
      }
    }

    return null;
  };

  const waitForAnySelector = (selectors, options = {}) =>
    new Promise((resolve) => {
      const timeoutMs = options.timeoutMs || DYNAMIC_TIMEOUT_MS;
      const minTextLength = options.minTextLength || 1;

      const findReadyNode = () => {
        const node = queryAny(selectors);
        return getText(node).length >= minTextLength ? node : null;
      };

      const existing = findReadyNode();

      if (existing) {
        resolve(existing);
        return;
      }

      const observer = new MutationObserver(() => {
        const node = findReadyNode();

        if (node) {
          observer.disconnect();
          clearTimeout(timeoutId);
          resolve(node);
        }
      });

      observer.observe(document.documentElement || document.body, {
        childList: true,
        subtree: true
      });

      const timeoutId = setTimeout(() => {
        observer.disconnect();
        resolve(findReadyNode());
      }, timeoutMs);
    });

  const extractGenericPage = () => {
    const clone = document.body ? document.body.cloneNode(true) : null;

    if (clone) {
      clone.querySelectorAll("script, style, noscript, svg, canvas, iframe").forEach((node) => node.remove());
    }

    return {
      title: document.title || location.href,
      text: limitText(clone?.innerText || document.body?.innerText || "")
    };
  };

  const extractLeetCode = async () => {
    const descriptionSelectors = [
      '[data-track-load="description_content"]',
      '[data-cy="question-content"]',
      ".question-content__JfgR",
      '[class*="question-content"]',
      '[class*="description"]'
    ];
    const titleSelectors = [
      '[data-cy="question-title"]',
      'a[href^="/problems/"]',
      "h1",
      "h2"
    ];

    const descriptionNode = await waitForAnySelector(descriptionSelectors, {
      timeoutMs: DYNAMIC_TIMEOUT_MS,
      minTextLength: 80
    });
    const title = getText(queryAny(titleSelectors)) || document.title || location.href;
    const description = getText(descriptionNode);

    if (!description) {
      return extractGenericPage();
    }

    return {
      title: `LeetCode: ${title}`,
      text: limitText(`Problem title: ${title}\n\nProblem description:\n${description}`)
    };
  };

  const readYouTubeTranscript = () => {
    const segmentSelectors = [
      "transcript-segment-view-model",
      "ytd-transcript-segment-renderer",
      "#segments-container ytd-transcript-segment-renderer",
      "yt-formatted-string.segment-text",
      ".segment-text"
    ];
    const segments = Array.from(document.querySelectorAll(segmentSelectors.join(",")))
      .map((node) => getText(node))
      .filter(Boolean);
    const uniqueSegments = [...new Set(segments)];

    return uniqueSegments.join(" ");
  };

  const tryOpenYouTubeTranscript = async () => {
    if (readYouTubeTranscript()) {
      return;
    }

    const expandDescriptionButton = getBestNodeByText(
      ["tp-yt-paper-button", "button", "yt-button-shape button"],
      /more|show more/i
    );
    expandDescriptionButton?.click();

    await new Promise((resolve) => setTimeout(resolve, 300));

    // YouTube does not expose a stable public transcript API to page scripts.
    // This DOM click/read approach works only when the visible page renders a transcript panel.
    const transcriptButton = getBestNodeByText(
      ["button", "tp-yt-paper-button", "yt-button-shape button", "ytd-button-renderer"],
      /show transcript|transcript/i
    );
    transcriptButton?.click();

    await waitForAnySelector(["transcript-segment-view-model", "ytd-transcript-segment-renderer", ".segment-text", "#segments-container"], {
      timeoutMs: 2500,
      minTextLength: 20
    });
  };

  const extractYouTube = async () => {
    const title = getText(queryAny(["h1.ytd-watch-metadata", "h1.title", "h1"])) || document.title || location.href;

    await tryOpenYouTubeTranscript();

    const transcript = readYouTubeTranscript();

    if (transcript) {
      return {
        title: `YouTube: ${title}`,
        text: limitText(`Video title: ${title}\n\nTranscript:\n${transcript}`)
      };
    }

    const descriptionNode =
      queryAny([
        "ytd-watch-metadata #description-inline-expander",
        "ytd-watch-metadata #description",
        "ytd-video-secondary-info-renderer #description",
        "#description"
      ]) || document.body;
    const description = getText(descriptionNode);

    return {
      title: `YouTube: ${title}`,
      text: limitText(`Video title: ${title}\n\nDescription or visible page text:\n${description}`)
    };
  };

  const extractLinkedIn = async () => {
    const composerSelectors = [
      'div.ql-editor[contenteditable="true"]',
      '[data-test-ql-editor-contenteditable="true"]',
      '[aria-label="Text editor for creating content"][contenteditable="true"]',
      '[aria-placeholder="What do you want to talk about?"][contenteditable="true"]',
      '[role="textbox"][contenteditable="true"]',
      '[role="textbox"]',
      ".ql-editor[contenteditable='true']",
      "[contenteditable='true']"
    ];
    const activeElement = document.activeElement;
    const activeText =
      activeElement?.matches?.(composerSelectors.join(",")) && isVisible(activeElement) ? getText(activeElement) : "";
    const composerText =
      activeText ||
      Array.from(document.querySelectorAll(composerSelectors.join(",")))
        .filter(isVisible)
        .map((node) => getText(node))
        .find(Boolean);

    if (!composerText) {
      return {
        title: `LinkedIn: ${document.title || location.href}`,
        text: "",
        error: "Could not find a LinkedIn post composer on this page. Open the Start a post composer, click inside the text box, and try again."
      };
    }

    return {
      title: `LinkedIn: ${document.title || location.href}`,
      text: limitText(`LinkedIn composer text:\n${composerText}`)
    };
  };

  const extractPageContent = async () => {
    const hostname = location.hostname;

    if (hostname.includes("leetcode.com")) {
      return extractLeetCode();
    }

    if (hostname.includes("youtube.com") && location.pathname === "/watch") {
      return extractYouTube();
    }

    if (hostname.includes("linkedin.com")) {
      return extractLinkedIn();
    }

    return extractGenericPage();
  };

  return extractPageContent();
})();
