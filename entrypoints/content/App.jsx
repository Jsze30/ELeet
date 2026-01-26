import { useEffect, useState } from "react";
import { Session } from "@/components/main/session.jsx";
import { Button } from "@/components/ui/button";

const ELeetLogoUrl = chrome.runtime.getURL("icons/ELeet_logo.png");
const ELeetLogoUrlBack = chrome.runtime.getURL("icons/ELeet_logo_no_back.png");

async function getAuth() {
  return await chrome.runtime.sendMessage({ type: "CLERK_GET_AUTH" });
}

async function openSignIn() {
  const redirectUrl = window.location.href;

  await chrome.runtime.sendMessage({
    type: "OPEN_TAB",
    url: `https://accounts.eleetcoder.com/sign-in?redirect_url=${encodeURIComponent(
      redirectUrl
    )}`,
  });
}

async function openSignUp() {
  await chrome.runtime.sendMessage({
    type: "OPEN_TAB",
    url: "https://accounts.eleetcoder.com/sign-up",
  });
}

export default function App() {
  const [isVisible, setIsVisible] = useState(true);
  const [authButtonPressed, setAuthButtonPressed] = useState(false);
  const [authRes, setAuthRes] = useState(null);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };
  useEffect(() => {
    // Run once on component mount to hide the gray bounding box
    const style = document.createElement('style');
    style.textContent = `
      [data-layout-path="/ts0"]::after {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      const res = await getAuth();

      if (!mounted) return;

      // Optional: only update state if something actually changed
      setAuthRes((prev) => {
        setAuthButtonPressed(false);
        if (
          prev?.userId === res?.userId &&
          prev?.sessionId === res?.sessionId
        ) {
          return prev;
        }
        return res;
      });

      // console.log("Auth response:", res);
    };

    // Run immediately once
    run();

    // Then run every 2 seconds
    const intervalId = setInterval(run, 2000);

    // Cleanup on unmount
    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const isAuthed = Boolean(authRes?.ok && authRes?.userId);
  const avatarUrl = authRes?.imageUrl ?? null;

  return (
    <div>
      {/* ELeet button that toggles the visibility of the session */}
      <button
        onClick={toggleVisibility}
        className="fixed bottom-5 right-5 w-12 h-12 bg-primary text-primary-foreground rounded-full z-[9999452] flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
      >
        {isVisible ? (
          "✕"
        ) : (
          <img
            src={ELeetLogoUrlBack}
            alt="ELeet Logo"
            style={{ width: "70%", height: "70%", objectFit: "contain" }}
          />
        )}
      </button>

      {/* 400x400px white panel */}
      <div
        className={`fixed bottom-20 min-h-[350px] right-5 min-w-[335px] bg-background rounded-lg flex justify-center items-center p-4 shadow-lg border ${
          isVisible
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Header (shared) */}
        <div className="absolute top-5 left-5 right-5 flex items-center justify-between">
          <div className="flex items-center">
            <img
              src={ELeetLogoUrl}
              alt="ELeet Logo"
              className="h-8 mr-3 rounded"
            />
            <h3 className="text-xl font-bold">ELeet</h3>
          </div>

          {/* Avatar (only when signed in and we have an image url) */}
          {isAuthed && avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile avatar"
              className="h-8 w-8 rounded-full cursor-pointer"
              onClick={() => {
                chrome.runtime.sendMessage({
                  type: "OPEN_TAB",
                  url: "https://eleetcoder.com",
                });
              }}
            />
          ) : null}
        </div>

        {/* Signed out UI */}
        {!isAuthed ? (
          <div className="w-[320px] h-[160px] flex items-center justify-center text-[hsl(0_0%_95%)] rounded-[14px] antialiased font-[system-ui,-apple-system,Segoe_UI,Roboto,Helvetica,Arial,sans-serif]">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  openSignIn();
                }}
                className="text-black/95 border-black hover:bg-black/10 hover:text-black/95 rounded-full"
              >
                Log In
              </Button>

              <Button
                variant="default"
                onClick={() => {
                  openSignUp();
                }}
                className="bg-black text-white/95 hover:bg-black/70 hover:text-white/95 rounded-full"
              >
                Sign Up
              </Button>
            </div>
          </div>
        ) : (
          // Signed in UI
          <div className="grid grid-cols-1 gap-4 items-center w-full">
            <Session />
          </div>
        )}
      </div>
    </div>
  );
}