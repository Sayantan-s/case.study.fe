# Audio-Recorder

### Functional Requirements

1. Record audio from the microphone. When tapped should make a certain sound (record sound).
2. When recording starts, a sheet comes from the bottom hiding the messageInput area.
3. The sheet contains.
   - Top Panel
     - Recording indicator (Timer) -> max 30s (configurable) goes from 30 -> 29 -> 28 ...
     - Audio waves
   - Bottom Panel
     - Delete Icon
     - play/pause button
     - Send Icon
4. When user is recording, user can pause and resume recording.
5. When user press send, the audio is sent to the backend and sheet closes. (optimistic),

### Non Functional Requirements

1. Should work on android / ios.
2. recorded audio size should be small enough (storage compatible + should be easily inputable to llms as well)
3. should be headless in terms of styling, can be easily styled, where ever used.
