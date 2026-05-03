# Audio Recorder — HLD & Component API Review

## Context

`docs/hld.md` (22 lines) and `src/components/feat/audio-recorder/index.tsx` (37 lines of empty compound-component stubs) are both early skeletons. This document reviews what's missing or weak before implementation begins. It is a **recommendations audit**, not an implementation plan.

> **Runtime note:** This component is web React rendered inside a **`react-native-webview`** host on iOS and Android — it is not a standalone web component. Several recommendations below depend on that fact (permissions are two-layered, "send" likely flows over the RN bridge, etc.). NFR1 should state this explicitly in the HLD.

---

## Part 1 — HLD improvements (`docs/hld.md`)

The current HLD lists features but doesn't pin down the contracts an implementer needs. Gaps, grouped by severity:

### A. Missing technical contracts (blocking)

1. **Audio format / codec / bitrate — split device and storage formats.** NFR2 says "small enough" but no target. The decision is now pinned:
   - **Device-side capture (what `MediaRecorder` produces):** the browser's `MediaRecorder` cannot emit MP3 on either platform, so the device records in the native container per platform:
     - **iOS WKWebView →** `audio/mp4` (AAC), 32 kbps, 16 kHz mono.
     - **Android WebView →** `audio/webm;codecs=opus`, 32 kbps, 16 kHz mono.
   - **Storage / canonical format:** `.mp3` @ 32 kbps mono. **Transcoding happens server-side** (e.g. via FFmpeg) — the device never produces MP3. This keeps the client headless, avoids shipping a JS MP3 encoder (`lamejs` ~150 KB + CPU spike), and avoids forcing the RN bridge.
   - **Implications for upload:** the `Content-Type` of the upload will be `audio/mp4` or `audio/webm` depending on platform; the server must accept both and normalize to MP3. Filename extension and downstream URLs (LLM input, playback) reference the post-transcode MP3.
   - **Sample rate:** 16 kHz mono is the sweet spot for voice + LLM transcription (Whisper, GPT-4o, Gemini all accept it natively).
2. **Output payload contract — support both transports.** "Sent to the backend" is undefined; the component should support two implementation approaches and let the consumer pick at construction time:

   **Approach A — Webview-direct upload (default):** the webview records with `MediaRecorder` and uploads via `fetch` from inside the bundle. Genuinely headless, works outside the RN shell, no `window.ReactNativeWebView` coupling. The RN bridge is *not* used for the send.
   - Pros: simple, one codepath, component stays portable.
   - Cons: if the user backgrounds the app mid-upload, iOS suspends the JS context and the request dies. No native retry/queue if offline. Auth token must be reachable inside the webview (cookie set on load, or one-time `postMessage` handshake on mount — only this small bridge usage).

   **Approach B — RN bridge upload (opt-in):** the webview encodes the blob (chunked `ArrayBuffer` or base64) and posts it to the RN host via `window.ReactNativeWebView.postMessage`; native code performs the upload via `URLSession` / `OkHttp`.
   - Pros: native background upload survives app suspension, native retry/queue, auth token reuse from native side.
   - Cons: base64 inflates payload ~33% (mitigate with chunking or transferable `ArrayBuffer`), couples component to RN host, no longer headless when this mode is enabled.

   The component API should expose this as a transport choice (e.g. `transport?: 'fetch' | 'bridge' | 'callback'` or simply via the `onSend` callback signature — see Part 2 §B.4). Both approaches require the same native-permission plumbing (§A.3 below).
3. **Permissions state machine — two-layered (applies to *both* transports).** Inside `react-native-webview`, mic access requires *both* native permission and webview permission to succeed, regardless of which transport (§A.2) is used for the send:
   - **Native layer** (host RN app): iOS needs `NSMicrophoneUsageDescription` in `Info.plist`; Android needs `<uses-permission android:name="android.permission.RECORD_AUDIO"/>` in `AndroidManifest.xml` and runtime grant via `PermissionsAndroid` (typically before opening the webview screen).
   - **WebView layer** (this is the gotcha — both platforms deny mic capture by default even when the OS has granted it):
     - **Android:** `react-native-webview`'s `onPermissionRequest` flow must grant `android.webkit.resource.AUDIO_CAPTURE`. Recent versions auto-grant if the prop is set; otherwise wire `WebChromeClient.onPermissionRequest` in native code. Without this, `getUserMedia` rejects with `NotAllowedError` even though the OS permission is granted.
     - **iOS WKWebView:** set `mediaCapturePermissionGrantType="grant"` on the `<WebView>` (iOS 15+). On iOS 14.5–14.x there's no React-side prop — needs a small native shim or a recent `react-native-webview` build that handles it.
   - **Web layer** (inside the bundle): only after both layers pass does `navigator.mediaDevices.getUserMedia` resolve. Enumerate UX for: native denied (open settings deep-link?), webview denied, prompt pending, permission revoked mid-recording.
   - For Approach B (bridge transport), the HLD should additionally specify the bridge contract: how the webview signals "I need mic permission" to the RN host, and how the host responds. For Approach A this is unnecessary — the webview asks via `getUserMedia` directly.
4. **Full state machine.** FR jumps between states. Define explicitly: `idle → requesting-permission → recording → paused → stopped (review) → sending → sent | error`, with allowed transitions.
5. **Max duration behavior.** "Max 30s (configurable)" — what happens at 0? Auto-stop and enter review? Auto-send? Hard cutoff vs soft warning at 5s remaining?
6. **Optimistic send rollback.** "Sheet closes (optimistic)" but no rollback story if upload fails. Define: retry, toast + restore, silently drop.

### B. Missing UX / behavior detail

7. **Trigger gesture.** Tap-to-start-tap-to-stop, hold-to-record (WhatsApp-style), or both? The current copy is ambiguous.
8. **Recording sound.** FR1 mentions "a certain sound" but doesn't specify start/stop/cancel sounds, volume, or how to disable them (accessibility / silent mode).
9. **Background / lifecycle.** Behavior when tab is hidden, page navigates, or device locks mid-recording.
10. **Review / playback step.** The sheet has a play/pause button, implying the user can review *before* sending — but FR doesn't describe a "stopped/review" state. Clarify whether playback happens during recording (impossible), after stop, or both.
11. **Waveform spec.** Live waveform vs post-recording static waveform? Source (`AnalyserNode` frequency bins vs time-domain), update rate, bar count, downsample strategy for the review state.

### C. Cross-cutting concerns

12. **Accessibility.** No mention of keyboard control, screen reader announcements ("Recording started, 30 seconds remaining"), `aria-live` for the timer, focus management when the sheet opens.
13. **Platform scope — pin it in the HLD.** The actual runtime is `react-native-webview` on iOS/Android (currently implicit). State this explicitly in NFR1 and call out the consequences:
    - **Minimum versions:** iOS 14.5+ for reliable `MediaRecorder` (14.3 added `getUserMedia` but recording was flaky); Android API floor follows the project's RN target (Chromium WebView is reliable everywhere RN supports).
    - **Codec floor:** iOS WKWebView's `MediaRecorder` only produces `audio/mp4` (AAC) — `audio/webm;codecs=opus` fails `isTypeSupported`. Android WebView supports both. So the fallback chain must try `audio/mp4` first (or at least include it) for a single codepath that works on both platforms.
    - **Permission plumbing:** see §A.3 — both platforms need the host app to grant the WebView mic capture explicitly.
14. **Telemetry events.** None specified. At minimum: recording started, cancelled, sent, send failed, permission denied.
15. **Privacy & lifecycle inside the webview.** Cleanup of the `MediaStream` tracks on unmount/cancel/send is critical — leaked tracks keep the iOS orange / Android red mic indicator on even after the user leaves the screen, which users perceive as a privacy bug. Also spec behavior when the RN host backgrounds the app, navigates away from the webview screen, or when the OS interrupts (incoming call). The webview won't naturally hear these — the RN host must forward them via `injectJavaScript` or `postMessage`.

### D. Structural

16. **No component-tree / responsibility diagram.** The file already commits to a compound-component shape (Trigger, Sheet, Panel, Timer, Waves, Delete, PlayPause, Send), but the HLD doesn't explain *why* that decomposition or what each owns.
17. **No sequence diagram** for the happy path (tap → permission → record → pause → resume → stop → review → send → close).

---

## Part 2 — Component API improvements (`src/components/feat/audio-recorder/index.tsx`)

Current shape: 9 compound components, all `PropsWithChildren`-only stubs returning `<div>`. NFR3 wants "headless" — the current API isn't headless yet, it's just empty.

### A. Missing the headless core

1. **No state engine / context provider.** Compound components imply a shared context, but none is declared. Need an internal `AudioRecorderContext` exposing `{ state, duration, elapsed, blob, error, start, pause, resume, stop, discard, send }`.
2. **No `useAudioRecorder()` hook.** A truly headless API exposes the state hook so consumers can build their own UI without touching the compound components. This is what makes Radix / Base UI feel headless rather than "empty."
3. **No `asChild` / Slot pattern.** Today every component returns `<div>`. For a headless library, `Trigger`, `Delete`, `Send`, `PlayPause` should accept `asChild` and merge props onto the consumer's element (so they can render a `<button>`, an icon button, etc., without wrapper divs).

### B. Root needs props

4. `AudioRecorder` should accept:
   - `maxDuration?: number` (seconds, default 30)
   - `mimeType?: string` — defaults to a platform-aware fallback chain (`audio/mp4` on iOS WKWebView, `audio/webm;codecs=opus` on Android WebView). The component never emits MP3 — that's a server-side concern, see §A.1.
   - `audioBitsPerSecond?: number` — defaults to `32_000` (32 kbps mono voice).
   - `sampleRate?: number` — defaults to `16_000` Hz (mono).
   - `sounds?: { start?: string; stop?: string; cancel?: string } | false`
   - `onStateChange?: (state: AudioRecorderState) => void`
   - `onSend?: (blob: Blob, meta: { duration: number; mimeType: string }) => void | Promise<void>` — the consumer decides the transport here. To keep the component genuinely headless, do *not* hardcode either `fetch` or `window.ReactNativeWebView.postMessage` inside `onSend`; instead ship two opt-in helper utilities the consumer can call from inside their `onSend`:
     - `uploadViaFetch(blob, meta, { url, headers })` — Approach A
     - `uploadViaRNBridge(blob, meta, { chunkSize?, eventName? })` — Approach B (no-op outside RN-WebView)
     This keeps the component reusable outside the RN shell while making both transports first-class.
   - `onCancel?: () => void`
   - `onError?: (error: AudioRecorderError) => void`
   - `onPermissionDenied?: (layer: 'native' | 'webview' | 'web') => void` — the discriminator matters because remediation differs (open Settings vs. ask the host to re-grant vs. show in-page UI).

### C. Naming / decomposition issues

5. **`PlayPause` is overloaded.** Today it's one component but it has to express 3 different actions across states: pause-recording, resume-recording, play-review, pause-review. Either:
   - split into `AudioRecorderRecordToggle` (recording state) and `AudioRecorderPlaybackToggle` (review state), or
   - expose a render-prop / context so a single component can render the right icon based on state.
6. **`Delete` should be `Discard` or `Cancel`.** "Delete" implies destruction of an existing artifact; pre-send it's really cancelling the in-flight recording. Naming will leak into ARIA labels.
7. **Missing components for completeness:**
   - `AudioRecorderPreview` / `AudioRecorderPlayback` (the review-state audio element)
   - `AudioRecorderState` (render-prop component: `<AudioRecorderState>{(s) => …}</AudioRecorderState>`) for conditional rendering without exposing the hook
   - `AudioRecorderError` (render-prop for the error state)

### D. Per-component refinements

8. **`AudioRecorderTrigger`** — must accept `onClick` and forward it; also needs `disabled` state when permission is denied or already recording. Should support `asChild`.
9. **`AudioRecorderTimer`** — needs `format?: 'countdown' | 'elapsed'` and either a `format?: (seconds: number) => string` prop or a render-prop `children: (s: { remaining; elapsed; total }) => ReactNode`. Today it can't even read the time.
10. **`AudioRecorderWaves`** — needs `barCount?`, `gap?`, `mode?: 'live' | 'static'`, and ideally exposes the raw `Float32Array` via render-prop so consumers can draw their own visualizer (canvas, SVG, three.js). Headless visualization is the hardest piece to design — don't lock the DOM shape.
11. **`AudioRecorderSend`** — must handle async `onSend`. Expose `pending` state via context so a consumer can show a spinner. Decide whether the optimistic close happens before or after `onSend` resolves.
12. **`AudioRecorderSheet`** — bottom-sheet behavior (open/close, animation, backdrop, swipe-to-dismiss) shouldn't live here. Either delegate to `@base-ui/react`'s `Dialog`/`Popover` (already a project dep) or extract a separate `BottomSheet` primitive. Don't reinvent it inline.

### E. Types & lifecycle

13. **No exported types.** Need `AudioRecorderState`, `AudioRecorderError` (with discriminated kinds: `permission-denied`, `no-device`, `unsupported-mime`, `max-duration-exceeded`, `send-failed`), `AudioBlobMeta`.
14. **No cleanup contract.** Document (and implement) that the `MediaStream` tracks are stopped on unmount, cancel, and after send — this is a common bug that leaves the mic indicator on.
15. **No imperative handle.** Consider a `ref` exposing `{ start, stop, pause, resume, discard }` for parent-driven control (e.g. global keyboard shortcut).

### F. Project conventions to align with

16. CLAUDE.md says React Compiler is on — don't manually `useMemo`/`useCallback` inside the recorder unless the compiler can't handle it (audio context, refs, and event handlers usually need explicit refs anyway).
17. CLAUDE.md says CSS Modules only and design tokens are `--bsb-*`. The audio-recorder folder will need its own `*.module.css` once it has DOM, and any colors should reuse existing tokens (or extend the token set explicitly, not introduce hardcoded values).
18. The `bsb` feature is currently one giant `index.tsx`; the audio-recorder is a chance to set the precedent of one-file-per-subcomponent (or at least split context, hook, components into separate files inside the feature folder).

---

## Recommended next steps (in priority order)

1. **State the runtime in the HLD** — make NFR1 say "runs inside `react-native-webview` on iOS 14.5+ / Android API Z+", and add the host-app responsibilities (native permissions in `Info.plist` / `AndroidManifest.xml`, WebView permission grant handler, lifecycle bridge events for backgrounding & OS interrupts).
2. **Document both transports** (Approach A: webview-direct `MediaRecorder` + `fetch`; Approach B: RN-bridge upload) with the tradeoff matrix from §A.2. Default to A; A→B is an upgrade path when background-upload reliability becomes a requirement.
3. **Pin the codec chain (already decided):** device captures `audio/mp4` (AAC, 32 kbps, 16 kHz mono) on iOS and `audio/webm;codecs=opus` (32 kbps, 16 kHz mono) on Android. Server transcodes both to canonical `.mp3` @ 32 kbps. Document this split (device format ≠ storage format) explicitly in the HLD so backend, client, and LLM-input contracts stay aligned.
4. **Draw the state machine** in the HLD, including the two-layered permission states — once it exists, the API surface (especially the `PlayPause` split and the missing `Preview` component) falls out naturally.
5. **Add the headless core** to the component file: `AudioRecorderContext`, `useAudioRecorder()`, `asChild` pattern, and the two `uploadVia*` helpers. The current empty stubs can stay as-is until the core exists.
6. **Defer the bottom-sheet** to `@base-ui/react` rather than building inline.
