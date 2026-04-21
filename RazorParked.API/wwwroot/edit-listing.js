// ══════════════════════════════════════
// EDIT LISTING
// ══════════════════════════════════════

function editListing(id, title, location, price) {
    document.getElementById('edit-listing-id').value = id;
    document.getElementById('edit-title').value = title;
    document.getElementById('edit-location').value = location;
    document.getElementById('edit-price').value = price;
    document.getElementById('edit-description').value = '';
    document.getElementById('edit-listing-modal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('edit-listing-modal').style.display = 'none';
}

async function saveEditListing() {
    const msg = document.getElementById('edit-msg');
    msg.className = 'msg';
    const id = document.getElementById('edit-listing-id').value;
    try {
        const res = await fetch(`/api/Listings/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                hostUserID: currentUser.userId,
                title: document.getElementById('edit-title').value,
                location: document.getElementById('edit-location').value,
                pricePerHour: parseFloat(document.getElementById('edit-price').value),
                description: document.getElementById('edit-description').value,
                isAvailable: true
            })
        });
        const data = await res.json();
        if (res.ok) {
            msg.className = 'msg success';
            msg.textContent = 'Listing updated!';
            setTimeout(() => { closeEditModal(); loadHostListings(); }, 1200);
        } else {
            msg.className = 'msg error';
            msg.textContent = data.message || 'Update failed.';
        }
    } catch {
        msg.className = 'msg error';
        msg.textContent = 'Connection error.';
    }
}

window.editListing = editListing;
window.closeEditModal = closeEditModal;
window.saveEditListing = saveEditListing;