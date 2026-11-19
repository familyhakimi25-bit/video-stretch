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
