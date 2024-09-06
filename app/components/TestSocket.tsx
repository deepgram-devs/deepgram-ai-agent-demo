import React, { useEffect, useRef, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";

const WebSocketMicrophoneStreaming = () => {
  const [voice, setVoice] = useState("defaultVoice");
  const [model, setModel] = useState("defaultModel");
  const [instructions, setInstructions] = useState(
    "You are a helpful assistant who responds in 1-2 sentences at most each time."
  );
  const [audioLevel, setAudioLevel] = useState(0);
  const canvasRef = useRef(null);
  const [microphoneStream, setMicrophoneStream] = useState(null);

  const { sendMessage, lastMessage, readyState } = useWebSocket(
    "wss://sts.sandbox.deepgram.com/agent",
    {
      protocols: ["token", "b6f78efae4b2128e4c3d8f81fb6c740b8c0bc077"],
      onOpen: () => {
        console.log("WebSocket connection established.");
        sendMessage(
          JSON.stringify({
            type: "SettingsConfiguration",
            audio: {
              input: {
                encoding: "linear32",
                sample_rate: 48000,
              },
              output: {
                encoding: "linear16",
                sample_rate: 48000,
                container: "none",
              },
            },
            agent: {
              listen: { model: "nova-2" },
              think: { provider: model.split("+")[0], model: model.split("+")[1], instructions },
              speak: { model: voice },
            },
          })
        );
        startStreaming();
      },
      onError: (error) => console.error("WebSocket error:", error),
      onMessage: (event) => {
        if (typeof event.data === "string") {
          console.log("Text message received:", event.data);
          const msgObj = JSON.parse(event.data);
          if (msgObj.type === "UserStartedSpeaking") {
            clearScheduledAudio();
          }
        } else if (event.data instanceof ArrayBuffer) {
          const simulatedVolumeLevel = 0.05; // Placeholder for real audio analysis
          setAudioLevel(simulatedVolumeLevel * 5);
          feedAudioData(event.data);
        }
      },
    }
  );

  useEffect(() => {
    const canvas:any = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let audioLevelLocal = audioLevel;

    const animateBlob = () => {
      const time = performance.now() * 0.001;
      audioLevelLocal += (audioLevel - audioLevelLocal) * 0.05;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const baseSize = 200 + audioLevelLocal * 100;
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        baseSize * 0.00005,
        centerX,
        centerY,
        baseSize
      );

      gradient.addColorStop(0, "#005f73");
      gradient.addColorStop(1, "#005f73");

      canvas.width = canvas.width;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);

      for (let angle = 0; angle <= Math.PI * 2; angle += 0.01) {
        const smoothRandom =
          Math.sin(angle * (3 + Math.random() * 0.005) + time) * 5 +
          Math.cos(angle * (5 + Math.random() * 0.005) + time) * 5;
        const radius = baseSize + smoothRandom;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        ctx.lineTo(x, y);
      }

      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
      setAudioLevel((prev) => prev * 0.95);
      requestAnimationFrame(animateBlob);
    };

    animateBlob();
  }, [audioLevel]);

  const startStreaming = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("getUserMedia is not supported in this browser.");
      return;
    }

    navigator.mediaDevices
      .getUserMedia({
        audio: {
          sampleRate: 48000,
          channelCount: 1,
          echoCancellation: true,
          autoGainControl: true,
        //   voiceIsolation: true,
          noiseSuppression: false,
        //   latency: 0,
        },
      })
      .then((stream:any) => {
        setMicrophoneStream(stream);
        const audioContext = new AudioContext();
        const microphone = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);

        processor.onaudioprocess = (event) => {
          const inputData = event.inputBuffer.getChannelData(0);
          const rms = Math.sqrt(
            inputData.reduce((sum, value) => sum + value * value, 0) /
              inputData.length
          );
          setAudioLevel(rms * 5);
          sendMessage(inputData);
        };

        microphone.connect(processor);
        processor.connect(audioContext.destination);
      })
      .catch((error) => console.error("Error accessing microphone:", error));
  };

  const feedAudioData = (audioData:any) => {
    // Implement audio data handling here
  };

  const clearScheduledAudio = () => {
    // Implement scheduled audio clearing here
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", height: "100vh", justifyContent: "center", backgroundColor: "#f0f0f0" }}>
      <div id="startContainer" style={{ position: "absolute", top: "100px", textAlign: "center", width: "400px" }}>
        <select onChange={(e) => setVoice(e.target.value)} value={voice}>
          {/* Options for voice selection */}
        </select>
        <select onChange={(e) => setModel(e.target.value)} value={model}>
          {/* Options for model selection */}
        </select>
        <button id="startConversationBtn" onClick={() => startStreaming()} style={{ padding: "10px 20px", borderRadius: "5px", backgroundColor: "#007bff", color: "white", cursor: "pointer", transition: "background-color 0.2s ease" }}>
          Start Conversation
        </button>
      </div>
      <canvas ref={canvasRef} id="blobCanvas" style={{ width: "100%", height: "100%", maxWidth: "350px", maxHeight: "350px", marginBottom: "15%" }}></canvas>
      <div id="instructionsContainer" style={{ position: "absolute", bottom: "100px", textAlign: "center", display: "flex", flexDirection: "column", width: "400px" }}>
        <textarea id="instructionsInput" value={instructions} onChange={(e) => setInstructions(e.target.value)} style={{ padding: "10px", marginBottom: "10px", border: "2px solid #ccc", borderRadius: "5px", resize: "vertical", fontSize: "14px" }} />
        <button id="updateInstructionsBtn" onClick={() => sendMessage(JSON.stringify({ type: "UpdateInstructions", instructions }))} style={{ padding: "10px 20px", borderRadius: "5px", backgroundColor: "#007bff", color: "white", cursor: "pointer", transition: "background-color 0.2s ease" }}>
          Update Instructions
        </button>
      </div>
      <div id="buttonContainer" style={{ position: "absolute", bottom: "250px", display: "flex", justifyContent: "center", gap: "20px" }}>
        {/* Voice selection buttons */}
      </div>
    </div>
  );
};

export default WebSocketMicrophoneStreaming;
