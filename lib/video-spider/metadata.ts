export interface VideoMetadata {
    videoId: string;
    title: string;
    channelName: string;
    thumbnailUrl: string;
    exists: boolean;
}

export async function fetchVideoMetadata(url: string): Promise<VideoMetadata | null> {
    try {
        const videoId = extractVideoId(url);
        if (!videoId) {
            return {
                videoId: '',
                title: 'Invalid URL',
                channelName: 'Check link format',
                thumbnailUrl: '',
                exists: false
            };
        }

        // Use YouTube oEmbed API for fast metadata fetch without API key
        const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
        const response = await fetch(oEmbedUrl);

        if (!response.ok) {
            let errorReason = 'Video nicht verfügbar';
            if (response.status === 404) errorReason = 'Video nicht gefunden (404)';
            if (response.status === 403) errorReason = 'Zugriff verweigert (Private/Region)';

            return {
                videoId,
                title: errorReason,
                channelName: 'Prüfung fehlgeschlagen',
                thumbnailUrl: '',
                exists: false
            };
        }

        const data = await response.json();
        return {
            videoId,
            title: data.title || '',
            channelName: data.author_name || '',
            thumbnailUrl: data.thumbnail_url || '',
            exists: true
        };
    } catch (error) {
        console.error('Error fetching video metadata:', error);
        return {
            videoId: '',
            title: 'Fetch Error',
            channelName: 'Network issue',
            thumbnailUrl: '',
            exists: false
        };
    }
}

export function extractVideoId(url: string): string | null {
    if (!isValidUrl(url)) return null;

    const patterns = [
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
        /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/,
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) return match[1];
    }

    return null;
}

function isValidUrl(urlString: string): boolean {
    try {
        const url = new URL(urlString);
        // Block non-http(s)
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;

        // Block private IPs, localhost, etc.
        const hostname = url.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') return false;
        if (hostname.startsWith('192.168.') || hostname.startsWith('10.')) return false;

        return true;
    } catch {
        return false;
    }
}

export function normalizeYoutubeUrl(url: string): string | null {
    const videoId = extractVideoId(url);
    if (!videoId) return null;
    return `https://www.youtube.com/watch?v=${videoId}`;
}
