"use client";

import { useState, useEffect } from "react";

const KEY = "ainews_compare";

export function useCompareIds() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    localStorage.removeItem(KEY);
  }, []);

  function update(next: string[]) {
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
    setIds(next);
  }

  return {
    ids,
    add(id: string) {
      if (!ids.includes(id) && ids.length < 5) update([...ids, id]);
    },
    remove(id: string) { update(ids.filter(x => x !== id)); },
    toggle(id: string) {
      update(ids.includes(id) ? ids.filter(x => x !== id) : ids.length < 5 ? [...ids, id] : ids);
    },
    clear() { update([]); },
  };
}
