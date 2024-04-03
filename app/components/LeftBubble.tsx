import { AgentAvatar } from "./AgentAvatar";
import { Message } from "ai/react";
import { MessageAudio } from "./MessageAudio";
import { MessageHeader } from "./MessageHeader";
import { MessageMeta } from "./MessageMeta";
import { TextContent } from "./TextContext";

export const LeftBubble = ({ message }: { message: Message }) => {
  return (
    <>
      <div className="col-start-1 col-end-13 sm:col-end-11 md:col-end-9 lg:col-end-8 xl:col-end-7 md:px-3 pt-3">
        <div className="flex items-start gap-2 flex-col md:flex-row">
          <div className="flex items-start gap-2 flex-col md:flex-row max-w-full md:max-w-none">
            <div className="min-w-12 text-white shrink-0">
              <AgentAvatar message={message} />
            </div>
            <div className="glass flex p-4 rounded-e-xl rounded-es-xl max-w-full md:max-w-none">
              <div className="flex flex-col overflow-hidden pre-overflow-y-auto">
                <MessageHeader message={message} />
                <div className="text-sm font-normal pt-2 text-white/80 markdown">
                  <TextContent text={message.content} />
                </div>
              </div>
            </div>
          </div>
          <div className="md:px-1 pb-3 flex gap-2 self-start md:self-center">
            <div className="h-6 w-6 shrink-0">
              <MessageAudio message={message} />
            </div>
            <MessageMeta className="md:hidden" message={message} />
          </div>
        </div>
      </div>
      <div className="hidden col-start-1 col-end-13 md:px-3 pb-3 md:flex gap-2">
        <MessageMeta className="md:ml-14" message={message} />
      </div>
    </>
  );
};
