import { useEffect, useState } from "react";
import { Session } from "@/components/main/session.jsx";
import { Button } from "@/components/ui/button";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/chrome-extension";
// import "./sessionStyles.css";

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
    const run = async () => {
      const res = await getAuth();
      setAuthRes(res);
      console.log("Auth response:", res);
    };
    run();
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
          <>
            {!authButtonPressed ? (
              <div className="w-[320px] h-[160px] flex items-center justify-center text-[hsl(0_0%_95%)] rounded-[14px] antialiased font-[system-ui,-apple-system,Segoe_UI,Roboto,Helvetica,Arial,sans-serif]">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      openSignIn();
                      setAuthButtonPressed(true);
                    }}
                    className="rounded-[12px] px-5 py-3 text-[15px] font-semibold border border-[hsl(270_85%_60%)] text-[hsl(270_85%_45%)] bg-[hsl(270_85%_95%)] transition hover:bg-[hsl(270_85%_60%)] hover:text-white active:translate-y-[1px]"
                  >
                    Log In
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      openSignUp();
                      setAuthButtonPressed(true);
                    }}
                    className="rounded-[12px] px-5 py-3 text-[15px] font-semibold bg-[hsl(270_85%_60%)] text-[hsl(0,0%,95%)] transition hover:bg-[hsl(270_85%_55%)] active:translate-y-[1px]"
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-[320px] h-[160px] flex items-center justify-center text-[hsl(0,0%,0%)] rounded-[14px] antialiased font-[system-ui,-apple-system,Segoe_UI,Roboto,Helvetica,Arial,sans-serif]">
                <div className="flex flex-col items-center gap-4">
                  <p className="text-center">
                    Please complete the authentication in the opened tab. Once
                    done, return here.
                  </p>
                  <Button
                    onClick={async () => {
                      const res = await getAuth();
                      setAuthRes(res);
                      console.log("Auth response after button click:", res);
                      setAuthButtonPressed(false);
                    }}
                    className="rounded-[12px] px-5 py-3 text-[15px] font-semibold bg-[hsl(270_85%_60%)] text-[hsl(0,0%,95%)] transition hover:bg-[hsl(270_85%_55%)] active:translate-y-[1px]"
                  >
                    I've Completed Authentication
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          // Signed in UI
          <div className="grid grid-cols-1 gap-4 items-center w-full">
            <Session />
          </div>
        )}
      </div>
      {/* </ClerkProvider> */}
    </div>
  );
}
