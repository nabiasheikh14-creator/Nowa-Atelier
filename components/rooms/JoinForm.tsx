"use client";

import { useState } from "react";
import { call } from "./RoomTools";

/** One card, two doors: make a room, or sign back in to yours. */
export function JoinForm() {
  const [mode, setMode] = useState<"new" | "back">("new");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handle, setHandle] = useState("");
  const [handleTouched, setHandleTouched] = useState(false);

  async function submit(form: HTMLFormElement) {
    const data = Object.fromEntries(new FormData(form));
    setBusy(true);
    setError(null);
    try {
      const result = await call<{ handle: string | null }>(mode === "new" ? "/api/account/signup" : "/api/account/signin", "POST", data);
      window.location.replace(`${window.location.origin}/${result.handle ? `@${result.handle}` : ""}`);
    } catch (problem) {
      setError((problem as Error).message);
      setBusy(false);
    }
  }

  return (
    <>
      <div className="join-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={mode === "new"} className={mode === "new" ? "on" : ""} onClick={() => setMode("new")}>
          Make a room
        </button>
        <button type="button" role="tab" aria-selected={mode === "back"} className={mode === "back" ? "on" : ""} onClick={() => setMode("back")}>
          Sign in
        </button>
      </div>
      <form
        className="join-form"
        onSubmit={(event) => {
          event.preventDefault();
          void submit(event.currentTarget);
        }}
      >
        {mode === "new" && (
          <>
            <label className="tool-field">
              <span>Your name</span>
              <input
                name="displayName"
                autoComplete="name"
                required
                maxLength={60}
                onChange={(event) => {
                  if (!handleTouched) setHandle(event.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30));
                }}
              />
            </label>
            <label className="tool-field">
              <span>Your room&apos;s address</span>
              <span className="handle-input">
                <i>/@</i>
                <input
                  name="handle"
                  value={handle}
                  onChange={(event) => {
                    setHandleTouched(true);
                    setHandle(event.target.value.toLowerCase());
                  }}
                  required
                  minLength={2}
                  maxLength={30}
                  pattern="[a-z0-9][a-z0-9-]{1,29}"
                  title="Lowercase letters, numbers, and dashes"
                />
              </span>
            </label>
          </>
        )}
        <label className="tool-field">
          <span>Email</span>
          <input name="email" type="email" autoComplete="email" required maxLength={200} />
        </label>
        <label className="tool-field">
          <span>
            Password {mode === "new" && <small>at least 8 characters</small>}
          </span>
          <input name="password" type="password" autoComplete={mode === "new" ? "new-password" : "current-password"} required minLength={mode === "new" ? 8 : 1} maxLength={200} />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="ink-button wide" type="submit" disabled={busy}>
          {busy ? (mode === "new" ? "Making your room…" : "Signing in…") : mode === "new" ? "Make my room" : "Sign in"}
        </button>
        {mode === "new" && <p className="muted small">Your room starts private. You choose when to open it.</p>}
      </form>
    </>
  );
}
