// ═══════════════════════════════════════════════════════
// HOST PROFILE JS
// ═══════════════════════════════════════════════════════

async function openHostModal(hostUserId) {
    showPage('view-host');
    const page = document.getElementById('page-view-host');
    page.innerHTML = '<div class="loading">Loading host profile...</div>';

    try {
        const [userRes, listingsRes] = await Promise.all([
            fetch(`/api/Users/${hostUserId}`),
            fetch(`/api/Listings/host/${hostUserId}`)
        ]);
        const host = await userRes.json();
        const listings = await listingsRes.json();
        const activeListings = listings.filter(l => l.isAvailable);

        page.innerHTML = `
            <button class="btn-ghost" onclick="history.back()" style="margin-bottom:24px">← Back</button>

            <div class="page-header">
                <h2>Host Profile</h2>
                <p>View this host's public information.</p>
            </div>

            <!-- TOP: Avatar + Info -->
            <div style="display:grid;grid-template-columns:240px 1fr;gap:24px;align-items:start;margin-bottom:32px">
                <div class="form-card" style="text-align:center;padding:28px 20px">
                    <div style="width:90px;height:90px;border-radius:50%;background:var(--red);
                                margin:0 auto 14px;display:flex;align-items:center;
                                justify-content:center;font-size:32px;color:#fff;overflow:hidden">
                        ${host.profilePicUrl
                ? `<img src="${host.profilePicUrl}" style="width:100%;height:100%;object-fit:cover"/>`
                : `<span style="font-family:'Bebas Neue',sans-serif;font-size:36px">
                                   ${host.fullName ? host.fullName.charAt(0).toUpperCase() : '🐗'}
                               </span>`
            }
                    </div>
                    <div style="font-family:'Bebas Neue',sans-serif;font-size:20px;
                                letter-spacing:1px;color:var(--text)">${host.fullName || 'Host'}</div>
                    <div style="font-size:12px;color:var(--muted);margin-top:4px">
                        ${host.roles ? host.roles.join(' & ') : 'Host'}
                    </div>
                    <div style="font-size:13px;color:var(--muted);font-style:italic;
                                margin-top:8px;line-height:1.4">
                        ${host.bio || 'No bio yet.'}
                    </div>
                </div>

                <div class="form-card" style="max-width:100%">
                    <div class="card-top">
                        <div class="form-title" style="font-size:22px">Account Info</div>
                        <div class="form-subtitle">This host's public information.</div>
                    </div>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Full Name</label>
                            <span>${host.fullName || '—'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Role(s)</label>
                            <span>${host.roles ? host.roles.join(' & ') : '—'}</span>
                        </div>
                        <div class="detail-item" style="grid-column:span 2">
                            <label>Bio</label>
                            <span style="font-size:14px;font-weight:400;font-style:italic;
                                         color:var(--muted);font-family:'Source Serif 4',serif">
                                ${host.bio || 'No bio yet.'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ACTIVE LISTINGS SECTION -->
            <div class="section-divider"><span>Active Listings</span></div>

            <!-- View toggle -->
            <div class="view-toggle" style="margin-bottom:16px">
                <button class="view-toggle-btn active" id="host-btn-list" onclick="setHostView('list')">☰ List View</button>
                <button class="view-toggle-btn" id="host-btn-map" onclick="setHostView('map')">🗺 Map View</button>
            </div>

            <!-- List view -->
            <div id="host-listings-view">
                ${activeListings.length === 0
                ? `<div class="empty"><div class="empty-icon">🅿️</div><p>No active listings.</p></div>`
                : `<div class="listings-grid">
                        ${activeListings.map(l => `
                            <div class="listing-card" onclick="viewListing(${l.listingID})">
                                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
                                    <h3>${l.title}</h3>
                                    <span class="badge available">Available</span>
                                </div>
                                <div class="location">📍 ${l.location || 'Fayetteville, AR'}</div>
                                <div class="price">$${l.pricePerHour}<span>/hr</span></div>
                            </div>`).join('')}
                       </div>`
            }
            </div>

            <!-- Map view -->
            <div id="host-map-view" style="display:none;border-radius:var(--radius);
                 overflow:hidden;border:1.5px solid var(--border);margin-top:8px">
                <div id="host-leaflet-map" style="height:400px;width:100%"></div>
            </div>`;

        // Init map with host's listings
        initHostMap(activeListings);

    } catch {
        page.innerHTML = `
            <button class="btn-ghost" onclick="history.back()" style="margin-bottom:24px">← Back</button>
            <div class="empty"><div class="empty-icon">⚠️</div><p>Could not load host profile.</p></div>`;
    }
}

function setHostView(view) {
    const listView = document.getElementById('host-listings-view');
    const mapView = document.getElementById('host-map-view');
    const btnList = document.getElementById('host-btn-list');
    const btnMap = document.getElementById('host-btn-map');

    if (view === 'map') {
        listView.style.display = 'none';
        mapView.style.display = 'block';
        btnMap.classList.add('active');
        btnList.classList.remove('active');
        setTimeout(() => hostMap && hostMap.invalidateSize(), 100);
    } else {
        listView.style.display = 'block';
        mapView.style.display = 'none';
        btnList.classList.add('active');
        btnMap.classList.remove('active');
    }
}

let hostMap = null;

function initHostMap(listings) {
    setTimeout(() => {
        if (hostMap) {
            hostMap.remove();
            hostMap = null;
        }

        hostMap = L.map('host-leaflet-map').setView([36.0682, -94.1719], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(hostMap);

        const redIcon = L.divIcon({
            className: '',
            html: `<div style="width:28px;height:28px;background:#9d2235;border:3px solid #fff;
                               border-radius:50% 50% 50% 0;transform:rotate(-45deg);
                               box-shadow:0 3px 10px rgba(157,34,53,0.45)"></div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 28],
            popupAnchor: [0, -30]
        });

        const points = [];
        listings.forEach(l => {
            if (!l.latitude || !l.longitude) return;
            const lat = parseFloat(l.latitude);
            const lng = parseFloat(l.longitude);
            if (isNaN(lat) || isNaN(lng)) return;
            points.push([lat, lng]);
            L.marker([lat, lng], { icon: redIcon })
                .addTo(hostMap)
                .bindPopup(`
                    <div class="map-popup">
                        <div class="map-popup-title">${l.title}</div>
                        <div class="map-popup-price">$${l.pricePerHour}<span>/hr</span></div>
                        <button class="map-popup-btn" onclick="viewListing(${l.listingID})">View & Reserve</button>
                    </div>`);
        });

        if (points.length === 1) hostMap.setView(points[0], 16);
        else if (points.length > 1) hostMap.fitBounds(points, { padding: [40, 40] });
    }, 200);
}

function closeHostModal() { }