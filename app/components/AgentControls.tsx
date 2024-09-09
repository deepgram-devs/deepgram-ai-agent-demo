import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Tooltip,
  useDisclosure,
} from "@nextui-org/react";
import { useCallback } from "react";
import { MicrophoneIcon } from "./icons/MicrophoneIcon";
import { useWebSocketContext } from "../context/WebSocketContext";
import { DownloadAgent } from "./Download";
import { useToast } from "../context/Toast";
import { CogIcon } from "./icons/CogIcon";
import { voiceMap } from "../context/Deepgram";
import { VoiceSelection, ModelSelection } from "./Selection";

export const AgentSettings = () => {
  const { toast } = useToast();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { voice, setVoice, setModel, model, chatMessages } =
    useWebSocketContext();

  return (
    <>
      <div className="flex items-center gap-2.5 text-sm mr-4">
        <span className="bg-gradient-to-r to-[#13EF93]/50 from-[#149AFB]/80 rounded-full flex">
          <a
            className={`relative m-px bg-black md:w-[9.25rem] w-10 h-10 rounded-full text-sm p-2.5 group md:hover:w-[9.25rem] transition-all ease-in-out duration-1000 overflow-hidden whitespace-nowrap`}
            href="#"
            onClick={onOpen}
          >
            <CogIcon className="w-5 h-5 transition-transform ease-in-out duration-2000 group-hover:rotate-180" />
            <span className="ml-2.5 text-xs">Change settings</span>
          </a>
        </span>
        <span className="hidden md:inline-block text-white/50 font-inter">
          Voice: <span className="text-white">{voiceMap(voice)?.name}</span>
        </span>
      </div>
      <DownloadAgent messages={chatMessages} />
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        backdrop="blur"
        className="glass"
      >
        <ModalContent>
          {(onClose) => {
            const saveAndClose = () => {
              toast("Options saved.");

              onClose();
            };

            return (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  Settings
                </ModalHeader>
                <ModalBody>
                  <h2>Text-to-Speech Settings</h2>
                  <VoiceSelection
                    model={voice}
                    setVoice={(v) => setVoice(v as string)}
                  />
                  <h2>LLM Settings</h2>
                  <ModelSelection
                    model={model}
                    setModel={(v) => setModel(v as string)}
                  />
                </ModalBody>
                <ModalFooter>
                  <Button color="primary" onPress={saveAndClose}>
                    Save
                  </Button>
                </ModalFooter>
              </>
            );
          }}
        </ModalContent>
      </Modal>
    </>
  );
};

export const AgentControls = () => {
  const { startStreaming, stopStreaming, microphoneOpen, chatMessages } =
    useWebSocketContext();

  const microphoneToggle = useCallback(
    async (e: Event) => {
      e.preventDefault();
      console.log("toogle the control");
      if (!microphoneOpen) {
        startStreaming();
      } else {
        stopStreaming();
      }
    },
    [microphoneOpen]
  );

  console.log("microphone control rendering");

  return (
    <div className="relative">
      <div className="absolute w-full -top-[4.5rem] py-4 flex justify-center">
        <AgentSettings />
        {/* <Download messages={chatMessages} /> */}
      </div>
      <div className="flex bg-[#101014] rounded-full justify-center">
        <span
          className={`rounded-full ps-0.5 py-0.5 ${
            microphoneOpen
              ? "bg-gradient-to-r bg-gradient to-[#13EF93]/50 from-red-500"
              : "bg-gradient-to-r bg-gradient to-[#13EF93]/50 from-[#149AFB]/80"
          }`}
        >
          <Tooltip showArrow content="Toggle microphone on/off.">
            <a
              href="#"
              onClick={(e: any) => microphoneToggle(e)}
              className={`rounded-full w-16 md:w-20 sm:w-24 py-2 md:py-4 px-2 h-full sm:px-8 font-bold bg-[#101014] text-light-900 text-sm sm:text-base flex items-center justify-center group`}
            >
              {microphoneOpen && (
                <div className="w-auto items-center justify-center hidden sm:flex absolute shrink-0">
                  <MicrophoneIcon
                    micOpen={microphoneOpen}
                    className="h-5 md:h-6 animate-ping-infinite"
                  />
                </div>
              )}
              <div className="w-auto flex items-center justify-center shrink-0">
                <MicrophoneIcon
                  micOpen={microphoneOpen}
                  className="h-5 md:h-6 "
                />
              </div>
              {/* <span>
                {microphoneOpen ? (
                  <>Now listening...</>
                ) : (
                  <>{`${isTablet || isMobile ? "Tap" : "Click"} to speak`}</>
                )}
              </span> */}
            </a>
          </Tooltip>
        </span>
      </div>
    </div>
  );
};
