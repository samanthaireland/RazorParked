// cancel-modal.js — RazorParked
// Custom cancellation confirmation modal with $20 fee warning

function showCancelModal(reservationId, reservationStart, reservationEnd, listingTitle) {
    // Remove existing modal if any
    var existing = document.getElementById('rp-cancel-modal');
    if (existing) existing.remove();

    var start = reservationStart ? new Date(reservationStart) : null;
    var end = reservationEnd ? new Date(reservationEnd) : null;
    var now = new Date();

    // Free cancellation if more than 24hrs before reservation
    var hoursUntil = start ? (start - now) / (1000 * 60 * 60) : 0;
    var isFree = hoursUntil > 24;

    var dateStr = start
        ? start.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
        + ' ' + start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        + ' → ' + (end ? end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')
        : 'your reservation';

    var modal = document.createElement('div');
    modal.id = 'rp-cancel-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;animation:fadeIn .15s ease';

    modal.innerHTML = `
        <div style="background:#fff;border-radius:14px;padding:32px;max-width:420px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.25);position:relative">
            <div style="font-family:'Bebas Neue',sans-serif;font-size:26px;letter-spacing:1px;color:#1a1208;margin-bottom:6px">
                Cancel Reservation
            </div>
            <div style="font-size:14px;color:#7a6e62;margin-bottom:20px;font-family:'Source Serif 4',serif">
                ${listingTitle || 'Parking Spot'}
            </div>

            <div style="background:#f5f5f5;border-radius:10px;padding:14px 16px;margin-bottom:16px;font-size:13px;color:#1a1208">
                <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#aaa;margin-bottom:5px">Reservation</div>
                ${dateStr}
            </div>

            ${isFree ? `
            <div style="background:#edf7f0;border:1px solid #b3dfc4;border-radius:10px;padding:14px 16px;margin-bottom:20px;display:flex;gap:10px;align-items:flex-start">
                <div style="font-size:20px">✅</div>
                <div>
                    <div style="font-size:13px;font-weight:700;color:#2d7a4f;margin-bottom:3px">Free Cancellation</div>
                    <div style="font-size:12px;color:#2d7a4f">Your reservation is more than 24 hours away — no cancellation fee will be charged.</div>
                </div>
            </div>` : `
            <div style="background:#f5e8eb;border:1px solid #e8b4bc;border-radius:10px;padding:14px 16px;margin-bottom:20px;display:flex;gap:10px;align-items:flex-start">
                <div style="font-size:20px">⚠️</div>
                <div>
                    <div style="font-size:13px;font-weight:700;color:#7a1a28;margin-bottom:3px">$20 Cancellation Fee</div>
                    <div style="font-size:12px;color:#7a1a28">Your reservation is within 24 hours. A <strong>$20 fee</strong> will be charged to your account to compensate the host.</div>
                </div>
            </div>`}

            <div style="display:flex;gap:10px">
                <button onclick="document.getElementById('rp-cancel-modal').remove()"
                    style="flex:1;padding:12px;background:#fff;border:1.5px solid #e5e0d8;border-radius:9px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;cursor:pointer;color:#1a1208;transition:all .2s"
                    onmouseover="this.style.borderColor='#9d2235'" onmouseout="this.style.borderColor='#e5e0d8'">
                    Keep Reservation
                </button>
                <button onclick="confirmCancelReservation(${reservationId})"
                    style="flex:1;padding:12px;background:#9d2235;border:none;border-radius:9px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;cursor:pointer;color:#fff;transition:all .2s"
                    onmouseover="this.style.background='#7a1a28'" onmouseout="this.style.background='#9d2235'">
                    ${isFree ? 'Cancel for Free' : 'Cancel — Charge $20'}
                </button>
            </div>

            <div id="rp-cancel-msg" style="margin-top:12px;font-size:13px;text-align:center;color:#7a6e62;display:none"></div>
        </div>`;

    document.body.appendChild(modal);

    // Close on backdrop click
    modal.addEventListener('click', function (e) {
        if (e.target === modal) modal.remove();
    });
}

async function confirmCancelReservation(id) {
    var msg = document.getElementById('rp-cancel-msg');
    var btns = document.querySelectorAll('#rp-cancel-modal button');
    btns.forEach(function (b) { b.disabled = true; b.style.opacity = '.6'; });
    if (msg) { msg.style.display = 'block'; msg.textContent = 'Cancelling...'; }

    try {
        var currentUser = JSON.parse(localStorage.getItem('rp_user') || 'null');
        var res = await fetch('/api/Reservations/' + id + '/cancel?driverUserId=' + currentUser.userId, { method: 'PATCH' });
        var data = await res.json();

        if (res.ok) {
            var modal = document.getElementById('rp-cancel-modal');
            if (modal) modal.remove();

            // Show success toast
            showCancelToast(data.freeCancellation
                ? '✅ Reservation cancelled — no charge!'
                : '✅ Cancelled. $20 fee applied to your account.');

            // Reload reservations list
            if (typeof loadMyReservations === 'function') loadMyReservations();

            // Clear calendar so listing shows updated availability
            if (window.calendarArriveKey) {
                window.calendarArriveKey = null;
                window.calendarDepartKey = null;
                window.calendarArriveTime = null;
                window.calendarDepartTime = null;
                window.calendarStartISO = null;
                window.calendarEndISO = null;
                // Refresh search results if on search page
                var searchResults = document.getElementById('search-results');
                if (searchResults && searchResults.innerHTML.includes('listing-card')) {
                    if (typeof searchListings === 'function') searchListings();
                }
            }
        } else {
            if (msg) msg.textContent = data.message || 'Cancellation failed. Try again.';
            btns.forEach(function (b) { b.disabled = false; b.style.opacity = '1'; });
        }
    } catch {
        if (msg) msg.textContent = 'Connection error. Try again.';
        btns.forEach(function (b) { b.disabled = false; b.style.opacity = '1'; });
    }
}

function showCancelToast(message) {
    var toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:#1a1208;color:#fff;padding:14px 24px;border-radius:99px;font-family:"DM Sans",sans-serif;font-size:14px;font-weight:600;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,0.2);animation:fadeUp .2s ease';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function () {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity .3s';
        setTimeout(function () { toast.remove(); }, 300);
    }, 3500);
}

// Replace the old cancelReservation with the modal version
window.cancelReservation = function (id, start, end, title) {
    showCancelModal(id, start, end, title);
};

window.showCancelModal = showCancelModal;
window.confirmCancelReservation = confirmCancelReservation;