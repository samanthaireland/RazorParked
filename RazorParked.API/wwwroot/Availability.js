// ═══════════════════════════════════════════════════════
//  AVAILABILITY MANAGER
//  Owner:  Kaden
//  API:    GET    /api/Listings/{id}/availability
//          POST   /api/Listings/{id}/availability
//          DELETE /api/Listings/{id}/availability/{slotId}
//  To edit: only touch this file + Sections/availability.html!
// ═══════════════════════════════════════════════════════

let _availListingId = null;

// Called from the 🗓 Availability button on each listing card
function openAvailability(listingId) {
    _availListingId = listingId;
    sessionStorage.setItem('availListingId', listingId);
    window.showPage('availability');
}

// Called by index.html router when the availability page loads
async function initAvailabilityPage() {
    if (!window.currentUser && !currentUser) { window.showPage('login'); return; }

    // Restore listing ID from sessionStorage in case the variable was reset
    if (!_availListingId) {
        _availListingId = parseInt(sessionStorage.getItem('availListingId'));
    }

    if (!_availListingId) return;

    // Show the listing name in the page header
    try {
        const userId = (window.currentUser || currentUser).userId;
        const res = await fetch(`/api/Listings/host/${userId}`);
        const listings = await res.json();
        const listing = listings.find(l => l.listingID === _availListingId);
        const nameEl = document.getElementById('avail-listing-name');
        if (nameEl && listing) nameEl.textContent = listing.title;
    } catch { }

    await loadAvailabilitySlots();
}

// GET /api/Listings/{id}/availability
async function loadAvailabilitySlots() {
    const container = document.getElementById('avail-slots-container');
    const countEl = document.getElementById('avail-slot-count');
    if (!container || !_availListingId) return;

    container.innerHTML = '<div class="loading">Loading slots...</div>';

    try {
        const res = await fetch(`/api/Listings/${_availListingId}/availability`);
        if (!res.ok) throw new Error();
        const slots = await res.json();

        if (!slots || slots.length === 0) {
            container.innerHTML = `
                <div class="empty">
                    <div class="empty-icon">🗓️</div>
                    <p>No availability slots yet. Add one above!</p>
                </div>`;
            if (countEl) countEl.textContent = '';
            return;
        }

        if (countEl) countEl.textContent = `${slots.length} slot${slots.length !== 1 ? 's' : ''}`;

        container.innerHTML = `
            <div class="listings-grid">
                ${slots.map(s => {
            // CHANGED: Show spots remaining out of total
            const total = s.totalSpots ?? 1;
            const remaining = s.remainingSpots ?? total;
            const spotsColor = remaining === 0 ? 'var(--red)' : remaining <= 1 ? 'var(--gold)' : '#2d7a4f';
            return `
                    <div class="listing-card" style="cursor:default">
                        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
                            <div style="font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:1px">
                                Slot #${s.slotID}
                            </div>
                            <span class="badge ${remaining > 0 ? 'available' : 'unavailable'}">
                                ${remaining > 0 ? 'Active' : 'Full'}
                            </span>
                        </div>
                        <div style="font-size:13px;color:var(--muted);margin-bottom:6px">
                            🕐 <strong style="color:var(--text)">Start:</strong>
                            ${new Date(s.startDateTime).toLocaleString()}
                        </div>
                        <div style="font-size:13px;color:var(--muted);margin-bottom:10px">
                            🕐 <strong style="color:var(--text)">End:</strong>
                            ${new Date(s.endDateTime).toLocaleString()}
                        </div>
                        <!-- CHANGED: Spots remaining indicator -->
                        <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px 14px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center">
                            <span style="font-size:12px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em">Spots</span>
                            <span style="font-family:'Bebas Neue',sans-serif;font-size:22px;color:${spotsColor};letter-spacing:1px">
                                ${remaining} <span style="font-size:13px;color:var(--muted);font-family:'DM Sans',sans-serif;font-weight:400">/ ${total}</span>
                            </span>
                        </div>
                        <button class="btn-secondary"
                            style="width:100%;padding:8px;font-size:13px;color:var(--red);border-color:var(--red)"
                            onclick="deleteAvailabilitySlot(${s.slotID})">
                            🗑 Remove Slot
                        </button>
                    </div>`;
        }).join('')}
            </div>`;

    } catch {
        container.innerHTML = `
            <div class="empty">
                <div class="empty-icon">⚠️</div>
                <p>Error loading slots. Make sure the API is running.</p>
            </div>`;
    }
}

// CHANGED: POST /api/Listings/{id}/availability — now sends totalSpots
async function addAvailabilitySlot() {
    const msg = document.getElementById('avail-msg');
    msg.className = 'msg';

    const start = document.getElementById('avail-start').value;
    const end = document.getElementById('avail-end').value;
    const spots = parseInt(document.getElementById('avail-spots').value) || 1;

    if (!start || !end) {
        msg.className = 'msg error';
        msg.textContent = 'Please fill in both start and end times.';
        return;
    }
    if (new Date(start) >= new Date(end)) {
        msg.className = 'msg error';
        msg.textContent = 'Start time must be before end time.';
        return;
    }
    if (spots < 1) {
        msg.className = 'msg error';
        msg.textContent = 'Number of spots must be at least 1.';
        return;
    }

    const user = window.currentUser || currentUser;

    try {
        const res = await fetch(`/api/Listings/${_availListingId}/availability`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                hostUserID: user.userId,
                startDateTime: start,
                endDateTime: end,
                totalSpots: spots
            })
        });
        const data = await res.json();
        if (res.ok) {
            msg.className = 'msg success';
            msg.textContent = `Slot added with ${spots} spot${spots !== 1 ? 's' : ''}!`;
            document.getElementById('avail-start').value = '';
            document.getElementById('avail-end').value = '';
            document.getElementById('avail-spots').value = '1';
            await loadAvailabilitySlots();
        } else {
            msg.className = 'msg error';
            msg.textContent = data.message || 'Failed to add slot.';
        }
    } catch {
        msg.className = 'msg error';
        msg.textContent = 'Connection error.';
    }
}

// DELETE /api/Listings/{id}/availability/{slotId}
async function deleteAvailabilitySlot(slotId) {
    if (!confirm('Are you sure you want to remove this availability slot?')) return;

    const user = window.currentUser || currentUser;

    try {
        const res = await fetch(
            `/api/Listings/${_availListingId}/availability/${slotId}?hostUserId=${user.userId}`,
            { method: 'DELETE' }
        );
        const data = await res.json();
        if (res.ok) {
            await loadAvailabilitySlots();
        } else {
            alert(data.message || 'Failed to remove slot.');
        }
    } catch {
        alert('Connection error.');
    }
}

// Expose to index.html router
window.initAvailabilityPage = initAvailabilityPage;
window.openAvailability = openAvailability;