import { Headphones } from "./Headphones";
import { Spinner } from "@nextui-org/react";
import { useState } from "react";
import { useWebSocketContext } from "../context/WebScoket";
import SpeakAnimation from "./SpeakAnimation";
import VoiceListeningAnimation from "./VoiceListeningAnimation";
import { ReadyState } from "react-use-websocket";
import { ModelSelection, VoiceSelection } from "./Selection";

export const AgentView = () => {
  const [conversationActive, setConversationActive] = useState(false);

  const {
    currentSpeaker,
    readyState,
    voice,
    model,
    startStreaming,
    stopStreaming,
    setModel,
    setVoice,
  } = useWebSocketContext();

  const startConversation = () => {
    setConversationActive(true);
    startStreaming();
  };

  const stopConversation = () => {
    setConversationActive(false);
    stopStreaming();
  };

  const onUpdateModel = (v: string) => {
    setModel(v as string);
  };

  const onUpdateVoice = (v: string) => {
    setVoice(v as string);
  };

  return (
    <>
      <div className="col-start-1 col-end-13 sm:col-start-2 sm:col-end-12 md:col-start-3 md:col-end-11 lg:col-start-4 lg:col-end-10 p-3 mb-1/2">
        <div className="relative block w-full glass p-6 sm:p-8 lg:p-12 rounded-xl">
          <h2 className="font-favorit mt-2 block font-bold text-xl text-gray-100">
            Welcome to Deepgram&apos;s
            <br />
            AI Agent Tech Demo.
          </h2>
          <div className=" mt-4 space-y-4">
            <VoiceSelection
              model={voice}
              setVoice={(v) => {
                onUpdateVoice(v as string);
              }}
            />
            <ModelSelection
              model={model}
              setModel={(v) => {
                onUpdateModel(v as string);
              }}
            />
          </div>
          <div className="mt-4 block font-semibold">
            <div className="flex justify-center">
              {currentSpeaker === "model" ? (
                <SpeakAnimation speed={10} />
              ) : currentSpeaker === "user" ||
                currentSpeaker === "user-waiting" ? (
                <VoiceListeningAnimation
                  isDone={currentSpeaker === "user-waiting"}
                />
              ) : null}
            </div>
            <div className="">
              {readyState !== ReadyState.OPEN ? (
                <div className="w-full h-full items-center flex justify-center cursor-not-allowed text-white">
                  <Spinner size={"sm"} className="-mt-1 mr-2" />
                  Connecting...
                </div>
              ) : (
                <div className="flex justify-center items-center gap-10 mt-5">
                  {!conversationActive ? (
                    <button
                      onClick={startConversation}
                      className="bg-white rounded-md h-10 text-black font-medium text-sm flex items-center px-4"
                    >
                      Start
                    </button>
                  ) : (
                    <button
                      onClick={stopConversation}
                      className="bg-red-600 w-[50px] h-[50px] rounded-full grid place-items-center font-bold text-white text-2xl"
                    >
                      x
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          <span className="mt-4 block text-sm text-gray-100/70">
            <Headphones /> For optimal enjoyment, we recommend using headphones
            while using this application. Minor bugs and annoyances may appear
            while using this demo. Pull requests are welcome.
          </span>
        </div>
      </div>
    </>
  );
};
