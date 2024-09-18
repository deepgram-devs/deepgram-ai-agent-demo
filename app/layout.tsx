import { GoogleTagManager } from "@next/third-parties/google";
import { Inter } from "next/font/google";
import classNames from "classnames";
import localFont from "next/font/local";
import Script from "next/script";
import { ToastContextProvider } from "./context/Toast";

import "react-toastify/dist/ReactToastify.css";
import "./globals.css";

import type { Metadata, Viewport } from "next";
import { WebSocketProvider } from "./context/WebSocketContext";
import { AuthContextProvider } from "./context/Auth";

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
          <AuthContextProvider>
            <WebSocketProvider>{children}</WebSocketProvider>
          </AuthContextProvider>
        </ToastContextProvider>
        <GoogleTagManager gtmId="GTM-5R73N627" />
        <Script
          id="github-buttons"
          async
          defer
          src="https://buttons.github.io/buttons.js"
        ></Script>
        <Script id="heap-analytics">
          {`window.heap=window.heap||[],heap.load=function(e,t){window.heap.appid=e,window.heap.config=t=t||{};var r=document.createElement("script");r.type="text/javascript",r.async=!0,r.src="https://cdn.heapanalytics.com/js/heap-"+e+".js";var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(r,a);for(var n=function(e){return function(){heap.push([e].concat(Array.prototype.slice.call(arguments,0)))}},p=["addEventProperties","addUserProperties","clearEventProperties","identify","resetIdentity","removeEventProperty","setEventProperties","track","unsetEventProperty"],o=0;o<p.length;o++)heap[p[o]]=n(p[o])};`}
          {`heap.load("765739241");`}
        </Script>
      </body>
    </html>
  );
}
