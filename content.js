// Buang jalur hitam kiri-kanan video secara auto. Mod disimpan ikut hostname.
(() => {
  const MODES = ["fill", "cover", "contain"];
  const LABELS = { fill: "Stretch", cover: "Crop", contain: "Asal" };
  const ATTR = "data-video-stretch";
  const MIN_RATIO = 1.2; // video potret (Shorts, TikTok) tak ditarik
  const MIN_WIDTH = 300; // preview kecil tak ditarik
  const host = location.hostname;
  const key = "mode:" + host;
  let mode = "fill";

  // Guna stylesheet, bukan inline, supaya saiz yang player (YouTube) tulis sendiri tak hilang.
  const style = document.createElement("style");
  style.textContent = `video[${ATTR}] {
    object-fit: var(--vs-fit) !important;
    width: var(--vs-width) !important;
    height: var(--vs-height) !important;
    left: 0 !important;
    top: 0 !important;
    transform: none !important; /* Netflix tengahkan guna translate(-50%,-50%) */
    translate: none !important;
  }`;
  document.documentElement.appendChild(style);

  function boxOf(video) {
    // Masa fullscreen, kotak sebenar ialah viewport. YouTube fullscreenkan <html> yang tingginya 0.
    if (document.fullscreenElement) return { width: innerWidth, height: innerHeight };
    for (let el = video.parentElement; el; el = el.parentElement) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) return r;
    }
    return null;
  }

  function update(video) {
    const box = boxOf(video);
    const ratio = video.videoWidth / video.videoHeight;
    const hasSideBars =
      box &&
      box.width >= MIN_WIDTH &&
      ratio >= MIN_RATIO &&
      box.width / box.height > ratio * 1.02;

    if (mode === "contain" || !hasSideBars) {
      video.removeAttribute(ATTR);
      return;
    }
    video.style.setProperty("--vs-fit", mode);
    video.style.setProperty("--vs-width", box.width + "px");
    video.style.setProperty("--vs-height", box.height + "px");
    if (!video.hasAttribute(ATTR)) video.setAttribute(ATTR, "");
  }

  function updateAll() {
    document.querySelectorAll("video").forEach(update);
  }

  function toast(text) {
    const el = document.createElement("div");
    el.textContent = "Video: " + text;
    el.style.cssText =
      "position:fixed;top:24px;left:50%;transform:translateX(-50%);z-index:2147483647;" +
      "padding:10px 18px;border-radius:8px;background:rgba(0,0,0,.85);color:#fff;" +
      "font:600 16px system-ui,sans-serif;pointer-events:none;";
    (document.fullscreenElement || document.documentElement).appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }

  chrome.storage.local.get(key, (saved) => {
    if (saved[key]) mode = saved[key];
    updateAll();
  });

  // Video mungkin dalam iframe, jadi semua frame ikut perubahan dari storage.
  chrome.storage.onChanged.addListener((changes) => {
    if (changes[key]) {
      mode = changes[key].newValue;
      updateAll();
    }
  });

  window.addEventListener(
    "keydown",
    (e) => {
      if (!e.altKey || e.code !== "KeyS") return;
      e.preventDefault();
      e.stopPropagation();
      mode = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
      updateAll();
      chrome.storage.local.set({ [key]: mode });
      toast(LABELS[mode]);
    },
    true
  );

  document.addEventListener("fullscreenchange", () => setTimeout(updateAll, 200));
  window.addEventListener("resize", updateAll);
  setInterval(updateAll, 1000);
})();
