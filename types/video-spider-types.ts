export type VideoSpiderStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'STOPPED';
export type VideoSpiderMode = 'VERIFY' | 'PLAY';
export type VideoReason = 'ok' | 'removed' | 'private' | 'region_blocked' | 'age_gate' | 'consent_wall' | 'captcha' | 'unknown';
export type PlayerState = 'ready' | 'playing' | 'error';

export interface VideoSpiderJob {
    id: string;
    organizationId: string;
    status: VideoSpiderStatus;
    spiderCount: number;
    mode: VideoSpiderMode;
    watchSeconds: number;
    mute: boolean;
    captureProof: boolean;
    totalUrls: number;
    processedCount: number;
    playableCount: number;
    blockedCount: number;
    failedCount: number;
    errorMessage?: string;
    startedAt?: string;
    finishedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface VideoSpiderResult {
    id: string;
    jobId: string;
    inputUrl: string;
    videoId?: string;
    finalUrl?: string;
    title?: string;
    channelName?: string;
    duration?: string;
    playable: boolean;
    reason?: VideoReason;
    playerState?: PlayerState;
    watchProgressProgress?: number;
    screenshotUrl?: string;
    rawLogs?: any;
    createdAt: string;
}

export interface VideoSpiderStats {
    totalJobs: number;
    totalVerified: number;
    playablePercentage: number;
    errorRate: number;
}
