import { useCallback, useEffect, useRef, useState } from "react";

const AgentMessageAudio = ({
  message,
  className = "",
  ...rest
}: {
  message: { id: string; audio: ArrayBuffer };
  className?: string;
}) => {
  const [playing, setPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const replayAudio = useCallback((audioData: ArrayBuffer) => {
    // Stop any existing playback
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.log);
    }

    // Create a new AudioContext
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    audioContextRef.current = audioContext;

    const audioDataView = new Int16Array(audioData);

    if (audioDataView.length === 0) {
      console.error("Received audio data is empty.");
      audioContext.close().catch(console.log);
      return;
    }

    const audioBuffer = audioContext.createBuffer(
      1,
      audioDataView.length,
      48000
    );
    const audioBufferChannel = audioBuffer.getChannelData(0);

    for (let i = 0; i < audioDataView.length; i++) {
      audioBufferChannel[i] = audioDataView[i] / 32768; // Convert linear16 PCM to float [-1, 1]
    }

    const source = audioContext.createBufferSource();
    sourceNodeRef.current = source;
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);

    source.onended = () => {
      setPlaying(false);
      source.disconnect();
      audioContext.close().catch((error) => {
        console.error("Error closing AudioContext:", error);
      });
    };

    source.start();
    setPlaying(true);
  }, []);

  const play = useCallback(() => {
    if (message.audio) {
      replayAudio(message.audio);
    }
  }, [message.audio, replayAudio]);

  const pause = useCallback(() => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch((error) => {
        console.error("Error closing AudioContext:", error);
      });
    }
    setPlaying(false);
  }, []);

  useEffect(() => {
    return () => {
      // Clean up audio playback when component unmounts
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch((error) => {
          console.error("Error closing AudioContext:", error);
        });
      }
    };
  }, []);

  if (playing) {
    return (
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          pause();
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className={`w-6 h-6 fill-white hover:fill-[#149AFB] ${className}`}
          {...rest}
        >
          <path
            fillRule="evenodd"
            d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z"
            clipRule="evenodd"
          />
        </svg>
      </a>
    );
  }

  if (!playing) {
    return (
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          play();
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className={`w-6 h-6 fill-white hover:fill-[#149AFB] ${className}`}
          {...rest}
        >
          <path
            fillRule="evenodd"
            d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z"
            clipRule="evenodd"
          />
        </svg>
      </a>
    );
  }

  return null;
};

export { AgentMessageAudio };
