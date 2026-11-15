"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Book } from "@/lib/types";
import { ALL_TAGS } from "@/lib/genres";
import { NOWHERE, parsePlace, placeToSearch, type Place } from "@/lib/links";

function here(): string {
  return `${window.location.pathname}${window.location.search}`;
}

/** Where the visitor arrived, read once from the address they opened. */
export function initialPlace(books: Book[]): Place {
  return typeof window === "undefined" ? NOWHERE : parsePlace(window.location.search, books, ALL_TAGS);
}

/**
 * The URL is the source of truth for where you are in the library.
 * `go` moves (and records a history step); `onPop` hears the back and forward buttons.
 */
export function usePlace(books: Book[], onPop?: (next: Place, previous: Place) => void) {
  const [place, setPlace] = useState<Place>(() => initialPlace(books));
  const current = useRef(place);
  const popRef = useRef(onPop);

  useEffect(() => {
    popRef.current = onPop;
  }, [onPop]);

  useEffect(() => {
    const handler = () => {
      const next = parsePlace(window.location.search, books, ALL_TAGS);
      const previous = current.current;
      current.current = next;
      setPlace(next);
      popRef.current?.(next, previous);
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [books]);

  const go = useCallback(
    (patch: Partial<Place>, how: "push" | "replace" = "push") => {
      const next = { ...current.current, ...patch };
      current.current = next;
      setPlace(next);
      const url = `${window.location.pathname}${placeToSearch(next, books)}`;
      if (url === here()) return;
      if (how === "push") window.history.pushState(null, "", url);
      else window.history.replaceState(null, "", url);
    },
    [books],
  );

  return { place, go };
}
