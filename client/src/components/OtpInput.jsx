import { useRef } from "react";

export default function OtpInput({ length = 6, value, onChange }) {
  const inputRefs = useRef([]);

  function setDigit(index, digit) {
    const digits = value.split("");
    digits[index] = digit;
    onChange(digits.join("").slice(0, length));
  }

  function handleChange(index, e) {
    const digit = e.target.value.replace(/\D/g, "").slice(-1);
    setDigit(index, digit);
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    onChange(pasted);
    inputRefs.current[Math.min(pasted.length, length - 1)]?.focus();
  }

  return (
    <div className="flex justify-between gap-2">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputRefs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="h-14 w-full rounded-xl border border-white/10 bg-[#131313] text-center text-lg font-bold text-white outline-none transition focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20"
        />
      ))}
    </div>
  );
}
