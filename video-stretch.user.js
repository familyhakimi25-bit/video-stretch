// ==UserScript==
// @name         Video Stretch (Phone)
// @namespace    https://github.com/familyhakimi25-bit/video-stretch
// @version      1.0
// @description  Buang jalur hitam kiri-kanan video bila fullscreen di phone. Ketik butang di bucu untuk tukar mod: Stretch, Crop, Asal.
// @match        *://*/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addValueChangeListener
// @grant        GM_registerMenuCommand
// @downloadURL  https://raw.githubusercontent.com/familyhakimi25-bit/video-stretch/main/video-stretch.user.js
// @updateURL    https://raw.githubusercontent.com/familyhakimi25-bit/video-stretch/main/video-stretch.user.js
// ==/UserScript==

// Versi phone untuk extension laptop (content.js). Logik saiz sama; beza dia:
// - phone tak ada Alt+S, jadi ada butang kecil di bucu kanan atas (keluar 3 saat bila video
//   ada jalur hitam, contoh masa masuk fullscreen) dan menu Violentmonkey/Tampermonkey.
// - mod satu untuk semua laman, sebab video selalu dalam iframe domain lain.
// Tiada @noframes: skrip mesti jalan dalam iframe player juga.
(() => {
  const MODES = ["fill", "cover", "contain"];
  const LABELS = { fill: "Stretch", cover: "Crop", contain: "Asal" };
  const ATTR = "data-video-stretch";
  const MIN_RATIO = 1.2; // video potret (Shorts, TikTok) tak ditarik
  const MIN_WIDTH = 300; // preview kecil tak ditarik
  const KEY = "mode";

  const hasGM = typeof GM_getValue === "function" && typeof GM_setValue === "function";
  const valid = (m) => MODES.includes(m);

  function load() {
    try {
      const m = hasGM ? GM_getValue(KEY, "fill") : "fill";
      return valid(m) ? m : "fill";
    } catch (e) {
      return "fill";
    }
  }

  let mode = load();

  function save(next) {
    mode = next;
    try {
      if (hasGM) GM_setValue(KEY, next);
    } catch (e) {
      /* mod tetap berubah untuk tab ini */
    }
  }

  // Guna stylesheet, bukan inline, supaya saiz yang player tulis sendiri tak hilang.
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

  function mountStyle() {
    if (style.isConnected) return;
    const root = document.head || document.documentElement;
    if (root) root.appendChild(style);
  }

  const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement || null;

  function boxOf(video) {
    // Masa fullscreen, kotak sebenar ialah skrin. Video lain di luar fullscreen guna kotak sendiri.
    const fs = fsElement();
    if (fs && (fs === video || fs.contains(video) || fs === document.documentElement)) {
      return { width: innerWidth, height: innerHeight };
    }
    for (let el = video.parentElement; el; el = el.parentElement) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) return r;
    }
    return null;
  }

  // Pulangkan kotak kalau video ada jalur hitam tepi, kalau tidak null.
  function sideBarBox(video) {
    if (!video.videoWidth || !video.videoHeight) return null;
    const box = boxOf(video);
    const ratio = video.videoWidth / video.videoHeight;
    const bars =
      box && box.width >= MIN_WIDTH && ratio >= MIN_RATIO && box.width / box.height > ratio * 1.02;
    return bars ? box : null;
  }

  function update(video) {
    const box = sideBarBox(video);
    if (mode === "contain" || !box) {
      video.removeAttribute(ATTR);
      return !!box;
    }
    video.style.setProperty("--vs-fit", mode);
    video.style.setProperty("--vs-width", box.width + "px");
    video.style.setProperty("--vs-height", box.height + "px");
    if (!video.hasAttribute(ATTR)) video.setAttribute(ATTR, "");
    return true;
  }

  let hadBars = false;

  function updateAll() {
    mountStyle();
    let any = false;
    document.querySelectorAll("video").forEach((v) => {
      if (update(v)) any = true;
    });
    // Butang keluar sekali setiap kali video mula ada jalur hitam (biasanya masa masuk fullscreen).
    if (any && !hadBars) showPill();
    hadBars = any;
  }

  // Butang kecil: tunjuk mod sekarang, ketik untuk tukar. Hilang sendiri lepas 3 saat.
  let pill = null;
  let hideTimer = 0;

  function makePill() {
    const el = document.createElement("div");
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", "Tukar mod video");
    el.style.cssText =
      "all:initial;position:fixed;z-index:2147483647;" +
      "top:max(14px,env(safe-area-inset-top));right:max(14px,env(safe-area-inset-right));" +
      "min-height:44px;min-width:44px;box-sizing:border-box;padding:12px 16px;border-radius:22px;" +
      "background:rgba(0,0,0,.72);color:#fff;font:600 15px/20px system-ui,sans-serif;" +
      "cursor:pointer;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;";
    // Jangan biar ketikan sampai ke player (nanti dia pause atau sorok kawalan).
    const stop = (e) => e.stopPropagation();
    ["pointerdown", "pointerup", "mousedown", "mouseup", "touchstart", "touchend", "dblclick"].forEach(
      (t) => el.addEventListener(t, stop, true)
    );
    el.addEventListener(
      "click",
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        save(MODES[(MODES.indexOf(mode) + 1) % MODES.length]);
        updateAll();
        showPill();
      },
      true
    );
    return el;
  }

  function showPill() {
    const fs = fsElement();
    // Kalau yang fullscreen ialah <video> itu sendiri, anak dia tak dilukis; butang tak boleh muncul.
    const host = fs ? (fs.tagName === "VIDEO" ? null : fs) : document.body || document.documentElement;
    if (!host) return;
    if (!pill) pill = makePill();
    pill.textContent = "⤢ " + LABELS[mode];
    if (pill.parentNode !== host) host.appendChild(pill);
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => pill && pill.remove(), 3000);
  }

  function setMode(next) {
    save(next);
    updateAll();
    showPill();
  }

  // Video mungkin dalam iframe, jadi semua frame ikut perubahan mod.
  if (typeof GM_addValueChangeListener === "function") {
    try {
      GM_addValueChangeListener(KEY, (_k, _old, val) => {
        if (valid(val) && val !== mode) {
          mode = val;
          updateAll();
        }
      });
    } catch (e) {
      /* semakan setiap saat di bawah jadi sandaran */
    }
  }

  // Menu dalam Violentmonkey/Tampermonkey. Daftar di frame atas sahaja supaya tak berganda.
  if (window.top === window && typeof GM_registerMenuCommand === "function") {
    MODES.forEach((m) => GM_registerMenuCommand("Mod: " + LABELS[m], () => setMode(m)));
  }

  // Kalau guna keyboard (tablet / laptop), Alt+S masih boleh.
  window.addEventListener(
    "keydown",
    (e) => {
      if (!e.altKey || e.code !== "KeyS") return;
      e.preventDefault();
      e.stopPropagation();
      setMode(MODES[(MODES.indexOf(mode) + 1) % MODES.length]);
    },
    true
  );

  const later = (ms) => () => setTimeout(updateAll, ms);
  document.addEventListener("fullscreenchange", later(200));
  document.addEventListener("webkitfullscreenchange", later(200));
  window.addEventListener("orientationchange", later(300));
  window.addEventListener("resize", updateAll);
  document.addEventListener("loadedmetadata", updateAll, true); // event media tak bubble
  setInterval(() => {
    if (hasGM) mode = load();
    updateAll();
  }, 1000);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", updateAll);
  else updateAll();
})();
