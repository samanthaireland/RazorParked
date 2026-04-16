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
        // First fetch current data so we don't wipe other fields
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

function switchProfileTab(tab) {
    ['info', 'edit', 'password', 'picture', 'email'].forEach(t => {
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
}