import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { VideoOff, RotateCcw } from "lucide-react";

export default function QRScannerView({ onDetected, onManualEntry }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(null);
  const detectedRef = useRef(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();
        tick();
      } catch (err) {
        setError(
          err.name === "NotAllowedError"
            ? "Camera access was denied. Allow camera permission to scan a QR code."
            : "Couldn't access a camera on this device."
        );
      }
    }

    function tick() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || detectedRef.current) return;

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });
        if (code?.data) {
          detectedRef.current = true;
          stopCamera();
          onDetected(code.data);
          return;
        }
      }
      frameRef.current = requestAnimationFrame(tick);
    }

    start();
    return () => {
      cancelled = true;
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopCamera() {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-black px-6 text-center">
        <VideoOff size={28} className="text-gray-500" />
        <p className="text-sm text-gray-400">{error}</p>
        <button
          onClick={onManualEntry}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
        >
          <RotateCcw size={13} />
          Enter payment details manually
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-64 overflow-hidden rounded-2xl border border-white/10 bg-black">
      <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
      <canvas ref={canvasRef} className="hidden" />
      <div className="pointer-events-none absolute inset-0">
        <span className="absolute left-4 top-4 h-8 w-8 rounded-tl-lg border-l-2 border-t-2 border-emerald-500" />
        <span className="absolute right-4 top-4 h-8 w-8 rounded-tr-lg border-r-2 border-t-2 border-emerald-500" />
        <span className="absolute bottom-4 left-4 h-8 w-8 rounded-bl-lg border-b-2 border-l-2 border-emerald-500" />
        <span className="absolute bottom-4 right-4 h-8 w-8 rounded-br-lg border-b-2 border-r-2 border-emerald-500" />
        <span className="absolute inset-x-4 h-0.5 animate-scan-line bg-emerald-500 shadow-[0_0_12px_rgba(34,197,94,0.8)]" />
        <p className="absolute bottom-8 left-0 right-0 text-center text-xs text-white/70">
          Point camera at a QR code
        </p>
      </div>
    </div>
  );
}
