# Celestial Lake — Section 1 real-device QA

This repository contains a first-section **mobile prototype**, not a published invitation or completed Section 2. Browser automation covers responsive geometry, but it does not measure touch smoothness, heating, memory pressure or battery use on a physical phone.

## Launch on Windows

1. In PowerShell, open your existing `testing-4` folder and run:
   ```powershell
   git pull origin main
   powershell -ExecutionPolicy Bypass -File .\start.ps1
   ```
2. Check `http://localhost:8000` on the PC. The starter verifies **all 25 WebP images** and repairs missing or corrupt files before launching.
3. For a physical iPhone or Android device, connect it to the **same Wi-Fi network** as your PC.
4. Run `ipconfig` in Windows and find the PC's Wi-Fi **IPv4 Address**.
5. Open `http://<PC-IPv4-address>:8000` in Safari or Chrome on the phone. If it cannot connect, allow Python through Windows Defender Firewall on the **private network**; avoid exposing port 8000 publicly.
6. For the new on-phone tester, add **`?phoneqa=1`**: `http://<PC-IPv4-address>:8000/?phoneqa=1`. Tap **Phone QA** in the upper-left corner. The normal invitation URL stays clean.

The source artwork remains on the PC during local preview. Do not publish these assets without confirming the owner's public-distribution rights.

## Touch and visual pass

- **Initial cover:** watch for broken images, cut-off trees or peacocks, flickering flowers, off-center monogram or a button hidden by browser navigation.
- **Opening:** tap **Open Invitation** once; the camera should move into the valley without horizontal page movement.
- **Swiping:** slowly swipe up through the sticky lake; flowers, arch and peacocks should return in stages. Names should write after the ceremonial frame returns. Scrolling must feel natural; the page must not lock.
- **Continuing:** continue to the temporary next-section placeholder, then scroll back. Ambient motion should resume without restarting the invitation.
- **Orientation:** rotate portrait → landscape → portrait. Confirm the page remains usable and doesn't show a white or torn gap.
- **Reduced motion:** enable the phone's accessibility setting for reduced motion and reload. Decorations should stop moving while the invitation remains accessible.
- **Connection problems:** test with slow Wi-Fi if practical. Missing artwork should produce an understandable message while the names and button remain usable.

## Performance observations

On a physical phone, note whether any of the following occurs: a visible pause during the opening camera move; delayed tap feedback; prolonged white/blank loading; rapidly heating device; clearly choppy falling petals; or stuttering when the arch and flowers return.

The canvas attempts at most **30 draws per second**, with a maximum raster density of **2×**. The app suspends decorative frames in hidden tabs and when less than 7.5% of the first scene remains visible. These are implementation limits, **not measured real-device FPS, CPU or battery results**.

## Shareable bug report

Record the phone model, browser, OS version, screen orientation, whether low-power/reduced-motion mode was on, the scroll point (cover, just opened, garden returning, names, or next section), and a screenshot or short screen recording. This makes visual fixes reproducible.

For desktop developer comparison, open `http://localhost:8000/?debug=1` to switch between master artwork and individual animated layers.


## Phase 16 — run the actual-phone diagnostics

The **Phone QA** panel is available only with the opt-in `?phoneqa=1` URL. It shows your real mobile viewport, pixel density, orientation, artwork state, whether the scene is visible, reduced-motion preference and any horizontal overflow.

1. Open the panel and make sure the artwork says **ready** and horizontal overflow says **0px**.
2. Tap **Close**, then tap **Open Invitation**. Swipe slowly through the full garden sequence, reach the names and scroll back. Reopen Phone QA.
3. Tap **Measure 5 seconds** while Section 1 is visible. Keep the browser tab foregrounded and the phone awake. It records a browser animation-frame callback rate and the scene's **actual petal canvas paint rate**, which should remain near or below 30 paints/second. A supported browser may also report long tasks.
4. Tick each manual check **only if it passed on the physical phone**. Rotate the phone to landscape and back before checking the rotation item.
5. Enter any problem under **Issues observed** and tap **Copy test report**. Paste the report in ChatGPT. On local-network HTTP addresses, browsers may block clipboard access; in that case a selectable text report appears for manual copying.

**Privacy:** The tester runs locally, does not call a telemetry server, and never uploads a report. The report contains the browser user-agent and screen properties; review it before sharing. No test result is considered verified until the physical-phone test is actually performed. Automated Chromium emulation is a separate safeguard, not a replacement.

**Metric interpretation:** The frame callback rate reflects how often browser animation frames were delivered during this short sample, not a guaranteed on-screen rendered FPS or GPU benchmark. Petal paints/second counts actual canvas draws. Neither metric proves battery life or absence of thermal throttling on longer sessions.
