import { useLayoutEffect, useRef, useState, type FC } from "react";
import { AudioVisualizer } from "react-audio-visualize";

interface IProps {
  audioUrl: string;
}

export const AudioMessage: FC<IProps> = ({ audioUrl }) => {
  const [blob, setBlob] = useState<Blob | null>(null);

  const visualizerRef = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    async function convertUrlToBlob(url: string) {
      try {
        // 1. Fetch the audio file
        const response = await fetch(url);

        console.log(response);

        // 2. Check if the request was successful
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }

        // 3. Convert the response to a Blob
        const audioBlob = await response.blob();

        setBlob(audioBlob);

        console.log("Success! Here is your Blob:", audioBlob);
        return audioBlob;
      } catch (error) {
        console.error("Error converting audio to blob:", error);
      }
    }

    void convertUrlToBlob(audioUrl);
  }, [audioUrl]);

  console.log(blob);

  return blob && visualizerRef.current ? (
    <AudioVisualizer
      ref={visualizerRef}
      blob={blob}
      width={500}
      height={75}
      barWidth={1}
      gap={0}
      barColor={"#f76565"}
    />
  ) : (
    "div..."
  );
};
