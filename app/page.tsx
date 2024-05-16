"use client";

import Image from "next/image";
// Removed the GitHubButton import
// import GitHubButton from "react-github-btn";

export const runtime = "edge";
import { init } from "@fullstory/browser";
import { useEffect } from "react";
// Removed unused icons imports
// import { XIcon } from "./components/icons/XIcon";
// import { FacebookIcon } from "./components/icons/FacebookIcon";
// import { LinkedInIcon } from "./components/icons/LinkedInIcon";
import Conversation from "./components/Conversation";

export default function Home() {
  useEffect(() => {
    init({ orgId: "5HWAN" });
  }, []);

  return (
    <>
      <div className="h-full overflow-hidden">
        {/* height 4rem */}
        <div className="bg-gradient-to-b from-black/50 to-black/10 backdrop-blur-[2px] h-[4rem] flex items-center">
          <header className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 flex items-center justify-between pt-4 md:pt-0 gap-2">
            <div>
              <a className="flex items-center" href="/">
                <Image
                  className="w-40 md:w-auto h-8 max-w-[12.5rem] sm:max-w-none"
                  src="/deepgram.svg"
                  alt="Deepgram Logo"
                  width={0}
                  height={0}
                  priority
                />
              </a>
            </div>
            {/* Removed GitHubButton and Get an API Key button */}
          </header>
        </div>

        {/* height 100% minus 8rem */}
        <main className="mx-auto max-w-7xl  px-4 md:px-6 lg:px-8 h-[calc(100%-8rem)]">
          <Conversation />
        </main>

        {/* Removed the entire footer */}
      </div>
    </>
  );
}
