"use client";
import { useState, useEffect, useRef } from "react";
import { useWebSocketContext } from "../context/WebSocketContext";
import { AgentControls } from "./AgentControls";
import { InitialLoadAgent } from "./InitialLoadAgent";
import { NextUIProvider } from "@nextui-org/react";
import { AgentChatBubble } from "./ChatBubble";

/**
 * Conversation element that contains the conversational AI app.
 * @returns {JSX.Element}
 */
export default function ConversationAgent(): JSX.Element {
  const { startStreaming, chatMessages, connection } = useWebSocketContext();
  /**
   * Refs
   */
  const messageMarker = useRef<null | HTMLDivElement>(null);

  /**
   * State
   */
  const [initialLoad, setInitialLoad] = useState(true);

  const startConversation = () => {
    startStreaming();
    setInitialLoad(false);
  };

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
                      <InitialLoadAgent
                        fn={startConversation}
                        connecting={!connection}
                      />
                    ) : (
                      <>
                        {chatMessages.length > 0 &&
                          chatMessages.map((message, i) => (
                            <AgentChatBubble message={message} key={i} />
                          ))}
                        <div
                          className="h-16 col-start-1 col-end-13"
                          ref={messageMarker}
                        ></div>
                      </>
                    )}
                  </div>
                </div>
                {!initialLoad && <AgentControls />}
              </div>
            </div>
          </div>
        </div>
      </NextUIProvider>
    </>
  );
}
