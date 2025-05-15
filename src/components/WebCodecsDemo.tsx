import React, { useCallback, useEffect, useRef, useState } from "react";
import "./WebCodecsDemo.css";

const WebCodecsDemo: React.FC = () => {
  // References for video and canvas elements
  const videoRef = useRef<HTMLVideoElement>(null);
  const sourceCanvasRef = useRef<HTMLCanvasElement>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);

  // State for managing media streams and UI state
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState<boolean>(false);
  const isActiveRef = useRef(isActive);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Configuration parameters
  const videoWidth = 640;
  const videoHeight = 480;
  const frameRate = 30;

  // Refs to store encoder/decoder and related resources
  const encoderRef = useRef<VideoEncoder | null>(null);
  const decoderRef = useRef<VideoDecoder | null>(null);
  const encodedChunksRef = useRef<EncodedVideoChunk[]>([]);
  const sourceContextRef = useRef<CanvasRenderingContext2D | null>(null);
  const outputContextRef = useRef<CanvasRenderingContext2D | null>(null);
  const animationFrameRef = useRef<number>(0);
  const encodingIntervalRef = useRef<number>(0);

  // Keep isActiveRef in sync with isActive
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  // Initialize camera access
  const initCamera = async () => {
    try {
      // Get user media with video constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: videoWidth },
          height: { ideal: videoHeight },
        },
        audio: false,
      });

      // Set the stream as video source
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setMediaStream(stream);
      setErrorMessage("");

      // Initialize canvas contexts
      if (sourceCanvasRef.current) {
        sourceContextRef.current = sourceCanvasRef.current.getContext("2d");
      }

      if (outputCanvasRef.current) {
        outputContextRef.current = outputCanvasRef.current.getContext("2d");
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setErrorMessage("Failed to access camera. Please ensure you have granted camera permissions.");
    }
  };

  // Configure and create video encoder
  const setupEncoder = useCallback(() => {
    if (!("VideoEncoder" in window)) {
      setErrorMessage("WebCodecs API is not supported in your browser.");
      return;
    }

    // Encoder output callback handler
    const encoderOutputCallback = (chunk: EncodedVideoChunk) => {
      // Store encoded chunk
      encodedChunksRef.current.push(chunk);

      // Feed the chunk to decoder
      if (decoderRef.current && chunk.type === "key") {
        decoderRef.current.decode(chunk);
      } else if (decoderRef.current) {
        decoderRef.current.decode(chunk);
      }
    };

    // Create video encoder with configuration
    const videoEncoder = new VideoEncoder({
      output: encoderOutputCallback,
      error: (err) => console.error("Encoder error:", err),
    });

    // Configure the encoder
    const encoderConfig = {
      codec: "vp8",
      width: videoWidth,
      height: videoHeight,
      framerate: frameRate,
      bitrate: 2_000_000, // 2 Mbps
      latencyMode: "realtime" as VideoEncoderConfig["latencyMode"],
    };

    videoEncoder.configure(encoderConfig);
    encoderRef.current = videoEncoder;
  }, []);

  // Configure and create video decoder
  const setupDecoder = useCallback(() => {
    if (!("VideoDecoder" in window)) {
      setErrorMessage("WebCodecs API is not supported in your browser.");
      return;
    }

    // Decoder output frame handler
    const decoderOutputCallback = (frame: VideoFrame) => {
      // Draw the decoded frame to the output canvas
      if (outputContextRef.current) {
        outputContextRef.current.drawImage(frame, 0, 0, videoWidth, videoHeight);
      }
      frame.close(); // Important to release resources
    };

    // Create video decoder
    const videoDecoder = new VideoDecoder({
      output: decoderOutputCallback,
      error: (err) => console.error("Decoder error:", err),
    });

    // Configure the decoder
    const decoderConfig = {
      codec: "vp8",
    };

    videoDecoder.configure(decoderConfig);
    decoderRef.current = videoDecoder;
  }, []);

  // Function to encode frames from the source canvas
  const encodeVideoFrame = () => {
    if (
      !encoderRef.current ||
      !sourceContextRef.current ||
      !sourceCanvasRef.current ||
      encoderRef.current.state !== "configured"
    ) {
      return;
    }

    // Create a VideoFrame from the source canvas
    const frame = new VideoFrame(
      sourceCanvasRef.current,
      { timestamp: performance.now() * 1000 } // Microseconds timestamp
    );

    try {
      // Encode the frame with a keyframe every 30 frames
      encoderRef.current.encode(frame, { keyFrame: encodedChunksRef.current.length % 30 === 0 });
      frame.close(); // Important to release resources
    } catch (err) {
      console.error("Error encoding frame:", err);
    }
  };

  // Function to capture frames from video to source canvas
  const captureFrame = () => {
    if (!videoRef.current || !sourceContextRef.current || !sourceCanvasRef.current) {
      return;
    }

    // 只在 video 有数据时采集
    if (videoRef.current.readyState >= 2) {
      sourceContextRef.current.drawImage(
        videoRef.current,
        0,
        0,
        sourceCanvasRef.current.width,
        sourceCanvasRef.current.height
      );
    } else {
      console.log("video not ready", videoRef.current.readyState);
    }
    // Schedule the next frame capture
    if (isActiveRef.current) {
      animationFrameRef.current = requestAnimationFrame(() => captureFrame());
    }
  };

  // Start the encoding and decoding process
  const startProcessing = () => {
    if (!mediaStream) {
      initCamera();
      return;
    }

    setIsActive(true);

    // Start capturing frames
    animationFrameRef.current = requestAnimationFrame(() => captureFrame(true));

    // Start encoding frames at a regular interval
    const encodingInterval = 1000 / frameRate; // ms between frames
    encodingIntervalRef.current = window.setInterval(encodeVideoFrame, encodingInterval);
  };

  // Stop all processing and release resources
  const stopProcessing = useCallback(() => {
    setIsActive(false);

    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Clear encoding interval
    if (encodingIntervalRef.current) {
      clearInterval(encodingIntervalRef.current);
    }

    // Close encoder and decoder if they exist
    if (encoderRef.current && encoderRef.current.state !== "closed") {
      encoderRef.current.close();
      encoderRef.current = null;
    }

    if (decoderRef.current && decoderRef.current.state !== "closed") {
      decoderRef.current.close();
      decoderRef.current = null;
    }

    // Clear encoded chunks
    encodedChunksRef.current = [];

    // Stop camera if needed
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);

      // Clear video srcObject
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [mediaStream]);

  // Set up initial configuration
  useEffect(() => {
    // Check if WebCodecs API is supported
    if (!("VideoEncoder" in window) || !("VideoDecoder" in window)) {
      setErrorMessage("WebCodecs API is not supported in your browser.");
      return;
    }

    // Initialize encoder and decoder
    setupEncoder();
    setupDecoder();

    // Cleanup function
    return () => {
      stopProcessing();
    };
  }, [setupEncoder, setupDecoder, stopProcessing]);

  return (
    <div className="webcodecs-demo">
      <h2>WebCodecs Demo</h2>
      <div className="controls">
        <button onClick={isActive ? stopProcessing : startProcessing}>{isActive ? "Stop" : "Start"}</button>
      </div>

      {errorMessage && <div className="error-message">{errorMessage}</div>}

      <div className="video-containers">
        <div className="video-container">
          <h3>Source Video</h3>
          <video ref={videoRef} autoPlay playsInline muted width={videoWidth} height={videoHeight} />
          <canvas
            ref={sourceCanvasRef}
            width={videoWidth}
            height={videoHeight}
            className="source-canvas"
            style={{ display: "block", marginTop: 8, border: "1px solid #aaa" }}
          />
        </div>

        <div className="video-container">
          <h3>Decoded Output</h3>
          <canvas ref={outputCanvasRef} width={videoWidth} height={videoHeight} className="output-canvas" />
        </div>
      </div>

      <div className="info">
        <p>This demo captures video from your camera, encodes it with VP8, decodes it, and displays the result.</p>
        <p>The source canvas is hidden and used for frame capture before encoding.</p>
      </div>
    </div>
  );
};

export default WebCodecsDemo;
