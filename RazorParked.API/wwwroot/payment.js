// ═══════════════════════════════════════════════════════
// PAYMENT JS
// Owner: Ryleigh
// ═══════════════════════════════════════════════════════

function initPaymentPage() {
    const summary = document.getElementById('payment-summary');
    if (!summary) return;

    const title = window.selectedPaymentTitle || 'Parking Spot';
    const id = window.selectedReservationId;

    if (id) {
        summary.innerHTML = `
            <div class="detail-item">
                <label>Reservation</label>
                <span>${title}</span>
            </div>
            <div class="detail-item" style="margin-top:8px">
                <label>Reservation ID</label>
                <span>#${id}</span>
            </div>`;
    }
}

async function confirmPayment() {
    const msg = document.getElementById('pay-msg');
    msg.className = 'msg';
    try {
        if (!window.selectedPaymentAmount || window.selectedPaymentAmount <= 0) {
            const rRes = await fetch(`/api/Reservations/user/${currentUser.userId}`);
            const reservations = await rRes.json();
            const match = reservations.find(r => r.reservationID === window.selectedReservationId);
            if (match) window.selectedPaymentAmount = match.pricePerHour;
        }

        const res = await fetch('/api/Payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                reservationID: window.selectedReservationId,
                driverUserID: currentUser.userId,
                amount: window.selectedPaymentAmount,
                paymentMethod: document.getElementById('pay-method').value
            })
        });
        const data = await res.json();
        if (res.ok) {
            msg.className = 'msg success';
            msg.textContent = 'Payment confirmed!! Redirecting...';

            // Notification for payment confirmation
            await fetch('/api/Notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userID: currentUser.userId,
                    reservationID: window.selectedReservationId,
                    type: 'PaymentConfirmed',
                    message: `✅ Payment confirmed for ${window.selectedPaymentTitle || 'reservation'} #${window.selectedReservationId}!`
                })
            }).catch(() => { });

            updateNotifBadge();
            setTimeout(() => showPage('my-reservations'), 2000);
        } else {
            msg.className = 'msg error';
            msg.textContent = data.message || 'Payment failed.';
        }
    } catch {
        msg.className = 'msg error';
        msg.textContent = 'Connection error.';
    }
}

window.initPaymentPage = initPaymentPage;
window.confirmPayment = confirmPayment;