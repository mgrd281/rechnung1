(function () {
    // Dynamically determine BASE_URL from the script tag's source
    let BASE_URL = 'https://invoice-production-8cd6.up.railway.app'; // Fallback
    try {
        const scriptUrl = document.currentScript ? document.currentScript.src : null;
        if (scriptUrl) {
            BASE_URL = new URL(scriptUrl).origin;
        }
    } catch (e) {
        console.error('Failed to determine BASE_URL from script source, using fallback', e);
    }

    function initExitIntent() {
        // Check if already shown in this session
        if (sessionStorage.getItem('rp-exit-intent-shown')) return;

        // Fetch settings from API
        fetch(`${BASE_URL}/api/marketing/public`)
            .then(res => res.json())
            .then(data => {
                if (!data.exitIntentEnabled) {
                    console.log('Exit Intent Popup is disabled in settings.');
                    return;
                }

                // Initialize Exit Intent Listeners
                let mouseLeft = false;

                document.addEventListener('mouseleave', (e) => {
                    if (e.clientY < 0 && !mouseLeft) {
                        mouseLeft = true;
                        showExitPopup();
                    }
                });
            })
            .catch(err => console.error('Failed to load exit intent settings:', err));
    }

    function showExitPopup() {
        if (sessionStorage.getItem('rp-exit-intent-shown')) return;
        sessionStorage.setItem('rp-exit-intent-shown', 'true');

        // Create Modal HTML
        const modalHTML = `
            <div id="rp-exit-modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); backdrop-filter: blur(5px); display: flex; justify-content: center; align-items: center; z-index: 999999; opacity: 0; transition: opacity 0.4s ease;">
                <div id="rp-exit-modal" style="background: #111111; width: 90%; max-width: 420px; border-radius: 20px; padding: 0; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); transform: scale(0.95); transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); overflow: hidden; position: relative; border: 1px solid #333;">
                    
                    <button id="rp-exit-close" style="position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.1); border: none; width: 32px; height: 32px; border-radius: 50%; font-size: 20px; cursor: pointer; color: #fff; z-index: 10; display: flex; align-items: center; justify-content: center; transition: background 0.2s;">&times;</button>
                    
                    <div style="padding: 40px 30px 30px 30px; text-align: center; color: white;">
                        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #D4AF37 0%, #F3E5AB 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto; box-shadow: 0 0 20px rgba(212, 175, 55, 0.3);">
                            <span style="font-size: 30px;">🎁</span>
                        </div>
                        
                        <h2 style="margin: 0 0 10px 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; background: linear-gradient(to right, #fff, #ccc); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Ein Geschenk für Sie</h2>
                        <p style="margin: 0; color: #9ca3af; font-size: 15px; line-height: 1.6;">Bevor Sie gehen: Sichern Sie sich jetzt Ihren exklusiven Vorteil für diese Bestellung.</p>
                    </div>

                    <div style="padding: 0 30px 40px 30px; text-align: center;">
                        <div style="background: #1a1a1a; border: 1px solid #333; padding: 20px; border-radius: 12px; margin-bottom: 25px; position: relative;">
                            <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #D4AF37; margin-bottom: 8px; font-weight: 600;">Ihr Gutscheincode</span>
                            <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                                <span style="font-family: 'Courier New', monospace; font-size: 28px; font-weight: 700; color: #fff; letter-spacing: 2px;">SAVE10</span>
                            </div>
                            <div style="margin-top: 10px; font-size: 13px; color: #9ca3af;">
                                Läuft ab in: <span id="rp-timer" style="color: #ef4444; font-weight: 700; font-variant-numeric: tabular-nums;">--:--</span>
                            </div>
                            <div style="position: absolute; top: -1px; left: 50%; transform: translateX(-50%); width: 40%; height: 1px; background: linear-gradient(90deg, transparent, #D4AF37, transparent);"></div>
                        </div>

                        <button id="rp-exit-cta" style="width: 100%; background: linear-gradient(135deg, #D4AF37 0%, #B4941F 100%); color: #000; border: none; padding: 16px; border-radius: 10px; font-weight: 700; font-size: 16px; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);">
                            Code kopieren & Sparen
                        </button>
                        
                        <button id="rp-exit-decline" style="background: none; border: none; color: #6b7280; font-size: 13px; margin-top: 20px; cursor: pointer; transition: color 0.2s;">
                            Nein danke, ich möchte den vollen Preis zahlen
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Inject into DOM
        const div = document.createElement('div');
        div.innerHTML = modalHTML;
        document.body.appendChild(div);

        // Timer Logic
        const timerElement = document.getElementById('rp-timer');
        // Random duration between 13 and 25 minutes (in seconds)
        let duration = Math.floor(Math.random() * (25 * 60 - 13 * 60 + 1)) + 13 * 60;

        const updateTimer = () => {
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            if (duration > 0) {
                duration--;
            } else {
                clearInterval(timerInterval);
                timerElement.textContent = "00:00";
                timerElement.style.color = "#6b7280";
            }
        };

        updateTimer(); // Initial call
        const timerInterval = setInterval(updateTimer, 1000);

        // Store interval ID on the modal element to clear it later
        document.getElementById('rp-exit-modal').dataset.timerId = timerInterval;

        // Animate In
        requestAnimationFrame(() => {
            const overlay = document.getElementById('rp-exit-modal-overlay');
            const modal = document.getElementById('rp-exit-modal');
            if (overlay) overlay.style.opacity = '1';
            if (modal) modal.style.transform = 'scale(1)';
        });

        // Event Listeners
        const closeWithTimer = () => {
            clearInterval(timerInterval);
            closeExitPopup();
        };

        document.getElementById('rp-exit-close').onclick = closeWithTimer;
        document.getElementById('rp-exit-decline').onclick = closeWithTimer;
        document.getElementById('rp-exit-modal-overlay').onclick = (e) => {
            if (e.target.id === 'rp-exit-modal-overlay') closeWithTimer();
        };

        document.getElementById('rp-exit-cta').onclick = () => {
            // Copy code to clipboard
            navigator.clipboard.writeText('SAVE10').then(() => {
                const btn = document.getElementById('rp-exit-cta');
                btn.textContent = 'Code kopiert! Weiter zum Checkout...';
                btn.style.background = '#16a34a'; // Green success
                btn.style.color = 'white';

                setTimeout(() => {
                    closeWithTimer();
                }, 1000);
            });
        };
    }

    function closeExitPopup() {
        const overlay = document.getElementById('rp-exit-modal-overlay');
        const modal = document.getElementById('rp-exit-modal');

        if (overlay) overlay.style.opacity = '0';
        if (modal) modal.style.transform = 'scale(0.9)';

        setTimeout(() => {
            const el = document.getElementById('rp-exit-modal-overlay').parentNode;
            if (el) el.remove();
        }, 300);
    }

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initExitIntent);
    } else {
        initExitIntent();
    }

})();
