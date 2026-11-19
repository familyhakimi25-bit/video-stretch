# Video Stretch Ultrawide

A small Chrome extension that fills an ultrawide (21:9) monitor with video, on sites where the existing
extensions did not work for me.

- **Alt + S** cycles three modes: **Stretch** (fill the screen), **Crop** (fill and trim the edges) and **Asal** (original).
- The chosen mode is remembered per site.
- Portrait videos (Shorts, TikTok) and small previews are left alone.
- Works in fullscreen, including players that centre the video with a CSS transform.

## Install

1. Download or clone this repository.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and pick this folder.

Manifest V3, plain JavaScript, only the `storage` permission.

## Phone (Android)

Chrome on Android cannot run extensions, so the same logic ships as a userscript: `video-stretch.user.js`.

1. Install **Firefox** from the Play Store.
2. In Firefox, open the menu, go to **Extensions** and add **Violentmonkey**.
3. Open [video-stretch.user.js](https://raw.githubusercontent.com/familyhakimi25-bit/video-stretch/main/video-stretch.user.js)
   in Firefox and tap **Confirm installation**.

- Fullscreen video is stretched by default, including players inside an iframe from another domain.
- A small button in the top-right corner shows for 3 seconds when the black bars would appear. Tap it to cycle
  **Stretch**, **Crop** and **Asal**. The modes are also in the Violentmonkey menu.
- One mode for every site, because the player usually lives on a different domain from the page.

iPhone: Safari plays fullscreen video in Apple's own player, which a script cannot restyle. Pinch out on the
video there to fill the screen (this crops instead of stretching).
