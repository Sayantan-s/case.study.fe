# Audio Recorder — Technical Requirements Document (TRD)

**Status:** Draft · **Owner:** TBD · **Last updated:** 2026-05-03

This TRD captures the technical requirements, constraints, and capacity/cost model for the in-app voice-message recorder. It complements:
- [`docs/hld.md`](./hld.md) — high-level design (architecture, state machine, sequence flows)
- [`docs/audio-recorder-component-design.md`](./audio-recorder-component-design.md) — React component API spec

---

## 1. Scope

In-app voice-message recorder shipped inside the existing mobile experience. Users tap to record (≤ 30 s), pause/resume, review, then send. The artifact is uploaded to S3 and made playable in chat-like surfaces.

**In scope:** capture, on-device codec selection, upload transport, server-side transcode to canonical MP3, storage, playback URL handoff.
**Out of scope:** transcription/STT, server-side voice-activity-detection, voice notes longer than 30 s, video.

---

## 2. Runtime context

| Property | Value |
| --- | --- |
| Host | `react-native-webview` (iOS + Android) |
| Web framework | React 19 + TypeScript (this repo) |
| iOS minimum | 14.5 (`MediaRecorder` reliable in WKWebView from this version) |
| Android minimum | follows project RN target; Chromium WebView is reliable across the supported range |
| Backend object store | Amazon S3 |

The component is *web React inside a native WebView*, not a React Native component. It must remain operable outside the RN shell (for browser-based testing and future surface re-use).

---

## 3. Functional requirements (technical view)

| # | Requirement |
| --- | --- |
| FR1 | Tap-to-record from a trigger control; emits a "start" cue (sound + haptic where available). |
| FR2 | A bottom sheet overlays the message-input area while recording is active. |
| FR3 | Sheet shows: countdown timer (configurable max, default 30 s → 30, 29, 28 …), live waveform, discard button, record/play toggle, send button. |
| FR4 | User may pause and resume recording any number of times within `maxDuration`. |
| FR5 | After stop, user enters a "review" state with playback. |
| FR6 | Send is optimistic: sheet closes immediately; upload completes in the background; failure surfaces as a toast with retry. |
| FR7 | Discard tears down the recording without uploading and releases the mic. |

---

## 4. Non-functional requirements

| # | Requirement | Acceptance |
| --- | --- | --- |
| NFR1 | Cross-platform: iOS 14.5+ and Android (RN-WebView). | Smoke flow passes on both platforms. |
| NFR2 | Storage-efficient and LLM-ingest-friendly. | Canonical artifact ≤ 100 KB for a 20 s clip; format accepted by Whisper / GPT-4o / Gemini without re-encode. |
| NFR3 | Headless component; consumer styles fully. | Component renders no opinionated DOM beyond what `asChild` allows; design tokens are not baked in. |
| NFR4 | Mic indicator goes off the moment recording ends or the sheet is dismissed. | `MediaStream` tracks stopped on unmount, cancel, send, and error. |
| NFR5 | Resilient to OS interrupts (incoming call, app backgrounded). | Auto-pause on interrupt; user can resume or discard. |

---

## 5. Audio format & encoding

### 5.1 Why MP3 cannot be produced on-device

Browser `MediaRecorder` does not ship an MP3 encoder on either platform. `MediaRecorder.isTypeSupported('audio/mpeg')` returns `false` in WKWebView and Android WebView. Producing MP3 in JS would require shipping `lamejs` (~150 KB) and paying a CPU spike at stop time — rejected to keep the bundle small and the component headless.

### 5.2 Decision

| Stage | Format | Bitrate | Sample rate | Channels |
| --- | --- | --- | --- | --- |
| Device (iOS WKWebView) | `audio/mp4` (AAC) | 32 kbps | 16 kHz | mono |
| Device (Android WebView) | `audio/webm;codecs=opus` | 32 kbps | 16 kHz | mono |
| Server canonical | `audio/mpeg` (MP3) | 32 kbps | 16 kHz | mono |

The server (FFmpeg or equivalent) accepts both upload `Content-Type`s and normalizes to MP3 before persisting. All downstream URLs (playback, LLM input, archival) reference the post-transcode MP3.

### 5.3 Why 32 kbps mono / 16 kHz

- 32 kbps voice in AAC, Opus, and MP3 is intelligible and acceptable for messaging UX.
- 16 kHz is the input sample rate for Whisper and the speech encoders inside GPT-4o / Gemini — anything higher gets resampled down anyway.
- Mono halves bandwidth with no perceptual loss for a single near-field speaker.

---

## 6. Upload transport

Two approaches are supported; default is A.

### Approach A — Webview-direct (default)

Webview records via `MediaRecorder`, uploads via `fetch` directly to the backend (or to a presigned S3 URL). No `window.ReactNativeWebView` coupling.

- ✅ Simple, single codepath, component remains portable outside RN shell.
- ❌ iOS suspends the JS context if the app is backgrounded mid-upload → request fails.
- ❌ No native retry / queue; auth token must be reachable inside the webview (cookie or one-time `postMessage` handshake on mount).

### Approach B — RN bridge (opt-in)

Webview chunks the blob (transferable `ArrayBuffer` or base64) and posts to the RN host via `window.ReactNativeWebView.postMessage`. Native code uploads via `URLSession` (iOS) / `OkHttp` (Android).

- ✅ Survives app suspension via background upload; native retry / queue; auth reused from native side.
- ❌ base64 inflates payload ~33% (mitigate with chunking); couples the component to the RN host.

The component does **not** hardcode either transport. The design ships two helper utilities (`uploadViaFetch`, `uploadViaRNBridge`) that the consumer invokes from inside `onSend`. See `docs/audio-recorder-component-design.md` §B.

---

## 7. Permissions (two-layered)

Mic access requires *both* native and WebView grants — both deny by default even when the OS layer has granted permission.

| Layer | iOS | Android |
| --- | --- | --- |
| Native | `NSMicrophoneUsageDescription` in `Info.plist` | `<uses-permission android:name="android.permission.RECORD_AUDIO"/>` + runtime `PermissionsAndroid.request(...)` |
| WebView | `mediaCapturePermissionGrantType="grant"` on `<WebView>` (iOS 15+); native shim or recent `react-native-webview` build for iOS 14.5–14.x | `react-native-webview`'s `onPermissionRequest` flow grants `android.webkit.resource.AUDIO_CAPTURE`; without this, `getUserMedia` throws `NotAllowedError` despite OS permission |
| Web | `navigator.mediaDevices.getUserMedia({ audio: true })` succeeds only if the layers above pass | same |

The component reports denials with a layer discriminator (`'native' | 'webview' | 'web'`) so the UI can offer the right remediation (open Settings vs. ask the host to re-grant vs. show in-page hint).

---

## 8. Capacity & cost model

### 8.1 Assumptions

- Format: MP3 @ 32 kbps (post-server-transcode canonical).
- Duration: 20 s per clip (typical voice message).
- Volume: 10,000 clips/day.
- Storage: Amazon S3 (Mumbai region, ₹ pricing).

### 8.2 Per-clip size

```
32 kbps = 4 KB/s
20 s × 4 KB/s = 80 KB / clip
```

The pre-transcode upload (AAC or Opus at the same 32 kbps) is essentially the same size — within ±10 % depending on container overhead. Plan on **~80 KB ingress, ~80 KB stored.**

### 8.3 Daily and monthly storage

| Metric | Value |
| --- | --- |
| Daily ingress | 10,000 × 80 KB ≈ **0.8 GB/day** |
| Monthly accumulation | 30 × 0.8 GB ≈ **~24 GB/month** |

### 8.4 Cost (S3, Mumbai region, indicative)

S3 standard storage ≈ ₹1.9 / GB / month → ₹0.063 / GB / day.

| Component | Daily | Monthly |
| --- | --- | --- |
| Storage (today's writes) | 0.8 GB × ₹0.063 ≈ **₹0.05/day** | — |
| Storage (steady-state, 30-day retention) | — | 24 GB × ₹1.9 ≈ **₹45/month** |
| Upload (S3 PUT, inbound) | Free | Free |
| Playback bandwidth (assume 1 play/upload) | 0.8 GB × ₹7 ≈ **₹5–7/day** | ~₹150–210/month |
| **Total** | **₹5–7/day** | **~₹200/month** |

### 8.5 Takeaway

Storage is effectively free at this scale. **Playback egress is ~100× the storage cost** and is the line item to watch as DAU grows.

---

## 9. Scaling levers (future)

Apply in this order if cost grows materially:

1. **CDN in front of S3 for playback** (CloudFront or third-party). Caches hot clips, cuts S3 egress to one read per cache miss. Single biggest lever.
2. **S3 lifecycle policies.** Transition objects older than 30 days to S3 Standard-IA or Glacier Instant Retrieval (~50–80 % cheaper for storage, slightly higher per-retrieval cost).
3. **Switch end-to-end to Opus.** Skip the server transcode and ship Opus to playback clients. Better quality at the same bitrate, smaller files (~15–20 % smaller than MP3 at 32 kbps for voice). Blocked today by the requirement that downstream consumers expect MP3 — revisit when that constraint relaxes.
4. **Drop bitrate to 24 kbps** (Opus or AAC). For voice the perceptual hit is small; ~25 % storage and bandwidth saving.
5. **Dedupe / reference-count uploads.** Only relevant if many users could send the same clip — usually not the case for personal voice notes.

---

## 10. Telemetry

At minimum, emit the following events from the component (consumer wires them to whatever analytics sink is in use):

| Event | Properties |
| --- | --- |
| `voice_record_started` | `triggerSurface` |
| `voice_record_paused` / `voice_record_resumed` | `elapsedMs` |
| `voice_record_stopped` | `durationMs`, `mimeType`, `sizeBytes` |
| `voice_record_discarded` | `elapsedMs` |
| `voice_record_sent` | `durationMs`, `sizeBytes`, `transport: 'fetch' \| 'bridge'` |
| `voice_record_send_failed` | `errorKind`, `httpStatus?` |
| `voice_record_permission_denied` | `layer: 'native' \| 'webview' \| 'web'` |

---

## 11. Out of scope (this iteration)

- Speech-to-text on device or server.
- Background recording (recording while the app is not foregrounded).
- Voice messages longer than 30 s.
- Editing / trimming after recording.
- Multi-track / stereo capture.
- End-to-end Opus pipeline (see §9 — possible future migration).
