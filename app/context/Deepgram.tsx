"use client";

import {
  CreateProjectKeyResponse,
  LiveClient,
  LiveSchema,
  LiveTranscriptionEvents,
  SpeakSchema,
  createClient,
} from "@deepgram/sdk";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useReducer,
  Dispatch,
  useState,
} from "react";
import { useToast } from "./Toast";


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

type DeepgramAction =
  | { type: 'SET_CONNECTING'; payload: boolean }
  | { type: 'SET_CONNECTION'; payload: LiveClient | null }
  | { type: 'RESET_CONNECTION' }
  | { type: 'SET_CONNECTION_READY'; payload: boolean }
  | { type: 'SET_TTS_OPTIONS'; payload: SpeakSchema | undefined }
  | { type: 'SET_STT_OPTIONS'; payload: LiveSchema | undefined }
  | { type: 'SET_LLM_LATENCY'; payload: { start: number; response: number } }
  | { type: 'SET_API_KEY'; payload: string | undefined}
  | { type: 'API_KEY_ERROR'; payload: Error }
  | { type: 'SET_LOADING_KEY'; payload: boolean };

// State Type
type DeepgramState = {
  apiKey?: string;
  apiKeyError?: Error;
  ttsOptions: SpeakSchema | undefined;
  sttOptions: LiveSchema | undefined;
  connection: LiveClient | null;
  connecting: boolean;
  connectionReady: boolean;
  llmLatency?: { start: number; response: number };
  isLoadingKey: boolean;
};

// type DeepgramContext = {
//   ttsOptions: SpeakSchema | undefined;
//   sttOptions: LiveSchema | undefined;
//   state: any;
//   dispatch: Dispatch<any>;
// };

// interface DeepgramContextInterface {
//   children: React.ReactNode;
// }

type DeepgramContext = {
  state: DeepgramState;
  dispatch: React.Dispatch<DeepgramAction>;
};

interface DeepgramContextInterface {
  children: React.ReactNode;
}

const initialState = {
  apiKey: undefined,             // Holds the API key string
  apiKeyError: undefined,        // Holds any error that occurs during API key retrieval
  isLoadingKey: true,
  ttsOptions: undefined,         // Text-to-Speech options
  sttOptions: undefined,         // Speech-to-Text options
  connection: null,              // Represents the LiveClient connection instance
  connecting: false,             // Indicates whether the connection process is ongoing
  connectionReady: false,        // Indicates whether the connection is established and ready
};

const DeepgramContext = createContext<DeepgramContext>({ state: initialState, dispatch: () => null });

const getApiKey = async (): Promise<string> => {
  console.log('getting a new api key');
  const result: CreateProjectKeyResponse = await (
    await fetch("/api/authenticate", { cache: "no-store" })
  ).json();
  return result.key;
};


// Define the state reducer
function reducer(state: DeepgramState, action: DeepgramAction): DeepgramState {
  switch (action.type) {
    case 'SET_CONNECTING':
      return { ...state, connecting: action.payload };
    case 'SET_CONNECTION':
      return { ...state, connection: action.payload, connecting: false, connectionReady: !!action.payload };
    case 'RESET_CONNECTION':
      return { ...state, connection: null, connectionReady: false, connecting: false, apiKey: undefined, isLoadingKey: true };
    case 'SET_CONNECTION_READY':
      return { ...state, connectionReady: action.payload };
    case 'SET_TTS_OPTIONS':
      return { ...state, ttsOptions: action.payload };
    case 'SET_STT_OPTIONS':
      return { ...state, sttOptions: action.payload };
    case 'SET_LLM_LATENCY':
      return { ...state, llmLatency: action.payload };
    case 'SET_API_KEY':
      return { ...state, apiKey: action.payload, apiKeyError: undefined };
    case 'API_KEY_ERROR':
      return { ...state, apiKeyError: action.payload };
    case 'SET_LOADING_KEY':
      return { ...state, isLoadingKey: action.payload };
    default:
      return state;
  }
}

const DeepgramContextProvider = ({ children }: DeepgramContextInterface) => {
  const { toast } = useToast();
  const [state, dispatch] = useReducer(reducer, initialState);
  const isMounted = useRef(true);


  useEffect(() => {
     if (!state.apiKey) {
      console.log("getting a new api key"); //zero
      fetch("/api/authenticate", { cache: "no-store" })
        .then((res) => res.json())
        .then((object) => {
          if (!("key" in object)) throw new Error("No api key returned");

          dispatch({ type: 'SET_API_KEY', payload: object.key });
          dispatch({ type: 'SET_LOADING_KEY', payload: false });
        })
        .catch((e) => {
          console.error(e);
        });
    }
  }, [state.apiKey]);

  useEffect(() => {
    if (state.apiKey) { // && "key" in apiKey
      console.log("connecting to deepgram"); //first
      const deepgram = createClient(state.apiKey);
      const connection = deepgram.listen.live({
        model: "nova-2",
        interim_results: true,
        smart_format: true,
        endpointing: 550,
        utterance_end_ms: 1500,
        filler_words: true,
      });

      connection.on(LiveTranscriptionEvents.Open, () => {
        dispatch({ type: 'SET_CONNECTION_READY', payload: true });
        // dispatch({ type: 'SET_CONNECTION', payload: connection });
        // dispatch({ type: 'SET_CONNECTING', payload: false });
        console.log('connected');
      });
  
      connection.on(LiveTranscriptionEvents.Close, () => {
        toast("The connection to Deepgram closed, we'll attempt to reconnect.");
        dispatch({ type: 'RESET_CONNECTION' });
        console.log('closed');
      });
  
      connection.on(LiveTranscriptionEvents.Error, () => {
        toast("An unknown error occurred. We'll attempt to reconnect to Deepgram.");
        dispatch({ type: 'RESET_CONNECTION' });
      });

      dispatch({ type: 'SET_CONNECTION', payload: connection });
      dispatch({ type: 'SET_CONNECTING', payload: false });
  
      if (connection) {
          
        return () => {
          console.log('cleanup connection');
          dispatch({ type: 'RESET_CONNECTION' });
          console.log(state.apiKey);
          console.log(state.isLoadingKey);
            // connection?.removeListener(LiveTranscriptionEvents.Open, handleOpen);
            // connection?.removeListener(LiveTranscriptionEvents.Close, handleClose);
            // connection?.removeListener(LiveTranscriptionEvents.Error, handleError);
        };
      }

    }
  }, [state.apiKey]);

  useEffect(() => {
    return () => {
      console.log('isMounted false');
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!state.ttsOptions) {
      console.log('set tts');
      dispatch({ type: 'SET_TTS_OPTIONS', payload: { model: "aura-asteria-en" } });
    }
    if (!state.sttOptions) {
      console.log('set stt');
      dispatch({ type: 'SET_STT_OPTIONS', payload: {
        model: "nova-2",
        interim_results: true,
        smart_format: true,
        endpointing: 550,
        utterance_end_ms: 1500,
        filler_words: true,
      }});
    }
    // if (!state.connection) {
    //   console.log('first pass, connect');
    //   connect();
    // }
  }, [state.connection, state.sttOptions, state.ttsOptions]);//[connect, state.connection, state.sttOptions, state.ttsOptions]);

  return (
    <DeepgramContext.Provider value={{ state, dispatch }}>
      {children}
    </DeepgramContext.Provider>
  );
};


function useDeepgram() {
  return useContext(DeepgramContext);
}

export { DeepgramContext, DeepgramContextProvider, useDeepgram, voiceMap, voices };



  // const connect = useCallback(async () => {
  //   if (!state.connection && !state.connecting) {
  //     dispatch({ type: 'SET_CONNECTING', payload: true });
  //     try {
  //       const response = await fetch("/api/authenticate", { cache: "no-store" });
  //       const object = await response.json();
  //       if (!object.key) throw new Error("No API key returned");
  //       dispatch({ type: 'SET_API_KEY', payload: object.key });

  //       // Now, create the connection using the API key
  //       if(object.key){
  //         const connection = new LiveClient(object.key, {}, {
  //           model: "nova-2",
  //           interim_results: true,
  //           smart_format: true,
  //           endpointing: 550,
  //           utterance_end_ms: 1500,
  //           filler_words: true,
  //         });
  //         if (isMounted.current) {
  //           console.log('isMounted true - setting connection');
  //           dispatch({ type: 'SET_CONNECTION', payload: connection });
  //         }
  //       }else {
  //         throw new Error("API key is undefined after setting.");
  //       }

        
  //     } catch (error) {
  //       console.error('Error in connection setup:', error);
  //       if (isMounted.current) {
  //         dispatch({ type: 'SET_CONNECTING', payload: false });
  //       }
  //     }
  //   }
  // }, [state.connection, state.connecting]);

  //  const connect = useCallback(async () => {
  //   if (!state.connection && !state.connecting) {
  //     dispatch({ type: 'SET_CONNECTING', payload: true });
  //     try {
  //       let apiKey = null;
  //       //const apiKey = await getApiKey();
  //       fetch("/api/authenticate", { cache: "no-store" })
  //         .then((res) => res.json())
  //         .then((object) => {
  //           console.log(object);
  //           apiKey = object.key;
  //           if (!("key" in object)) throw new Error("No api key returned");
  //           dispatch({ type: 'SET_API_KEY', payload: object.key });
  //         })
  //       //const connection = new LiveClient(apiKey, {}, {
  //       if (apiKey){
  //         console.log('LiveClient');
  //         const connection = new LiveClient(apiKey, {}, {
  //           model: "nova-2",
  //           interim_results: true,
  //           smart_format: true,
  //           endpointing: 550,
  //           utterance_end_ms: 1500,
  //           filler_words: true,
  //         });

  //         if (isMounted.current) {
  //           console.log('isMounted true set connection');
  //           dispatch({ type: 'SET_CONNECTION', payload: connection });
  //         }
  //       }else {
  //         throw new Error("API key is undefined after setting.");
  //       }
  //     } catch (error) {
  //       console.error('Error establishing connection:', error);
  //       if (isMounted.current) {
  //         console.log('isMounted true set connecting');
  //         dispatch({ type: 'SET_CONNECTING', payload: false });
  //       }
  //     }
  //   }
  // }, [state.connecting, state.connection]);

  // const connect = useCallback(async () => {
  //   if (!state.connection && !state.connecting) {
  //     dispatch({ type: 'SET_CONNECTING', payload: true });
  //     try {
  //       //const apiKey = await getApiKey();
  //       fetch("/api/authenticate", { cache: "no-store" })
  //         .then((res) => res.json())
  //         .then((object) => {
  //           console.log(object);
  //           if (!("key" in object)) throw new Error("No api key returned");
  //           dispatch({ type: 'SET_API_KEY', payload: object.key });
  //         })
  //       //const connection = new LiveClient(apiKey, {}, {
  //       if (state.apiKey){
  //         const connection = new LiveClient(state.apiKey, {}, {
  //           model: "nova-2",
  //           interim_results: true,
  //           smart_format: true,
  //           endpointing: 550,
  //           utterance_end_ms: 1500,
  //           filler_words: true,
  //         });

  //         if (isMounted.current) {
  //           console.log('isMounted true set connection');
  //           dispatch({ type: 'SET_CONNECTION', payload: connection });
  //         }
  //       }else {
  //         throw new Error("API key is undefined after setting.");
  //       }
  //     } catch (error) {
  //       console.error('Error establishing connection:', error);
  //       if (isMounted.current) {
  //         console.log('isMounted true set connecting');
  //         dispatch({ type: 'SET_CONNECTING', payload: false });
  //       }
  //     }
  //   }
  // }, [state.connecting, state.connection]);



  // useEffect(() => {
  //   const handleOpen = () => {
  //     dispatch({ type: 'SET_CONNECTION_READY', payload: true });
  //     console.log('connected');
  //   };

  //   const handleClose = () => {
  //     toast("The connection to Deepgram closed, we'll attempt to reconnect.");
  //     dispatch({ type: 'RESET_CONNECTION' });
  //     dispatch({ type: 'SET_API_KEY', payload: undefined })
  //     console.log('closed');
  //   };

  //   const handleError = (err: Error) => {
  //     toast("An unknown error occurred. We'll attempt to reconnect to Deepgram.");
  //     console.error(err);
  //     dispatch({ type: 'RESET_CONNECTION' });
  //   };

  //   if (state.connection) {
  //     state.connection.addListener(LiveTranscriptionEvents.Open, handleOpen);
  //     state.connection.addListener(LiveTranscriptionEvents.Close, handleClose);
  //     state.connection.addListener(LiveTranscriptionEvents.Error, handleError);

  //     return () => {
  //         state.connection?.removeListener(LiveTranscriptionEvents.Open, handleOpen);
  //         state.connection?.removeListener(LiveTranscriptionEvents.Close, handleClose);
  //         state.connection?.removeListener(LiveTranscriptionEvents.Error, handleError);
  //     };
  //   }
  // }, [state.connection, toast]);


  // return (
  //   <DeepgramContext.Provider
  //     value={{
  //       ttsOptions: state.ttsOptions,
  //       sttOptions: state.sttOptions,
  //       state,
  //       dispatch
  //     }}
  //   >
  //     {children}
  //   </DeepgramContext.Provider>
  // );


// const DeepgramContextProvider = ({ children }: DeepgramContextInterface) => {
//   const { toast } = useToast();
//   const [state, dispatch] = useReducer(reducer, initialState);
//   const isMounted = useRef(true);

//   const fetchApiKey = useCallback(async () => {
//     console.log('api ky');
//     dispatch({ type: 'SET_CONNECTING', payload: true });
//     try {
//       fetch("/api/authenticate", { cache: "no-store" })
//         .then((res) => res.json())
//         .then((object) => {
//           console.log(object);
//           if (!("key" in object)) throw new Error("No api key returned");
//           dispatch({ type: 'SET_API_KEY', payload: object.key });
//           //setApiKey(object);
//           //setLoadingKey(false);
//         })
//       // const response = await fetch("/api/authenticate", { cache: "no-store" });
//       // const data: CreateProjectKeyResponse = await response.json();
//       // if (data.key) {
//       //   dispatch({ type: 'SET_API_KEY', payload: data.key });
//       // } else {
//       //   throw new Error("API key not found");
//       // }
//     } catch (error) {
//       toast("Failed to retrieve API key.");
//       dispatch({ type: 'API_KEY_ERROR', payload: error });
//     } finally {
//       console.log('finally');
//       dispatch({ type: 'SET_CONNECTING', payload: false });
//     }
//   }, [toast]);

//   const connect = useCallback(async () => {
//     console.log('connect method');
//     if (!state.connection && !state.connecting && state.apiKey) {
//       dispatch({ type: 'SET_CONNECTING', payload: true });
//       try {
//         const connection = new LiveClient(state.apiKey, {
//           model: "nova-2",
//           interim_results: true,
//           smart_format: true,
//           endpointing: 550,
//           utterance_end_ms: 1500,
//           filler_words: true,
//         });
//         connection.on(LiveTranscriptionEvents.Open, () => {
//           if (isMounted.current) {
//             console.log('connected');
//             dispatch({ type: 'SET_CONNECTION', payload: connection });
//           }
//         });
//         connection.on(LiveTranscriptionEvents.Close, () => {
//           toast("Connection to Deepgram closed, we'll attempt to reconnect.");
//           if (isMounted.current) {
//             dispatch({ type: 'RESET_CONNECTION' });
//           }
//         });
//         connection.on(LiveTranscriptionEvents.Error, (error) => {
//           toast("An error occurred with the Deepgram connection.");
//           console.error(error);
//           if (isMounted.current) {
//             dispatch({ type: 'RESET_CONNECTION' });
//           }
//         });
//       } catch (error) {
//         console.error('Error establishing connection:', error);
//         if (isMounted.current) {
//           dispatch({ type: 'SET_CONNECTING', payload: false });
//         }
//       }
//     }
//   }, [state.apiKey, state.connection, state.connecting, toast]);

//   useEffect(() => {
//     // Check if ttsOptions needs to be initialized
//     if (state.ttsOptions === undefined) {
//       dispatch({
//         type: 'SET_TTS_OPTIONS',
//         payload: { model: "aura-asteria-en" }
//       });
//     }

//     // Check if sttOptions needs to be initialized
//     if (state.sttOptions === undefined) {
//       dispatch({
//         type: 'SET_STT_OPTIONS',
//         payload: {
//           model: "nova-2",
//           interim_results: true,
//           smart_format: true,
//           endpointing: 350,
//           utterance_end_ms: 1000,
//           filler_words: true
//         }
//       });
//     }
//   }, [state.ttsOptions, state.sttOptions, dispatch]);
  
//   useEffect(() => {
//     if (!state.apiKey && !state.apiKeyError) {
//       fetchApiKey();
//     }
//   }, [state.apiKey, state.apiKeyError, fetchApiKey]);

//   useEffect(() => {
//     if (state.apiKey && !state.connection) {
//       connect();
//     }
//   }, [state.apiKey, state.connection, connect]);

//   useEffect(() => {
//     return () => {
//       console.log('Component unmounting');
//       isMounted.current = false;
//     };
//   }, []);

//   return (
//     <DeepgramContext.Provider value={{ state, dispatch }}>
//       {children}
//     </DeepgramContext.Provider>
//   );
// };
