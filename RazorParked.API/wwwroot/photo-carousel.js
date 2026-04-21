// ══════════════════════════════════════
// PHOTO CAROUSEL — RazorParked
// Shared across search cards + listing detail + host dashboard
// ══════════════════════════════════════

// ── Fetch all photos for a listing ──
async function fetchListingPhotos(listingId) {
    try {
        const res = await fetch(`/api/Listings/${listingId}/photos`);
        if (!res.ok) return [];
        return await res.json();
    } catch { return []; }
}

// ── Render a cover photo for a search card ──
// Returns an HTML string to prepend to a .listing-card
function renderCoverPhoto(photos, listingId) {
    const cover = photos.find(p => p.sortOrder === 0) || photos[0];
    if (!cover) return '';
    return `
        <div style="
            width: calc(100% + 44px);
            margin: -22px -22px 16px -22px;
            height: 160px;
            overflow: hidden;
            border-radius: 10px 10px 0 0;
            background: var(--surface2);
            position: relative;
        ">
            <img src="${cover.url}" alt="Listing photo"
                style="width:100%;height:100%;object-fit:cover;display:block;"
                onerror="this.parentElement.style.display='none'" />
            ${photos.length > 1 ? `
            <div style="position:absolute;bottom:8px;right:10px;
                background:rgba(0,0,0,0.55);color:#fff;
                font-size:11px;padding:2px 8px;border-radius:10px">
                📷 ${photos.length}
            </div>` : ''}
        </div>`;
}

// ── Render full Airbnb-style carousel for the detail page ──
// Inject into a container element by ID
function renderCarousel(photos, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!photos || photos.length === 0) {
        container.innerHTML = '';
        return;
    }

    const id = `carousel-${containerId}`;
    container.innerHTML = `
        <div id="${id}" style="position:relative;border-radius:var(--radius);
            overflow:hidden;background:var(--surface2);margin-bottom:24px;
            max-height:420px;">

            <!-- Slides -->
            <div id="${id}-slides" style="display:flex;transition:transform 0.35s ease;height:420px;">
                ${photos.map((p, i) => `
                    <div style="min-width:100%;height:420px;overflow:hidden;flex-shrink:0">
                        <img src="${p.url}" alt="Photo ${i + 1}"
                            style="width:100%;height:100%;object-fit:cover;display:block;"
                            onerror="this.style.display='none'" />
                    </div>`).join('')}
            </div>

            <!-- Prev button -->
            ${photos.length > 1 ? `
            <button onclick="carouselPrev('${id}')"
                style="position:absolute;left:12px;top:50%;transform:translateY(-50%);
                    background:rgba(255,255,255,0.9);border:none;border-radius:50%;
                    width:38px;height:38px;font-size:18px;cursor:pointer;
                    box-shadow:0 2px 8px rgba(0,0,0,0.2);display:flex;align-items:center;
                    justify-content:center;transition:background 0.2s"
                onmouseover="this.style.background='#fff'"
                onmouseout="this.style.background='rgba(255,255,255,0.9)'">‹</button>

            <!-- Next button -->
            <button onclick="carouselNext('${id}', ${photos.length})"
                style="position:absolute;right:12px;top:50%;transform:translateY(-50%);
                    background:rgba(255,255,255,0.9);border:none;border-radius:50%;
                    width:38px;height:38px;font-size:18px;cursor:pointer;
                    box-shadow:0 2px 8px rgba(0,0,0,0.2);display:flex;align-items:center;
                    justify-content:center;transition:background 0.2s"
                onmouseover="this.style.background='#fff'"
                onmouseout="this.style.background='rgba(255,255,255,0.9)'">›</button>

            <!-- Dot indicators -->
            <div style="position:absolute;bottom:12px;left:50%;transform:translateX(-50%);
                display:flex;gap:6px;">
                ${photos.map((_, i) => `
                    <div id="${id}-dot-${i}"
                        onclick="carouselGoTo('${id}', ${i}, ${photos.length})"
                        style="width:8px;height:8px;border-radius:50%;cursor:pointer;
                            background:${i === 0 ? '#fff' : 'rgba(255,255,255,0.5)'};
                            transition:background 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.3)">
                    </div>`).join('')}
            </div>

            <!-- Counter -->
            <div id="${id}-counter"
                style="position:absolute;top:12px;right:12px;
                    background:rgba(0,0,0,0.55);color:#fff;
                    font-size:12px;padding:3px 10px;border-radius:10px">
                1 / ${photos.length}
            </div>` : ''}
        </div>`;

    // Store state
    window[`_carousel_${id}`] = { index: 0, total: photos.length };
}

function carouselGoTo(id, index, total) {
    const slides = document.getElementById(`${id}-slides`);
    if (!slides) return;
    slides.style.transform = `translateX(-${index * 100}%)`;
    window[`_carousel_${id}`] = { index, total };

    // Update dots
    for (let i = 0; i < total; i++) {
        const dot = document.getElementById(`${id}-dot-${i}`);
        if (dot) dot.style.background = i === index ? '#fff' : 'rgba(255,255,255,0.5)';
    }

    // Update counter
    const counter = document.getElementById(`${id}-counter`);
    if (counter) counter.textContent = `${index + 1} / ${total}`;
}

function carouselPrev(id) {
    const state = window[`_carousel_${id}`] || { index: 0, total: 1 };
    const newIndex = (state.index - 1 + state.total) % state.total;
    carouselGoTo(id, newIndex, state.total);
}

function carouselNext(id, total) {
    const state = window[`_carousel_${id}`] || { index: 0, total };
    const newIndex = (state.index + 1) % state.total;
    carouselGoTo(id, newIndex, state.total);
}

// ── Upload widget for host dashboard / create listing ──
// Renders a drag-and-drop upload area + thumbnail grid
// onUpload(files) is called when files are selected
function renderPhotoUploadWidget(containerId, listingId, hostUserId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div style="border:2px dashed var(--border);border-radius:var(--radius);
            padding:32px;text-align:center;background:var(--surface);
            cursor:pointer;transition:border-color 0.2s"
            id="${containerId}-dropzone"
            ondragover="event.preventDefault();this.style.borderColor='var(--red)'"
            ondragleave="this.style.borderColor='var(--border)'"
            ondrop="handlePhotoDrop(event,'${containerId}',${listingId},${hostUserId})">
            <div style="font-size:32px;margin-bottom:8px">📷</div>
            <div style="font-weight:600;color:var(--text);margin-bottom:4px">
                Drag photos here or click to upload
            </div>
            <div style="font-size:13px;color:var(--muted)">
                JPG, PNG, WEBP · Max 10MB each · Multiple allowed
            </div>
            <input type="file" id="${containerId}-input" accept="image/*" multiple
                style="display:none"
                onchange="handlePhotoFileInput(event,'${containerId}',${listingId},${hostUserId})" />
            <button class="btn-secondary" style="margin-top:16px;padding:10px 24px"
                onclick="document.getElementById('${containerId}-input').click()">
                Choose Photos
            </button>
        </div>
        <div id="${containerId}-grid" style="display:grid;
            grid-template-columns:repeat(auto-fill,minmax(120px,1fr));
            gap:10px;margin-top:16px"></div>
        <div id="${containerId}-msg" class="msg" style="margin-top:8px"></div>`;

    // Load existing photos if editing
    if (listingId) loadExistingPhotos(containerId, listingId, hostUserId);
}

async function loadExistingPhotos(containerId, listingId, hostUserId) {
    const photos = await fetchListingPhotos(listingId);
    const grid = document.getElementById(`${containerId}-grid`);
    if (!grid || !photos.length) return;
    grid.innerHTML = photos.map(p => photoThumb(p, containerId, listingId, hostUserId)).join('');
}

function photoThumb(photo, containerId, listingId, hostUserId) {
    return `
    <div id="thumb-${photo.photoID}" style="position:relative;border-radius:8px;
        overflow:hidden;aspect-ratio:1;background:var(--surface2)">
        <img src="${photo.url}" style="width:100%;height:100%;object-fit:cover" />
        ${photo.sortOrder === 0 ? `
        <div style="position:absolute;top:4px;left:4px;background:var(--gold);
            color:#fff;font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px">
            COVER
        </div>` : ''}
        <button onclick="deletePhoto(${photo.photoID},${listingId},${hostUserId},'${containerId}')"
            style="position:absolute;top:4px;right:4px;background:rgba(157,34,53,0.85);
                color:#fff;border:none;border-radius:50%;width:24px;height:24px;
                font-size:14px;cursor:pointer;display:flex;align-items:center;
                justify-content:center;line-height:1">×</button>
    </div>`;
}

function handlePhotoDrop(event, containerId, listingId, hostUserId) {
    event.preventDefault();
    document.getElementById(`${containerId}-dropzone`).style.borderColor = 'var(--border)';
    const files = Array.from(event.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length) uploadPhotos(files, containerId, listingId, hostUserId);
}

function handlePhotoFileInput(event, containerId, listingId, hostUserId) {
    const files = Array.from(event.target.files);
    if (files.length) uploadPhotos(files, containerId, listingId, hostUserId);
}

async function uploadPhotos(files, containerId, listingId, hostUserId) {
    const msg = document.getElementById(`${containerId}-msg`);
    msg.className = 'msg';

    if (!listingId) {
        msg.className = 'msg error';
        msg.textContent = 'Save the listing first, then add photos.';
        return;
    }

    msg.className = 'msg';
    msg.textContent = `Uploading ${files.length} photo(s)...`;
    msg.style.display = 'block';
    msg.style.color = 'var(--muted)';

    const formData = new FormData();
    files.forEach(f => formData.append('photos', f));

    try {
        const res = await fetch(
            `/api/Listings/${listingId}/photos?hostUserId=${hostUserId}`,
            { method: 'POST', body: formData }
        );
        const data = await res.json();
        if (res.ok) {
            msg.className = 'msg success';
            msg.textContent = `${data.photos.length} photo(s) uploaded!`;
            loadExistingPhotos(containerId, listingId, hostUserId);
        } else {
            msg.className = 'msg error';
            msg.textContent = data.message || 'Upload failed.';
        }
    } catch {
        msg.className = 'msg error';
        msg.textContent = 'Connection error during upload.';
    }
}

async function deletePhoto(photoId, listingId, hostUserId, containerId) {
    if (!confirm('Delete this photo?')) return;
    try {
        const res = await fetch(
            `/api/Listings/${listingId}/photos/${photoId}?hostUserId=${hostUserId}`,
            { method: 'DELETE' }
        );
        if (res.ok) {
            const thumb = document.getElementById(`thumb-${photoId}`);
            if (thumb) thumb.remove();
        }
    } catch { alert('Error deleting photo.'); }
}

// Expose globally
window.fetchListingPhotos = fetchListingPhotos;
window.renderCoverPhoto = renderCoverPhoto;
window.renderCarousel = renderCarousel;
window.carouselPrev = carouselPrev;
window.carouselNext = carouselNext;
window.carouselGoTo = carouselGoTo;
window.renderPhotoUploadWidget = renderPhotoUploadWidget;
window.handlePhotoDrop = handlePhotoDrop;
window.handlePhotoFileInput = handlePhotoFileInput;
window.deletePhoto = deletePhoto;