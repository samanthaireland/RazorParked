let businessRevenueChartInstance = null;
let businessStatusChartInstance = null;

// Shietsu Business Analytics
async function loadBusinessAnalytics() {
    try {
        const currentUser = JSON.parse(localStorage.getItem('rp_user') || 'null');
        if (!currentUser) return;

        const businessId = currentUser.userId ?? currentUser.UserID ?? currentUser.userid ?? currentUser.id;

        const res = await fetch(`/api/Analytics/business/${businessId}`);
        const data = await res.json();

        const container = document.getElementById('business-analytics-container');
        if (!container) return;

        if (!data.length) {
            container.innerHTML = "<p>No data available</p>";
            return;
        }

        renderBusinessRevenueChart(data);
        renderBusinessStatusChart(data);

        container.innerHTML = data.map(item => `
            <div class="listing-card" style="margin-bottom:16px">
                <h3>${item.listingName}</h3>
                <p>Total Reservations: ${item.totalReservations}</p>
                <p>Confirmed: ${item.confirmedReservations}</p>
                <p>Cancelled: ${item.cancelledReservations}</p>
                <p><strong>Revenue: $${Number(item.estimatedRevenue ?? 0).toFixed(2)}</strong></p>
            </div>
        `).join("");

    } catch (err) {
        console.error("Business analytics error:", err);
        const container = document.getElementById('business-analytics-container');
        if (container) {
            container.innerHTML = "<p>Error loading business analytics</p>";
        }
    }
}

function renderBusinessRevenueChart(data) {
    const canvas = document.getElementById('businessRevenueChart');
    if (!canvas) return;

    if (businessRevenueChartInstance) {
        businessRevenueChartInstance.destroy();
    }

    businessRevenueChartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: data.map(item => item.listingName),
            datasets: [{
                label: 'Revenue ($)',
                data: data.map(item => Number(item.estimatedRevenue ?? 0)),
                backgroundColor: '#9d2235',
                borderRadius: 6
            }]
        },
        options: {
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    ticks: {
                        maxRotation: 0,
                        minRotation: 0,
                        autoSkip: false,
                        font: {
                            family: "'DM Sans', sans-serif",
                            size: 11
                        },
                        callback: function (value) {
                            const label = this.getLabelForValue(value);
                            return label.length > 12
                                ? label.substring(0, 12) + '...'
                                : label;
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return '$' + value;
                        },
                        font: {
                            family: "'DM Sans', sans-serif",
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

function renderBusinessStatusChart(data) {
    const canvas = document.getElementById('businessStatusChart');
    if (!canvas) return;

    if (businessStatusChartInstance) {
        businessStatusChartInstance.destroy();
    }

    const totalConfirmed = data.reduce((sum, item) => sum + Number(item.confirmedReservations ?? 0), 0);
    const totalCancelled = data.reduce((sum, item) => sum + Number(item.cancelledReservations ?? 0), 0);

    businessStatusChartInstance = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['Confirmed', 'Cancelled'],
            datasets: [{
                data: [totalConfirmed, totalCancelled],
                backgroundColor: ['#2d7a4f', '#9d2235'],
                borderWidth: 1
            }]
        },
        options: {
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            family: "'DM Sans', sans-serif",
                            size: 12
                        }
                    }
                }
            }
        }
    });
}