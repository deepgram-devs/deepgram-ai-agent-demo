import { Message } from "ai/react";
import { useAudioStore } from "../context/AudioStore";
import { useState } from "react";
import { CaretIcon } from "./icons/CaretIcon";
import { useMessageData } from "../context/MessageMetadata";
import { Tooltip } from "@nextui-org/react";
import { BoltIcon } from "./icons/BoltIcon";

const TTFB = () => (
  <Tooltip
    showArrow
    className="p-5 max-w-md"
    content="Time to first byte (TTFB) is the time it takes from initiating an API request to receiving the first byte of audio from the response."
  >
    <span className="underline decoration-dotted">Time to first-byte</span>
  </Tooltip>
);

const MessageMeta = ({
  message,
  className = "",
}: {
  message: Message;
  className?: string;
}) => {
  const { audioStore } = useAudioStore();
  const { messageData } = useMessageData();
  const [breakdown, setBreakdown] = useState(false);

  const foundData = messageData.findLast((item) => item.id === message.id);
  const foundAudio = audioStore.findLast((item) => item.id === message.id);

  if (!foundAudio) return;

  if (message.role === "assistant") {
    const llmTotal = Number(foundData?.end) - Number(foundData?.start);
    const ttsTtfb = foundAudio.latency;
    const ttsTotal = foundAudio.networkLatency;

    return (
      <div className="flex flex-col">
        <div
          className={`flex gap-x-2.5 pt-1 text-xs text-[#BBBBBF] ${className} flex-wrap`}
        >
          <span>
            <BoltIcon className="w-[1em] h-[1em]" />
          </span>
          <span>
            TTS <TTFB />: {(ttsTtfb / 1000).toFixed(1)}s
          </span>
          <button
            className="font-semibold hover:text-[#fbfbff]"
            onClick={() => setBreakdown(!breakdown)}
          >
            More{" "}
            <CaretIcon
              className={`w-[1em] h-[1em] transition-transform duration-150 ease-in-out ${
                breakdown && "rotate-90 md:rotate-180"
              }`}
            />
          </button>
          {!!llmTotal && (
            <span className={breakdown ? "hidden md:inline" : "hidden"}>
              LLM total: {(llmTotal / 1000).toFixed(1)}s
            </span>
          )}
          <span className={breakdown ? "hidden md:inline" : "hidden"}>
            TTS total: {(ttsTotal / 1000).toFixed(1)}s
          </span>
        </div>
        <div
          className={`flex md:hidden flex-col gap-2.5 pt-3 text-xs text-[#BBBBBF] ${className} flex-wrap`}
        >
          {!!llmTotal && (
            <span className={breakdown ? "inline ml-2" : "hidden"}>
              LLM total: {(llmTotal / 1000).toFixed(1)}s
            </span>
          )}

          <span className={breakdown ? "inline ml-2" : "hidden"}>
            TTS total: {(ttsTotal / 1000).toFixed(1)}s
          </span>
        </div>
      </div>
    );
  }
};

export { MessageMeta };
