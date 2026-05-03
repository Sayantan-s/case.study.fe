import {
  AudioRecorder,
  AudioRecorderDelete,
  AudioRecorderPanel,
  AudioRecorderPlayPause,
  AudioRecorderSend,
  AudioRecorderSheet,
  AudioRecorderTimer,
  AudioRecorderTrigger,
  AudioRecorderWaves,
} from "./audio-recorder";

export const MessageInput = () => {
  return (
    <div>
      <AudioRecorder>
        <AudioRecorderTrigger>Some Icon</AudioRecorderTrigger>
        <AudioRecorderSheet>
          <AudioRecorderPanel>
            <AudioRecorderTimer />
            <AudioRecorderWaves />
          </AudioRecorderPanel>
          <AudioRecorderPanel>
            <AudioRecorderDelete />
            <AudioRecorderPlayPause />
            <AudioRecorderSend />
          </AudioRecorderPanel>
        </AudioRecorderSheet>
      </AudioRecorder>
    </div>
  );
};
