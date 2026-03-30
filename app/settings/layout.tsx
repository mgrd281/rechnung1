import { HeaderNavIcons } from '@/components/navigation/header-nav-icons'
import { SettingsSidebar } from '@/components/settings/settings-sidebar'

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-4">
                            <HeaderNavIcons />
                            <div className="h-6 w-px bg-slate-200 mx-2" />
                            <h1 className="text-lg font-bold text-slate-900">Einstellungen</h1>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Sidebar */}
                    <aside className="w-full lg:w-64 flex-shrink-0">
                        <div className="lg:sticky lg:top-24">
                            <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Einstellungen</h3>
                            <SettingsSidebar />
                        </div>
                    </aside>

                    {/* Right Content */}
                    <main className="flex-1 min-w-0">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    )
}
