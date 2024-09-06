"use client";
import { NextUIProvider } from "@nextui-org/react";
import { useState, useEffect, useRef } from "react";
import { AgentView } from "./AgentView";

/**
 * Conversation element that contains the conversational AI app.
 * @returns {JSX.Element}
 */
export default function ConversationAgent(): JSX.Element {
  return (
    <>
      <NextUIProvider className="h-full">
        <div className="flex h-full antialiased">
          <div className="flex flex-row h-full w-full overflow-x-hidden">
            <div className="flex flex-col flex-auto h-full">
              <div className="flex flex-col justify-between h-full">
                <div
                  className={`flex flex-col h-full overflow-hidden justify-center`}
                >
                  <div className="grid grid-cols-12 overflow-x-auto gap-y-2">
                    <AgentView />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </NextUIProvider>
    </>
  );
}
