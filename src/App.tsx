import { Fragment } from "react";
import "./App.css";
import { AudioRecorder } from "./components/feat/audio-recorder";
import { AudioMessage } from "./components/feat/audio-message";

function App() {
  return (
    <Fragment>
      <AudioRecorder />
      <AudioMessage audioUrl="/audio.mp3" />
    </Fragment>
  );
}

export default App;
