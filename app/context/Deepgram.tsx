"use client";

import {
  CreateProjectKeyResponse,
  LiveClient,
  LiveSchema,
  LiveTranscriptionEvents,
  SpeakSchema,
} from "@deepgram/sdk";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useReducer,
  Dispatch,
} from "react";
import { useToast } from "./Toast";

type DeepgramContext = {
  ttsOptions: SpeakSchema | undefined;
  sttOptions: LiveSchema | undefined;
  state: any;
  dispatch: Dispatch<any>;
};

interface DeepgramContextInterface {
  children: React.ReactNode;
}

const DeepgramContext = createContext<DeepgramContext>({} as DeepgramContext);

const voices: {
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

const voiceMap = (model: string) => {
  return voices[model];
};

const getApiKey = async (): Promise<string> => {
  console.log('getting a new api key');
  const result: CreateProjectKeyResponse = await (
    await fetch("/api/authenticate", { cache: "no-store" })
  ).json();
  return result.key;
};

type DeepgramAction =
  | { type: 'SET_CONNECTING'; payload: boolean }
  | { type: 'SET_CONNECTION'; payload: LiveClient | null }
  | { type: 'RESET_CONNECTION' }
  | { type: 'SET_CONNECTION_READY'; payload: boolean }
  | { type: 'SET_TTS_OPTIONS'; payload: SpeakSchema | undefined }
  | { type: 'SET_STT_OPTIONS'; payload: LiveSchema | undefined }
  | { type: 'SET_LLM_LATENCY'; payload: { start: number; response: number } };

  type DeepgramState = {
    ttsOptions: SpeakSchema | undefined;
    sttOptions: LiveSchema | undefined;
    connection: LiveClient | null;
    connecting: boolean;
    connectionReady: boolean;
    llmLatency?: { start: number; response: number };  // Optional property for latency data
  };

// Define the state reducer
function reducer(state: DeepgramState, action: DeepgramAction): DeepgramState {
  switch (action.type) {
    case 'SET_CONNECTING':
      return { ...state, connecting: action.payload };
    case 'SET_CONNECTION':
      return { ...state, connection: action.payload, connecting: false, connectionReady: !!action.payload };
    case 'RESET_CONNECTION':
      return { ...state, connection: null, connectionReady: false, connecting: false };
    case 'SET_CONNECTION_READY':
      return { ...state, connectionReady: action.payload };
    case 'SET_TTS_OPTIONS':
      return { ...state, ttsOptions: action.payload };
    case 'SET_STT_OPTIONS':
      return { ...state, sttOptions: action.payload };
    case 'SET_LLM_LATENCY': // Handle latency metrics if required by your application
      return { ...state, llmLatency: action.payload };
    default:
      return state;
  }
}

// Define the initial state
const initialState = {
  ttsOptions: undefined,
  sttOptions: undefined,
  connection: null,
  connecting: false,
  connectionReady: false,
};

const DeepgramContextProvider = ({ children }: DeepgramContextInterface) => {
  const { toast } = useToast();
  const [state, dispatch] = useReducer(reducer, initialState);
  const isMounted = useRef(true);

  const connect = useCallback(async () => {
    if (!state.connection && !state.connecting) {
      dispatch({ type: 'SET_CONNECTING', payload: true });
      try {
        const apiKey = await getApiKey();
        const connection = new LiveClient(apiKey, {}, {
          model: "nova-2",
          interim_results: true,
          smart_format: true,
          endpointing: 550,
          utterance_end_ms: 1500,
          filler_words: true,
        });
        if (isMounted.current) {
          dispatch({ type: 'SET_CONNECTION', payload: connection });
        }
      } catch (error) {
        console.error('Error establishing connection:', error);
        if (isMounted.current) {
          dispatch({ type: 'SET_CONNECTING', payload: false });
        }
      }
    }
  }, [state.connecting, state.connection]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!state.ttsOptions) {
      dispatch({ type: 'SET_TTS_OPTIONS', payload: { model: "aura-asteria-en" } });
    }
    if (!state.sttOptions) {
      dispatch({ type: 'SET_STT_OPTIONS', payload: {
        model: "nova-2",
        interim_results: true,
        smart_format: true,
        endpointing: 550,
        utterance_end_ms: 1500,
        filler_words: true,
      }});
    }
    if (!state.connection) {
      connect();
    }
  }, [connect, state.connection, state.sttOptions, state.ttsOptions]);

  useEffect(() => {
    const handleOpen = () => {
      dispatch({ type: 'SET_CONNECTION_READY', payload: true });
      console.log('connected');
    };

    const handleClose = () => {
      toast("The connection to Deepgram closed, we'll attempt to reconnect.");
      dispatch({ type: 'RESET_CONNECTION' });
      console.log('closed');
    };

    const handleError = (err) => {
      toast("An unknown error occurred. We'll attempt to reconnect to Deepgram.");
      console.error(err);
      dispatch({ type: 'RESET_CONNECTION' });
    };

    if (state.connection) {
      state.connection.addListener(LiveTranscriptionEvents.Open, handleOpen);
      state.connection.addListener(LiveTranscriptionEvents.Close, handleClose);
      state.connection.addListener(LiveTranscriptionEvents.Error, handleError);

      return () => {
        if (state.connection) {
          state.connection.removeListener(LiveTranscriptionEvents.Open, handleOpen);
          state.connection.removeListener(LiveTranscriptionEvents.Close, handleClose);
          state.connection.removeListener(LiveTranscriptionEvents.Error, handleError);
        }
      };
    }
  }, [state.connection, toast]);

  return (
    <DeepgramContext.Provider
      value={{
        ttsOptions: state.ttsOptions,
        sttOptions: state.sttOptions,
        state,
        dispatch
      }}
    >
      {children}
    </DeepgramContext.Provider>
  );
};

function useDeepgram() {
  return useContext(DeepgramContext);
}

export { DeepgramContextProvider, useDeepgram, voiceMap, voices };