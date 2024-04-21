import { GoogleTagManager } from "@next/third-parties/google";
import { Inter } from "next/font/google";
import { NowPlayingContextProvider } from "react-nowplaying";
import classNames from "classnames";
import localFont from "next/font/local";
import Script from "next/script";

import { DeepgramContextProvider } from "./context/Deepgram";
import { MessageMetadataContextProvider } from "./context/MessageMetadata";
import { MicrophoneContextProvider } from "./context/Microphone";
import { AudioStoreContextProvider } from "./context/AudioStore";
import { ToastContextProvider } from "./context/Toast";

import 'react-toastify/dist/ReactToastify.css';
import "./globals.css";

import type { Metadata, Viewport } from "next";

const inter = Inter({ subsets: ["latin"] });
const favorit = localFont({
  src: "./fonts/ABCFavorit-Bold.woff2",
  variable: "--font-favorit",
});

export const viewport: Viewport = {
  themeColor: "#000000",
  initialScale: 1,
  width: "device-width",
  // maximumScale: 1, hitting accessability
};

export const metadata: Metadata = {
  metadataBase: new URL("https://aura-tts-demo.deepgram.com"),
  title: "Deepgram AI Agent",
  description: `Deepgram's AI Agent Demo shows just how fast Speech-to-Text and Text-to-Speech can be.`,
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-dvh">
      <body
        className={`h-full dark ${classNames(
          favorit.variable,
          inter.className
        )}`}
      >
        <ToastContextProvider>
          <MicrophoneContextProvider>
            <AudioStoreContextProvider>
              <NowPlayingContextProvider>
                <MessageMetadataContextProvider>
                  <DeepgramContextProvider>{children}</DeepgramContextProvider>
                </MessageMetadataContextProvider>
              </NowPlayingContextProvider>
            </AudioStoreContextProvider>
          </MicrophoneContextProvider>
        </ToastContextProvider>
        <GoogleTagManager gtmId="GTM-5R73N627" />
        <Script
          id="github-buttons"
          async
          defer
          src="https://buttons.github.io/buttons.js"
        ></Script>
      </body>
    </html>
  );
}
