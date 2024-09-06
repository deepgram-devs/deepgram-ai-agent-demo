"use client";

import { useQueue } from "@uidotdev/usehooks";
import {
  Dispatch,
  SetStateAction,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useWebSocketContext } from "./WebScoket";

type MicrophoneContext = {
  microphone: MediaRecorder | undefined;
  setMicrophone: Dispatch<SetStateAction<MediaRecorder | undefined>>;
  startMicrophone: () => void;
  stopMicrophone: () => void;
  microphoneOpen: boolean;
  enqueueBlob: (element: Blob) => void;
  removeBlob: () => Blob | undefined;
  firstBlob: Blob | undefined;
  queueSize: number;
  queue: Blob[];
  stream: MediaStream | undefined;
};

interface MicrophoneContextInterface {
  children: React.ReactNode;
}

const MicrophoneContext = createContext({} as MicrophoneContext);

const MicrophoneContextProvider = ({
  children,
}: MicrophoneContextInterface) => {
  const [microphone, setMicrophone] = useState<MediaRecorder>();
  const [stream, setStream] = useState<MediaStream>();
  const [microphoneOpen, setMicrophoneOpen] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const {sendMessage} = useWebSocketContext();

  const {
    add: enqueueBlob, // addMicrophoneBlob,
    remove: removeBlob, // removeMicrophoneBlob,
    first: firstBlob, // firstMicrophoneBlob,
    size: queueSize, // countBlobs,
    queue, // : microphoneBlobs,
  } = useQueue<Blob>([]);

  useEffect(() => {
    async function setupMicrophone() {
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: true,
          echoCancellation: true,
        },
      });

      setStream(stream);
      const microphone = audioContextRef.current?.createMediaStreamSource(stream);
        const processor = audioContextRef.current?.createScriptProcessor(4096, 1, 1);

        processor.onaudioprocess = (event) => {
          const inputData = event.inputBuffer.getChannelData(0);
          const rms = Math.sqrt(
            inputData.reduce((sum, value) => sum + value * value, 0) / inputData.length
          );

          // send message to socket
          // sendMessage(inputData.buffer);
          console.log("Message sent! askdfjdk");
          // Update blob size based on audio level
          // updateBlobSize(rms * 5); // Adjust the scaling factor as needed
        };

        microphone.connect(processor);
        processor.connect(audioContextRef.current?.destination);
      // const microphone = new MediaRecorder(stream);

      // setMicrophone(microphone);
    }

    if (!microphone) {
      setupMicrophone();
    }
  }, [enqueueBlob, microphone, microphoneOpen]);

  useEffect(() => {
    if (!microphone) return;

    microphone.ondataavailable = (e) => {
      if (microphoneOpen) enqueueBlob(e.data);
    };

    return () => {
      microphone.ondataavailable = null;
    };
  }, [enqueueBlob, microphone, microphoneOpen]);

  const stopMicrophone = useCallback(() => {
    if (microphone?.state === "recording") microphone?.pause();

    setMicrophoneOpen(false);
  }, [microphone]);

  const startMicrophone = useCallback(() => {
    if (microphone?.state === "paused") {
      microphone?.resume();
    } else {
      microphone?.start(250);
    }

    setMicrophoneOpen(true);
  }, [microphone]);

  useEffect(() => {
    const eventer = () =>
      document.visibilityState !== "visible" && stopMicrophone();

    window.addEventListener("visibilitychange", eventer);

    return () => {
      window.removeEventListener("visibilitychange", eventer);
    };
  }, [stopMicrophone]);

  return (
    <MicrophoneContext.Provider
      value={{
        microphone,
        setMicrophone,
        startMicrophone,
        stopMicrophone,
        microphoneOpen,
        enqueueBlob,
        removeBlob,
        firstBlob,
        queueSize,
        queue,
        stream,
      }}
    >
      {children}
    </MicrophoneContext.Provider>
  );
};

function useMicrophone() {
  return useContext(MicrophoneContext);
}

export { MicrophoneContextProvider, useMicrophone };
