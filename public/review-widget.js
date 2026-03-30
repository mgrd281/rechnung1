// public/review-widget.js

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

    // Initialize both widgets
    function init() {
        initStarRating();
        initReviewsWidget();
    }

    function initStarRating() {
        const containers = document.querySelectorAll('.rechnung-profi-stars');

        containers.forEach(container => {
            const productId = container.dataset.productId;
            if (!productId) return;

            fetch(`${BASE_URL}/api/reviews/public?productId=${productId}&t=${Date.now()}`)
                .then(res => res.json())
                .then(data => {
                    if (data.settings && data.settings.reviewsEnabled === false) {
                        container.style.display = 'none';
                        return;
                    }
                    const total = data.stats?.total || 0;
                    const average = data.stats?.average || 0;

                    // Only render if we have data or if we want to show empty state
                    container.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                            <div style="color: #fbbf24; display: flex;">
                                ${getStarsHTML(average)}
                            </div>
                            <span style="font-size: 14px; color: #6b7280;">
                                (${total} Bewertungen)
                            </span>
                        </div>
                    `;

                    container.addEventListener('click', () => {
                        const widget = document.getElementById('rechnung-profi-reviews-widget');
                        if (widget) widget.scrollIntoView({ behavior: 'smooth' });
                    });
                })
                .catch(err => console.error('Failed to load rating:', err));
        });
    }

    function timeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) {
            return seconds === 1 ? "vor 1 Sekunde" : "vor " + seconds + " Sekunden";
        }

        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) {
            return minutes === 1 ? "vor 1 Minute" : "vor " + minutes + " Minuten";
        }

        const hours = Math.floor(minutes / 60);
        if (hours < 24) {
            return hours === 1 ? "vor 1 Stunde" : "vor " + hours + " Stunden";
        }

        const days = Math.floor(hours / 24);
        if (days < 30) {
            return days === 1 ? "vor 1 Tag" : "vor " + days + " Tagen";
        }

        const months = Math.floor(days / 30);
        if (months < 12) {
            return months === 1 ? "vor 1 Monat" : "vor " + months + " Monaten";
        }

        const years = Math.floor(days / 365);
        return years === 1 ? "vor 1 Jahr" : "vor " + years + " Jahren";
    }

    function initReviewsWidget() {
        const widgetContainer = document.getElementById('rechnung-profi-reviews-widget');
        if (!widgetContainer) return;

        const productId = widgetContainer.dataset.productId;
        if (!productId) {
            widgetContainer.innerHTML = '<p style="color:red">Error: No Product ID found</p>';
            return;
        }

        widgetContainer.innerHTML = '<div style="text-align:center; padding: 20px;">Loading reviews...</div>';

        // State
        let allReviews = [];
        let currentFilter = null; // null, 1, 2, 3, 4, 5
        let currentPage = 1;
        const reviewsPerPage = 5;
        let widgetSettings = { primaryColor: '#2563eb', layout: 'list' };
        let stats = { total: 0, average: 0 };
        let summary = null;
        let activeTab = 'reviews'; // 'reviews' | 'gallery'

        fetch(`${BASE_URL}/api/reviews/public?productId=${productId}&t=${Date.now()}`)
            .then(res => res.json())
            .then(data => {
                if (data.settings && data.settings.reviewsEnabled === false) {
                    widgetContainer.style.display = 'none';
                    return;
                }
                widgetSettings = data.settings || widgetSettings;
                allReviews = data.reviews || [];
                stats = data.stats || { total: 0, average: 0 };
                summary = data.summary || null;

                // Inject CSS
                injectStyles(widgetSettings.primaryColor);

                // Initial Render
                renderWidget();
            })
            .catch(err => {
                console.error('Failed to load reviews widget:', err);
                widgetContainer.innerHTML = `<div style="color:red; padding:20px; border:1px solid red; border-radius:8px; background:#fff0f0;">
                    <strong>Failed to load reviews.</strong><br>
                    <small>${err.message}</small>
                </div>`;
            });

        function injectStyles(primaryColor) {
            const style = document.createElement('style');
            style.textContent = `
                .rp-widget { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #111827; max-width: 1200px; margin: 0 auto; padding: 0 20px; }
                .rp-header { display: flex; align-items: center; gap: 30px; padding-bottom: 30px; margin-bottom: 0; flex-wrap: wrap; }
                .rp-divider { height: 1px; background-color: #e5e7eb; margin: 0 0 30px 0; width: 100%; }
                .rp-summary { text-align: center; min-width: 120px; flex-shrink: 0; }
                .rp-big-rating { font-size: 48px; font-weight: 700; line-height: 1; color: ${primaryColor}; margin-bottom: 8px; }
                .rp-total-count { font-size: 14px; color: #6b7280; margin-top: 4px; }
                
                .rp-bars { flex: 1; min-width: 250px; max-width: 500px; }
                .rp-bar-row { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; font-size: 13px; color: #4b5563; cursor: pointer; transition: opacity 0.2s; }
                .rp-bar-row:hover { opacity: 0.8; }
                .rp-bar-row.active .rp-stars { font-weight: bold; }
                .rp-bar-bg { flex: 1; height: 8px; background-color: #f3f4f6; border-radius: 4px; overflow: hidden; }
                .rp-bar-fill { height: 100%; background-color: ${primaryColor}; border-radius: 4px; }
                
                .rp-write-btn { background-color: ${primaryColor}; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: opacity 0.2s; white-space: nowrap; flex-shrink: 0; margin-left: auto; }
                .rp-write-btn:hover { opacity: 0.9; }
                
                .rp-review-list { display: flex; flex-direction: column; gap: 24px; }
                .rp-review-card { padding-bottom: 24px; border-bottom: 1px solid #e5e7eb; }
                .rp-review-card:last-child { border-bottom: none; }
                
                .rp-review-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
                .rp-user-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
                .rp-avatar { width: 32px; height: 32px; background: #f3f4f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; color: #4b5563; font-size: 14px; }
                .rp-username { font-weight: 600; font-size: 14px; }
                .rp-verified { color: #16a34a; font-size: 12px; display: flex; align-items: center; gap: 2px; }
                .rp-date { color: #9ca3af; font-size: 12px; }
                
                .rp-stars { display: flex; color: ${primaryColor}; margin-bottom: 8px; }
                .rp-content { font-size: 15px; line-height: 1.6; color: #374151; }
                .rp-title { font-weight: 600; display: block; margin-bottom: 4px; color: #111827; }

                /* Pagination */
                .rp-pagination { display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 30px; }
                .rp-page-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: 1px solid #e5e7eb; background: white; border-radius: 4px; cursor: pointer; color: #374151; font-size: 14px; transition: all 0.2s; }
                .rp-page-btn:hover { border-color: ${primaryColor}; color: ${primaryColor}; }
                .rp-page-btn.active { background-color: ${primaryColor}; color: white; border-color: ${primaryColor}; }
                .rp-page-btn:disabled { opacity: 0.5; cursor: not-allowed; border-color: #e5e7eb; color: #9ca3af; }

                /* Modal Styles */
                .rp-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: none; justify-content: center; align-items: center; z-index: 10000; }
                .rp-modal { background: white; width: 90%; max-width: 500px; border-radius: 12px; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); position: relative; max-height: 90vh; overflow-y: auto; }
                .rp-modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .rp-modal-title { font-size: 20px; font-weight: bold; margin: 0; }
                .rp-close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280; }
                .rp-form-group { margin-bottom: 16px; }
                .rp-label { display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px; color: #374151; }
                .rp-input, .rp-textarea { width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; box-sizing: border-box; }
                .rp-textarea { min-height: 100px; resize: vertical; }
                .rp-submit-btn { width: 100%; background-color: ${primaryColor}; color: white; border: none; padding: 12px; border-radius: 6px; font-weight: 600; cursor: pointer; margin-top: 10px; }
                .rp-submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }
                
                .rp-star-input { display: flex; gap: 4px; flex-direction: row-reverse; justify-content: flex-end; }
                .rp-star-input input { display: none; }
                .rp-star-input label { cursor: pointer; color: #d1d5db; font-size: 24px; transition: color 0.2s; }
                .rp-star-input label:hover,
                .rp-star-input label:hover ~ label,
                .rp-star-input input:checked ~ label { color: #fbbf24; }

                .rp-helpful-section { display: flex; align-items: center; gap: 12px; margin-top: 16px; padding-top: 16px; border-top: 1px solid #f3f4f6; }
                .rp-helpful-text { font-size: 13px; color: #6b7280; }
                .rp-helpful-btn { display: flex; align-items: center; gap: 6px; background: none; border: 1px solid #e5e7eb; padding: 4px 10px; border-radius: 16px; cursor: pointer; color: #4b5563; font-size: 13px; transition: all 0.2s; }
                .rp-helpful-btn:hover { background-color: #f9fafb; border-color: #d1d5db; }
                .rp-helpful-btn svg { width: 14px; height: 14px; }
                
                /* Grid Layout Styles */
                .rp-layout-grid .rp-review-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
                .rp-layout-grid .rp-review-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; height: 100%; display: flex; flex-direction: column; }
                .rp-layout-grid .rp-review-card:last-child { border-bottom: 1px solid #e5e7eb; }
                .rp-layout-grid .rp-content { flex: 1; }
                
                @media (max-width: 600px) {
                    .rp-header { flex-direction: column; gap: 20px; align-items: center; text-align: center; }
                    .rp-bars { width: 100%; }
                    .rp-write-btn { width: 100%; margin: 10px 0 0 0; }
                    .rp-layout-grid .rp-review-list { grid-template-columns: 1fr; }
                }
            `;
            document.head.appendChild(style);
        }

        function renderWidget() {
            // Filter reviews
            const filteredReviews = currentFilter
                ? allReviews.filter(r => Math.round(r.rating) === currentFilter)
                : allReviews;

            // Filter for Gallery
            const galleryItems = allReviews.filter(r => (r.images && r.images.length > 0) || (r.videos && r.videos.length > 0));

            // Pagination
            const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage);
            const startIndex = (currentPage - 1) * reviewsPerPage;
            const displayedReviews = filteredReviews.slice(startIndex, startIndex + reviewsPerPage);

            // Calculate distribution for bars (always based on ALL reviews)
            const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
            allReviews.forEach(r => {
                const rating = Math.round(r.rating);
                if (distribution[rating] !== undefined) distribution[rating]++;
            });

            // Generate Bars HTML
            let barsHTML = '';
            for (let i = 5; i >= 1; i--) {
                const count = distribution[i];
                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                const isActive = currentFilter === i;
                const opacity = currentFilter && !isActive ? '0.4' : '1';

                barsHTML += `
                    <div class="rp-bar-row ${isActive ? 'active' : ''}" onclick="window.rpFilter(${i})" style="opacity: ${opacity}">
                        <div class="rp-stars" style="margin:0; font-size:12px;">
                            ${getStarsHTML(i).replace(/width="16"/g, 'width="12"').replace(/height="16"/g, 'height="12"')}
                        </div>
                        <div class="rp-bar-bg">
                            <div class="rp-bar-fill" style="width: ${percentage}%"></div>
                        </div>
                        <span style="min-width: 20px; text-align: right;">(${count})</span>
                    </div>
                `;
            }

            // AI Summary HTML
            let summaryHTML = '';
            if (summary) {
                summaryHTML = `
                    <div class="rp-ai-summary" style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; color: #0369a1; font-weight: 600;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 2a10 10 0 0 1 10 10h-10V2z"/><path d="m9 22 3-8 3 8"/><path d="M8 22h8"/></svg>
                            KI-Zusammenfassung
                        </div>
                        <p style="margin: 0 0 16px 0; color: #334155; line-height: 1.6;">${summary.text}</p>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div>
                                <div style="font-weight: 600; color: #166534; margin-bottom: 8px;">Vorteile</div>
                                <ul style="margin: 0; padding-left: 20px; color: #334155;">
                                    ${summary.pros.map(p => `<li style="margin-bottom: 4px;">${p}</li>`).join('')}
                                </ul>
                            </div>
                            <div>
                                <div style="font-weight: 600; color: #991b1b; margin-bottom: 8px;">Nachteile</div>
                                <ul style="margin: 0; padding-left: 20px; color: #334155;">
                                    ${summary.cons.map(c => `<li style="margin-bottom: 4px;">${c}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                    </div>
                `;
            }

            // Modal HTML
            const modalHTML = `
                <div id="rp-modal-overlay" class="rp-modal-overlay">
                    <div class="rp-modal">
                        <div class="rp-modal-header">
                            <h3 class="rp-modal-title">Bewertung schreiben</h3>
                            <button id="rp-close-modal" class="rp-close-btn">&times;</button>
                        </div>
                        <form id="rp-review-form">
                            <div class="rp-form-group">
                                <label class="rp-label">Ihre Bewertung</label>
                                <div class="rp-star-input">
                                    <input type="radio" id="star5" name="rating" value="5" required /><label for="star5">★</label>
                                    <input type="radio" id="star4" name="rating" value="4" /><label for="star4">★</label>
                                    <input type="radio" id="star3" name="rating" value="3" /><label for="star3">★</label>
                                    <input type="radio" id="star2" name="rating" value="2" /><label for="star2">★</label>
                                    <input type="radio" id="star1" name="rating" value="1" /><label for="star1">★</label>
                                </div>
                            </div>
                            <div class="rp-form-group">
                                <label class="rp-label" for="rp-name">Name</label>
                                <input type="text" id="rp-name" name="customerName" class="rp-input" required placeholder="Ihr Name">
                            </div>
                            <div class="rp-form-group">
                                <label class="rp-label" for="rp-email">E-Mail</label>
                                <input type="email" id="rp-email" name="customerEmail" class="rp-input" required placeholder="ihre@email.de">
                            </div>
                            <div class="rp-form-group">
                                <label class="rp-label" for="rp-title">Titel (Optional)</label>
                                <input type="text" id="rp-title" name="title" class="rp-input" placeholder="Zusammenfassung Ihrer Erfahrung">
                            </div>
                            <div class="rp-form-group">
                                <label class="rp-label" for="rp-content">Bewertung</label>
                                <textarea id="rp-content" name="content" class="rp-textarea" required placeholder="Teilen Sie Ihre Erfahrung mit diesem Produkt..."></textarea>
                            </div>
                            <div class="rp-form-group">
                                <label class="rp-label">Fotos/Videos hinzufügen (Optional)</label>
                                <input type="file" name="media" multiple accept="image/*,video/*" class="rp-input">
                                <small style="color:#6b7280; display:block; margin-top:4px;">Max. 5MB pro Datei</small>
                            </div>
                            <button type="submit" class="rp-submit-btn">Bewertung absenden</button>
                        </form>
                    </div>
                </div>
            `;

            // Tabs HTML
            const tabsHTML = `
                <div class="rp-tabs" style="display: flex; gap: 20px; border-bottom: 1px solid #e5e7eb; margin-bottom: 24px;">
                    <button onclick="window.rpTab('reviews')" class="rp-tab-btn ${activeTab === 'reviews' ? 'active' : ''}" style="padding: 10px 0; background: none; border: none; border-bottom: 2px solid ${activeTab === 'reviews' ? widgetSettings.primaryColor : 'transparent'}; color: ${activeTab === 'reviews' ? widgetSettings.primaryColor : '#6b7280'}; font-weight: 600; cursor: pointer;">
                        Bewertungen (${stats.total})
                    </button>
                    <button onclick="window.rpTab('gallery')" class="rp-tab-btn ${activeTab === 'gallery' ? 'active' : ''}" style="padding: 10px 0; background: none; border: none; border-bottom: 2px solid ${activeTab === 'gallery' ? widgetSettings.primaryColor : 'transparent'}; color: ${activeTab === 'gallery' ? widgetSettings.primaryColor : '#6b7280'}; font-weight: 600; cursor: pointer;">
                        Galerie (${galleryItems.length})
                    </button>
                </div>
            `;

            // Content based on Tab
            let contentHTML = '';

            if (activeTab === 'reviews') {
                const reviewsHTML = displayedReviews.map(review => `
                    <div class="rp-review-card">
                        <div class="rp-user-row">
                            <div class="rp-avatar">${review.customerName ? review.customerName.charAt(0).toUpperCase() : '?'}</div>
                            <span class="rp-username">${review.customerName}</span>
                            ${review.isVerified ? `
                                <span class="rp-verified">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="margin-right:2px">
                                        <path d="M12 0a12 12 0 1 0 12 12A12.014 12.014 0 0 0 12 0Zm6.927 8.2-6.845 9.289a1.011 1.011 0 0 1-1.43.188l-4.888-3.908a1 1 0 1 1 1.25-1.562l4.076 3.261 6.227-8.451a1 1 0 1 1 1.61 1.183Z"/>
                                    </svg>
                                    Verifizierter Kauf
                                </span>
                            ` : ''}
                            <span class="rp-date" style="color: #9ca3af; font-size: 12px;">• ${timeAgo(review.createdAt)}</span>
                        </div>
                        <div class="rp-stars">
                            ${getStarsHTML(review.rating)}
                        </div>
                        <div class="rp-content">
                            ${review.title ? `<span class="rp-title">${review.title}</span>` : ''}
                            ${review.content}
                            ${(review.images && review.images.length > 0) ? `
                                <div style="display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap;">
                                    ${review.images.map(img => `<img src="${img}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 6px; border: 1px solid #e5e7eb; cursor: pointer;" onclick="window.open(this.src, '_blank')">`).join('')}
                                </div>
                            ` : ''}
                            ${(review.videos && review.videos.length > 0) ? `
                                <div style="display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap;">
                                    ${review.videos.map(vid => `<video src="${vid}" controls style="width: 160px; height: 90px; object-fit: cover; border-radius: 6px; border: 1px solid #e5e7eb;"></video>`).join('')}
                                </div>
                            ` : ''}
                        </div>
                        <div class="rp-helpful-section">
                            <span class="rp-helpful-text">War diese Bewertung hilfreich?</span>
                            <div style="display:flex; gap:8px;">
                                <button id="rp-helpful-btn-${review.id}" class="rp-helpful-btn" onclick="window.rpVote('${review.id}', 'helpful')" ${sessionStorage.getItem(`rp-vote-${review.id}`) ? 'style="opacity:0.5;cursor:default;"' : ''}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                                    <span id="rp-helpful-count-${review.id}">${review.helpful || 0}</span>
                                </button>
                                <button id="rp-not-helpful-btn-${review.id}" class="rp-helpful-btn" onclick="window.rpVote('${review.id}', 'notHelpful')" ${sessionStorage.getItem(`rp-vote-${review.id}`) ? 'style="opacity:0.5;cursor:default;"' : ''}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>
                                    <span id="rp-not-helpful-count-${review.id}">${review.notHelpful || 0}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('');

                // Pagination HTML
                let paginationHTML = '';
                if (totalPages > 1) {
                    paginationHTML += `<div class="rp-pagination">`;
                    // Prev Button
                    paginationHTML += `<button class="rp-page-btn" onclick="window.rpPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>&lt;</button>`;

                    // Simplified Pagination Logic for brevity
                    for (let i = 1; i <= totalPages; i++) {
                        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                            paginationHTML += `<button class="rp-page-btn ${currentPage === i ? 'active' : ''}" onclick="window.rpPage(${i})">${i}</button>`;
                        } else if (i === currentPage - 2 || i === currentPage + 2) {
                            paginationHTML += `<span style="color:#9ca3af">...</span>`;
                        }
                    }

                    // Next Button
                    paginationHTML += `<button class="rp-page-btn" onclick="window.rpPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>&gt;</button>`;
                    paginationHTML += `</div>`;
                }

                contentHTML = `
                    <div class="rp-review-list">
                        ${reviewsHTML.length > 0 ? reviewsHTML : '<div style="text-align:center; color:#6b7280; padding:20px;">Keine Bewertungen gefunden.</div>'}
                    </div>
                    ${paginationHTML}
                `;
            } else {
                // Gallery View
                if (galleryItems.length === 0) {
                    contentHTML = '<div style="text-align:center; color:#6b7280; padding:40px;">Noch keine Fotos oder Videos vorhanden.</div>';
                } else {
                    const galleryGrid = galleryItems.map(r => {
                        const media = [...(r.images || []), ...(r.videos || [])];
                        // Just show first media item as thumbnail
                        const first = media[0];
                        const isVideo = r.videos && r.videos.includes(first);

                        return `
                            <div style="aspect-ratio: 1; position: relative; cursor: pointer; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;" onclick="window.open('${first}', '_blank')">
                                ${isVideo
                                ? `<video src="${first}" style="width:100%; height:100%; object-fit:cover;"></video><div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); color:white; background:rgba(0,0,0,0.5); padding:10px; border-radius:50%;">▶</div>`
                                : `<img src="${first}" style="width:100%; height:100%; object-fit:cover;">`
                            }
                                <div style="position:absolute; bottom:0; left:0; right:0; background:linear-gradient(transparent, rgba(0,0,0,0.7)); padding:10px; color:white; font-size:12px;">
                                    ${getStarsHTML(r.rating).replace(/width="16"/g, 'width="12"').replace(/height="16"/g, 'height="12"')}
                                    <div style="margin-top:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${r.customerName}</div>
                                </div>
                            </div>
                        `;
                    }).join('');

                    contentHTML = `
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 16px;">
                            ${galleryGrid}
                        </div>
                    `;
                }
            }

            widgetContainer.innerHTML = `
                <div class="rp-widget ${widgetSettings.layout === 'grid' ? 'rp-layout-grid' : ''}">
                    <div class="rp-header">
                        <div class="rp-summary">
                            <div class="rp-big-rating">${stats.average}</div>
                            <div class="rp-stars" style="justify-content:center; margin-bottom:4px;">
                                ${getStarsHTML(stats.average)}
                            </div>
                            <div class="rp-total-count">${stats.total} Bewertungen</div>
                        </div>
                        <div class="rp-bars">
                            ${barsHTML}
                        </div>
                        <button class="rp-write-btn" id="rp-open-modal">Bewertung schreiben</button>
                    </div>
                    
                    ${summaryHTML}
                    ${tabsHTML}
                    
                    ${contentHTML}
                    
                    ${modalHTML}
                </div>
            `;

            attachEventListeners();
        }

        // Global handlers for onclick events in HTML strings
        window.rpFilter = function (rating) {
            if (currentFilter === rating) {
                currentFilter = null; // Toggle off
            } else {
                currentFilter = rating;
            }
            currentPage = 1;
            renderWidget();
        };

        window.rpTab = function (tab) {
            activeTab = tab;
            renderWidget();
        };

        window.rpPage = function (page) {
            currentPage = page;
            renderWidget();
            // Scroll to top of widget
            widgetContainer.scrollIntoView({ behavior: 'smooth' });
        };

        window.rpVote = function (reviewId, action) {
            // Check if already voted in this session
            if (sessionStorage.getItem(`rp-vote-${reviewId}`)) return;

            const countId = action === 'helpful' ? `rp-helpful-count-${reviewId}` : `rp-not-helpful-count-${reviewId}`;
            const countSpan = document.getElementById(countId);

            if (countSpan) {
                const current = parseInt(countSpan.innerText);
                countSpan.innerText = current + 1;
            }

            // Disable buttons visually
            const btnHelpful = document.getElementById(`rp-helpful-btn-${reviewId}`);
            const btnNotHelpful = document.getElementById(`rp-not-helpful-btn-${reviewId}`);

            if (btnHelpful) {
                btnHelpful.style.opacity = '0.5';
                btnHelpful.style.cursor = 'default';
            }
            if (btnNotHelpful) {
                btnNotHelpful.style.opacity = '0.5';
                btnNotHelpful.style.cursor = 'default';
            }

            sessionStorage.setItem(`rp-vote-${reviewId}`, action);

            fetch(`${BASE_URL}/api/reviews/${reviewId}/helpful`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            }).catch(err => console.error('Failed to vote:', err));
        };

        function attachEventListeners() {
            const modal = document.getElementById('rp-modal-overlay');
            const openBtn = document.getElementById('rp-open-modal');
            const closeBtn = document.getElementById('rp-close-modal');
            const form = document.getElementById('rp-review-form');

            if (openBtn) openBtn.onclick = () => modal.style.display = 'flex';
            if (closeBtn) closeBtn.onclick = () => modal.style.display = 'none';
            if (modal) modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

            if (form) {
                form.onsubmit = async (e) => {
                    e.preventDefault();
                    const formData = new FormData(form);
                    const submitBtn = form.querySelector('.rp-submit-btn');
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Wird verarbeitet...';

                    // Handle File Uploads (Convert to Base64)
                    const fileInput = form.querySelector('input[type="file"]');
                    const images = [];
                    const videos = [];

                    if (fileInput && fileInput.files.length > 0) {
                        for (let i = 0; i < fileInput.files.length; i++) {
                            const file = fileInput.files[i];
                            if (file.size > 5 * 1024 * 1024) {
                                alert(`Datei ${file.name} ist zu groß (Max 5MB)`);
                                submitBtn.disabled = false;
                                submitBtn.textContent = 'Bewertung absenden';
                                return;
                            }

                            try {
                                const base64 = await new Promise((resolve, reject) => {
                                    const reader = new FileReader();
                                    reader.onload = () => resolve(reader.result);
                                    reader.onerror = reject;
                                    reader.readAsDataURL(file);
                                });

                                if (file.type.startsWith('image/')) {
                                    images.push(base64);
                                } else if (file.type.startsWith('video/')) {
                                    videos.push(base64);
                                }
                            } catch (err) {
                                console.error('Error reading file:', err);
                            }
                        }
                    }

                    submitBtn.textContent = 'Wird gesendet...';

                    const payload = {
                        productId: productId,
                        rating: formData.get('rating'),
                        customerName: formData.get('customerName'),
                        customerEmail: formData.get('customerEmail'),
                        title: formData.get('title'),
                        content: formData.get('content'),
                        images: images,
                        videos: videos
                    };

                    fetch(`${BASE_URL}/api/reviews/public`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    })
                        .then(res => res.json())
                        .then(response => {
                            if (response.success) {
                                modal.innerHTML = `
                                <div class="rp-modal" style="text-align:center;">
                                    <div style="color: #16a34a; font-size: 48px; margin-bottom: 16px;">✓</div>
                                    <h3 style="margin-bottom: 8px;">Vielen Dank!</h3>
                                    <p style="color: #6b7280; margin-bottom: 24px;">Ihre Bewertung wurde eingereicht und wird nach Prüfung veröffentlicht.</p>
                                    <button onclick="document.getElementById('rp-modal-overlay').style.display='none'" class="rp-submit-btn">Schließen</button>
                                </div>
                            `;
                            } else {
                                alert('Fehler beim Senden: ' + (response.error || 'Unbekannter Fehler'));
                                submitBtn.disabled = false;
                                submitBtn.textContent = 'Bewertung absenden';
                            }
                        })
                        .catch(err => {
                            console.error(err);
                            alert('Ein Fehler ist aufgetreten.');
                            submitBtn.disabled = false;
                            submitBtn.textContent = 'Bewertung absenden';
                        });
                };
            }
        }
    }

    function getStarsHTML(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (rating >= i) {
                stars += '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
            } else if (rating >= i - 0.5) {
                stars += '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none" style="opacity: 0.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
            } else {
                stars += '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
            }
        }
        return stars;
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
