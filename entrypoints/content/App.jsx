import { useState } from "react"
import { HoverCardDemo } from "@/components/main/HoverDemo.jsx"
import { ResizableDemo } from "@/components/main/ResizableDemo.jsx"
import { TabsDemo } from "@/components/main/TabsDemo.jsx"
import { TooltipDemo } from "@/components/main/TooltipDemo.jsx"
import { Button } from "@/components/ui/button.jsx"
import { ScrollArea } from "@/components/ui/scroll-area.jsx"
import { Session } from "@/components/main/session.jsx"

const parrotLogoUrl = chrome.runtime.getURL("icons/parrot_logo.png");
const parrotLogoUrlBack = chrome.runtime.getURL("icons/parrot_logo_back.png");

export default function App() {
    const [isVisible, setIsVisible] = useState(true)

    const toggleVisibility = () => {
        setIsVisible(!isVisible)
    }
    return (
        <div>
            <button
                onClick={toggleVisibility}
                className="fixed bottom-5 right-5 w-12 h-12 bg-primary text-primary-foreground rounded-full z-[9999452] flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
            >
                {isVisible ? '✕' : <img
                    src={parrotLogoUrlBack}
                    alt="Parrot Logo"
                    style={{ width: '70%', height: '70%', objectFit: 'contain' }} // Show Parrot logo when the panel is hidden
                />}
            </button>
            {isVisible && (
                <div className="fixed bottom-20 min-h-[400px] right-5 min-w-[400px] bg-background  rounded-lg flex justify-center items-center p-4 shadow-lg border">
                    <div className="absolute top-5 left-5 flex items-center justify-start">
                        <img
                            src={parrotLogoUrl}
                            alt="Parrot Logo"
                            className="h-8 mr-3 rounded"
                        />
                        <h3 className="text-xl font-bold">Parrot</h3>
                    </div>
                    {/* <ScrollArea className="w-full h-[350px] mx-auto items-center flex justify-center"> */}
                    <div className='grid grid-cols-1 gap-4 items-center w-full'>
                        {/* <Button>
                            Click Me
                        </Button>
                        <TooltipDemo /> */}
                        {/* <HoverCardDemo /> */}
                        {/* <TabsDemo /> */}
                        <Session />

                        {/* <ResizableDemo /> */}
                    </div>
                    {/* </ScrollArea> */}
                </div>
            )}
        </div>
    )
};
