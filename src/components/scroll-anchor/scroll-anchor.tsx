import * as React from 'react';
import { useInView } from 'react-intersection-observer';

interface ChatScrollAnchorProps {
    trackVisibility: boolean;
    isAtBottom: boolean;
    scrollAreaRef: React.RefObject<HTMLDivElement | null>;
}

export function ChatScrollAnchor({
    trackVisibility,
    isAtBottom,
    scrollAreaRef,
}: ChatScrollAnchorProps) {
    const { ref, inView } = useInView({
        trackVisibility,
        delay: 100,
        threshold: 0.1,
    });

    React.useEffect(() => {
        if (isAtBottom && trackVisibility && !inView) {
            if (!scrollAreaRef.current) return;

            const scrollAreaElement = scrollAreaRef.current;
            
            // Smooth scroll to bottom
            scrollAreaElement.scrollTo({
                top: scrollAreaElement.scrollHeight - scrollAreaElement.clientHeight,
                behavior: 'smooth'
            });
        }
    }, [inView, isAtBottom, trackVisibility, scrollAreaRef]);

    return <div ref={ref} className='h-px w-full' />;
}
