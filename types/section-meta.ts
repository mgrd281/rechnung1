import { LucideIcon } from 'lucide-react'

/**
 * Metadata for each section/page in the application
 * Used to display consistent headers with icons and navigation
 */
export interface SectionMeta {
    /** Display title of the section */
    title: string

    /** Lucide icon component */
    icon: LucideIcon

    /** Optional color for the icon (hex format) */
    color?: string

    /** Optional subtitle/description */
    description?: string
}
