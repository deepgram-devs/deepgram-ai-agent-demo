"use client";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";

// Define the shape of the WebSocket context
interface WebSocketContextValue {
  sendMessage: (message: ArrayBuffer) => void;
  lastMessage: MessageEvent<any> | null;
  readyState: ReadyState;
  startStreaming: () => void;
  stopStreaming: () => void;
  connection: boolean;
  setVoice: (v: string) => void;
  setModel: (v: string) => void;
  voice: string;
  model: string;
  currentSpeaker: "user" | "user-waiting" | "model" | null;
}

type WebSocketProviderProps = { children: ReactNode };

// Create the WebSocket context with default values
const WebSocketContext = createContext<WebSocketContextValue | undefined>(
  undefined
);

// Extract the environfile
const DEEPGRAM_SOCKET_URL = process.env
  .NEXT_PUBLIC_DEEPGRAM_SOCKET_URL as string;
const DEEPGRAM_API_KEY = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY as string;

/**
 * Voice Options
 */
export const voices: {
  [key: string]: {
    name: string;
    avatar: string;
    language: string;
    accent: string;
  };
} = {
  "aura-asteria-en": {
    name: "Asteria",
    avatar: "/aura-asteria-en.svg",
    language: "English",
    accent: "US",
  },
  "aura-luna-en": {
    name: "Luna",
    avatar: "/aura-luna-en.svg",
    language: "English",
    accent: "US",
  },
  "aura-stella-en": {
    name: "Stella",
    avatar: "/aura-stella-en.svg",
    language: "English",
    accent: "US",
  },
  "aura-athena-en": {
    name: "Athena",
    avatar: "/aura-athena-en.svg",
    language: "English",
    accent: "UK",
  },
  "aura-hera-en": {
    name: "Hera",
    avatar: "/aura-hera-en.svg",
    language: "English",
    accent: "US",
  },
  "aura-orion-en": {
    name: "Orion",
    avatar: "/aura-orion-en.svg",
    language: "English",
    accent: "US",
  },
  "aura-arcas-en": {
    name: "Arcas",
    avatar: "/aura-arcas-en.svg",
    language: "English",
    accent: "US",
  },
  "aura-perseus-en": {
    name: "Perseus",
    avatar: "/aura-perseus-en.svg",
    language: "English",
    accent: "US",
  },
  "aura-angus-en": {
    name: "Angus",
    avatar: "/aura-angus-en.svg",
    language: "English",
    accent: "Ireland",
  },
  "aura-orpheus-en": {
    name: "Orpheus",
    avatar: "/aura-orpheus-en.svg",
    language: "English",
    accent: "US",
  },
  "aura-helios-en": {
    name: "Helios",
    avatar: "/aura-helios-en.svg",
    language: "English",
    accent: "UK",
  },
  "aura-zeus-en": {
    name: "Zeus",
    avatar: "/aura-zeus-en.svg",
    language: "English",
    accent: "US",
  },
};

// models

export const models = [
  {
    name: "Anthropic: Claude 3 Haiku",
    value: "anthropic+claude-3-haiku-20240307",
  },
  {
    name: "Deepgram: Llama 3 8b",
    value: "deepgram+llama-3-8b-instruct",
  },
  {
    name: "Groq: Llama 3 8b",
    value: "groq+llama3-8b-8192",
  },
  {
    name: "Groq: Llama 3 70b",
    value: "groq+llama3-70b-8192",
  },
  {
    name: "Groq: Mixtral 8x7b",
    value: "groq+mixtral-8x7b-32768",
  },
  {
    name: "OpenAI: GPT 4o",
    value: "open_ai+gpt-4o",
  },
];

// Define a provider component
export const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const [connection, setConnection] = useState(false);
  const [voice, setVoice] = useState("aura-asteria-en");
  const [model, setModel] = useState("anthropic+claude-3-haiku-20240307");
  const [startTime, setStartTime] = useState(0);
  const scheduledAudioSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [currentSpeaker, setCurrentSpeaker] = useState<
    "user" | "user-waiting" | "model" | null
  >(null);
  const scheduledAudioCountRef = useRef<number>(0);
  const completedAudioCountRef = useRef<number>(0);

  const [socketURL, setSocketUrl] = useState(
    `${DEEPGRAM_SOCKET_URL}?t=${Date.now()}`
  );
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const PING_INTERVAL = 10000; // 10s
  const [config_settings, setConfigSettings] = useState({
    type: "SettingsConfiguration",
    audio: {
      input: {
        encoding: "linear32",
        sample_rate: 48000,
      },
      output: {
        encoding: "linear16",
        sample_rate: 48000,
        container: "none",
      },
    },
    agent: {
      listen: {
        model: "nova-2",
      },
      think: {
        provider: model.split("+")[0],
        model: model.split("+")[1],
        instructions:
          "You are a helpful assistant who responds in 1-2 sentences at most each time.",
      },
      speak: {
        model: voice,
      },
    },
  });

  const { sendMessage, lastMessage, readyState, getWebSocket } = useWebSocket(
    socketURL,
    {
      protocols: ["token", DEEPGRAM_API_KEY],
      share: true,
      onOpen: () => {
        const socket = getWebSocket();
        if (socket instanceof WebSocket) {
          socket.binaryType = "arraybuffer";
          console.log("Binary type set to:", socket.binaryType);
        }
        setConnection(true);
        console.log("WebSocket connection established.");
        sendMessage(JSON.stringify(config_settings));

        startPingInterval();
      },
      onError: (error) => {
        console.error("WebSocket error:", error);
        stopPingInterval();
      },
      onClose: () => {
        stopPingInterval();
      },
      onMessage: (event) => {
        if (typeof event.data === "string") {
          console.log("Text message received:", event.data);
          const msgObj = JSON.parse(event.data);
          if (msgObj.type === "UserStartedSpeaking") {
            setCurrentSpeaker("user");
            clearScheduledAudio();
          } else if (msgObj.type === "AgentStartedSpeaking") {
            setCurrentSpeaker("model");
          } else if (msgObj.type === "AgentFinishedSpeaking") {
            setCurrentSpeaker("user-waiting");
          }
        } else if (event.data instanceof ArrayBuffer) {
          playAudio(event.data);
        }
      },
      retryOnError: true,
    }
  );

  const playAudio = (audioData: ArrayBuffer) => {
    if (!audioContextRef.current) return;

    const audioContext = audioContextRef.current;
    const audioDataView = new Int16Array(audioData);

    if (audioDataView.length === 0) {
      console.error("Received audio data is empty.");
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
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);

    scheduledAudioCountRef.current++;

    // Start audio playback
    if (startTime < audioContext.currentTime) {
      setStartTime(audioContext.currentTime);
    }
    source.start(startTime);

    // Update the start time for the next audio
    setStartTime((prevStartTime) => prevStartTime + audioBuffer.duration);
    scheduledAudioSourcesRef.current.push(source);

    // Use a promise to track playback completion
    const playPromise = new Promise<void>((resolve) => {
      source.onended = () => {
        completedAudioCountRef.current++;
        resolve(); // Resolve the promise when the audio finishes playing
        checkAllAudioCompleted(); // Check if all audio has finished
      };
    });

    return playPromise;
  };

  const checkAllAudioCompleted = () => {
    if (completedAudioCountRef.current === scheduledAudioCountRef.current) {
      console.log("All scheduled audio sources have finished playing.");
      // You can trigger any necessary actions here, such as updating UI or state
      setCurrentSpeaker("user-waiting");
    }
  };

  const clearScheduledAudio = () => {
    scheduledAudioSourcesRef.current.forEach((source) => {
      source.stop();
      source.onended = null;
    });
    scheduledAudioSourcesRef.current = [];

    const scheduledAudioMs = Math.round(
      1000 * (startTime - (audioContextRef.current?.currentTime || 0))
    );
    if (scheduledAudioMs > 0) {
      console.log(`Cleared ${scheduledAudioMs}ms of scheduled audio`);
    } else {
      console.log("No scheduled audio to clear.");
    }

    setStartTime(0);
  };

  const startStreaming = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("getUserMedia is not supported in this browser.");
      return;
    }
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
    try {
      const constraints = {
        audio: {
          sampleRate: 48000,
          channelCount: 1,
          echoCancellation: true,
          autoGainControl: true,
          voiceIsolation: true,
          noiseSuppression: false,
          latency: 0,
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      const microphone = audioContext.createMediaStreamSource(stream);
      microphoneRef.current = microphone;
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        sendMessage(inputData.buffer);
      };

      microphone.connect(processor);
      processor.connect(audioContext.destination);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopStreaming = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
    }
    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current
        .close()
        .catch((err) => console.error("Error closing audio context:", err));
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setConnection(false);
    setCurrentSpeaker(null);
  };

  const startPingInterval = () => {
    pingIntervalRef.current = setInterval(() => {
      sendMessage(JSON.stringify({ type: "KeepAlive" }));
    }, PING_INTERVAL);
  };

  const stopPingInterval = () => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  };

  const updateVoice = (newVoice: string) => {
    stopStreaming();
    setVoice(newVoice);
    setCurrentSpeaker(null);
  };

  const updateModel = (newModel: string) => {
    stopStreaming();
    setModel(newModel);
    setCurrentSpeaker(null);
  };

  const value = useMemo(
    () => ({
      sendMessage,
      lastMessage,
      readyState,
      startStreaming,
      stopStreaming,
      connection,
      voice,
      model,
      currentSpeaker,
      setModel: updateModel,
      setVoice: updateVoice,
    }),
    [sendMessage, lastMessage, readyState, connection, currentSpeaker]
  );

  useEffect(() => {
    const provider = model.split("+")[0];
    const modelName = model.split("+")[1];

    const newSettings = {
      ...config_settings,
      agent: {
        ...config_settings.agent,
        think: {
          ...config_settings.agent.think,
          provider: provider,
          model: modelName,
        },
        speak: {
          model: voice,
        },
      },
    };

    // Only update if the settings have changed
    if (JSON.stringify(newSettings) !== JSON.stringify(config_settings)) {
      setConfigSettings(newSettings);
      setSocketUrl(`${DEEPGRAM_SOCKET_URL}?t=${Date.now()}`);
    }
  }, [model, voice, config_settings]);

  useEffect(() => {
    return () => {
      stopPingInterval();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Custom hook to use the WebSocket context
export const useWebSocketContext = (): WebSocketContextValue => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error(
      "useWebSocketContext must be used within a WebSocketProvider"
    );
  }
  return context;
};
