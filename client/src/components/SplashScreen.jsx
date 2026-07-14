import { ShieldCheck } from "lucide-react";

export default function SplashScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-black">
      <div className="flex flex-col items-center text-center animate-fade-in-up">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#2a0f0f] text-red-500 shadow-[0_0_60px_rgba(239,68,68,0.4)]">
          <ShieldCheck size={36} />
        </div>
        <h1 className="mt-6 text-3xl font-bold">
          <span className="text-white">SecureVault</span>
          <span className="text-red-500">Pay</span>
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Secure Today. Schedule Tomorrow. Pay Smarter.
        </p>
      </div>
    </div>
  );
}
