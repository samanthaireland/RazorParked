// ═══════════════════════════════════════════════════════
// MESSAGES JS
// Owner: Carter/Team
// ═══════════════════════════════════════════════════════

async function loadMessages() {
    loadDriverReservations();
}

async function loadDriverReservations() {
    if (!currentUser) return;
    const container = document.getElementById('driver-reservations');
    if (!container) return;
    container.innerHTML = '<div class="loading">Loading...</div>';
    try {
        const res = await fetch(`/api/Reservations/user/${currentUser.userId}`);
        const reservations = await res.json();
        if (!reservations.length) {
            container.innerHTML = '<div class="empty"><div class="empty-icon">🎫</div><p>No reservations yet.</p></div>';
            return;
        }

        // Fetch listing details to get hostUserID + host info
        const listingCache = {};
        const hostCache = {};
        await Promise.all(reservations.map(async r => {
            if (!r.listingID || listingCache[r.listingID]) return;
            try {
                const lr = await fetch(`/api/Listings/${r.listingID}`);
                if (lr.ok) {
                    const l = await lr.json();
                    listingCache[r.listingID] = l;
                    if (l.hostUserID && !hostCache[l.hostUserID]) {
                        const hr = await fetch(`/api/Users/${l.hostUserID}`);
                        if (hr.ok) hostCache[l.hostUserID] = await hr.json();
                    }
                }
            } catch { }
        }));

        container.innerHTML = `<div class="listings-grid">${reservations.map(r => {
            const listing = listingCache[r.listingID];
            const hostId = listing?.hostUserID;
            const host = hostCache[hostId];
            return `
            <div class="listing-card">
                <h3>${r.title || 'Parking Spot'}</h3>
                <div class="location">📍 ${r.fullAddress || 'Fayetteville, AR'}</div>
                <div style="margin:8px 0">
                    <span class="badge ${r.status === 'Confirmed' ? 'available' : 'unavailable'}">${r.status}</span>
                </div>
                <div style="font-size:13px;color:var(--muted);margin-bottom:12px">
                    ${new Date(r.reservationStart).toLocaleDateString()} → ${new Date(r.reservationEnd).toLocaleDateString()}
                </div>

                ${host ? `
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;
                            padding:10px;background:var(--surface);border-radius:8px;
                            border:1px solid var(--border);cursor:pointer"
                     onclick="openHostModal(${hostId})">
                    <div style="width:28px;height:28px;border-radius:50%;overflow:hidden;
                                flex-shrink:0;border:2px solid var(--red)">
                        ${host.profilePicUrl
                        ? `<img src="${host.profilePicUrl}" style="width:100%;height:100%;object-fit:cover"/>`
                        : `<div style="width:100%;height:100%;background:var(--red);color:#fff;
                                          display:flex;align-items:center;justify-content:center;
                                          font-size:12px;font-weight:700">
                                   ${host.fullName ? host.fullName.charAt(0).toUpperCase() : '?'}
                               </div>`
                    }
                    </div>
                    <span style="font-size:13px;color:var(--muted)">
                        Hosted by <strong style="color:var(--text)">${host.fullName || 'Host'}</strong>
                    </span>
                    <span style="margin-left:auto;font-size:12px;color:var(--muted2)">View →</span>
                </div>` : ''}

                ${hostId ? `
                <button class="btn-primary" style="width:100%;padding:8px;font-size:13px"
                    onclick="startConversation(${hostId}, ${r.listingID}, '${(r.title || 'Host').replace(/'/g, '')}')">
                    💬 Message Host
                </button>` : `
                <div class="msg error" style="display:block;font-size:13px">Host info unavailable</div>`}
            </div>`;
        }).join('')}</div>`;
    } catch {
        container.innerHTML = '<div class="empty"><p>Error loading reservations.</p></div>';
    }
}

async function loadHostConversations() {
    if (!currentUser) return;
    const container = document.getElementById('host-conversations');
    if (!container) return;
    container.innerHTML = '<div class="loading">Loading...</div>';
    try {
        const res = await fetch(`/api/Messages/user/${currentUser.userId}`);
        const data = await res.json();
        if (!data.conversations || data.conversations.length === 0) {
            container.innerHTML = '<div class="empty"><div class="empty-icon">💬</div><p>No messages yet.</p></div>';
            return;
        }
        container.innerHTML = `<div class="listings-grid">${data.conversations.map(c => `
            <div class="listing-card" style="cursor:pointer"
                onclick="openMsgConversation(${c.conversationID}, ${c.otherUserId}, '${(c.otherUserName || 'Driver').replace(/'/g, '')}')">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
                    <h3>${c.otherUserName || 'Driver'}</h3>
                    ${c.unreadCount > 0 ? `<span style="background:var(--red);color:#fff;font-size:11px;padding:2px 8px;border-radius:10px">${c.unreadCount}</span>` : ''}
                </div>
                <div class="location">📍 ${c.listingTitle || 'Listing'}</div>
                <div style="font-size:13px;color:var(--muted);margin-top:8px">${c.lastMessage || 'No messages yet'}</div>
            </div>`).join('')}</div>`;
    } catch {
        container.innerHTML = '<div class="empty"><p>Error loading conversations.</p></div>';
    }
}

function switchMsgTab(tab) {
    document.getElementById('msg-tab-driver').style.display = tab === 'driver' ? 'block' : 'none';
    document.getElementById('msg-tab-host').style.display = tab === 'host' ? 'block' : 'none';
    document.getElementById('msg-thread-panel').style.display = 'none';
    if (tab === 'driver') {
        document.getElementById('tab-btn-driver').className = 'btn-primary';
        document.getElementById('tab-btn-host').className = 'btn-secondary';
        loadDriverReservations();
    } else {
        document.getElementById('tab-btn-host').className = 'btn-primary';
        document.getElementById('tab-btn-driver').className = 'btn-secondary';
        loadHostConversations();
    }
}

async function startConversation(receiverId, listingId, name) {
    window._activeMsgReceiverId = receiverId;
    window._activeMsgListingId = listingId;
    window._activeMsgConvId = null;
    window._activeMsgName = name;

    try {
        const res = await fetch(`/api/Messages/user/${currentUser.userId}`);
        const data = await res.json();
        const existing = data.conversations?.find(c => c.otherUserId === receiverId);
        if (existing) {
            openMsgConversation(existing.conversationID, receiverId, name);
            return;
        }
    } catch { }

    document.getElementById('msg-thread-panel').style.display = 'block';
    document.getElementById('msg-thread-header').innerHTML = `
        <div style="font-family:'Bebas Neue',sans-serif;font-size:24px;letter-spacing:1px">Message ${name}</div>`;
    document.getElementById('msg-thread-messages').innerHTML = '<div class="empty"><p>Start the conversation below!</p></div>';
    document.getElementById('msg-thread-panel').scrollIntoView({ behavior: 'smooth' });
}

async function openMsgConversation(conversationId, receiverId, name) {
    window._activeMsgConvId = conversationId;
    window._activeMsgReceiverId = receiverId;
    window._activeMsgName = name;

    document.getElementById('msg-thread-panel').style.display = 'block';
    document.getElementById('msg-thread-messages').innerHTML = '<div class="loading">Loading...</div>';

    try {
        await fetch(`/api/Messages/${conversationId}/read?userId=${currentUser.userId}`, { method: 'PATCH' });
        const res = await fetch(`/api/Messages/${conversationId}`);
        const data = await res.json();

        document.getElementById('msg-thread-header').innerHTML = `
            <div style="font-family:'Bebas Neue',sans-serif;font-size:24px;letter-spacing:1px">
                ${data.conversation?.otherUserName || name}
            </div>
            <div style="font-size:13px;color:var(--muted)">${data.conversation?.listingTitle || ''}</div>`;

        if (!data.messages || data.messages.length === 0) {
            document.getElementById('msg-thread-messages').innerHTML = '<div class="empty"><p>No messages yet!</p></div>';
        } else {
            document.getElementById('msg-thread-messages').innerHTML = data.messages.map(m => {
                const isMine = m.senderUserID === currentUser.userId;
                return `
                    <div style="display:flex;flex-direction:column;align-items:${isMine ? 'flex-end' : 'flex-start'}">
                        <div style="font-size:11px;color:var(--muted);margin-bottom:4px">
                            ${m.senderName} · ${new Date(m.sentAt).toLocaleString()}
                        </div>
                        <div style="max-width:75%;padding:10px 14px;border-radius:10px;font-size:14px;
                            ${isMine ? 'background:var(--red);color:#fff' : 'background:var(--surface);border:1px solid var(--border);color:var(--text)'}">
                            ${m.body}
                        </div>
                    </div>`;
            }).join('');
        }

        const el = document.getElementById('msg-thread-messages');
        el.scrollTop = el.scrollHeight;
        document.getElementById('msg-thread-panel').scrollIntoView({ behavior: 'smooth' });

    } catch {
        document.getElementById('msg-thread-messages').innerHTML = '<div class="empty"><p>Error loading.</p></div>';
    }
}

async function sendMsgReply() {
    const body = document.getElementById('msg-reply-body').value.trim();
    const status = document.getElementById('msg-reply-status');
    status.className = 'msg';

    if (!body) {
        status.className = 'msg error';
        status.textContent = 'Message cannot be empty.';
        return;
    }

    try {
        const payload = {
            senderUserID: currentUser.userId,
            receiverUserID: window._activeMsgReceiverId,
            body: body
        };
        if (window._activeMsgConvId) payload.conversationID = window._activeMsgConvId;
        if (window._activeMsgListingId) payload.listingID = window._activeMsgListingId;

        const res = await fetch('/api/Messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
            document.getElementById('msg-reply-body').value = '';
            if (!window._activeMsgConvId && data.conversationId) {
                window._activeMsgConvId = data.conversationId;
            }
            openMsgConversation(window._activeMsgConvId, window._activeMsgReceiverId, window._activeMsgName);
        } else {
            status.className = 'msg error';
            status.textContent = data.message || 'Failed to send.';
        }
    } catch {
        status.className = 'msg error';
        status.textContent = 'Connection error.';
    }
}

window.loadMessages = loadMessages;
window.switchMsgTab = switchMsgTab;
window.startConversation = startConversation;
window.openMsgConversation = openMsgConversation;
window.sendMsgReply = sendMsgReply;