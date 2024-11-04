"use client";

export const runtime = "edge";
import { init } from "@fullstory/browser";
import { useEffect } from "react";
import { Banner } from "./components/Banner";
import { Header } from "./components/Header";
import { Conversation } from "./components/Conversation";
import { Footer } from "./components/Footer";

export default function Home() {
  useEffect(() => {
    init({ orgId: "5HWAN" });
  }, []);

  return (
    <>
      <div className="flex flex-col max-h-screen h-screen overflow-hidden">

        <Banner />

        <Header />

        <main className="flex-grow mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <Conversation />
        </main>

        <Footer />
      </div>
    </>
  );
}
