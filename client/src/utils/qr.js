// Generates a UPI-style deep link so the code this app produces is itself scannable
// and round-trips through parsePaymentPayload below.
export function buildPaymentPayload({ name, upiId }) {
  const params = new URLSearchParams({
    pa: upiId,
    pn: name,
    cu: "INR",
  });
  return `upi://pay?${params.toString()}`;
}

// Best-effort parse of whatever a real camera scan turns up: our own UPI-style
// links, real-world UPI QR codes (same "upi://pay?pa=&pn=&am=" shape), or any
// other QR content — which still gets handed back as a raw merchant label
// rather than rejected, so scanning always leads somewhere.
export function parsePaymentPayload(text) {
  try {
    if (text.startsWith("upi://")) {
      const url = new URL(text);
      const payeeName = url.searchParams.get("pn");
      const amount = url.searchParams.get("am");
      return {
        merchantName: payeeName ? decodeURIComponent(payeeName) : "UPI Payee",
        amount: amount ? Number(amount) : null,
      };
    }
  } catch {
    // fall through to generic handling below
  }

  if (/^https?:\/\//.test(text)) {
    try {
      const { hostname } = new URL(text);
      return { merchantName: hostname.replace(/^www\./, ""), amount: null };
    } catch {
      // ignore, fall through
    }
  }

  return { merchantName: text.slice(0, 40), amount: null };
}
