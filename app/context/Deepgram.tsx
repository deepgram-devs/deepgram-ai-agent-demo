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

const DEFAULT_TTS_MODEL = '30';
const DEFAULT_STT_MODEL = 'nova-2-softbank';

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
  language: 'ja'
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
  /*
15 - Male
23 - Male
28 (Aya Ishiharaguchi) - Female
30 (Sakura Maria) - Female
31 (Naoko Yamaguchi) - Female
41 (Hoshun Murakami) - Male
82 - Female
95 - Male
106 - Female
109 - Female
122 - Male
195 - Female
222 (Devante Teerink) - Male
264 - Female
  */
 "30": {
    name: "Voice 30 - Female *",
    avatar: "/aura-stella-en.svg",
    language: "Japanese",
    accent: "JA",
  },
  "31": {
    name: "Voice 31 - Female *",
    avatar: "/aura-asteria-en.svg",
    language: "Japanese",
    accent: "JA",
  },
  "47": {
    name: "Voice 47 - Male *",
    avatar: "/aura-angus-en.svg",
    language: "Japanese",
    accent: "JA",
  },
 /*
  "28": {
    name: "Voice 28 - Female *",
    avatar: "/aura-asteria-en.svg",
    language: "Japanese",
    accent: "JA",
  },
  [DEFAULT_TTS_MODEL]: {
    name: "Voice 122 - Male",
    avatar: "/aura-orpheus-en.svg",
    language: "Japanese",
    accent: "JA",
  },
  "15": {
    name: "Voice 15 - Male",
    avatar: "/aura-orion-en.svg",
    language: "Japanese",
    accent: "JA",
  },
  "93_old": {
    name: "Voice 93 - Male",
    avatar: "/aura-zeus-en.svg",
    language: "Japanese",
    accent: "JA",
  },
  "23": {
    name: "Voice 23 - Male",
    avatar: "/aura-orion-en.svg",
    language: "Japanese",
    accent: "JA",
  },
  "254_old": {
    name: "Voice 254 - Female",
    avatar: "/aura-luna-en.svg",
    language: "Japanese",
    accent: "JA",
  },
  "82": {
    name: "Voice 82 - Female",
    avatar: "/aura-luna-en.svg",
    language: "Japanese",
    accent: "JA",
  },
  "100_old": {
    name: "Voice 100 - Female",
    avatar: "/aura-luna-en.svg",
    language: "Japanese",
    accent: "JA",
  },
  "31": {
    name: "Voice 31 - Female *",
    avatar: "/aura-athena-en.svg",
    language: "Japanese",
    accent: "JA",
  },
  */
  // "30": {
  //   name: "Voice 30 - Female *",
  //   avatar: "/aura-stella-en.svg",
  //   language: "Japanese",
  //   accent: "JA",
  // },
  // "106": {
  //   name: "Voice 106 - Female",
  //   avatar: "/aura-hera-en.svg",
  //   language: "Japanese",
  //   accent: "JA",
  // },
  // "95": {
  //   name: "Voice 95 - Male",
  //   avatar: "/aura-arcas-en.svg",
  //   language: "Japanese",
  //   accent: "JA",
  // },
  // "41": {
  //   name: "Voice 41 - Male *",
  //   avatar: "/aura-perseus-en.svg",
  //   language: "Japanese",
  //   accent: "JA",
  // },
  // "109": {
  //   name: "Voice 109 - Female",
  //   avatar: "/aura-luna-en.svg",
  //   language: "Japanese",
  //   accent: "JA",
  // },
  // "195": {
  //   name: "Voice 195 - Female",
  //   avatar: "/aura-luna-en.svg",
  //   language: "Japanese",
  //   accent: "JA",
  // },
  // "222": {
  //   name: "Voice 222 - Male *",
  //   avatar: "/aura-zeus-en.svg",
  //   language: "Japanese",
  //   accent: "JA",
  // },
  // "264": {
  //   name: "Voice 264 - Female",
  //   avatar: "/aura-luna-en.svg",
  //   language: "Japanese",
  //   accent: "JA",
  // },
  // // Old Models
  // "15_old": {
  //   name: "Old Voice 15 - Male",
  //   avatar: "/aura-zeus-en.svg",
  //   language: "Japanese",
  //   accent: "JA",
  // },
  // "23_old": {
  //   name: "Old Voice 23 - Male",
  //   avatar: "/aura-zeus-en.svg",
  //   language: "Japanese",
  //   accent: "JA",
  // },
  // "78_old": {
  //   name: "Old Voice 78 - Female",
  //   avatar: "/aura-luna-en.svg",
  //   language: "Japanese",
  //   accent: "JA",
  // },
  // "116_old": {
  //   name: "Old Voice 116 - Male",
  //   avatar: "/aura-zeus-en.svg",
  //   language: "Japanese",
  //   accent: "JA",
  // },
  // "104_old": {
  //   name: "Old Voice 104 - Female",
  //   avatar: "/aura-luna-en.svg",
  //   language: "Japanese",
  //   accent: "JA",
  // },
  // "192_old": {
  //   name: "Old Voice 192 - Female",
  //   avatar: "/aura-luna-en.svg",
  //   language: "Japanese",
  //   accent: "JA",
  // },
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
