"use client";

import {
  LiveClient,
  LiveConnectionState,
  LiveTranscriptionEvent,
  LiveTranscriptionEvents,
  UtteranceEndEvent,
  createClient,
} from "@deepgram/sdk";
import { ChatBubble } from "./ChatBubble";
import { Controls } from "./Controls";
import { InitialLoad } from "./InitialLoad";
import { RightBubble } from "./RightBubble";
import { Message, useChat } from "ai/react";
import { useQueue } from "@uidotdev/usehooks";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { contextualGreeting, utteranceText } from "../lib/helpers";
import { useNowPlaying } from "../context/NowPlaying";
import { usePlayQueue } from "../context/PlayQueue";
import { NextUIProvider, Spinner } from "@nextui-org/react";
import { useMicrophone } from "../context/Microphone";
import { MessageMetadata } from "../lib/types";
import { useMessageData } from "../context/MessageMetadata";
import { useDeepgram } from "../context/Deepgram";

/**
 * Conversation element that contains the conversational AI app.
 * @returns {JSX.Element}
 */
export default function Conversation(): JSX.Element {
  /**
   * Custom context providers
   */
  const { ttsOptions, connection, connectionReady } = useDeepgram();
  const { playQueue, enqueueItem, updateItem } = usePlayQueue();
  const { nowPlaying, setNowPlaying } = useNowPlaying();
  const { addMessageData } = useMessageData();
  const {
    microphoneOpen,
    queue: microphoneQueue,
    queueSize: microphoneQueueSize,
    firstBlob,
    removeBlob,
  } = useMicrophone();

  /**
   * Queues
   */
  const {
    add: addTranscriptPart,
    queue: transcriptParts,
    clear: clearTranscriptParts,
    last: lastTranscriptPart,
  } = useQueue<{ is_final: boolean; speech_final: boolean; text: string }>([]);

  /**
   * Refs
   */
  const messageMarker = useRef<null | HTMLDivElement>(null);

  /**
   * State
   */
  // const [apiKey, setApiKey] = useState<CreateProjectKeyResponse>();
  // const [connection, setConnection] = useState<LiveClient>();
  const [initialLoad, setInitialLoad] = useState(true);
  // const [isListening, setListening] = useState(false);
  // const [isLoading, setLoading] = useState(true);
  // const [isLoadingKey, setLoadingKey] = useState(true);
  const [isProcessing, setProcessing] = useState(false);

  /**
   * Contextual functions
   */
  const requestTtsAudio = useCallback(
    async (message: Message) => {
      const start = Date.now();
      const model = ttsOptions?.model ?? "aura-asteria-en";

      const res = await fetch(`/api/speak?model=${model}`, {
        cache: "no-store",
        method: "POST",
        body: JSON.stringify(message),
      });

      const headers = res.headers;

      enqueueItem({
        id: message.id,
        blob: await res.blob(),
        latency: Number(headers.get("X-DG-Latency")) ?? Date.now() - start,
        networkLatency: Date.now() - start,
        played: false,
        model,
      });
    },
    [enqueueItem, ttsOptions?.model]
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

  const greeting = useMemo(
    () =>
      ({
        id: "welcome",
        role: "assistant",
        content: contextualGreeting(),
      }) as Message,
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
    api: "/api/brain-bedrock",
    initialMessages: [{ role: "user", content: "Hi" } as Message, greeting],
    onFinish,
    onResponse,
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
    requestTtsAudio(greeting);
  }, [greeting, requestTtsAudio]);

  const startConversation = useCallback(() => {
    if (!initialLoad) return;

    setInitialLoad(false);

    // add a stub message data with no latency
    const welcomeMetadata: MessageMetadata = {
      ...greeting,
      ttsModel: ttsOptions?.model,
    };

    addMessageData(welcomeMetadata);

    // get welcome audio
    requestWelcomeAudio();
  }, [
    addMessageData,
    greeting,
    initialLoad,
    requestWelcomeAudio,
    ttsOptions?.model,
  ]);

  const { player, clearNowPlaying } = useNowPlaying();

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

  const [currentUtterance, setCurrentUtterance] = useState<string>();

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
      append({
        role: "user",
        content,
      });
      clearTranscriptParts();
      setCurrentUtterance(undefined);
    }
  }, [getCurrentUtterance, clearTranscriptParts, append]);

  /**
   * incomplete speech final failsafe
   */
  useEffect(() => {
    if (!lastUtterance || !currentUtterance) return;

    const interval = setInterval(() => {
      const timeLived = Date.now() - lastUtterance;

      if (currentUtterance !== "" && timeLived > 1500) {
        console.log("failsafe fires! pew pew!!");

        append({
          role: "user",
          content: currentUtterance,
        });
        clearTranscriptParts();
        setCurrentUtterance(undefined);
      }
    }, 100);

    return () => {
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastUtterance, currentUtterance]);

  /**
   * barge-in
   */
  useEffect(() => {
    if (!currentUtterance || currentUtterance === "") return;

    console.log("barging in");

    if (nowPlaying) {
      player?.pause();
      updateItem(nowPlaying.id, { played: true });
      clearNowPlaying();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUtterance, clearNowPlaying, nowPlaying, updateItem]);

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
   * magic tts audio queue processing mk2
   */
  useEffect(() => {
    if (playQueue.length > 0) {
      const playableItems = playQueue.filter((item) => !item.played);
      const nextPlayableItem = playableItems[playableItems.length - 1];
      if (nextPlayableItem && !nowPlaying) {
        setNowPlaying(nextPlayableItem);
      }
    }
  }, [nowPlaying, playQueue, setNowPlaying]);

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

  /**
   * loading message (api key)
   */
  if (!connection) {
    return (
      <div className="w-auto h-full items-center flex justify-center">
        <Spinner size={"sm"} className="-mt-1 mr-2" />
        Connecting...
      </div>
    );
  }

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
                      <InitialLoad fn={startConversation} />
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
