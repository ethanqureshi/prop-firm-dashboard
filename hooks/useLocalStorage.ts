"use client";
import { useState, useEffect } from "react";

export function useLocalStorage<T>(key: string, initialValue: T): [T, (v: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) setStoredValue(JSON.parse(item));
    } catch {
      console.warn(`Failed to read localStorage[${key}]`);
    }
    setHydrated(true);
  }, [key]);

  const setValue = (value: T) => {
    setStoredValue(value);
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      console.warn(`Failed to write localStorage[${key}]`);
    }
  };

  return [storedValue, setValue];
}
