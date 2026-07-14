import { Lock } from "lucide-react";

export default function AuthLayout({ icon: Icon = Lock, children }) {
  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-14">
        {Icon && (
          <div className="mb-8 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2a0f0f] shadow-[0_0_50px_rgba(239,68,68,0.35)]">
              <Icon size={28} className="text-red-500" />
            </div>
          </div>
        )}
        <div className="animate-fade-in-up">{children}</div>
      </div>
    </div>
  );
}
