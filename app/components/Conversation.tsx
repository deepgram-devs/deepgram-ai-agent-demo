"use client";

import {
  LiveClient,
  LiveConnectionState,
  LiveTranscriptionEvent,
  LiveTranscriptionEvents,
} from "@deepgram/sdk";
import { Message, useChat } from "ai/react";
import { NextUIProvider } from "@nextui-org/react";
import { useMicVAD } from "@ricky0123/vad-react";
import { useNowPlaying } from "react-nowplaying";
import { useQueue } from "@uidotdev/usehooks";
import { useState, useEffect, useCallback, useRef, useMemo, useContext } from "react";

import { ChatBubble } from "./ChatBubble";
import {
  contextualGreeting,
  generateRandomString,
  utteranceText,
} from "../lib/helpers";
import { Controls } from "./Controls";
import { InitialLoad } from "./InitialLoad";
import { MessageMetadata } from "../lib/types";
import { RightBubble } from "./RightBubble";
import { systemContent } from "../lib/constants";
import { useDeepgram } from "../context/Deepgram";
import { useMessageData } from "../context/MessageMetadata";
import { useMicrophone } from "../context/Microphone";
import { useAudioStore } from "../context/AudioStore";

import { articleConversationContent } from "../prompts/articleConversation";
import { voyager1ConversationContent } from "../prompts/voyager1Conversation";
import { newsArticleConversationContent } from "../prompts/newsArticlesConversation";

/**
 * Conversation element that contains the conversational AI app.
 * @returns {JSX.Element}
 */
export default function Conversation(): JSX.Element {
  const { state, dispatch } = useDeepgram();
  const { addAudio } = useAudioStore();
  const { player, stop: stopAudio, play: startAudio } = useNowPlaying();
  const { addMessageData } = useMessageData();
  const {
    microphoneOpen,
    queue: microphoneQueue,
    queueSize: microphoneQueueSize,
    firstBlob,
    removeBlob,
    stream,
    startMicrophone,
    stopMicrophone,
  } = useMicrophone();

  /**
   * Queues
   */
  const {
    add: addTranscriptPart,
    queue: transcriptParts,
    clear: clearTranscriptParts,
  } = useQueue<{ is_final: boolean; speech_final: boolean; text: string }>([]);

  /**
   * Refs
   */
  const messageMarker = useRef<null | HTMLDivElement>(null);

  /**
   * State
   */
  const [initialLoad, setInitialLoad] = useState(true);
  const [isProcessing, setProcessing] = useState(false);

  /**
   * Request audio from API
   */
  const requestTtsAudio = useCallback(
    async (message: Message) => {
      const start = Date.now();
      const model = state.ttsOptions?.model ?? "aura-asteria-en";

      //Deepgram TTS
      const res = await fetch(`/api/speak?model=${model}`, {
        cache: "no-store",
        method: "POST",
        body: JSON.stringify(message),
      });
    
      // //ElevenLabs TTS
      // const res = await fetch('/api/natural-speak', {
      //   cache: "no-store",
      //   method: "POST",
      //   body: JSON.stringify(message),
      // });

      const headers = res.headers;
      const blob = await res.blob();

      stopMicrophone();
      
      //Delay before capturing audio. Does this work?
      const waiting = setTimeout(() => {
        clearTimeout(waiting);
        setProcessing(false);
      }, 200);

      startAudio(blob, "audio/mp3", message.id).then(() => {
        addAudio({
          id: message.id,
          blob,
          latency: Number(headers.get("X-DG-Latency")) ?? Date.now() - start,
          networkLatency: Date.now() - start,
          model,
        });

        if (player) {
          player.onended = () => {
            const waiting = setTimeout(() => {
              clearTimeout(waiting);
              setProcessing(false);
            }, 500);
            //Microphone is turned off when LLM is generating a response. After playing the TTS, turn the mic back on again.
            startMicrophone();
          };
        } else {
          console.error('Player is undefined');
        }
      });
    },
    [state.ttsOptions?.model, addAudio, startAudio, stopMicrophone, startMicrophone, player]
  );

  const onFinish = useCallback(
    (msg: any) => {
      requestTtsAudio(msg);
    },
    [requestTtsAudio]
  );

  const onResponse = useCallback((res: Response) => {
    (async () => {
      const start = Number(res.headers.get("x-llm-start"));
      const response = Number(res.headers.get("x-llm-response"));
      dispatch({ type: 'SET_LLM_LATENCY', payload: { start, response } });
    })();
  }, [dispatch]);

  const systemMessage: Message = useMemo(
    () => ({
      id: generateRandomString(7),
      role: "system",
      content: systemContent,
    }),
    []
  );

  const greetingMessage: Message = useMemo(
    () => ({
      id: generateRandomString(7),
      role: "assistant",
      content: contextualGreeting(),
    }),
    []
  );

  const promptMessage: Message = useMemo(
    () => ({
      id: 'AAAA',//LmSwiUg
      role: "user",
      content: newsArticleConversationContent,
    }),
    []
  );

  /**
   * AI SDK
   */
  const {
    messages: chatMessages,
    append,
    handleInputChange,
    input,
    handleSubmit,
    isLoading: llmLoading,
  } = useChat({
    id: "aura",
    //api: "/api/brain", //OpenAI
    api: "/api/groq",//Groq
    initialMessages: [systemMessage, promptMessage, greetingMessage],
    onFinish,
    onResponse,
  });

  const [currentUtterance, setCurrentUtterance] = useState<string>();
  const [failsafeTimeout, setFailsafeTimeout] = useState<NodeJS.Timeout>();
  const [failsafeTriggered, setFailsafeTriggered] = useState<boolean>(false);

  const onSpeechEnd = useCallback(() => {
    /**
     * We have the audio data context available in VAD
     * even before we start sending it to deepgram.
     * So ignore any VAD events before we "open" the mic.
     */
    if (!microphoneOpen) return;

    setFailsafeTimeout(
      setTimeout(() => {
        if (currentUtterance) {
          console.log("failsafe fires! pew pew!!");
          setFailsafeTriggered(true);
          append({
            role: "user",
            content: currentUtterance,
          });
          clearTranscriptParts();
          setCurrentUtterance(undefined);
        }
      }, 1500)
    );

    return () => {
      clearTimeout(failsafeTimeout);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [microphoneOpen, currentUtterance]);

  const onSpeechStart = () => {
    /**
     * We have the audio data context available in VAD
     * even before we start sending it to deepgram.
     * So ignore any VAD events before we "open" the mic.
     */
    if (!microphoneOpen) return;

    /**
     * We we're talking again, we want to wait for a transcript.
     */
    setFailsafeTriggered(false);

    if (!player?.ended) {
      stopAudio();
      console.log("barging in! SHH!");
    }
  };

  useMicVAD({
    startOnLoad: true,
    stream,
    onSpeechStart,
    onSpeechEnd,
    positiveSpeechThreshold: 0.6,
    negativeSpeechThreshold: 0.6 - 0.15,
  });

  useEffect(() => {
    if (llmLoading) {
      //don't listen for voice input while LLM response is generating and displaying
      stopMicrophone();
      return;
    };
    if (!state.llmLatency) return;

    const latestLlmMessage: MessageMetadata = {
      ...chatMessages[chatMessages.length - 1],
      ...state.llmLatency,
      end: Date.now(),
      ttsModel: state.ttsOptions?.model,
    };

    addMessageData(latestLlmMessage);
  }, [
    chatMessages,
    state.llmLatency,  // Update dependency to use state from context
    llmLoading,
    addMessageData,
    state.ttsOptions?.model,  // Update dependency to use state from context
  ]);

  /**
   * Contextual functions
   */
  const requestWelcomeAudio = useCallback(async () => {
    requestTtsAudio(greetingMessage);
  }, [greetingMessage, requestTtsAudio]);

  const startConversation = useCallback(() => {
    if (!initialLoad) return;
    setInitialLoad(false);

    // add a stub message data with no latency
    const promptMetadata: MessageMetadata = {
      ...promptMessage,
      ttsModel: state.ttsOptions?.model,
    };

    // add a stub message data with no latency
    const welcomeMetadata: MessageMetadata = {
      ...greetingMessage,
      ttsModel: state.ttsOptions?.model,
    };
    addMessageData(promptMetadata);
    addMessageData(welcomeMetadata);

    // get welcome audio
    requestWelcomeAudio();
  }, [
    addMessageData,
    greetingMessage,
    promptMessage,
    initialLoad,
    requestWelcomeAudio,
    state.ttsOptions?.model,
  ]);

  const onTranscript = useCallback((data: LiveTranscriptionEvent) => {
    let content = utteranceText(data);

    if (content !== "" || data.speech_final) {
      addTranscriptPart({
        is_final: data.is_final as boolean,
        speech_final: data.speech_final as boolean,
        text: content,
      });
    }
  }, [addTranscriptPart]);

  useEffect(() => {
    const onOpen = () => {
      state.connection?.addListener(LiveTranscriptionEvents.Transcript, onTranscript);
    };

    if (state.connection) {// && state.connectionReady
      state.connection.addListener(LiveTranscriptionEvents.Open, onOpen);
      return () => {
        state.connection?.removeListener(LiveTranscriptionEvents.Open, onOpen);
        state.connection?.removeListener(LiveTranscriptionEvents.Transcript, onTranscript);
      };
    }
  }, [state.connection, onTranscript]);

  const getCurrentUtterance = useCallback(() => {
    return transcriptParts.filter(({ is_final, speech_final }, i, arr) => {
      return is_final || speech_final || (!is_final && i === arr.length - 1);
    });
  }, [transcriptParts]);

  const [lastUtterance, setLastUtterance] = useState<number>();

  useEffect(() => {
    const parts = getCurrentUtterance();
    const last = parts[parts.length - 1];
    const content = parts
      .map(({ text }) => text)
      .join(" ")
      .trim();

    /**
     * if the entire utterance is empty, don't go any further
     * for example, many many many empty transcription responses
     */
    if (!content) return;

    /**
     * failsafe was triggered since we last sent a message to TTS
     */
    if (failsafeTriggered) {
      clearTranscriptParts();
      setCurrentUtterance(undefined);
      return;
    }

    /**
     * display the concatenated utterances
     */
    setCurrentUtterance(content);

    /**
     * record the last time we recieved a word
     */
    if (last.text !== "") {
      setLastUtterance(Date.now());
    }

    /**
     * if the last part of the utterance, empty or not, is speech_final, send to the LLM.
     */
    if (last && last.speech_final) {
      clearTimeout(failsafeTimeout);
      append({
        role: "user",
        content,
      });
      clearTranscriptParts();
      setCurrentUtterance(undefined);
    }
  }, [
    getCurrentUtterance,
    clearTranscriptParts,
    append,
    failsafeTimeout,
    failsafeTriggered,
  ]);

  /**
   * magic microphone audio queue processing
   */
  useEffect(() => {
    const processQueue = async () => {
      if (microphoneQueueSize > 0 && !isProcessing) {
        setProcessing(true);

        if (state.connectionReady) {  // Use connectionReady from state
          const nextBlob = firstBlob;

          if (nextBlob && nextBlob?.size > 0) {
            state.connection?.send(nextBlob);  // Use connection from state
          }

          removeBlob();
        }

        const waiting = setTimeout(() => {
          clearTimeout(waiting);
          setProcessing(false);
        }, 200);
      }
    };

    processQueue();
  }, [
    state.connection,  // Use connection from state
    state.connectionReady,  // Use connectionReady from state
    firstBlob,
    microphoneQueueSize,
    isProcessing,
    removeBlob,
  ]);

  /**
   * keep deepgram connection alive when mic closed
   */
  useEffect(() => {
    let keepAlive: NodeJS.Timeout | null = null;
    
    if (state.connection && state.connectionReady && !microphoneOpen) {
      keepAlive = setInterval(() => {
        // should stop spamming dev console when working on frontend in devmode
        if(state.connection){
          if (state.connection.getReadyState() !== LiveConnectionState.OPEN) {
            if (keepAlive) clearInterval(keepAlive);
          } else {
            state.connection.keepAlive();
          }
        }
      }, 10000);
    } else {
      if (keepAlive) clearInterval(keepAlive);
    }

    // prevent duplicate timeouts
    return () => {
      if (keepAlive) clearInterval(keepAlive);
    };
  }, [state.connection, state.connectionReady, microphoneOpen]);


  // this works
  useEffect(() => {
    if (messageMarker.current) {
      messageMarker.current.scrollIntoView({
        behavior: "auto",
      });
    }
  }, [chatMessages]);

  return (
    <>
      <NextUIProvider className="h-full">
        <div className="flex h-full antialiased">
          <div className="flex flex-row h-full w-full overflow-x-hidden">
            <div className="flex flex-col flex-auto h-full">
              <div className="flex flex-col justify-between h-full">
                <div
                  className={`flex flex-col h-full overflow-hidden ${
                    initialLoad ? "justify-center" : "justify-end"
                  }`}
                >
                  <div className="grid grid-cols-12 overflow-x-auto gap-y-2">
                  {initialLoad ? (
                    <InitialLoad
                      fn={startConversation}
                      connecting={state.connectionReady === false} // Pass 'connectionReady' as the opposite of 'connecting'
                    />
                  ) : (
                    <>
                        {chatMessages.length > 0 &&
                          chatMessages.map((message, i) => {
                            if(message.id === 'AAAA'){
                              return null
                            }
                            return <ChatBubble message={message} key={i} />
                          })}

                        {currentUtterance && (
                          <RightBubble text={currentUtterance}></RightBubble>
                        )}

                        <div
                          className="h-16 col-start-1 col-end-13 responsive-hide"
                          ref={messageMarker}
                        ></div>
                      </>
                    )}
                  </div>
                </div>
                {!initialLoad && (
                  <Controls
                    messages={chatMessages}
                    handleSubmit={handleSubmit}
                    handleInputChange={handleInputChange}
                    input={input}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </NextUIProvider>
    </>
  );
}