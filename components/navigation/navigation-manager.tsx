'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

export function NavigationManager() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isNavigating, setIsNavigating] = useState(false)

    // 1. Scroll Restoration Logic
    useEffect(() => {
        const handleBeforeUnload = () => {
            // Save scroll position for the current page
            sessionStorage.setItem(`scroll-${window.location.pathname}${window.location.search}`, window.scrollY.toString())
        }

        window.addEventListener('beforeunload', handleBeforeUnload)

        // Check if we have a saved scroll position for the current page
        const fullPath = `${pathname}${searchParams.toString() ? '?' + searchParams.toString() : ''}`
        const savedPosition = sessionStorage.getItem(`scroll-${fullPath}`) || sessionStorage.getItem(`scroll-${pathname}`)

        if (savedPosition) {
            // Small delay to allow content to load
            setTimeout(() => {
                window.scrollTo({
                    top: parseInt(savedPosition),
                    behavior: 'instant'
                })
            }, 50)
        } else {
            // Only scroll to top if the pathname itself changed (new page)
            // If it's just search params changing, we might want to stay where we are
            // unless it's a pagination event.
            window.scrollTo(0, 0)
        }

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
        }
    }, [pathname]) // Only trigger on pathname change, not searchParams

    // 2. Clear stale scroll positions regularly
    useEffect(() => {
        // Basic cleanup: remove oldest items if too many
        const keys = Object.keys(sessionStorage).filter(key => key.startsWith('scroll-'))
        if (keys.length > 50) {
            keys.sort().slice(0, 20).forEach(key => sessionStorage.removeItem(key))
        }
    }, [])

    // 3. Navigation Progress (TopLoader)
    useEffect(() => {
        // We can't detect standard Link clicks easily in App Router without external lib or wrapping Link
        // But we can detect searchParams changes or just provide a manual trigger if needed.
        // For a true TopLoader, usually `nextjs-toploader` package is best.
        // As a fallback without package: we just reset our "isNavigating" state on pathname change.
        setIsNavigating(false)
    }, [pathname, searchParams])

    return (
        <div className="fixed top-0 left-0 w-full z-[100] pointer-events-none">
            {/* 
               If we had a way to detect start, we'd toggle this. 
               Since we can't easily without a library, we rely on the fact that
               most heavy navigations are handled by the browser or simple transitions.
               
               However, to prevent FREEZE sensation, we can add a global 'click' listener 
               that shows a tiny bar if the click target is a link.
            */}
            <script dangerouslySetInnerHTML={{
                __html: `
                (function() {
                    document.addEventListener('click', function(e) {
                        const link = e.target.closest('a');
                        if (link && link.href && link.href.startsWith(window.location.origin) && !link.target && !e.ctrlKey && !e.metaKey) {
                            const bar = document.getElementById('nav-progress-bar');
                            if (bar) {
                                bar.style.width = '30%';
                                bar.style.opacity = '1';
                                setTimeout(() => { bar.style.width = '70%'; }, 500);
                            }
                        }
                    });
                })();
            `}} />
            <div
                id="nav-progress-bar"
                className="h-1 bg-violet-600 transition-all duration-300 ease-out"
                style={{ width: '0%', opacity: 0 }}
            />
        </div>
    )
}
