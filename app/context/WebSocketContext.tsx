"use client";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { getApiKey } from "../lib/helpers";
import { useAuth } from "./Auth";

// Types and Interfaces
type Message = {
  content: string;
  role: string;
  audio?: ArrayBuffer;
  voice?: string;
  id: number | string;
};

type Speaker = "user" | "user-waiting" | "model" | null;

interface WebSocketContextValue {
  lastMessage: MessageEvent<any> | null;
  readyState: ReadyState;
  connection: boolean;
  voice: string;
  model: string;
  currentSpeaker: Speaker;
  microphoneOpen: boolean;
  chatMessages: Message[];
  sendMessage: (message: ArrayBuffer | string) => void;
  startStreaming: () => Promise<void>;
  stopStreaming: () => void;
  setVoice: (v: string) => void;
  setModel: (v: string) => void;
  replayAudio: (audioData: ArrayBuffer) => (() => void) | undefined;
}

type WebSocketProviderProps = { children: ReactNode };

// Constants
const DEEPGRAM_SOCKET_URL = process.env
  .NEXT_PUBLIC_DEEPGRAM_SOCKET_URL as string;
const PING_INTERVAL = 8000; // 8s

// Context Creation
const WebSocketContext = createContext<WebSocketContextValue | undefined>(
  undefined
);

// Utility functions
const concatArrayBuffers = (buffer1: ArrayBuffer, buffer2: ArrayBuffer) => {
  const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return tmp.buffer;
};

// WebSocket Provider Component
export const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const { token } = useAuth();
  // State
  const [connection, setConnection] = useState(false);
  const [voice, setVoice] = useState("aura-asteria-en");
  const [model, setModel] = useState("anthropic+claude-3-haiku-20240307");
  const [currentSpeaker, setCurrentSpeaker] = useState<Speaker>(null);
  const [microphoneOpen, setMicrophoneOpen] = useState(true);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [socketURL, setSocketUrl] = useState(
    `${DEEPGRAM_SOCKET_URL}?t=${Date.now()}`
  );
  const [startTime, setStartTime] = useState(0);
  const [apiKey, setApiKey] = useState<string | null>(null);

  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scheduledAudioSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const incomingMessage = useRef<Message | null>(null);

  // Config settings
  const [configSettings, setConfigSettings] = useState({
    type: "SettingsConfiguration",
    audio: {
      input: { encoding: "linear32", sample_rate: 48000 },
      output: { encoding: "linear16", sample_rate: 48000, container: "none" },
    },
    agent: {
      listen: { model: "nova-2" },
      think: {
        provider: {
          type: model.split("+")[0],
        },
        model: model.split("+")[1],
        instructions:
          "You are a helpful assistant who responds in 1-2 sentences at most each time.",
      },
      speak: { model: voice },
    },
  });

  // WebSocket setup
  const { sendMessage, lastMessage, readyState, getWebSocket } = useWebSocket(
    socketURL,
    {
      // protocols: ["token", DEEPGRAM_API_KEY],
      protocols: apiKey ? ["token", apiKey] : undefined,
      share: true,
      onOpen: () => {
        const socket = getWebSocket();
        if (socket instanceof WebSocket) {
          socket.binaryType = "arraybuffer";
        }
        setConnection(true);
        sendMessage(JSON.stringify(configSettings));
        startPingInterval();
      },
      onError: (error) => {
        console.error("WebSocket error:", error);
        stopPingInterval();
      },
      onClose: () => stopPingInterval(),
      onMessage: handleWebSocketMessage,
      retryOnError: true,
    }
  );

  // WebSocket message handler
  function handleWebSocketMessage(event: MessageEvent) {
    if (typeof event.data === "string") {
      const msgObj = JSON.parse(event.data);
      console.log(msgObj);
      switch (msgObj.type) {
        case "UserStartedSpeaking":
          setCurrentSpeaker("user");
          clearScheduledAudio();
          incomingMessage.current = null;
          break;
        case "AgentStartedSpeaking":
          setCurrentSpeaker("model");
          break;
        case "ConversationText":
          if (msgObj.content && msgObj.role === "user") {
            setChatMessages((prev) => [
              ...prev,
              { ...msgObj, id: Date.now().toString() },
            ]);
          } else if (msgObj.content) {
            let text = msgObj.content;
            if (incomingMessage.current) {
              incomingMessage.current = {
                ...incomingMessage.current,
                content: incomingMessage.current.content + text,
              };
              setChatMessages((prev) => {
                const updatedMessages = [...prev];
                const index = updatedMessages.findIndex(
                  (item) => item.id === incomingMessage.current?.id
                );
                console.log("index");
                console.log(index);
                if (index !== -1) {
                  updatedMessages[index] = {
                    ...incomingMessage.current,
                  } as Message;
                }
                return updatedMessages;
              });
            } else {
              incomingMessage.current = {
                ...msgObj,
                voice,
                id: Date.now().toString(),
              };
            }
          }
          break;
        case "AgentAudioDone":
          const ms = { ...incomingMessage.current };
          if (ms && Object.keys(ms).length) {
            setChatMessages((p) => [...p, ms as Message]);
          }
          setCurrentSpeaker("user-waiting");
          incomingMessage.current = null;
          break;
      }
    } else if (event.data instanceof ArrayBuffer) {
      if (incomingMessage.current) {
        incomingMessage.current.audio = incomingMessage.current.audio
          ? concatArrayBuffers(incomingMessage.current.audio, event.data)
          : event.data;
      }
      playAudio(event.data);
    }
  }

  const playAudio = useCallback(
    (audioData: ArrayBuffer) => {
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

      // Start audio playback
      const currentTime = audioContext.currentTime;
      if (startTime < currentTime) {
        setStartTime(currentTime);
      }
      source.start(startTime);

      // Update the start time for the next audio
      setStartTime((prevStartTime) => prevStartTime + audioBuffer.duration);
      scheduledAudioSourcesRef.current.push(source);
    },
    [startTime]
  );

  const replayAudio = useCallback((audioData: ArrayBuffer) => {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const audioDataView = new Int16Array(audioData);

    if (audioDataView.length === 0) {
      console.error("Received audio data is empty.");
      audioContext.close();
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

    source.onended = () => {
      source.disconnect();
      audioContext.close().catch((error) => {
        console.error("Error closing AudioContext:", error);
      });
    };

    source.start();

    // Return a function to stop playback if needed
    return () => {
      if (source.buffer) {
        source.stop();
        source.disconnect();
      }
      if (audioContext.state !== "closed") {
        audioContext.close().catch((error) => {
          console.error("Error closing AudioContext:", error);
        });
      }
    };
  }, []);

  const clearScheduledAudio = useCallback(() => {
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
  }, [startTime]);

  // Utility functions
  const startPingInterval = useCallback(() => {
    pingIntervalRef.current = setInterval(() => {
      sendMessage(JSON.stringify({ type: "KeepAlive" }));
    }, PING_INTERVAL);
  }, [sendMessage]);

  const stopPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  // Streaming functions
  const startStreaming = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("getUserMedia is not supported in this browser.");
      return;
    }

    setMicrophoneOpen(true);
    stopPingInterval();

    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 48000,
          channelCount: 1,
          echoCancellation: true,
          autoGainControl: true,
          noiseSuppression: false,
        },
      });

      streamRef.current = stream;

      const microphone = audioContext.createMediaStreamSource(stream);
      microphoneRef.current = microphone;

      const processor = audioContext.createScriptProcessor(2048, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        sendMessage(inputData.buffer);
      };

      microphone.connect(processor);
      processor.connect(audioContext.destination);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      setMicrophoneOpen(false);
    }
  }, [sendMessage, stopPingInterval]);

  const stopStreaming = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
    }
    startPingInterval();
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
    setMicrophoneOpen(false);
  }, [startPingInterval]);

  const updateVoice = useCallback(
    (newVoice: string) => {
      stopStreaming();
      setVoice(newVoice);
      setCurrentSpeaker(null);
    },
    [stopStreaming]
  );

  const updateModel = useCallback(
    (newModel: string) => {
      stopStreaming();
      setModel(newModel);
      setCurrentSpeaker(null);
    },
    [stopStreaming]
  );

  // Effects

  // Effect to fetch API key
  useEffect(() => {
    if (token) {
      const fetchApiKey = async () => {
        try {
          const key = await getApiKey(token as string);
          setApiKey(key);
        } catch (error) {
          console.error("Failed to fetch API key:", error);
        }
      };

      fetchApiKey();
    }
  }, [token]);

  // Effect to update socket URL when API key is available
  useEffect(() => {
    if (apiKey) {
      setSocketUrl(`${DEEPGRAM_SOCKET_URL}?t=${Date.now()}`);
    }
  }, [apiKey]);

  useEffect(() => {
    const [provider, modelName] = model.split("+");
    const newSettings = {
      ...configSettings,
      agent: {
        ...configSettings.agent,
        think: {
          ...configSettings.agent.think,
          provider: {
            type: provider,
          },
          model: modelName,
        },
        speak: { model: voice },
      },
    };

    if (JSON.stringify(newSettings) !== JSON.stringify(configSettings)) {
      setConfigSettings(newSettings);
      setSocketUrl(`${DEEPGRAM_SOCKET_URL}?t=${Date.now()}`);
    }
  }, [model, voice, configSettings]);

  useEffect(() => {
    return () => stopPingInterval();
  }, [stopPingInterval]);

  // Context value
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
      microphoneOpen,
      chatMessages,
      setModel: updateModel,
      setVoice: updateVoice,
      replayAudio,
    }),
    [
      sendMessage,
      lastMessage,
      readyState,
      startStreaming,
      stopStreaming,
      connection,
      voice,
      model,
      currentSpeaker,
      microphoneOpen,
      chatMessages,
      updateModel,
      updateVoice,
      replayAudio,
    ]
  );

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Custom hook
export const useWebSocketContext = (): WebSocketContextValue => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error(
      "useWebSocketContext must be used within a WebSocketProvider"
    );
  }
  return context;
};
