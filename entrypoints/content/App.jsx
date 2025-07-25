import { useState } from "react"
import { HoverCardDemo } from "@/components/main/HoverDemo.jsx"
import { ResizableDemo } from "@/components/main/ResizableDemo.jsx"
import { TabsDemo } from "@/components/main/TabsDemo.jsx"
import { TooltipDemo } from "@/components/main/TooltipDemo.jsx"
import { Button } from "@/components/ui/button.jsx"
import { ScrollArea } from "@/components/ui/scroll-area.jsx"


export default function App() {
    const [isVisible, setIsVisible] = useState(false)

    const toggleVisibility = () => {
        setIsVisible(!isVisible)
    }

    return (
        <div>
            <button
                onClick={toggleVisibility}
                className="fixed bottom-2 right-2 w-12 h-12 bg-primary text-primary-foreground rounded-full z-[9999452] flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
            >
                {isVisible ? '×' : '☰'}
            </button>
            {isVisible && (
                <div className="fixed bottom-16 min-h-[400px] right-2 min-w-[400px] bg-background z-[9999451] rounded-lg flex justify-center items-center p-4 shadow-lg border">
                    {/* <ScrollArea className="w-full h-[350px] mx-auto items-center flex justify-center"> */}
                    <div className='grid grid-cols-1 gap-4 items-center w-full'>
                        {/* <Button>
                            Click Me
                        </Button>
                        <TooltipDemo /> */}
                        {/* <HoverCardDemo /> */}
                        <TabsDemo />
                        {/* <ResizableDemo /> */}
                    </div>
                    {/* </ScrollArea> */}
                </div>
            )}
        </div>
    )
};
