import { chromium, Browser, Page } from 'playwright';
import { VideoReason, PlayerState } from '@/types/video-spider-types';

export interface browserVerificationResult {
    playable: boolean;
    reason: VideoReason;
    playerState: PlayerState;
    watchProgressSeconds?: number;
    screenshotBase64?: string;
    finalUrl: string;
    title: string;
    channelName: string;
    duration?: string;
}

export async function verifyVideoWithBrowser(
    url: string,
    mode: 'VERIFY' | 'PLAY',
    watchSeconds: number,
    mute: boolean,
    captureScreenshot: boolean
): Promise<browserVerificationResult> {
    let browser: Browser | null = null;
    try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        });
        const page = await context.newPage();

        // SSRF Protection: Ensure URL is YouTube
        if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
            throw new Error('Non-YouTube URL blocked');
        }

        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

        // Handle Consent Wall (Typical for YouTube in EU)
        const consentButton = await page.$('button[aria-label*="Alle akzeptieren"], button[aria-label*="Accept all"]');
        if (consentButton) {
            await consentButton.click();
            await page.waitForLoadState('networkidle');
        }

        const title = await page.title();
        const content = await page.content();

        let playable = true;
        let reason: VideoReason = 'ok';
        let playerState: PlayerState = 'ready';

        // Check for common error states
        if (content.includes('Video unavailable') || content.includes('Dieses Video ist nicht verfügbar')) {
            playable = false;
            reason = 'removed';
        } else if (content.includes('Private video') || content.includes('Privates Video')) {
            playable = false;
            reason = 'private';
        } else if (content.includes('The uploader has not made this video available in your country')) {
            playable = false;
            reason = 'region_blocked';
        } else if (content.includes('age-restricted') || content.includes('confirm your age')) {
            playable = false;
            reason = 'age_gate';
        }

        let watchProgressSeconds = 0;

        if (playable && mode === 'PLAY') {
            try {
                // Mute if requested
                if (mute) {
                    await page.keyboard.press('m');
                }

                // Click play button (usually the large play button or the player itself)
                const playButton = await page.$('.ytp-large-play-button');
                if (playButton) {
                    await playButton.click();
                    playerState = 'playing';

                    // Wait for X seconds
                    const startTime = Date.now();
                    await page.waitForTimeout(watchSeconds * 1000);
                    watchProgressSeconds = (Date.now() - startTime) / 1000;
                }
            } catch (playError) {
                console.error('Playback failed:', playError);
                playerState = 'error';
            }
        }

        let screenshotBase64 = '';
        if (captureScreenshot) {
            screenshotBase64 = (await page.screenshot()).toString('base64');
        }

        // Try to get channel name
        const channelName = await page.$eval('yt-formatted-string.ytd-channel-name a', el => el.textContent).catch(() => 'Unknown Channel');

        return {
            playable,
            reason,
            playerState,
            watchProgressSeconds,
            screenshotBase64,
            finalUrl: page.url(),
            title: title || 'No Title',
            channelName: channelName || 'Unknown Channel',
        };

    } catch (error: any) {
        console.error('Browser verification error:', error);
        return {
            playable: false,
            reason: 'unknown',
            playerState: 'error',
            finalUrl: url,
            title: 'Error',
            channelName: 'Error',
        };
    } finally {
        if (browser) await browser.close();
    }
}
