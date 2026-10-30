"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addMembershipToCart } from "@/lib/cart";

export default function MembershipPurchaseButton({ planId, className = "" }) {
  const router = useRouter();
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  async function buySubscription() {
    if (!planId || working) return;

    setWorking(true);
    setError("");

    try {
      await addMembershipToCart(planId);
      router.push("/cart");
    } catch (caught) {
      if (caught?.status === 401 || /sign in|unauthoriz|log.?in/i.test(caught?.message || "")) {
        router.push(`/auth/login?next=${encodeURIComponent("/infinity/membership")}`);
        return;
      }

      setError(caught?.message || "This subscription could not be added to your cart.");
      setWorking(false);
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={buySubscription}
        disabled={!planId || working}
        className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#315a48] px-4 text-sm font-semibold text-white transition hover:bg-[#254737] disabled:cursor-wait disabled:opacity-60 ${className}`}
      >
        {working ? "Adding to cart…" : "Buy subscription"}
        <span aria-hidden="true">→</span>
      </button>
      {error && <p role="alert" className="mt-2 text-xs leading-5 text-[#9a493b]">{error}</p>}
    </div>
  );
}
