import { VideoSpiderDashboard } from "@/components/video-spider/video-spider-dashboard";

export default function VideoSpiderPage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 leading-none mb-2">
                    Video Spider
                </h1>
                <p className="text-slate-500 font-medium">
                    Traffic- & View-Validierungs-Engine - Enterprise Verification System.
                </p>
            </div>

            <VideoSpiderDashboard />
        </div>
    );
}
