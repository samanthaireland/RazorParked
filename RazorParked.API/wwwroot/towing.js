// ═══════════════════════════════════════════════════════
// TOWING & PROMO JS — Owner: Carter — Sprint 6
// API: GET/POST /api/TowingContacts, PATCH /api/Users/{id}/preferences,
//      POST /api/Notifications/broadcast
// ═══════════════════════════════════════════════════════

// ══════════════════════════════════════
// TOWING CONTACTS — Task 17
// ══════════════════════════════════════
async function loadTowingContacts() {
    const container = document.getElementById('towing-contacts-list');
    if (!container) return;
    container.innerHTML = '<div class="loading">Loading...</div>';
    try {
        const res = await fetch('/api/TowingContacts');
        const contacts = await res.json();
        if (!contacts.length) {
            container.innerHTML = '<div class="empty"><p>No towing contacts available.</p></div>';
            return;
        }
        container.innerHTML = `<div class="listings-grid">${contacts.map(c => `
            <div class="listing-card">
                <h3>🚛 ${c.companyName}</h3>
                <div style="margin:10px 0">
                    <div style="font-size:14px;margin-bottom:6px">
                        <strong>📞 Phone:</strong>
                        <a href="tel:${c.phone}" style="color:var(--red);font-weight:600;text-decoration:none">${c.phone}</a>
                    </div>
                    <div style="font-size:13px;color:var(--muted);margin-bottom:4px">
                        <strong style="color:var(--text)">Service Area:</strong> ${c.serviceArea}
                    </div>
                    <div style="font-size:13px;color:var(--muted)">
                        <strong style="color:var(--text)">Hours:</strong> ${c.hoursOfOperation || 'Not specified'}
                    </div>
                </div>
            </div>`).join('')}</div>`;

        // Also load host's listings into the tow request dropdown
        loadTowListingDropdown();
    } catch {
        container.innerHTML = '<div class="empty"><p>Error loading towing contacts.</p></div>';
    }
}

// Populate listing dropdown for tow request form
async function loadTowListingDropdown() {
    if (!currentUser) return;
    const select = document.getElementById('tow-listing-select');
    if (!select) return;
    try {
        const res = await fetch(`/api/Listings/host/${currentUser.userId}`);
        const listings = await res.json();
        if (!listings.length) {
            select.innerHTML = '<option value="">No listings found</option>';
            return;
        }
        select.innerHTML = '<option value="">Select a listing...</option>' +
            listings.map(l => `<option value="${l.listingID}">${l.title} — ${l.location}</option>`).join('');
    } catch {
        select.innerHTML = '<option value="">Error loading listings</option>';
    }
}

// ══════════════════════════════════════
// REQUEST TOW — Task 18
// ══════════════════════════════════════
async function submitTowRequest() {
    const msg = document.getElementById('tow-msg');
    msg.className = 'msg';

    const listingId = document.getElementById('tow-listing-select').value;
    const spotNumber = document.getElementById('tow-spot').value.trim();
    const vehicleDesc = document.getElementById('tow-vehicle-desc').value.trim();

    if (!listingId) {
        msg.className = 'msg error';
        msg.textContent = 'Please select a listing.';
        return;
    }
    if (!spotNumber) {
        msg.className = 'msg error';
        msg.textContent = 'Spot number is required.';
        return;
    }

    try {
        const res = await fetch('/api/TowingContacts/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                hostUserID: currentUser.userId,
                listingID: parseInt(listingId),
                spotNumber: spotNumber,
                vehicleDescription: vehicleDesc || null
            })
        });
        const data = await res.json();
        if (res.ok) {
            msg.className = 'msg success';
            msg.textContent = data.message || 'Tow request submitted!';
            document.getElementById('tow-spot').value = '';
            document.getElementById('tow-vehicle-desc').value = '';
            // Refresh notification badge
            updateNotifBadge();
        } else {
            msg.className = 'msg error';
            msg.textContent = data.message || 'Request failed.';
        }
    } catch {
        msg.className = 'msg error';
        msg.textContent = 'Connection error.';
    }
}

// ══════════════════════════════════════
// PROMO OPT-IN — Task 19
// ══════════════════════════════════════
async function loadPromoPreference() {
    if (!currentUser) return;
    const toggle = document.getElementById('promo-optin-toggle');
    if (!toggle) return;
    try {
        const res = await fetch(`/api/Users/${currentUser.userId}`);
        const data = await res.json();
        toggle.checked = data.promoOptIn || false;
    } catch { }
}

async function togglePromoOptIn() {
    const toggle = document.getElementById('promo-optin-toggle');
    const msg = document.getElementById('prefs-msg');
    if (!toggle || !currentUser) return;
    if (msg) msg.className = 'msg';

    try {
        const res = await fetch(`/api/Users/${currentUser.userId}/preferences`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ promoOptIn: toggle.checked })
        });
        const data = await res.json();
        if (res.ok && msg) {
            msg.className = 'msg success';
            msg.textContent = data.message;
        } else if (msg) {
            msg.className = 'msg error';
            msg.textContent = data.message || 'Failed to update preferences.';
            toggle.checked = !toggle.checked; // revert
        }
    } catch {
        if (msg) {
            msg.className = 'msg error';
            msg.textContent = 'Connection error.';
        }
        toggle.checked = !toggle.checked; // revert
    }
}

// ══════════════════════════════════════
// ADMIN BROADCAST — Task 20
// ══════════════════════════════════════
async function sendBroadcast() {
    const msg = document.getElementById('broadcast-msg');
    msg.className = 'msg';

    const subject = document.getElementById('broadcast-subject').value.trim();
    const body = document.getElementById('broadcast-body').value.trim();

    if (!subject || !body) {
        msg.className = 'msg error';
        msg.textContent = 'Subject and message are both required.';
        return;
    }

    try {
        const res = await fetch('/api/Notifications/broadcast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                senderUserID: currentUser.userId,
                subject: subject,
                messageBody: body
            })
        });
        const data = await res.json();
        if (res.ok) {
            msg.className = 'msg success';
            msg.textContent = `${data.message} Sent to ${data.recipientCount} opted-in user(s).`;
            document.getElementById('broadcast-subject').value = '';
            document.getElementById('broadcast-body').value = '';
        } else {
            msg.className = 'msg error';
            msg.textContent = data.message || 'Broadcast failed.';
        }
    } catch {
        msg.className = 'msg error';
        msg.textContent = 'Connection error.';
    }
}

// ══════════════════════════════════════
// PROFILE TAB OVERRIDE — adds 'preferences' tab
// ══════════════════════════════════════
(function () {
    // Wait for DOM and profile.html to load, then patch switchProfileTab
    const originalSwitch = window.switchProfileTab;
    window.switchProfileTab = function (tab) {
        const allTabs = ['info', 'edit', 'password', 'picture', 'email', 'preferences'];
        allTabs.forEach(t => {
            const panel = document.getElementById('profile-tab-' + t);
            const btn = document.getElementById('tab-btn-' + t);
            if (panel) panel.style.display = 'none';
            if (btn) {
                btn.style.background = 'none';
                btn.style.color = 'var(--text)';
                btn.style.fontWeight = '500';
            }
        });
        const activePanel = document.getElementById('profile-tab-' + tab);
        const activeBtn = document.getElementById('tab-btn-' + tab);
        if (activePanel) activePanel.style.display = 'block';
        if (activeBtn) {
            activeBtn.style.background = 'var(--red)';
            activeBtn.style.color = '#fff';
            activeBtn.style.fontWeight = '600';
        }
        // Load promo preference when switching to preferences tab
        if (tab === 'preferences') loadPromoPreference();
    };
})();
