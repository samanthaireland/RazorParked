// ═══════════════════════════════════════════════════════
// PAYMENT JS — RazorParked
// ═══════════════════════════════════════════════════════

function initPaymentPage() {
    const summary = document.getElementById('payment-summary');
    if (!summary) return;

    const title = window.selectedPaymentTitle || 'Parking Spot';
    const id = window.selectedReservationId;
    const start = window.selectedReservationStart;
    const end = window.selectedReservationEnd;
    const rate = window.selectedPricePerHour || 0;

    let hours = 0;
    let baseAmount = 0;
    let serviceFee = 0;
    let totalAmount = 0;

    if (start && end) {
        hours = Math.round(((new Date(end) - new Date(start)) / 3600000) * 100) / 100;
        baseAmount = Math.round(rate * hours * 100) / 100;
        serviceFee = Math.round(baseAmount * 0.10 * 100) / 100;
        totalAmount = Math.round((baseAmount + serviceFee) * 100) / 100;
    }

    window._paymentBaseAmount = baseAmount;
    window._paymentServiceFee = serviceFee;
    window._paymentTotalAmount = totalAmount;
    window._paymentHours = hours;

    summary.innerHTML = `
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:16px">
            <div style="font-size:11px;font-weight:700;color:var(--muted2);text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">Reservation</div>
            <div style="font-weight:600;color:var(--text);font-size:16px">${title}</div>
            <div style="font-size:12px;color:var(--muted);margin-top:4px">ID: #${id}</div>
            ${start && end ? `<div style="font-size:12px;color:var(--muted);margin-top:2px">
                ${new Date(start).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} →
                ${new Date(end).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>` : ''}
        </div>
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:16px">
            <div style="display:flex;justify-content:space-between;font-size:13px;padding:3px 0">
                <span style="color:var(--muted)">Rate</span>
                <span>$${rate.toFixed(2)}/hr × ${hours} hrs</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:13px;padding:3px 0">
                <span style="color:var(--muted)">Base amount</span>
                <span>$${baseAmount.toFixed(2)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:13px;padding:3px 0">
                <span style="color:var(--muted)">Service fee (10%)</span>
                <span>$${serviceFee.toFixed(2)}</span>
            </div>
            <div style="height:1px;background:var(--border);margin:8px 0"></div>
            <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:600">
                <span>Total</span>
                <span style="color:var(--red)">$${totalAmount.toFixed(2)}</span>
            </div>
        </div>`;

    updatePaymentMethodForm('Venmo');
}

function updatePaymentMethodForm(method) {
    const container = document.getElementById('payment-method-form');
    if (!container) return;

    const total = window._paymentTotalAmount || 0;
    const savedCard = getSavedCard();

    if (method === 'CreditCard') {
        if (savedCard) {
            container.innerHTML = `
                <div style="margin-top:16px;background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:14px 16px;display:flex;align-items:center;gap:12px">
                    <div style="width:36px;height:26px;background:var(--gold);border-radius:4px;flex-shrink:0"></div>
                    <div>
                        <div style="font-size:14px;font-weight:600;letter-spacing:.08em;color:var(--text)">•••• •••• •••• ${savedCard.last4}</div>
                        <div style="font-size:12px;color:var(--muted);margin-top:2px">${savedCard.name} · Expires ${savedCard.expiry}</div>
                    </div>
                    <span style="margin-left:auto;font-size:10px;background:#edf7f0;color:#2d7a4f;border:1px solid #b3dfc4;padding:2px 8px;border-radius:99px;font-weight:600">On file</span>
                </div>
                <div style="margin-top:10px;font-size:12px;color:var(--muted)">You'll be asked to confirm before your card is charged.</div>`;
        } else {
            container.innerHTML = `
                <div style="margin-top:16px">
                    <div class="form-group">
                        <label>Name on Card</label>
                        <input id="card-name" type="text" placeholder="Jane Smith" />
                    </div>
                    <div class="form-group">
                        <label>Card Number</label>
                        <input id="card-number" type="text" placeholder="4242 4242 4242 4242" maxlength="19"
                            oninput="formatCardNumber(this)" />
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Expiry</label>
                            <input id="card-expiry" type="text" placeholder="MM / YY" maxlength="7"
                                oninput="formatExpiry(this)" />
                        </div>
                        <div class="form-group">
                            <label>CVV</label>
                            <input id="card-cvv" type="password" placeholder="•••" maxlength="4" />
                        </div>
                    </div>
                </div>`;
        }
    } else if (method === 'InAppCredit') {
        container.innerHTML = `<div class="loading" style="padding:20px">Loading balance...</div>`;
        fetchCreditBalance().then(balance => {
            const canPay = balance >= total;
            container.innerHTML = `
                <div style="margin-top:16px;background:var(--gold-light);border:1px solid var(--gold);
                    border-radius:var(--radius);padding:14px;display:flex;justify-content:space-between;align-items:center">
                    <div>
                        <div style="font-size:11px;font-weight:700;color:#7a5a10;text-transform:uppercase;letter-spacing:1px">Your balance</div>
                        <div style="font-size:22px;font-weight:600;color:#7a5a10">$${balance.toFixed(2)}</div>
                    </div>
                    <button class="add-credit-btn" onclick="goAddCredits()">+ Add credits</button>
                </div>
                ${!canPay
                    ? `<div class="msg error" style="display:block;margin-top:10px">
                        Insufficient balance. You need $${(total - balance).toFixed(2)} more.
                       </div>`
                    : `<div class="msg success" style="display:block;margin-top:10px">
                        Balance sufficient ✓ — $${(balance - total).toFixed(2)} will remain after payment.
                       </div>`}`;
        });
    } else if (method === 'Venmo') {
        container.innerHTML = `
            <div style="margin-top:16px">
                <div class="form-group">
                    <label>Venmo Username</label>
                    <input id="venmo-handle" type="text" placeholder="@username" />
                </div>
            </div>`;
    }
}

function getSavedCard() {
    try {
        const saved = localStorage.getItem(`rp_card_${currentUser?.userId}`);
        return saved ? JSON.parse(saved) : null;
    } catch { return null; }
}

function showCardConfirmModal(last4, amount, title, onConfirm) {
    const existing = document.getElementById('card-confirm-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'card-confirm-overlay';
    overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center`;
    overlay.innerHTML = `
        <div style="background:#fff;border-radius:12px;padding:28px;max-width:380px;width:90%;box-shadow:0 16px 48px rgba(0,0,0,0.2)">
            <div style="font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:1px;margin-bottom:8px;color:#1a1208">Confirm Payment</div>
            <p style="font-size:14px;color:#7a6e62;margin-bottom:20px;line-height:1.55">
                Your card ending in <strong style="color:#1a1208">••••&nbsp;${last4}</strong> will be charged
                <strong style="color:#9d2235">$${amount.toFixed(2)}</strong> for <strong style="color:#1a1208">${title}</strong>.
            </p>
            <div style="display:flex;gap:10px">
                <button id="cof-confirm-yes" style="flex:1;background:#9d2235;color:#fff;border:none;border-radius:8px;padding:11px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;cursor:pointer">
                    Yes, charge card
                </button>
                <button id="cof-confirm-no" style="flex:1;background:#fff;color:#1a1208;border:1.5px solid #e5e0d8;border-radius:8px;padding:11px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;cursor:pointer">
                    No, cancel
                </button>
            </div>
        </div>`;

    document.body.appendChild(overlay);
    document.getElementById('cof-confirm-yes').onclick = () => { overlay.remove(); onConfirm(); };
    document.getElementById('cof-confirm-no').onclick = () => { overlay.remove(); };
}

async function fetchCreditBalance() {
    if (!currentUser) return 0;
    try {
        const res = await fetch(`/api/Users/${currentUser.userId}/credits`);
        if (res.ok) {
            const data = await res.json();
            return data.balance || 0;
        }
    } catch { }
    return 0;
}

function formatCardNumber(input) {
    let v = input.value.replace(/\D/g, '').substring(0, 16);
    input.value = v.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(input) {
    let v = input.value.replace(/\D/g, '').substring(0, 4);
    if (v.length >= 2) v = v.substring(0, 2) + ' / ' + v.substring(2);
    input.value = v;
}

async function confirmPayment() {
    const msg = document.getElementById('pay-msg');
    msg.className = 'msg';

    const method = document.getElementById('pay-method')?.value;
    if (!method) { msg.className = 'msg error'; msg.textContent = 'Please select a payment method.'; return; }

    // Block if insufficient in-app credit
    if (method === 'InAppCredit') {
        const balance = await fetchCreditBalance();
        const total = window._paymentTotalAmount || 0;
        if (balance < total) {
            msg.className = 'msg error';
            msg.textContent = `Insufficient balance. You need $${(total - balance).toFixed(2)} more. Add credits first.`;
            return;
        }
    }

    // If credit card + card on file — show confirmation modal first
    if (method === 'CreditCard') {
        const savedCard = getSavedCard();
        if (savedCard) {
            const title = window.selectedPaymentTitle || 'Parking Spot';
            const total = window._paymentTotalAmount || 0;
            showCardConfirmModal(savedCard.last4, total, title, () => executePayment(method, savedCard));
            return;
        }
    }

    await executePayment(method, null);
}

async function executePayment(method, savedCard) {
    const msg = document.getElementById('pay-msg');
    msg.className = 'msg';

    let cardNumber = null, cardName = null, cardExpiry = null, cardCvv = null, venmoHandle = null;

    if (method === 'CreditCard') {
        if (savedCard) {
            // Use in-memory full details if available, otherwise just last4 for display
            const full = window._cofFull;
            cardName = full?.cardName || savedCard.name;
            cardNumber = full?.cardNumber || null;
            cardExpiry = full?.cardExpiry || savedCard.expiry;
            cardCvv = null; // never stored
        } else {
            cardName = document.getElementById('card-name')?.value?.trim();
            cardNumber = document.getElementById('card-number')?.value?.replace(/\s/g, '');
            cardExpiry = document.getElementById('card-expiry')?.value?.trim();
            cardCvv = document.getElementById('card-cvv')?.value?.trim();
            if (!cardName || !cardNumber || cardNumber.length < 16 || !cardExpiry || !cardCvv) {
                msg.className = 'msg error';
                msg.textContent = 'Please fill in all card details.';
                return;
            }
        }
    } else if (method === 'Venmo') {
        venmoHandle = document.getElementById('venmo-handle')?.value?.trim();
        if (!venmoHandle) { msg.className = 'msg error'; msg.textContent = 'Please enter your Venmo username.'; return; }
    }

    try {
        const res = await fetch('/api/Payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                reservationID: window.selectedReservationId,
                driverUserID: currentUser.userId,
                amount: window._paymentTotalAmount || window.selectedPaymentAmount,
                paymentMethod: method,
                cardNumber,
                cardName,
                cardExpiry,
                cardCvv,
                venmoHandle
            })
        });

        const data = await res.json();

        if (res.ok) {
            msg.className = 'msg success';
            msg.textContent = 'Payment confirmed!! Loading receipt...';
            window._lastReceipt = data;

            const last4 = savedCard?.last4 || cardNumber?.slice(-4) || '';
            const notifMsg = method === 'CreditCard'
                ? `✅ Payment of $${data.totalAmount?.toFixed(2)} confirmed — card ending ${last4} charged for ${data.listingTitle || window.selectedPaymentTitle}!`
                : `✅ Payment of $${data.totalAmount?.toFixed(2)} confirmed for ${data.listingTitle || window.selectedPaymentTitle}!`;

            await fetch('/api/Notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userID: currentUser.userId,
                    reservationID: window.selectedReservationId,
                    type: 'PaymentConfirmed',
                    message: notifMsg
                })
            }).catch(() => { });

            updateNotifBadge();
            setTimeout(() => showReceiptPage(data), 1500);
        } else {
            msg.className = 'msg error';
            msg.textContent = data.message || 'Payment failed.';
        }
    } catch {
        msg.className = 'msg error';
        msg.textContent = 'Connection error.';
    }
}

function showReceiptPage(receiptData) {
    window._lastReceipt = receiptData;
    showPage('receipt');
    setTimeout(() => renderReceipt(receiptData), 100);
}

function renderReceipt(d) {
    const container = document.getElementById('receipt-content');
    if (!container) return;

    const start = new Date(d.reservationStart);
    const end = new Date(d.reservationEnd);
    const paidAt = new Date(d.paidAt);
    const hours = d.hours || Math.round(((end - start) / 3600000) * 100) / 100;
    const base = d.baseAmount || d.amount || 0;
    const fee = d.serviceFee || 0;
    const total = d.totalAmount || (base + fee);
    const methodLabel = d.paymentMethod === 'CreditCard'
        ? `Credit card ${d.cardLastFour ? '••••' + d.cardLastFour : ''}`
        : d.paymentMethod === 'Venmo'
            ? `Venmo ${d.venmoHandle || ''}`
            : 'In-app credit';

    container.innerHTML = `
        <div style="max-width:500px;margin:0 auto">
            <div style="text-align:center;margin-bottom:24px">
                <div style="font-family:'Bebas Neue',sans-serif;font-size:28px;color:var(--red);letter-spacing:2px">🐗 RazorParked</div>
                <div style="font-size:13px;color:var(--muted)">Payment Receipt</div>
            </div>
            <div class="form-card" style="max-width:100%">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding-bottom:16px;border-bottom:2px solid var(--red)">
                    <div>
                        <div style="font-family:'Bebas Neue',sans-serif;font-size:24px;letter-spacing:1px">${d.listingTitle || d.title || 'Parking Spot'}</div>
                        <div style="font-size:13px;color:var(--muted)">${d.listingAddress || d.location || ''}</div>
                    </div>
                    <div style="background:#edf7f0;color:#2d7a4f;border:1px solid #b3dfc4;font-size:11px;font-weight:700;padding:4px 12px;border-radius:100px;text-transform:uppercase;letter-spacing:1px">Paid</div>
                </div>
                <div style="margin-bottom:16px">
                    <div style="display:flex;justify-content:space-between;font-size:13px;padding:5px 0;border-bottom:1px solid var(--surface2)">
                        <span style="color:var(--muted)">Host</span><span style="font-weight:600">${d.hostName || '—'}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;font-size:13px;padding:5px 0;border-bottom:1px solid var(--surface2)">
                        <span style="color:var(--muted)">Spot</span><span style="font-weight:600">${d.spotNumber || d.assignedSpotNumber || '—'}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;font-size:13px;padding:5px 0;border-bottom:1px solid var(--surface2)">
                        <span style="color:var(--muted)">Check in</span><span>${start.toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;font-size:13px;padding:5px 0;border-bottom:1px solid var(--surface2)">
                        <span style="color:var(--muted)">Check out</span><span>${end.toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;font-size:13px;padding:5px 0;border-bottom:1px solid var(--surface2)">
                        <span style="color:var(--muted)">Duration</span><span>${hours} hrs</span>
                    </div>
                </div>
                <div style="background:var(--surface);border-radius:8px;padding:14px;margin-bottom:16px">
                    <div style="display:flex;justify-content:space-between;font-size:13px;padding:3px 0">
                        <span style="color:var(--muted)">Rate</span><span>$${(d.pricePerHour || base / hours).toFixed(2)}/hr × ${hours} hrs</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;font-size:13px;padding:3px 0">
                        <span style="color:var(--muted)">Base amount</span><span>$${base.toFixed(2)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;font-size:13px;padding:3px 0">
                        <span style="color:var(--muted)">Service fee (10%)</span><span>$${fee.toFixed(2)}</span>
                    </div>
                    <div style="height:1px;background:var(--border);margin:8px 0"></div>
                    <div style="display:flex;justify-content:space-between;font-size:17px;font-weight:600">
                        <span>Total paid</span><span style="color:var(--red)">$${total.toFixed(2)}</span>
                    </div>
                </div>
                <div style="margin-bottom:20px">
                    <div style="display:flex;justify-content:space-between;font-size:13px;padding:5px 0;border-bottom:1px solid var(--surface2)">
                        <span style="color:var(--muted)">Payment method</span><span>${methodLabel}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;font-size:13px;padding:5px 0;border-bottom:1px solid var(--surface2)">
                        <span style="color:var(--muted)">Reservation ID</span><span>#${d.reservationId || d.reservationID || '—'}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;font-size:13px;padding:5px 0">
                        <span style="color:var(--muted)">Paid at</span><span>${paidAt.toLocaleString()}</span>
                    </div>
                </div>
                <div style="display:flex;gap:10px">
                    <button class="btn-primary" style="flex:1" onclick="downloadReceiptPDF()">⬇ Download PDF</button>
                    <button class="btn-secondary" style="flex:1" onclick="showPage('my-reservations')">← My Reservations</button>
                </div>
            </div>
        </div>`;
}

async function loadReceiptForReservation(reservationId) {
    try {
        const res = await fetch(`/api/Payments/reservation/${reservationId}`);
        if (res.ok) {
            const data = await res.json();
            showReceiptPage(data);
        }
    } catch { alert('Could not load receipt.'); }
}

function downloadReceiptPDF() {
    const d = window._lastReceipt;
    if (!d) return;

    const start = new Date(d.reservationStart);
    const end = new Date(d.reservationEnd);
    const hours = d.hours || Math.round(((end - start) / 3600000) * 100) / 100;
    const base = d.baseAmount || d.amount || 0;
    const fee = d.serviceFee || 0;
    const total = d.totalAmount || (base + fee);
    const methodLabel = d.paymentMethod === 'CreditCard'
        ? `Credit Card ${d.cardLastFour ? '••••' + d.cardLastFour : ''}`
        : d.paymentMethod === 'Venmo'
            ? `Venmo ${d.venmoHandle || ''}`
            : 'In-App Credit';

    const html = `<!DOCTYPE html><html><head><title>RazorParked Receipt</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 500px; margin: 40px auto; color: #1a1208; }
        h1 { color: #9d2235; font-size: 28px; margin-bottom: 4px; }
        .sub { color: #7a6e62; font-size: 13px; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        td { padding: 7px 0; font-size: 13px; border-bottom: 1px solid #f3f0ec; }
        td:last-child { text-align: right; font-weight: 600; }
        .total td { font-size: 17px; font-weight: 700; border-top: 2px solid #9d2235; border-bottom: none; }
        .total td:last-child { color: #9d2235; }
        .badge { background: #edf7f0; color: #2d7a4f; border: 1px solid #b3dfc4; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 100px; }
    </style></head><body>
    <h1>🐗 RazorParked</h1>
    <div class="sub">Payment Receipt &nbsp;<span class="badge">PAID</span></div>
    <h2 style="font-size:18px;margin-bottom:4px">${d.listingTitle || d.title}</h2>
    <div style="color:#7a6e62;font-size:13px;margin-bottom:16px">${d.listingAddress || d.location || ''}</div>
    <table>
        <tr><td style="color:#7a6e62">Host</td><td>${d.hostName || '—'}</td></tr>
        <tr><td style="color:#7a6e62">Spot</td><td>${d.spotNumber || d.assignedSpotNumber || '—'}</td></tr>
        <tr><td style="color:#7a6e62">Check in</td><td>${start.toLocaleString()}</td></tr>
        <tr><td style="color:#7a6e62">Check out</td><td>${end.toLocaleString()}</td></tr>
        <tr><td style="color:#7a6e62">Duration</td><td>${hours} hrs</td></tr>
    </table>
    <table>
        <tr><td style="color:#7a6e62">Rate</td><td>$${(d.pricePerHour || base / hours).toFixed(2)}/hr × ${hours} hrs</td></tr>
        <tr><td style="color:#7a6e62">Base amount</td><td>$${base.toFixed(2)}</td></tr>
        <tr><td style="color:#7a6e62">Service fee (10%)</td><td>$${fee.toFixed(2)}</td></tr>
        <tr class="total"><td>Total paid</td><td>$${total.toFixed(2)}</td></tr>
    </table>
    <table>
        <tr><td style="color:#7a6e62">Payment method</td><td>${methodLabel}</td></tr>
        <tr><td style="color:#7a6e62">Reservation ID</td><td>#${d.reservationId || d.reservationID}</td></tr>
        <tr><td style="color:#7a6e62">Paid at</td><td>${new Date(d.paidAt).toLocaleString()}</td></tr>
    </table>
    <div style="margin-top:24px;font-size:11px;color:#a8a09a;text-align:center">
        RazorParked · University of Arkansas · Fayetteville, AR · Go Hogs!
    </div>
    </body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RazorParked-Receipt-${d.reservationId || d.reservationID}.html`;
    a.click();
    URL.revokeObjectURL(url);
}

function selectPayMethod(method) {
    document.querySelectorAll('.method-option').forEach(el => el.classList.remove('selected'));
    const el = document.getElementById('method-' + method);
    if (el) el.classList.add('selected');
    const input = document.getElementById('pay-method');
    if (input) input.value = method;
    updatePaymentMethodForm(method);
}

function goAddCredits() {
    window._openCreditsTab = true;
    showPage('profile');
}

window.selectPayMethod = selectPayMethod;
window.initPaymentPage = initPaymentPage;
window.updatePaymentMethodForm = updatePaymentMethodForm;
window.confirmPayment = confirmPayment;
window.executePayment = executePayment;
window.getSavedCard = getSavedCard;
window.showCardConfirmModal = showCardConfirmModal;
window.formatCardNumber = formatCardNumber;
window.formatExpiry = formatExpiry;
window.showReceiptPage = showReceiptPage;
window.renderReceipt = renderReceipt;
window.loadReceiptForReservation = loadReceiptForReservation;
window.downloadReceiptPDF = downloadReceiptPDF;
window.goAddCredits = goAddCredits;