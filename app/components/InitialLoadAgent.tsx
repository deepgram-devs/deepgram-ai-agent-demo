import { Headphones } from "./Headphones";
import { isBrowser } from "react-device-detect";
import { Spinner } from "@nextui-org/react";

export const InitialLoadAgent = ({
  fn,
  connecting = true,
}: {
  fn: () => void;
  connecting: boolean;
}) => {
  return (
    <>
      <div className="col-start-1 col-end-13 sm:col-start-2 sm:col-end-12 md:col-start-3 md:col-end-11 lg:col-start-4 lg:col-end-10 p-3 mb-1/2">
        <button
          disabled={connecting}
          onClick={() => !connecting && fn()}
          type="button"
          className="relative block w-full glass p-6 sm:p-8 lg:p-12 rounded-xl"
        >
          <h2 className="font-favorit mt-2 block font-bold text-xl text-gray-100">
            Deepgram Agent API Demo
          </h2>
          <span className="mt-2 block text-sm text-gray-100/70">
            <Headphones /> For optimal enjoyment, we recommend using headphones
            while using this application. Minor bugs and annoyances may appear
            while using this demo. Pull requests are welcome.
          </span>
          <span className="mt-4 block font-semibold">
            <div className="bg-white text-black rounded px-6 md:px-8 py-3 font-semibold sm:w-fit sm:mx-auto opacity-90">
              {connecting ? (
                <div className="w-full h-full items-center flex justify-center opacity-40 cursor-not-allowed">
                  <Spinner size={"sm"} className="-mt-1 mr-2" />
                  Connecting...
                </div>
              ) : (
                <>{isBrowser ? "Click" : "Tap"} here to start</>
              )}
            </div>
          </span>
        </button>
      </div>
    </>
  );
};
