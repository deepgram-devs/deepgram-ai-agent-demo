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
import { useState, useEffect, useCallback, useRef, useMemo } from "react";

import { ChatBubble } from "./ChatBubble";
import {
  // contextualGreeting,
  generateRandomString,
  utteranceText,
} from "../lib/helpers";
import { Controls } from "./Controls";
import { InitialLoad } from "./InitialLoad";
import { MessageMetadata } from "../lib/types";
import { RightBubble } from "./RightBubble";
import { greeting, greeting2, greeting3, systemContent, systemContent2, systemContent3 } from "../lib/constants";
import { useDeepgram } from "../context/Deepgram";
import { useMessageData } from "../context/MessageMetadata";
import { useMicrophone } from "../context/Microphone";
import { useAudioStore } from "../context/AudioStore";
import { useSearchParams } from "next/navigation";

/**
 * Conversation element that contains the conversational AI app.
 * @returns {JSX.Element}
 */
export default function Conversation(): JSX.Element {
  const searchParams = useSearchParams();

  /**
   * Custom context providers
   */
  const { ttsOptions, connection, connectionReady } = useDeepgram();
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

  let systemPrompt = '';
  let greetingChoice = '';
  let prompt = searchParams.get('prompt');
  let voice = searchParams.get('voice');

  /**
   * Request audio from API
   */
  const requestTtsAudio = useCallback(
    async (message: Message) => {
      const start = Date.now();
      
      let model = ttsOptions?.model ?? "30";

      if(prompt == '2' && (!voice || voice == '')){
        model = '31';
      } if(prompt == '3' && (!voice || voice == '')){
        model = '47';
      }

      if(voice && voice != ''){
        model = voice;
      }

      const res = await fetch(`/api/speak?model=${model}`, {
        cache: "no-store",
        method: "POST",
        body: JSON.stringify(message),
      });

      const headers = res.headers;

      const blob = await res.blob();

      startAudio(blob, "audio/mp3", message.id).then(() => {
        addAudio({
          id: message.id,
          blob,
          latency: Number(headers.get("X-DG-Latency")) ?? Date.now() - start,
          networkLatency: Date.now() - start,
          model,
        });
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ttsOptions?.model]
  );

  const [llmNewLatency, setLlmNewLatency] = useState<{
    start: number;
    response: number;
  }>();

  const onFinish = useCallback(
    (msg: any) => {
      requestTtsAudio(msg);
    },
    [requestTtsAudio]
  );

  const onResponse = useCallback((res: Response) => {
    (async () => {
      setLlmNewLatency({
        start: Number(res.headers.get("x-llm-start")),
        response: Number(res.headers.get("x-llm-response")),
      });
    })();
  }, []);

  if(prompt == '2'){
    systemPrompt = systemContent2;
    greetingChoice = greeting2;
  } else if(prompt == '3'){
    systemPrompt = systemContent3;
    greetingChoice = greeting3;
  } else {
    systemPrompt = systemContent;
    greetingChoice = greeting;
  }

  const systemMessage: Message = useMemo(
    () => ({
      id: generateRandomString(7),
      role: "system",
      content: systemPrompt,
    }),
    []
  );

  const greetingMessage: Message = useMemo(
    () => ({
      id: generateRandomString(7),
      role: "assistant",
      content: greetingChoice,
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
    api: "/api/brain",
    initialMessages: [systemMessage, greetingMessage],
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
    if (llmLoading) return;
    if (!llmNewLatency) return;

    const latestLlmMessage: MessageMetadata = {
      ...chatMessages[chatMessages.length - 1],
      ...llmNewLatency,
      end: Date.now(),
      ttsModel: ttsOptions?.model,
    };

    addMessageData(latestLlmMessage);
  }, [
    chatMessages,
    llmNewLatency,
    setLlmNewLatency,
    llmLoading,
    addMessageData,
    ttsOptions?.model,
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
    const welcomeMetadata: MessageMetadata = {
      ...greetingMessage,
      ttsModel: ttsOptions?.model,
    };

    addMessageData(welcomeMetadata);

    // get welcome audio
    requestWelcomeAudio();
  }, [
    addMessageData,
    greetingMessage,
    initialLoad,
    requestWelcomeAudio,
    ttsOptions?.model,
  ]);

  useEffect(() => {
    const onTranscript = (data: LiveTranscriptionEvent) => {
      let content = utteranceText(data);

      // i only want an empty transcript part if it is speech_final
      if (content !== "" || data.speech_final) {
        /**
         * use an outbound message queue to build up the unsent utterance
         */
        addTranscriptPart({
          is_final: data.is_final as boolean,
          speech_final: data.speech_final as boolean,
          text: content,
        });
      }
    };

    const onOpen = (connection: LiveClient) => {
      connection.addListener(LiveTranscriptionEvents.Transcript, onTranscript);
    };

    if (connection) {
      connection.addListener(LiveTranscriptionEvents.Open, onOpen);
    }

    return () => {
      connection?.removeListener(LiveTranscriptionEvents.Open, onOpen);
      connection?.removeListener(
        LiveTranscriptionEvents.Transcript,
        onTranscript
      );
    };
  }, [addTranscriptPart, connection]);

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

        if (connectionReady) {
          const nextBlob = firstBlob;

          if (nextBlob && nextBlob?.size > 0) {
            connection?.send(nextBlob);
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
    connection,
    microphoneQueue,
    removeBlob,
    firstBlob,
    microphoneQueueSize,
    isProcessing,
    connectionReady,
  ]);

  /**
   * keep deepgram connection alive when mic closed
   */
  useEffect(() => {
    let keepAlive: any;
    if (connection && connectionReady && !microphoneOpen) {
      keepAlive = setInterval(() => {
        // should stop spamming dev console when working on frontend in devmode
        if (connection?.getReadyState() !== LiveConnectionState.OPEN) {
          clearInterval(keepAlive);
        } else {
          connection.keepAlive();
        }
      }, 10000);
    } else {
      clearInterval(keepAlive);
    }

    // prevent duplicate timeouts
    return () => {
      clearInterval(keepAlive);
    };
  }, [connection, connectionReady, microphoneOpen]);

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
                      <InitialLoad fn={startConversation} connecting={!connection} />
                    ) : (
                      <>
                        {chatMessages.length > 0 &&
                          chatMessages.map((message, i) => (
                            <ChatBubble message={message} key={i} />
                          ))}

                        {currentUtterance && (
                          <RightBubble text={currentUtterance}></RightBubble>
                        )}

                        <div
                          className="h-16 col-start-1 col-end-13"
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
