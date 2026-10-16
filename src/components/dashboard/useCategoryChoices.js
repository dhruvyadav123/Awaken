"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { accountFetch } from "@/lib/client-account";
import { availableCategories, loadFacilitatorCategories } from "@/lib/dashboard/categories";

export default function useCategoryChoices(enabled, type) {
  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const generation = useRef(0);
  const reload = useCallback(async () => {
    const request = ++generation.current;
    if (!enabled) return;
    setLoading(true);
    setLoaded(false);
    setError("");
    setData([]);
    try {
      const result = await loadFacilitatorCategories(accountFetch);
      if (generation.current === request) setData(availableCategories(result, type));
    } catch (caught) {
      if (generation.current === request) setError(caught.message);
    } finally {
      if (generation.current === request) { setLoading(false); setLoaded(true); }
    }
  }, [enabled, type]);
  useEffect(() => {
    const counter = generation;
    const timer = setTimeout(() => void reload(), 0);
    return () => { clearTimeout(timer); counter.current++; };
  }, [reload]);
  return { data, error, loading: enabled && (loading || !loaded), reload };
}
