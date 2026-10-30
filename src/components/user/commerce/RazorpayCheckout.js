"use client";

let scriptPromise;

function loadRazorpayScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Payment checkout is only available in a browser."));
  }

  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => window.Razorpay
      ? resolve(window.Razorpay)
      : reject(new Error("Razorpay checkout could not be initialized."));
    script.onerror = () => reject(new Error("Razorpay checkout could not be loaded. Check your connection and try again."));
    document.head.appendChild(script);
  }).catch((error) => {
    scriptPromise = null;
    throw error;
  });

  return scriptPromise;
}

export async function openRazorpayCheckout(options) {
  const Razorpay = await loadRazorpayScript();

  return new Promise((resolve, reject) => {
    const checkout = new Razorpay({
      ...options,
      handler: (response) => resolve({ type: "success", response }),
      modal: {
        ondismiss: () => resolve({ type: "dismissed" }),
      },
    });

    checkout.on("payment.failed", (response) => {
      const description = response?.error?.description || "Payment failed. Please try again.";
      const error = new Error(description);
      error.paymentFailure = response?.error || null;
      reject(error);
    });

    checkout.open();
  });
}
