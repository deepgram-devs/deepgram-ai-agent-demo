export const Header = () => {
    return (
        <div className="bg-gradient-to-b from-black/50 to-black/10 backdrop-blur-[2px]">
          <div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 flex flex-col pb-2 pt-4 gap-y-1">
            <header className="flex justify-between">
              <div>
                <div className="flex items-bottom">
                  <h1 className="text-[1.4rem] font-bold">
                    Emily
                  </h1>
                  <h1 className="text-[1.4rem] font-bold text-transparent bg-clip-text bg-gradient-to-tl from-spring-green-500 to-dodger-blue-600">
                    AI
                  </h1>
                  <h2 className="ml-2 font-semibold text-xs">
                    V1
                  </h2>
                </div>
              </div>
              <div className="text-sm flex gap-2">
                <span className="inline-block gradient-shadow bg-white/50 rounded">
                  <a
                    href="https://github.com/deepgram-devs/deepgram-ai-agent-demo/tree/v1"
                    target="_blank"
                    className="hidden text-xs md:inline-block bg-black text-white/80 rounded m-px px-4 py-2 font-semibold"
                  >
                    Opensource on GitHub
                  </a>
                </span>
                <span className="inline-block gradient-shadow bg-white hover:bg-gradient-to-r to-[#13EF93]/50 from-[#149AFB]/80 rounded">
                  <a
                    href="https://console.deepgram.com/signup?jump=keys"
                    target="_blank"
                    className="hidden text-xs md:inline-block bg-transparent text-black rounded m-px px-4 py-2 font-semibold"
                  >
                    Get an API Key
                  </a>
                </span>
              </div>
            </header>
            <div className="flex justify-between text-xs font-bold">
              <p>Powered by <span className="">Deepgram Speech-to-Text and Text-to-Speech APIs</span> and an LLM.</p>
            </div>
          </div>
        </div>
    );
};
