import { Message } from "ai/react";
import { TextContent } from "./TextContext";
import { UserAvatar } from "./UserAvatar";

export const RightBubble = ({
  message,
  text,
}: {
  message?: Message;
  text?: string;
}) => {
  return (
    <>
      <div className="col-start-1 col-end-13 md:p-3">
        <div className="flex flex-row justify-end">
          <div className="flex justify-end md:justify-start gap-2 flex-col md:flex-row-reverse">
            <div className="self-end md:self-start h-6 w-6 text-white shrink-0 pt-1 mt-1 rounded-full bg-black border border-zinc-300 overflow-hidden">
              <UserAvatar />
            </div>
            <div className="glass relative text-sm py-2 px-4 shadow rounded-s-xl rounded-ee-xl">
              <div className="text-sm font-normal text-white/80 markdown word-break">
                <TextContent text={message?.content ?? text ?? ""} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
