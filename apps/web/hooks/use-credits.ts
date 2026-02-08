"use client";

import { BACKEND_URL } from "@/app/config";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "./useAuth";

/** Event target for credit updates (e.g. after payment or generation). */
export const creditUpdateEvent = new EventTarget();

export function useCredits() {
  const { getToken } = useAuth();
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCredits = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        setCredits(0);
        return;
      }

      const response = await fetch(`${BACKEND_URL}/credits`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        setCredits(data.credits ?? 0);
      }
    } catch (error) {
      console.error("Error fetching credits:", error);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchCredits();

    const handleCreditUpdate = () => {
      fetchCredits();
    };

    creditUpdateEvent.addEventListener("creditUpdate", handleCreditUpdate);
    const interval = setInterval(fetchCredits, 60 * 1000);

    return () => {
      creditUpdateEvent.removeEventListener("creditUpdate", handleCreditUpdate);
      clearInterval(interval);
    };
  }, [fetchCredits]);

  return { credits, loading, refreshCredits: fetchCredits };
}
