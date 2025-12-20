import { useState } from "react"
import { Session } from "@/components/main/session.jsx"
import { Button } from "@/components/ui/button";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton
} from '@clerk/chrome-extension'
// import "./sessionStyles.css";

const ELeetLogoUrl = chrome.runtime.getURL("icons/ELeet_logo.png");
const ELeetLogoUrlBack = chrome.runtime.getURL("icons/ELeet_logo_no_back.png");

// const PUBLISHABLE_KEY = import.meta.env.WXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
// const SYNC_HOST = import.meta.env.WXT_PUBLIC_CLERK_SYNC_HOST;

// if (!PUBLISHABLE_KEY || !SYNC_HOST) {
//   throw new Error('Please add the WXT_PUBLIC_CLERK_PUBLISHABLE_KEY and WXT_PUBLIC_CLERK_SYNC_HOST to the .env file')
// }

export default function App() {
    const [isVisible, setIsVisible] = useState(true)

    const toggleVisibility = () => {
        setIsVisible(!isVisible)
    }
    return (
        <ClerkProvider
            publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
            appearance={{
                cssLayerName: 'clerk',
                variables: {
                    fontFamily:
                    "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
                },
                elements: {
                    userButtonTrigger: "clerk-userbtn-trigger",
                    userButtonAvatarBox: "clerk-avatar-box",
                    userButtonAvatarImage: "clerk-avatar-img",
                },
            }}
        >
            <div>
                {/* ELeet button that toggles the visibility of the session */}
                <button
                    onClick={toggleVisibility}
                    className="fixed bottom-5 right-5 w-12 h-12 bg-primary text-primary-foreground rounded-full z-[9999452] flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
                >
                    {isVisible ? '✕' : <img
                        src={ELeetLogoUrlBack}
                        alt="ELeet Logo"
                        style={{ width: '70%', height: '70%', objectFit: 'contain' }}
                    />}
                </button>
                
                {/* 400x400px white panel */}
                <div 
                    className={`fixed bottom-20 min-h-[350px] right-5 min-w-[335px] bg-background rounded-lg flex justify-center items-center p-4 shadow-lg border ${
                        isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                >

                    {/* If signed out, then display just name logo, sign in and sign up button */}
                    <SignedIn>
                        <div className="absolute top-5 left-5 right-5 flex items-center justify-between">
                            <div className="flex items-center">
                                <img src={ELeetLogoUrl} alt="ELeet Logo" className="h-8 mr-3 rounded" />
                                <h3 className="text-xl font-bold">ELeet</h3>
                            </div>
                            <UserButton/>
                        </div>
                        <div className='grid grid-cols-1 gap-4 items-center w-full'>
                            <Session />
                        </div>
                    </SignedIn>

                    {/* If signed in, then display name, logo, and appropriate session info */}
                    <SignedOut>
                        <div className="absolute top-5 left-5 right-5 flex items-center justify-between">
                            <div className="flex items-center">
                                <img src={ELeetLogoUrl} alt="ELeet Logo" className="h-8 mr-3 rounded" />
                                <h3 className="text-xl font-bold">ELeet</h3>
                            </div>
                            <UserButton/>
                        </div>
                        <div className="w-[320px] h-[160px] flex items-center justify-center text-[hsl(0_0%_95%)] rounded-[14px] antialiased font-[system-ui,-apple-system,Segoe_UI,Roboto,Helvetica,Arial,sans-serif]">
                            <div className="flex items-center gap-4">
                            <SignInButton mode="modal">
                                <button
                                type="button"
                                className="rounded-[12px] px-5 py-3 text-[15px] font-semibold border border-[hsl(270_85%_60%)] text-[hsl(270_85%_45%)] bg-[hsl(270_85%_95%)] transition hover:bg-[hsl(270_85%_60%)] hover:text-white active:translate-y-[1px]"
                                >
                                Log In
                                </button>
                            </SignInButton>

                            <SignUpButton mode="modal">
                                <button
                                type="button"
                                className="rounded-[12px] px-5 py-3 text-[15px] font-semibold bg-[hsl(270_85%_60%)] text-[hsl(0,0%,95%)] transition hover:bg-[hsl(270_85%_55%)] active:translate-y-[1px]"
                                >
                                Sign Up
                                </button>
                            </SignUpButton>
                            </div>
                        </div>
                    </SignedOut>

                </div>
            </div>
        </ClerkProvider>
    )
};
