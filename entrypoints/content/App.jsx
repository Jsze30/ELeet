import { useState } from "react"
import { Session } from "@/components/main/session.jsx"

const ELeetLogoUrl = chrome.runtime.getURL("icons/ELeet_logo.png");
const ELeetLogoUrlBack = chrome.runtime.getURL("icons/ELeet_logo_no_back.png");

export default function App() {
    const [isVisible, setIsVisible] = useState(false)

    const toggleVisibility = () => {
        setIsVisible(!isVisible)
    }
    return (
        <div>
            {/* Parrot button that toggles the visibility of the session */}
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

                {/* Name and logo */}
                <div className="absolute top-5 left-5 flex items-center justify-start">
                    <img
                        src={ELeetLogoUrl}
                        alt="ELeet Logo"
                        className="h-8 mr-3 rounded"
                    />
                    <h3 className="text-xl font-bold">ELeet</h3>
                </div>
                
                {/* Renders session component */}
                <div className='grid grid-cols-1 gap-4 items-center w-full'>
                    <Session />
                </div>
            </div>
        </div>
    )
};
