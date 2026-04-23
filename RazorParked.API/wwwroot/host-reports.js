let earningsChartInstance = null;
let usageChartInstance = null;

async function loadHostReports() {
    const currentUser = JSON.parse(localStorage.getItem('rp_user') || 'null');
    if (!currentUser) return;

    const hostId = currentUser.userId ?? currentUser.UserID ?? currentUser.userid ?? currentUser.id;
    console.log("currentUser =", currentUser);
    console.log("resolved hostId =", hostId);

    console.log("earnings url =", `/api/Reports/host/${hostId}/earnings`);
    console.log("reservations url =", `/api/Reports/host/${hostId}/reservations`);
    console.log("usage url =", `/api/Reports/host/${hostId}/usage`);

 

    try {
        const [earningsRes, reservationsRes, usageRes] = await Promise.all([
            fetch(`/api/Reports/host/${hostId}/earnings`),
            fetch(`/api/Reports/host/${hostId}/reservations`),
            fetch(`/api/Reports/host/${hostId}/usage`)
        ]);

        const earnings = await earningsRes.json();
        const reservations = await reservationsRes.json();
        const usage = await usageRes.json();

        console.log("earnings =", earnings);
        console.log("reservations =", reservations);
        console.log("usage =", usage);

        document.getElementById('report-total-earnings').textContent =
            '$' + Number(earnings.totalEarnings ?? 0).toFixed(2);

        const reservationList = Array.isArray(reservations)
            ? reservations
            : (reservations.reservations ?? []);

        document.getElementById('report-total-reservations').textContent =
            reservationList.length;

        document.getElementById('report-confirmed').textContent =
            Number(usage.confirmed ?? 0);

        document.getElementById('report-cancelled').textContent =
            Number(usage.cancelled ?? 0);

        renderEarningsBreakdown(earnings);
        renderReservationsReport(reservationList);
        renderUsageAnalytics(usage);

    } catch (err) {
        console.error('Error loading reports:', err);
    }
}

function renderEarningsBreakdown(earnings) {
    const container = document.getElementById('earnings-report');
    const byListing = earnings.breakdown ?? earnings.byListing ?? [];

    if (!byListing.length) {
        container.innerHTML = '<p>No earnings data yet.</p>';
        return;
    }

    container.innerHTML = byListing.map(item => `
        <div style="display:flex;justify-content:space-between;padding:12px;border-bottom:1px solid var(--border)">
            <span>${item.title ?? item.listing ?? 'Listing'}</span>
            <strong>$${Number(item.total ?? 0).toFixed(2)}</strong>
        </div>
    `).join('');

    if (earningsChartInstance) earningsChartInstance.destroy();

    earningsChartInstance = new Chart(document.getElementById('earningsChart'), {
        type: 'bar',
        data: {
            labels: byListing.map(i => i.title ?? i.listing ?? 'Listing'),
            datasets: [{
                data: byListing.map(i => Number(i.total ?? 0)),
                backgroundColor: '#9d2235'
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });
}

function renderReservationsReport(list) {
    const container = document.getElementById('reservations-report');

    if (!list.length) {
        container.innerHTML = '<p>No reservations yet.</p>';
        return;
    }

    container.innerHTML = list.map(r => `
        <div style="display:flex;justify-content:space-between;padding:12px;border-bottom:1px solid var(--border)">
            <span>${r.listing ?? 'Spot'}</span>
            <span>${formatDate(r.start)}</span>
            <span>${r.status}</span>
        </div>
    `).join('');
}

function renderUsageAnalytics(usage) {
    const container = document.getElementById('usage-report');

    const chartData = [
        usage.totalReservations ?? 0,
        usage.confirmed ?? 0,
        usage.cancelled ?? 0
    ];

    container.innerHTML = `
        <div style="display:flex;gap:24px">
            <div>Total: ${chartData[0]}</div>
            <div>Confirmed: ${chartData[1]}</div>
            <div>Cancelled: ${chartData[2]}</div>
        </div>
    `;

    if (usageChartInstance) usageChartInstance.destroy();

    usageChartInstance = new Chart(document.getElementById('usageChart'), {
        type: 'line',
        data: {
            labels: ['Total', 'Confirmed', 'Cancelled'],
            datasets: [{
                data: chartData,
                borderColor: '#9d2235',
                backgroundColor: 'rgba(157,34,53,0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });
}

function formatDate(value) {
    if (!value) return 'N/A';
    const d = new Date(value);
    return isNaN(d) ? 'N/A' : d.toLocaleDateString();
}