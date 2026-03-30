'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

interface NavigateOptions {
    replace?: boolean
    scroll?: boolean
    preserveState?: boolean
}

export function useSafeNavigation() {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const navigate = (url: string, options?: NavigateOptions) => {
        startTransition(() => {
            if (options?.preserveState) {
                // Save current state to sessionStorage
                const currentState = {
                    scrollPosition: window.scrollY,
                    timestamp: Date.now(),
                    pathname: window.location.pathname
                }
                sessionStorage.setItem(
                    `nav-state-${window.location.pathname}`,
                    JSON.stringify(currentState)
                )
            }

            if (options?.replace) {
                router.replace(url)
            } else {
                router.push(url)
            }

            // Handle scrolling
            if (options?.scroll !== false) {
                // Scroll to top after navigation
                setTimeout(() => window.scrollTo(0, 0), 0)
            }
        })
    }

    const back = () => {
        startTransition(() => {
            router.back()
        })
    }

    const forward = () => {
        startTransition(() => {
            router.forward()
        })
    }

    const refresh = () => {
        startTransition(() => {
            router.refresh()
        })
    }

    return {
        navigate,
        back,
        forward,
        refresh,
        isNavigating: isPending,
        router // Expose router for advanced use cases
    }
}
