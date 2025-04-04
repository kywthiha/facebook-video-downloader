document.addEventListener("DOMContentLoaded", function () {
  const statusEl = document.getElementById("status");
  const videoOptionsEl = document.getElementById("videoOptions");
  const downloadSDBtn = document.getElementById("downloadSD");
  const downloadHDBtn = document.getElementById("downloadHD");

  let videoUrls = {
    SD: null,
    HD: null,
  };

  // Check if we're on a Facebook page with video
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentTab = tabs[0];

    if (!currentTab.url.includes("facebook.com")) {
      statusEl.textContent = "Please open a Facebook page with a video.";
      return;
    }

    // Execute content script to find video URLs
    chrome.scripting.executeScript(
      {
        target: { tabId: currentTab.id },
        function: findFacebookVideos,
      },
      (results) => {
        if (chrome.runtime.lastError) {
          statusEl.textContent = "Error: " + chrome.runtime.lastError.message;
          return;
        }

        const result = results[0].result;

        if (!result || (!result.SD && !result.HD)) {
          statusEl.textContent = "No Facebook videos detected on this page.";
          return;
        }

        // Found videos
        statusEl.textContent = "Facebook video detected!";
        videoUrls = result;

        // Enable/disable buttons based on available qualities
        if (videoUrls.SD) {
          downloadSDBtn.disabled = false;
        } else {
          downloadSDBtn.disabled = true;
        }

        if (videoUrls.HD) {
          downloadHDBtn.disabled = false;
        } else {
          downloadHDBtn.disabled = true;
        }

        // Show video options
        videoOptionsEl.style.display = "flex";
      }
    );
  });

  // Set up download buttons
  downloadSDBtn.addEventListener("click", function () {
    if (videoUrls.SD) {
      downloadVideo(videoUrls.SD, "SD");
    }
  });

  downloadHDBtn.addEventListener("click", function () {
    if (videoUrls.HD) {
      downloadVideo(videoUrls.HD, "HD");
    }
  });

  function downloadVideo(url, quality) {
    chrome.downloads.download(
      {
        url: url,
        filename: `facebook_video_${quality}_${Date.now()}.mp4`,
        saveAs: true,
      },
      function (downloadId) {
        if (chrome.runtime.lastError) {
          statusEl.textContent =
            "Download failed: " + chrome.runtime.lastError.message;
        } else {
          statusEl.textContent = `Downloading ${quality} video...`;
        }
      }
    );
  }
});

// Function to find Facebook videos on the page using the provided code
function findFacebookVideos() {
  // This function runs in the context of the web page
  const videoUrls = {
    SD: null,
    HD: null,
  };

  // Using the provided code to fetch and extract video URLs
  return fetch(window.location.href, {
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
  })
    .then((res) => res.text())
    .then((res) => {
      const match = res.match(/progressive_urls":\s*(\[[^\]]+\])/);
      if (match) {
        try {
          const progressiveUrls = JSON.parse(match[1]);

          // Process the progressive URLs
          for (const item of progressiveUrls) {
            if (item.metadata && item.progressive_url) {
              if (item.metadata.quality === "SD") {
                videoUrls.SD = item.progressive_url;
              } else if (item.metadata.quality === "HD") {
                videoUrls.HD = item.progressive_url;
              }
            }
          }

          return videoUrls;
        } catch (error) {
          console.error("Error parsing JSON:", error);
          return videoUrls;
        }
      } else {
        console.log("No progressive_urls found.");
        return videoUrls;
      }
    })
    .catch((error) => {
      console.error("Fetch error:", error);
      return videoUrls;
    });
}
