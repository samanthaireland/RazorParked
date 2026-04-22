// ═══════════════════════════════════════════════════════
// PROFILE JS — Owner: Samantha
// To edit: only touch this file!
// DO NOT paste this into index.html
// ═══════════════════════════════════════════════════════

async function loadProfile() {
    if (!currentUser) return;
    try {
        const res = await fetch(`/api/Users/${currentUser.userId}`);
        const data = await res.json();

        document.getElementById('profile-name').value = data.fullName || '';
        document.getElementById('profile-email').value = data.email || '';
        document.getElementById('profile-bio').value = data.bio || '';
        document.getElementById('profile-pic-url').value = data.profilePicUrl || '';
        document.getElementById('profile-display-name').textContent = data.fullName;
        document.getElementById('profile-display-bio').textContent = data.bio || 'No bio yet.';
        document.getElementById('profile-display-role').textContent = data.roles.join(' & ');

        if (data.roles.includes('Customer')) document.getElementById('profile-role-customer').checked = true;
        if (data.roles.includes('Host')) document.getElementById('profile-role-host').checked = true;

        document.getElementById('info-name').textContent = data.fullName || '—';
        document.getElementById('info-email').textContent = data.email || '—';
        document.getElementById('info-roles').textContent = data.roles.join(' & ') || '—';
        document.getElementById('info-bio').textContent = data.bio || 'No bio yet.';

        const currentEmailEl = document.getElementById('profile-current-email');
        if (currentEmailEl) currentEmailEl.value = data.email || '';

        if (data.profilePicUrl) {
            document.getElementById('profile-avatar').innerHTML =
                `<img src="${data.profilePicUrl}" style="width:100%;height:100%;object-fit:cover" />`;
        }

        // Show/hide host-only gift section based on role
        const giftSection = document.getElementById('credits-gift-section');
        if (giftSection) {
            giftSection.style.display = data.roles.includes('Host') ? 'block' : 'none';
        }

        // Load credit balance once profile is ready
        await loadCreditBalance();

        // If host, load their recent reservations into the gift dropdown
        if (data.roles.includes('Host')) {
            await loadReservationsForGift();
        }
    } catch { console.error('Could not load profile'); }
}

async function saveProfile() {
    const msg = document.getElementById('profile-msg');
    msg.className = 'msg';
    try {
        const res = await fetch(`/api/Users/${currentUser.userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: document.getElementById('profile-name').value,
                email: document.getElementById('profile-email').value,
                bio: document.getElementById('profile-bio').value,
                profilePicUrl: document.getElementById('profile-pic-url').value
            })
        });
        const data = await res.json();
        if (res.ok) {
            msg.className = 'msg success';
            msg.textContent = 'Profile updated!';
            currentUser.fullName = document.getElementById('profile-name').value;
            localStorage.setItem('rp_user', JSON.stringify(currentUser));
            document.getElementById('nav-name').textContent = currentUser.fullName;
            document.getElementById('profile-display-name').textContent = currentUser.fullName;
            document.getElementById('profile-display-bio').textContent = document.getElementById('profile-bio').value;
            document.getElementById('info-name').textContent = currentUser.fullName;
            document.getElementById('info-bio').textContent = document.getElementById('profile-bio').value || 'No bio yet.';
        } else {
            msg.className = 'msg error';
            msg.textContent = data.message || 'Update failed.';
        }
    } catch { msg.className = 'msg error'; msg.textContent = 'Connection error.'; }
}

async function updateProfilePic() {
    const url = document.getElementById('profile-pic-url').value;
    const msg = document.getElementById('pic-msg');
    msg.className = 'msg';

    if (!url) {
        msg.className = 'msg error';
        msg.textContent = 'Please enter a URL.';
        return;
    }

    try {
        const current = await fetch(`/api/Users/${currentUser.userId}`);
        const data = await current.json();

        const res = await fetch(`/api/Users/${currentUser.userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: data.fullName,
                email: data.email,
                bio: data.bio || '',
                profilePicUrl: url
            })
        });

        if (res.ok) {
            msg.className = 'msg success';
            msg.textContent = 'Picture updated!';
            const imgHtml = `<img src="${url}" style="width:100%;height:100%;object-fit:cover" />`;
            document.getElementById('profile-avatar').innerHTML = imgHtml;
            const preview = document.getElementById('profile-avatar-preview');
            if (preview) preview.innerHTML = imgHtml;
        } else {
            const err = await res.json();
            msg.className = 'msg error';
            msg.textContent = err.message || 'Update failed.';
        }
    } catch {
        msg.className = 'msg error';
        msg.textContent = 'Connection error.';
    }
}

async function changePassword() {
    const msg = document.getElementById('pw-msg');
    msg.className = 'msg';
    try {
        const res = await fetch(`/api/Users/${currentUser.userId}/password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                currentPassword: document.getElementById('profile-current-pw').value,
                newPassword: document.getElementById('profile-new-pw').value,
                confirmPassword: document.getElementById('profile-confirm-pw').value
            })
        });
        const data = await res.json();
        if (res.ok) {
            msg.className = 'msg success';
            msg.textContent = 'Password updated!';
            document.getElementById('profile-current-pw').value = '';
            document.getElementById('profile-new-pw').value = '';
            document.getElementById('profile-confirm-pw').value = '';
        } else {
            msg.className = 'msg error';
            msg.textContent = data.message || 'Failed.';
        }
    } catch { msg.className = 'msg error'; msg.textContent = 'Connection error.'; }
}

async function changeEmail() {
    const msg = document.getElementById('email-msg');
    msg.className = 'msg';
    const newEmail = document.getElementById('profile-new-email').value;
    const password = document.getElementById('email-confirm-pw').value;

    if (!newEmail || !password) {
        msg.className = 'msg error';
        msg.textContent = 'All fields are required.';
        return;
    }
    try {
        const verify = await fetch('/api/Auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentUser.email, password })
        });
        if (!verify.ok) {
            msg.className = 'msg error';
            msg.textContent = 'Password incorrect.';
            return;
        }
        const res = await fetch(`/api/Users/${currentUser.userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: currentUser.fullName,
                email: newEmail,
                bio: document.getElementById('profile-bio')?.value || ''
            })
        });
        const data = await res.json();
        if (res.ok) {
            msg.className = 'msg success';
            msg.textContent = 'Email updated!';
            currentUser.email = newEmail;
            localStorage.setItem('rp_user', JSON.stringify(currentUser));
            document.getElementById('info-email').textContent = newEmail;
            document.getElementById('profile-current-email').value = newEmail;
            document.getElementById('profile-new-email').value = '';
            document.getElementById('email-confirm-pw').value = '';
        } else {
            msg.className = 'msg error';
            msg.textContent = data.message || 'Failed.';
        }
    } catch { msg.className = 'msg error'; msg.textContent = 'Connection error.'; }
}

// ═══════════════════════════════════════════════════════
// CREDITS & PAYMENT
// ═══════════════════════════════════════════════════════

async function loadCreditBalance() {
    try {
        const res = await fetch(`/api/Users/${currentUser.userId}/credits`);
        if (!res.ok) return;
        const data = await res.json();
        const balance = typeof data.balance === 'number' ? data.balance : (data.credits ?? 0);
        const formatted = `$${balance.toFixed(2)}`;

        const balanceEl = document.getElementById('credits-balance-amount');
        if (balanceEl) balanceEl.textContent = formatted;

        // Also show a small badge in the sidebar button
        const badge = document.getElementById('credits-tab-badge');
        if (badge) badge.textContent = formatted;
    } catch { console.error('Could not load credit balance'); }
}

async function buyCredits() {
    const msg = document.getElementById('credits-buy-msg');
    msg.className = 'msg';

    const amountInput = document.getElementById('credits-buy-amount');
    const amount = parseFloat(amountInput.value);

    if (!amount || amount <= 0) {
        msg.className = 'msg error';
        msg.textContent = 'Please enter a valid amount.';
        return;
    }

    const btn = document.getElementById('credits-buy-btn');
    btn.disabled = true;
    btn.textContent = 'Processing...';

    try {
        const res = await fetch(`/api/Users/${currentUser.userId}/credits/purchase`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount })
        });
        const data = await res.json();
        if (res.ok) {
            msg.className = 'msg success';
            msg.textContent = `Successfully added $${amount.toFixed(2)} in credits!`;
            amountInput.value = '';
            await loadCreditBalance();
        } else {
            msg.className = 'msg error';
            msg.textContent = data.message || 'Purchase failed.';
        }
    } catch {
        msg.className = 'msg error';
        msg.textContent = 'Connection error.';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Buy Credits';
    }
}

// Host only — load reservations for their listings so they can gift credits
async function loadReservationsForGift() {
    try {
        const res = await fetch(`/api/Reservations/host/${currentUser.userId}`);
        if (!res.ok) return;
        const reservations = await res.json();

        const select = document.getElementById('credits-gift-reservation');
        if (!select) return;

        select.innerHTML = '<option value="">— Choose a reservation —</option>';

        if (!reservations.length) {
            select.innerHTML += '<option disabled>No confirmed reservations found</option>';
            return;
        }

        reservations.forEach(r => {
            const start = new Date(r.reservationStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const end = new Date(r.reservationEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const label = `#${r.reservationID} — ${r.customerName} · ${r.listingTitle} · ${start} → ${end}`;
            const opt = document.createElement('option');
            opt.value = r.reservationID;
            opt.dataset.customerId = r.driverUserID;
            opt.dataset.name = r.customerName;
            opt.dataset.spot = r.listingTitle;
            opt.dataset.date = `${start} → ${end}`;
            opt.textContent = label;
            select.appendChild(opt);
        });
    } catch { console.error('Could not load reservations for gift'); }
}

function onReservationPick() {
    const select = document.getElementById('credits-gift-reservation');
    const opt = select.options[select.selectedIndex];
    const detail = document.getElementById('credits-res-detail');
    if (!select.value) { detail.style.display = 'none'; return; }
    document.getElementById('credits-rd-name').textContent = `Reservation #${select.value} — ${opt.dataset.name}`;
    document.getElementById('credits-rd-spot').textContent = opt.dataset.spot;
    document.getElementById('credits-rd-date').textContent = opt.dataset.date;
    detail.style.display = 'block';
}

async function giftCredits() {
    const msg = document.getElementById('credits-gift-msg');
    msg.className = 'msg';

    const select = document.getElementById('credits-gift-reservation');
    const selectedOpt = select.options[select.selectedIndex];
    const reservationId = select.value;
    const customerId = selectedOpt?.dataset?.customerId;
    const amount = parseFloat(document.getElementById('credits-gift-amount').value);
    const note = document.getElementById('credits-gift-note')?.value?.trim() || '';

    if (!reservationId) {
        msg.className = 'msg error';
        msg.textContent = 'Please select a reservation.';
        return;
    }
    if (!amount || amount <= 0) {
        msg.className = 'msg error';
        msg.textContent = 'Please enter a valid amount to gift.';
        return;
    }

    const btn = document.getElementById('credits-gift-btn');
    btn.disabled = true;
    btn.textContent = 'Sending...';

    try {
        const res = await fetch(`/api/Users/${currentUser.userId}/credits/gift`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipientUserId: customerId, reservationId, amount, note })
        });
        const data = await res.json();
        if (res.ok) {
            msg.className = 'msg success';
            msg.textContent = `Gifted $${amount.toFixed(2)} in credits successfully!`;
            document.getElementById('credits-gift-amount').value = '';
            document.getElementById('credits-gift-note').value = '';
            document.getElementById('credits-char-left').textContent = '160';
            document.getElementById('credits-res-detail').style.display = 'none';
            select.value = '';
            await loadCreditBalance();
        } else {
            msg.className = 'msg error';
            msg.textContent = data.message || 'Gift failed.';
        }
    } catch {
        msg.className = 'msg error';
        msg.textContent = 'Connection error.';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Send Credits';
    }
}

// Quick-select preset amounts for buying credits
function setPresetAmount(amount) {
    const input = document.getElementById('credits-buy-amount');
    if (input) input.value = amount;
}

// ═══════════════════════════════════════════════════════
// TAB SWITCHING — updated to include 'credits'
// ═══════════════════════════════════════════════════════

function switchProfileTab(tab) {
    ['info', 'edit', 'password', 'picture', 'email', 'credits'].forEach(t => {
        document.getElementById('profile-tab-' + t).style.display = 'none';
        const btn = document.getElementById('tab-btn-' + t);
        btn.style.background = 'none';
        btn.style.color = 'var(--text)';
        btn.style.fontWeight = '500';
    });
    document.getElementById('profile-tab-' + tab).style.display = 'block';
    const active = document.getElementById('tab-btn-' + tab);
    active.style.background = 'var(--red)';
    active.style.color = '#fff';
    active.style.fontWeight = '600';

    // Refresh balance every time the credits tab is opened
    if (tab === 'credits') {
        loadCreditBalance();
    }
}