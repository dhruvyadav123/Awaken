"use client";
import { useEffect, useState } from "react";
import { accountFetch } from "@/lib/client-account";
import { identityOf, dashboardHome } from "@/lib/dashboard/identity";
import { subscribeSession } from "@/lib/session";

export default function useVerifiedAccount(pathname) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    let active = true; let sequence = 0;
    const verify = async () => {
      const request = ++sequence;
      try {
        const identity = identityOf(await accountFetch("auth/me"));
        if (active && request === sequence) setUser(dashboardHome(identity) ? identity : null);
      } catch { if (active && request === sequence) setUser(null); }
      finally { if (active && request === sequence) setChecking(false); }
    };
    const timer = setTimeout(verify, 0);
    const unsubscribe = subscribeSession(verify);
    window.addEventListener("focus", verify);
    return () => { active = false; clearTimeout(timer); unsubscribe(); window.removeEventListener("focus", verify); };
  }, [pathname]);
  return { user, checking };
}
