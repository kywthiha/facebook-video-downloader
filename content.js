// This script runs on Facebook pages
console.log("Facebook Video Downloader extension is active");

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "checkForVideos") {
    findVideoUrls().then((urls) => {
      sendResponse(urls);
    });
    return true; // Keep the message channel open for the async response
  }
});

// Function to find videos using the provided fetch code
async function findVideoUrls() {
  const videoUrls = {
    SD: null,
    HD: null,
  };

  try {
    const response = await fetch(window.location.href, {
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language":
          "en-US,en;q=0.9,my;q=0.8,th;q=0.7,zh-CN;q=0.6,zh;q=0.5,ja;q=0.4",
        dpr: "1.5",
        priority: "u=0, i",
        "sec-ch-prefers-color-scheme": "light",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        "viewport-width": "215",
      },
      referrerPolicy: "strict-origin-when-cross-origin",
      body: null,
      method: "GET",
      mode: "cors",
      credentials: "include",
    });

    const html = await response.text();
    const match = html.match(/progressive_urls":\s*(\[[^\]]+\])/);

    if (match) {
      try {
        const progressiveUrls = JSON.parse(match[1]);

        for (const item of progressiveUrls) {
          if (item.metadata && item.progressive_url) {
            if (item.metadata.quality === "SD") {
              videoUrls.SD = item.progressive_url;
            } else if (item.metadata.quality === "HD") {
              videoUrls.HD = item.progressive_url;
            }
          }
        }
      } catch (error) {
        console.error("Error parsing JSON:", error);
      }
    } else {
      console.log("No progressive_urls found.");
    }
  } catch (error) {
    console.error("Fetch error:", error);
  }

  return videoUrls;
}
