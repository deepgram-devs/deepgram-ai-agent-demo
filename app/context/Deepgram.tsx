"use client";

import {
  CreateProjectKeyResponse,
  LiveClient,
  LiveSchema,
  LiveTranscriptionEvents,
  SpeakSchema,
} from "@deepgram/sdk";
import {
  Dispatch,
  SetStateAction,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useToast } from "./Toast";
import { useLocalStorage } from "../lib/hooks/useLocalStorage";

type DeepgramContext = {
  ttsOptions: SpeakSchema | undefined;
  setTtsOptions: (value: SpeakSchema) => void;
  sttOptions: LiveSchema | undefined;
  setSttOptions: (value: LiveSchema) => void;
  connection: LiveClient | undefined;
  connectionReady: boolean;
};

interface DeepgramContextInterface {
  children: React.ReactNode;
}

const DeepgramContext = createContext({} as DeepgramContext);

const DEFAULT_TTS_MODEL = 'aura-asteria-en';
const DEFAULT_STT_MODEL = 'nova-2';

const defaultTtsOptions = {
  model: DEFAULT_TTS_MODEL
}

const defaultSttsOptions = {
  model: DEFAULT_STT_MODEL,
  interim_results: true,
  smart_format: true,
  endpointing: 550,
  utterance_end_ms: 1500,
  filler_words: true,
}

/**
 * TTS Voice Options
 */
const voices: {
  [key: string]: {
    name: string;
    avatar: string;
    language: string;
    accent: string;
  };
} = {
  [DEFAULT_TTS_MODEL]: {
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
  const result: CreateProjectKeyResponse = await (
    await fetch("/api/authenticate", { cache: "no-store" })
  ).json();

  return result.key;
};

const DeepgramContextProvider = ({ children }: DeepgramContextInterface) => {
  const { toast } = useToast();
  const [ttsOptions, setTtsOptions] = useLocalStorage<SpeakSchema | undefined>('ttsModel');
  const [sttOptions, setSttOptions] = useLocalStorage<LiveSchema | undefined>('sttModel');
  const [connection, setConnection] = useState<LiveClient>();
  const [connecting, setConnecting] = useState<boolean>(false);
  const [connectionReady, setConnectionReady] = useState<boolean>(false);

  const connect = useCallback(
    async (defaultSttsOptions: SpeakSchema) => {
      if (!connection && !connecting) {
        setConnecting(true);

        const connection = new LiveClient(
          await getApiKey(),
          {},
          defaultSttsOptions
        );

        setConnection(connection);
        setConnecting(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [connecting, connection]
  );

  useEffect(() => {
    // it must be the first open of the page, let's set up the defaults

    // Why this is needed?, the requestTtsAudio of Conversation is wrapped in useCallback
    // which has a dependency of ttsOptions model
    // but the player inside the Nowplaying provider is set on mount, means
    // the when the startAudio is called the player is undefined.

    // This can be fixed in 3 ways:
    // 1. set player as a dependency inside the useCallback of requestTtsAudio
    // 2. change the code of react-nowplaying to use the ref mechanism
    // 3. follow the old code to avoid any risk i.e., first ttsOptions is undefined
    // and later when it gets set, it also update the requestTtsAudio callback.
    if (ttsOptions === undefined) {
      setTtsOptions(defaultTtsOptions);
    }

    if (!sttOptions === undefined) {
      setSttOptions(defaultSttsOptions);
    }
    if (connection === undefined) {
      connect(defaultSttsOptions);
    }
  }, [connect, connection, setSttOptions, setTtsOptions, sttOptions, ttsOptions]);

  useEffect(() => {
    if (connection && connection?.getReadyState() !== undefined) {
      connection.addListener(LiveTranscriptionEvents.Open, () => {
        setConnectionReady(true);
      });

      connection.addListener(LiveTranscriptionEvents.Close, () => {
        toast("The connection to Deepgram closed, we'll attempt to reconnect.");
        setConnectionReady(false);
        connection.removeAllListeners();
        setConnection(undefined);
      });

      connection.addListener(LiveTranscriptionEvents.Error, () => {
        toast(
          "An unknown error occured. We'll attempt to reconnect to Deepgram."
        );
        setConnectionReady(false);
        connection.removeAllListeners();
        setConnection(undefined);
      });
    }

    return () => {
      setConnectionReady(false);
      connection?.removeAllListeners();
    };
  }, [connection, toast]);

  return (
    <DeepgramContext.Provider
      value={{
        ttsOptions,
        setTtsOptions,
        sttOptions,
        setSttOptions,
        connection,
        connectionReady,
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
