import { ExclamationIcon } from "./icons/ExclamationIcon";
import { Headphones } from "./Headphones";
import { isBrowser, isIOS } from "react-device-detect";
import Image from "next/image";

export const InitialLoad = ({ fn }: { fn: () => void }) => {
  return (
    <>
      <div className="col-start-1 col-end-13 sm:col-start-2 sm:col-end-12 md:col-start-3 md:col-end-11 lg:col-start-4 lg:col-end-10 p-3 mb-1/2">
        <button
          onClick={() => fn()}
          type="button"
          className="relative block w-full glass p-6 sm:p-8 lg:p-12 rounded-xl"
        >
          <h2 className="font-favorit mt-2 block font-bold text-xl text-gray-100">
            Welcome to Deepgram&apos;s
            <br />
            AI Agent Tech Demo.
          </h2>
          <div className="flex justify-center mt-4">
            <ul className="list-disc list-inside marker:text-[#13EF93]">
              <li className="text-center">Nova-2 Speech-to-Text</li>
              <li className="text-center">Bedrock</li>
              <li className="text-center">Aura Text-to-Speech</li>
            </ul>
          </div>
          <span className="mt-4 block font-semibold">
            <div className="bg-white text-black rounded px-10 py-3 font-semibold sm:w-fit sm:mx-auto">
              {isBrowser ? "Click" : "Tap"} here to start
            </div>
          </span>
          <span className="mt-4 block text-sm text-gray-100/70">
            <Headphones /> For optimal enjoyment, we recommend using headphones
            while using this application. Minor bugs and annoyances may appear
            while using this demo. Pull requests are welcome.
          </span>
        </button>
      </div>
    </>
  );
};
