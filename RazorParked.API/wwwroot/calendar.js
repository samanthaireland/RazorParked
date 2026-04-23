// CALENDAR JS -- RazorParked v3
// Fixes: same-day depart, scrollable right panel, all days show slots

var FB_SCHEDULE = {
    '2026-09-05': { opp: 'North Alabama', home: true, time: '11:00 AM', tv: 'SEC Network' },
    '2026-09-12': { opp: 'Utah', home: false, time: '3:30 PM', tv: 'ESPN' },
    '2026-09-19': { opp: 'Georgia', home: true, time: '6:00 PM', tv: 'ABC' },
    '2026-09-26': { opp: 'Tulsa', home: true, time: '11:00 AM', tv: 'SEC+' },
    '2026-10-03': { opp: 'Texas A&M', home: false, time: '6:00 PM', tv: 'ESPN' },
    '2026-10-10': { opp: 'Tennessee', home: true, time: '2:30 PM', tv: 'CBS' },
    '2026-10-17': { opp: 'Vanderbilt', home: false, time: '11:00 AM', tv: 'SEC Network' },
    '2026-10-31': { opp: 'Missouri', home: true, time: '11:00 AM', tv: 'SEC+' },
    '2026-11-07': { opp: 'Auburn', home: false, time: '6:00 PM', tv: 'ESPN' },
    '2026-11-14': { opp: 'South Carolina', home: true, time: '11:00 AM', tv: 'SEC Network' },
    '2026-11-21': { opp: 'Texas', home: false, time: '6:00 PM', tv: 'ABC' },
    '2026-11-28': { opp: 'LSU', home: true, time: '2:30 PM', tv: 'CBS' }
};
var BB_SCHEDULE = {
    '2026-02-20': { opp: 'Xavier', home: true, time: '3:00 PM', tv: '' },
    '2026-02-21': { opp: 'Xavier', home: true, time: '1:00 PM', tv: '' },
    '2026-02-22': { opp: 'Xavier', home: true, time: 'Noon', tv: '' },
    '2026-02-24': { opp: 'Arkansas State', home: true, time: '3:00 PM', tv: '' },
    '2026-02-25': { opp: 'Arkansas State', home: true, time: '3:00 PM', tv: '' },
    '2026-03-01': { opp: 'Texas-Arlington', home: true, time: '11:00 AM', tv: '' },
    '2026-03-03': { opp: 'Oral Roberts', home: true, time: '3:00 PM', tv: '' },
    '2026-03-06': { opp: 'Stetson', home: true, time: '1:00 PM', tv: '' },
    '2026-03-07': { opp: 'Stetson', home: true, time: '2:00 PM', tv: '' },
    '2026-03-08': { opp: 'Stetson', home: true, time: '1:00 PM', tv: '' },
    '2026-03-09': { opp: 'Stetson', home: true, time: 'Noon', tv: '' },
    '2026-03-13': { opp: 'Mississippi State', home: true, time: '6:00 PM', tv: '' },
    '2026-03-14': { opp: 'Mississippi State', home: true, time: '1:00 PM', tv: '' },
    '2026-03-17': { opp: 'Northern Colorado', home: true, time: '6:00 PM', tv: '' },
    '2026-03-18': { opp: 'Northern Colorado', home: true, time: '3:00 PM', tv: '' },
    '2026-03-20': { opp: 'South Carolina', home: false, time: '6:00 PM', tv: '' },
    '2026-03-21': { opp: 'South Carolina', home: false, time: '3:00 PM', tv: '' },
    '2026-03-22': { opp: 'South Carolina', home: false, time: '12:30 PM', tv: '' },
    '2026-03-24': { opp: 'Central Arkansas', home: true, time: '6:00 PM', tv: '' },
    '2026-03-27': { opp: 'Florida', home: true, time: '6:00 PM', tv: '' },
    '2026-03-28': { opp: 'Florida', home: true, time: '1:00 PM', tv: '' },
    '2026-03-29': { opp: 'Florida', home: true, time: 'Noon', tv: '' },
    '2026-03-31': { opp: 'Missouri State', home: false, time: '6:00 PM', tv: '' },
    '2026-04-02': { opp: 'Auburn', home: false, time: '6:00 PM', tv: '' },
    '2026-04-03': { opp: 'Auburn', home: false, time: '6:00 PM', tv: '' },
    '2026-04-04': { opp: 'Auburn', home: false, time: '2:00 PM', tv: '' },
    '2026-04-07': { opp: 'Little Rock', home: true, time: '6:00 PM', tv: '' },
    '2026-04-10': { opp: 'Alabama', home: false, time: '6:00 PM', tv: '' },
    '2026-04-11': { opp: 'Alabama', home: false, time: '4:00 PM', tv: '' },
    '2026-04-12': { opp: 'Alabama', home: false, time: '1:00 PM', tv: '' },
    '2026-04-16': { opp: 'Georgia', home: true, time: '7:00 PM', tv: '' },
    '2026-04-17': { opp: 'Georgia', home: true, time: '6:00 PM', tv: '' },
    '2026-04-18': { opp: 'Georgia', home: true, time: '1:00 PM', tv: '' },
    '2026-04-21': { opp: 'Missouri State', home: true, time: '6:00 PM', tv: '' },
    '2026-04-23': { opp: 'Missouri', home: false, time: '7:00 PM', tv: 'SEC Network' },
    '2026-04-24': { opp: 'Missouri', home: false, time: '7:00 PM', tv: 'SEC Network' },
    '2026-04-25': { opp: 'Missouri', home: false, time: '2:00 PM', tv: 'SEC Network' },
    '2026-04-28': { opp: 'Northwestern State', home: true, time: '6:00 PM', tv: 'SECN+' },
    '2026-04-29': { opp: 'Northwestern State', home: true, time: '3:00 PM', tv: 'SECN+' },
    '2026-05-01': { opp: 'Ole Miss', home: true, time: '6:00 PM', tv: 'SECN+' },
    '2026-05-02': { opp: 'Ole Miss', home: true, time: '2:00 PM', tv: 'SECN+' },
    '2026-05-03': { opp: 'Ole Miss', home: true, time: '2:00 PM', tv: 'SEC Network' },
    '2026-05-08': { opp: 'Oklahoma', home: true, time: '6:00 PM', tv: 'SECN+' },
    '2026-05-09': { opp: 'Oklahoma', home: true, time: '2:00 PM', tv: 'SECN+' },
    '2026-05-10': { opp: 'Oklahoma', home: true, time: '1:00 PM', tv: 'SECN+' },
    '2026-05-14': { opp: 'Kentucky', home: false, time: '5:30 PM', tv: 'SECN+' },
    '2026-05-15': { opp: 'Kentucky', home: false, time: '5:30 PM', tv: 'SECN+' },
    '2026-05-16': { opp: 'Kentucky', home: false, time: '1:00 PM', tv: 'SECN+' }
};

var DAY_SLOTS = ['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM',
    '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM'];
var NEXT_SLOTS = ['12:00 AM', '1:00 AM', '2:00 AM', '3:00 AM', '4:00 AM', '5:00 AM', '6:00 AM'];
var ALL_SLOTS = DAY_SLOTS.concat(NEXT_SLOTS);
var DAY_COUNT = DAY_SLOTS.length;

var MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
var SHORT_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function _p(n) { return n < 10 ? '0' + n : '' + n; }
function _k(d) { return d.getFullYear() + '-' + _p(d.getMonth() + 1) + '-' + _p(d.getDate()); }
function _ms(k) { return new Date(k + 'T12:00:00').getTime(); }
function _short(k) { return new Date(k + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); }
function _long(k) { return new Date(k + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }); }
function _todayK() { var t = new Date(); return _k(new Date(t.getFullYear(), t.getMonth(), t.getDate())); }
function _to24(t) {
    var m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!m) return '00:00';
    var h = parseInt(m[1]), min = m[2], p = m[3].toUpperCase();
    if (p === 'AM' && h === 12) h = 0;
    if (p === 'PM' && h !== 12) h += 12;
    return _p(h) + ':' + min;
}

function _injectStyles() {
    if (document.getElementById('rp-cal-css')) return;
    var s = document.createElement('style');
    s.id = 'rp-cal-css';
    s.textContent =
        '.rpc{background:#fff;border:1px solid #e5e0d8;border-radius:14px;overflow:hidden;font-family:"DM Sans",sans-serif}' +
        '.rpc-tabs{display:flex;border-bottom:1px solid #e5e0d8}' +
        '.rpc-tab{flex:1;padding:9px;font-size:12px;font-weight:600;text-align:center;cursor:pointer;border:none;background:none;font-family:inherit;color:#888;border-bottom:2px solid transparent;transition:all .15s}' +
        '.rpc-tab.t-all{color:#222;border-bottom-color:#222;background:#f5f5f5}' +
        '.rpc-tab.t-fb{color:#9d2235;border-bottom-color:#9d2235;background:#fdf0f2}' +
        '.rpc-tab.t-bb{color:#2d7a4f;border-bottom-color:#2d7a4f;background:#edf7f0}' +
        '.rpc-body{display:grid;grid-template-columns:1fr 300px}' +
        '.rpc-left{padding:16px;border-right:1px solid #e5e0d8}' +
        '.rpc-2col{display:grid;grid-template-columns:1fr 1fr;gap:18px}' +
        '.rpc-mhdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}' +
        '.rpc-mttl{font-size:12px;font-weight:600;color:#1a1208}' +
        '.rpc-nb{width:24px;height:24px;border-radius:50%;border:1px solid #e5e0d8;background:none;cursor:pointer;font-size:13px;color:#1a1208;display:flex;align-items:center;justify-content:center;padding:0}' +
        '.rpc-nb:hover{background:#f0f0f0}' +
        '.rpc-dgrid{display:grid;grid-template-columns:repeat(7,1fr);gap:1px}' +
        '.rpc-dow{font-size:9px;color:#bbb;text-align:center;padding:2px 0;font-weight:500}' +
        '.rpc-day{position:relative;aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:11px;cursor:pointer;color:#1a1208;flex-direction:column;transition:background .1s;border-radius:50%}' +
        '.rpc-day:hover:not(.rbl):not(.rem){background:#f0f0f0}' +
        '.rpc-day.rem{pointer-events:none}' +
        '.rpc-day.rbl{pointer-events:none;color:#ccc;text-decoration:line-through}' +
        '.rpc-day.rarr{background:#222;color:#fff;border-radius:50% 0 0 50%}' +
        '.rpc-day.rdep{background:#222;color:#fff;border-radius:0 50% 50% 0}' +
        '.rpc-day.rarr.rsolo,.rpc-day.rarr.rdep{border-radius:50%}' +
        '.rpc-day.rin{background:#f0f0f0;border-radius:0}' +
        '.rdots{display:flex;gap:2px;position:absolute;bottom:2px;left:50%;transform:translateX(-50%)}' +
        '.rdot{width:4px;height:4px;border-radius:50%}' +
        '.rdot.fb-h{background:#9d2235}.rdot.fb-a{background:#3a7bd5}.rdot.bb-h{background:#2d7a4f}.rdot.bb-a{background:#5aab78}' +
        '.rpc-day.rarr .rdots,.rpc-day.rdep .rdots{filter:brightness(3)}' +
        '.rpc-legend{display:flex;gap:10px;margin-top:10px;flex-wrap:wrap}' +
        '.rpc-ld{display:flex;align-items:center;gap:4px;font-size:10px;color:#aaa}' +
        '.rpc-ldot{width:6px;height:6px;border-radius:50%}' +
        '.rpc-right{display:flex;flex-direction:column;height:100%}' +
        '.rpc-bh{padding:10px 12px;background:#faf9f7;border-bottom:1px solid #e5e0d8;flex-shrink:0}' +
        '.rpc-bh-lbl{font-size:9px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#bbb;margin-bottom:6px}' +
        '.rpc-bboxes{display:flex;gap:6px}' +
        '.rpc-bbox{flex:1;background:#fff;border:1.5px solid #ddd;border-radius:8px;padding:7px 9px;cursor:pointer;transition:border-color .15s}' +
        '.rpc-bbox.active{border-color:#222;border-width:2px}' +
        '.rpc-bbox-lbl{font-size:9px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#bbb;margin-bottom:2px}' +
        '.rpc-bbox-date{font-size:11px;font-weight:600;color:#1a1208;line-height:1.3}' +
        '.rpc-bbox-date.ph{color:#ccc;font-weight:400}' +
        '.rpc-bbox-time{font-size:11px;color:#9d2235;font-weight:700;margin-top:2px}' +
        '.rpc-dur{font-size:11px;color:#7a6e62;text-align:center;padding:6px 12px;border-bottom:1px solid #e5e0d8;line-height:1.5;flex-shrink:0}' +
        '.rpc-dur strong{color:#1a1208}' +
        '.rpc-right-inner{overflow-y:auto;max-height:340px;min-height:0}' +
        '.rpc-gl-month{font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#bbb;padding:7px 12px 3px;background:#faf9f7;border-bottom:1px solid #f0f0f0;position:sticky;top:0;z-index:1}' +
        '.rpc-gl-item{display:flex;align-items:center;gap:9px;padding:7px 12px;border-bottom:1px solid #f5f5f5;cursor:pointer;transition:background .1s}' +
        '.rpc-gl-item:hover{background:#faf9f7}' +
        '.rpc-gl-date{font-size:12px;font-weight:700;color:#888;min-width:30px;text-align:center;line-height:1.2}' +
        '.rpc-gl-date span{display:block;font-size:9px;font-weight:500;color:#bbb;text-transform:uppercase}' +
        '.rpc-gl-bar{width:3px;border-radius:2px;align-self:stretch;flex-shrink:0;min-height:28px}' +
        '.rpc-gl-bar.fb-h{background:#9d2235}.rpc-gl-bar.fb-a{background:#3a7bd5}' +
        '.rpc-gl-bar.bb-h{background:#2d7a4f}.rpc-gl-bar.bb-a{background:#5aab78}' +
        '.rpc-gl-info{flex:1;min-width:0}' +
        '.rpc-gl-matchup{font-size:12px;font-weight:600;color:#1a1208;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
        '.rpc-gl-meta{font-size:10px;color:#aaa;margin-top:1px}' +
        '.rpc-gl-pill{font-size:9px;font-weight:700;padding:2px 6px;border-radius:99px;flex-shrink:0}' +
        '.rpc-gl-pill.fph{background:#9d2235;color:#fff}.rpc-gl-pill.fpa{background:#3a7bd5;color:#fff}' +
        '.rpc-gl-pill.bph{background:#2d7a4f;color:#fff}.rpc-gl-pill.bpa{background:#5aab78;color:#fff}' +
        '.rpc-day-detail{display:none;flex-direction:column}' +
        '.rpc-day-detail.show{display:flex}' +
        '.rpc-game-banner{padding:9px 12px;border-bottom:1px solid #e5e0d8;flex-shrink:0}' +
        '.rpc-game-banner.fb-home{background:#fdf0f2;border-left:3px solid #9d2235}' +
        '.rpc-game-banner.fb-away{background:#eef4fb;border-left:3px solid #3a7bd5}' +
        '.rpc-game-banner.bb-home{background:#edf7f0;border-left:3px solid #2d7a4f}' +
        '.rpc-game-banner.no-game{background:#f5f5f5;border-left:3px solid #e5e0d8}' +
        '.rpc-banner-title{font-size:12px;font-weight:700;margin-bottom:2px}' +
        '.rpc-banner-title.fh{color:#7a1a28}.rpc-banner-title.fa{color:#1a3a6e}.rpc-banner-title.bh{color:#1a4a2e}' +
        '.rpc-banner-meta{font-size:10px;color:#888;line-height:1.5}' +
        '.rpc-banner-pill{display:inline-flex;font-size:9px;font-weight:700;padding:2px 6px;border-radius:99px;margin-top:3px}' +
        '.rpc-banner-pill.fph{background:#9d2235;color:#fff}.rpc-banner-pill.fpa{background:#3a7bd5;color:#fff}.rpc-banner-pill.bph{background:#2d7a4f;color:#fff}' +
        '.rpc-sameday-hint{font-size:10px;color:#c0892a;background:#fdf6e8;border:1px solid #c0892a;border-radius:6px;padding:5px 8px;margin-top:6px;text-align:center}' +
        '.rpc-slots{padding:8px 10px}' +
        '.rpc-slots-lbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#888;margin:5px 0 4px;display:flex;align-items:center;gap:6px}' +
        '.rpc-slots-lbl::after{content:"";flex:1;height:0.5px;background:#e5e0d8}' +
        '.rpc-nd-div{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#c0892a;padding:6px 0 3px;display:flex;align-items:center;gap:6px}' +
        '.rpc-nd-div::after{content:"";flex:1;height:0.5px;background:#e5d5a8}' +
        '.rpc-sgrid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px;margin-bottom:3px}' +
        '.rpc-slot{border:1px solid #e5e0d8;border-radius:6px;padding:5px 3px;cursor:pointer;font-family:inherit;background:#fff;text-align:center;transition:all .1s;position:relative}' +
        '.rpc-slot:hover:not(.bk){border-color:#222;background:#f5f5f5}' +
        '.rpc-slot.bk{opacity:.35;cursor:not-allowed}' +
        '.rpc-slot.arr-s{background:#222;color:#fff;border-color:#222}' +
        '.rpc-slot.dep-s{background:#9d2235;color:#fff;border-color:#9d2235}' +
        '.rpc-slot.in-r{background:#f0f0f0;border-color:#ddd}' +
        '.rpc-slot.fb-g{border-color:#9d2235;background:#fdf0f2}' +
        '.rpc-slot.bb-g{border-color:#2d7a4f;background:#edf7f0}' +
        '.rpc-slot.nd{background:#faf9f7}' +
        '.rpc-slot-t{font-size:10px;font-weight:700;line-height:1.2}' +
        '.rpc-slot-s{font-size:8px;color:#aaa;margin-top:1px}' +
        '.rpc-slot.arr-s .rpc-slot-s,.rpc-slot.dep-s .rpc-slot-s{color:rgba(255,255,255,.6)}' +
        '.rpc-slot.fb-g .rpc-slot-t{color:#7a1a28}.rpc-slot.bb-g .rpc-slot-t{color:#1a4a2e}' +
        '.rpc-rtag{position:absolute;top:1px;right:2px;font-size:7px;font-weight:700;padding:1px 2px;border-radius:2px}' +
        '.rpc-rtag.ts{background:#222;color:#fff}.rpc-rtag.te{background:#9d2235;color:#fff}' +
        '.rpc-no-slots{padding:14px;text-align:center;font-size:11px;color:#bbb}' +
        '.rpc-footer{padding:8px 12px;border-top:1px solid #e5e0d8;display:flex;gap:8px;align-items:center;background:#fff;flex-shrink:0}' +
        '.rpc-sum{font-size:10px;color:#888;flex:1;line-height:1.4}' +
        '.rpc-btn-clr{background:none;border:none;font-size:11px;color:#888;cursor:pointer;text-decoration:underline;font-family:inherit;white-space:nowrap}' +
        '.rpc-btn-res{background:#9d2235;color:#fff;border:none;border-radius:7px;padding:7px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;display:none;white-space:nowrap}' +
        '.rpc-btn-res.show{display:block}' +
        '.rpc-btn-res:hover{background:#7a1a28}';
    document.head.appendChild(s);
}

var RazorParkedCalendar = (function () {
    function Cal(opts) {
        opts = opts || {};
        this.id = opts.containerId || 'rp-cal';
        this.onConfirm = opts.onConfirm || null;
        this.blockedSlots = opts.blockedSlots || {};
        this.blockedDays = opts.blockedDays || [];
        this.sport = 'all';
        this.bYear = new Date().getFullYear();
        this.bMonth = new Date().getMonth();
        this.arriveKey = null;
        this.departKey = null;
        this.arriveTime = null;
        this.departTime = null;
        this.arriveIdx = null;
        this.departIdx = null;
        this.phase = 'arrive-date';
        _injectStyles();
        window['_rpc_' + this.id] = this;
    }

    Cal.prototype.mount = function () {
        var el = document.getElementById(this.id);
        if (!el) return;
        el.innerHTML = this._shell();
        this._renderCal();
        this._renderGameList();
    };

    Cal.prototype.loadBlockedSlots = function (listingId) {
        var self = this;
        return fetch('/api/Reservations/listing/' + listingId + '/blocked')
            .then(function (r) { return r.ok ? r.json() : {}; })
            .then(function (d) { self.blockedSlots = d.blockedSlots || {}; self.blockedDays = d.blockedDays || []; self._renderCal(); })
            .catch(function () { });
    };

    Cal.prototype.clear = function () {
        this.arriveKey = null; this.departKey = null;
        this.arriveTime = null; this.departTime = null;
        this.arriveIdx = null; this.departIdx = null;
        this.phase = 'arrive-date';
        this._renderCal();
        this._showGameList();
        this._updateBBoxes();
        this._syncBar();
        var btn = document.getElementById('rp-res-' + this.id);
        if (btn) btn.classList.remove('show');
        var sum = document.getElementById('rpc-sum-' + this.id);
        if (sum) sum.textContent = 'Choose dates and times';
    };

    Cal.prototype.setSport = function (s, btn) {
        this.sport = s;
        document.querySelectorAll('#' + this.id + ' .rpc-tab').forEach(function (b) { b.className = 'rpc-tab'; });
        btn.className = 'rpc-tab t-' + s;
        this._renderCal();
        this._renderGameList();
    };

    Cal.prototype._shell = function () {
        var i = this.id;
        var ref = "window['_rpc_" + i + "']";
        return '<div class="rpc">'
            + '<div class="rpc-tabs">'
            + '<button class="rpc-tab t-all" onclick="' + ref + '.setSport(\'all\',this)">All Sports</button>'
            + '<button class="rpc-tab" onclick="' + ref + '.setSport(\'fb\',this)">Football</button>'
            + '<button class="rpc-tab" onclick="' + ref + '.setSport(\'bb\',this)">Baseball</button>'
            + '</div>'
            + '<div class="rpc-body">'
            + '<div class="rpc-left">'
            + '<div class="rpc-2col" id="rpc-months-' + i + '"></div>'
            + '<div class="rpc-legend">'
            + '<div class="rpc-ld"><div class="rpc-ldot" style="background:#9d2235"></div>FB Home</div>'
            + '<div class="rpc-ld"><div class="rpc-ldot" style="background:#3a7bd5"></div>FB Away</div>'
            + '<div class="rpc-ld"><div class="rpc-ldot" style="background:#2d7a4f"></div>BB Home</div>'
            + '<div class="rpc-ld"><div class="rpc-ldot" style="background:#5aab78"></div>BB Away</div>'
            + '</div></div>'
            + '<div class="rpc-right">'
            + '<div class="rpc-bh">'
            + '<div class="rpc-bh-lbl">Your reservation</div>'
            + '<div class="rpc-bboxes">'
            + '<div class="rpc-bbox active" id="rpc-ba-' + i + '" onclick="' + ref + '._setPhase(\'arrive-time\')">'
            + '<div class="rpc-bbox-lbl">Arrive</div>'
            + '<div class="rpc-bbox-date ph" id="rpc-ad-' + i + '">Select date</div>'
            + '<div class="rpc-bbox-time" id="rpc-at-' + i + '" style="display:none"></div>'
            + '</div>'
            + '<div class="rpc-bbox" id="rpc-bd-' + i + '" onclick="' + ref + '._setPhase(\'depart-time\')">'
            + '<div class="rpc-bbox-lbl">Depart</div>'
            + '<div class="rpc-bbox-date ph" id="rpc-dd-' + i + '">Select date</div>'
            + '<div class="rpc-bbox-time" id="rpc-dt-' + i + '" style="display:none"></div>'
            + '</div></div></div>'
            + '<div class="rpc-dur" id="rpc-dur-' + i + '">Click a date to get started</div>'
            + '<div class="rpc-right-inner" id="rpc-ri-' + i + '">'
            + '<div id="rpc-gamelist-' + i + '"></div>'
            + '<div id="rpc-detail-' + i + '" class="rpc-day-detail">'
            + '<div id="rpc-banner-' + i + '"></div>'
            + '<div class="rpc-slots" id="rpc-slots-' + i + '"></div>'
            + '</div></div>'
            + '<div class="rpc-footer">'
            + '<div class="rpc-sum" id="rpc-sum-' + i + '">Choose dates and times</div>'
            + '<button class="rpc-btn-clr" onclick="' + ref + '.clear()">Clear</button>'
            + '<button class="rpc-btn-res" id="rp-res-' + i + '" onclick="' + ref + '._confirm()">Reserve</button>'
            + '</div></div></div></div>';
    };

    Cal.prototype._renderCal = function () {
        var el = document.getElementById('rpc-months-' + this.id);
        if (!el) return;
        var m2 = (this.bMonth + 1) % 12;
        var y2 = this.bMonth === 11 ? this.bYear + 1 : this.bYear;
        var i = this.id;
        var ref = "window['_rpc_" + i + "']";
        el.innerHTML =
            '<div><div class="rpc-mhdr"><span class="rpc-mttl">' + MONTH_NAMES[this.bMonth] + ' ' + this.bYear + '</span>'
            + '<button class="rpc-nb" onclick="' + ref + '._shift(-1)">&#8249;</button></div>'
            + this._month(this.bYear, this.bMonth) + '</div>'
            + '<div><div class="rpc-mhdr"><span class="rpc-mttl">' + MONTH_NAMES[m2] + ' ' + y2 + '</span>'
            + '<button class="rpc-nb" onclick="' + ref + '._shift(1)">&#8250;</button></div>'
            + this._month(y2, m2) + '</div>';
    };

    Cal.prototype._month = function (y, m) {
        var i = this.id;
        var ref = "window['_rpc_" + i + "']";
        var todayMs = _ms(_todayK());
        var aMs = this.arriveKey ? _ms(this.arriveKey) : null;
        var dMs = this.departKey ? _ms(this.departKey) : null;
        var first = new Date(y, m, 1).getDay();
        var total = new Date(y, m + 1, 0).getDate();
        var html = '<div class="rpc-dgrid">';
        SHORT_DAYS.forEach(function (d) { html += '<div class="rpc-dow">' + d + '</div>'; });
        for (var x = 0; x < first; x++) html += '<div class="rpc-day rem"></div>';
        var sport = this.sport, blk = this.blockedDays;
        for (var d = 1; d <= total; d++) {
            var dt = new Date(y, m, d), k = _k(dt), ms = _ms(k);
            var past = ms < todayMs || blk.indexOf(k) >= 0;
            var isA = this.arriveKey === k, isD = this.departKey === k;
            var inR = aMs && dMs && ms > aMs && ms < dMs;
            var fb = FB_SCHEDULE[k], bb = BB_SCHEDULE[k];
            var showFb = sport === 'all' || sport === 'fb';
            var showBb = sport === 'all' || sport === 'bb';
            var cls = 'rpc-day';
            if (past) cls += ' rbl';
            if (isA) cls += ' rarr';
            if (isD && !isA) cls += ' rdep';
            if (isA && (!this.departKey || this.departKey === k)) cls += ' rsolo';
            if (isA && isD) cls += ' rsolo';
            if (inR) cls += ' rin';
            var dots = '';
            if (fb && !past && showFb) dots += '<div class="rdot ' + (fb.home ? 'fb-h' : 'fb-a') + '"></div>';
            if (bb && !past && showBb) dots += '<div class="rdot ' + (bb.home ? 'bb-h' : 'bb-a') + '"></div>';
            var tip = '';
            if (fb && showFb) tip += (fb.home ? 'Home' : 'Away') + ': Arkansas ' + (fb.home ? 'vs ' : '@ ') + fb.opp;
            if (bb && showBb) tip += (tip ? ' | ' : '') + (bb.home ? 'Home' : 'Away') + ': Arkansas ' + (bb.home ? 'vs ' : '@ ') + bb.opp;
            var tipAttr = tip ? ' title="' + tip + '"' : '';
            html += '<div class="' + cls + '"' + tipAttr + ' onclick="' + ref + '._click(\'' + k + '\')">'
                + '<div style="font-size:11px;line-height:1">' + d + '</div>'
                + (dots ? '<div class="rdots">' + dots + '</div>' : '')
                + '</div>';
        }
        return html + '</div>';
    };

    Cal.prototype._shift = function (dir) {
        this.bMonth += dir * 2;
        if (this.bMonth > 11) { this.bMonth -= 12; this.bYear++; }
        if (this.bMonth < 0) { this.bMonth += 12; this.bYear--; }
        this._renderCal();
    };

    // KEY FIX: clicking same date for depart is allowed
    Cal.prototype._click = function (k) {
        if (_ms(k) < _ms(_todayK()) || this.blockedDays.indexOf(k) >= 0) return;

        if (this.phase === 'arrive-date' || !this.arriveKey) {
            this.arriveKey = k; this.departKey = null;
            this.arriveTime = null; this.departTime = null;
            this.arriveIdx = null; this.departIdx = null;
            this.phase = 'depart-date';
        } else if (this.phase === 'depart-date') {
            // Same date OR later date both allowed
            if (_ms(k) < _ms(this.arriveKey)) {
                this.departKey = this.arriveKey; this.arriveKey = k;
            } else {
                this.departKey = k; // same day if k === arriveKey
            }
            this.arriveTime = null; this.departTime = null;
            this.arriveIdx = null; this.departIdx = null;
            this.phase = 'arrive-time';
        } else {
            // Restart
            this.arriveKey = k; this.departKey = null;
            this.arriveTime = null; this.departTime = null;
            this.arriveIdx = null; this.departIdx = null;
            this.phase = 'depart-date';
        }
        this._renderCal();
        this._updateBBoxes();
        this._showDayDetail();
        this._renderSlots();
        this._syncBar();
    };

    Cal.prototype._setPhase = function (p) {
        if (p === 'arrive-time' && !this.arriveKey) return;
        if (p === 'depart-time' && !this.departKey) return;
        this.phase = p;
        var ba = document.getElementById('rpc-ba-' + this.id);
        var bd = document.getElementById('rpc-bd-' + this.id);
        if (ba) ba.classList.toggle('active', p === 'arrive-time');
        if (bd) bd.classList.toggle('active', p === 'depart-time');
        this._renderSlots();
    };

    Cal.prototype._showGameList = function () {
        var gl = document.getElementById('rpc-gamelist-' + this.id);
        var dd = document.getElementById('rpc-detail-' + this.id);
        if (gl) gl.style.display = '';
        if (dd) dd.classList.remove('show');
    };

    Cal.prototype._showDayDetail = function () {
        var gl = document.getElementById('rpc-gamelist-' + this.id);
        var dd = document.getElementById('rpc-detail-' + this.id);
        if (gl) gl.style.display = 'none';
        if (dd) dd.classList.add('show');
        var k = this.arriveKey;
        var fb = FB_SCHEDULE[k], bb = BB_SCHEDULE[k];
        var banner = document.getElementById('rpc-banner-' + this.id);
        if (!banner) return;
        var isSameDay = this.arriveKey === this.departKey;
        var sdHint = isSameDay ? '<div class="rpc-sameday-hint">Same-day: pick arrival then departure time below</div>' : '';
        if (fb) {
            var isH = fb.home;
            banner.className = 'rpc-game-banner ' + (isH ? 'fb-home' : 'fb-away');
            banner.innerHTML = '<div class="rpc-banner-title ' + (isH ? 'fh' : 'fa') + '">'
                + (isH ? 'Home' : 'Away') + ': Arkansas ' + (isH ? 'vs ' : '@ ') + fb.opp + '</div>'
                + '<div class="rpc-banner-meta">' + _long(k) + ' &bull; ' + fb.time + (fb.tv ? ' &bull; ' + fb.tv : '') + '</div>'
                + '<span class="rpc-banner-pill ' + (isH ? 'fph' : 'fpa') + '">' + (isH ? 'HOME' : 'AWAY') + ' GAME</span>'
                + sdHint;
        } else if (bb) {
            var isHb = bb.home;
            banner.className = 'rpc-game-banner ' + (isHb ? 'bb-home' : 'no-game');
            banner.innerHTML = '<div class="rpc-banner-title bh">'
                + (isHb ? 'Home' : 'Away') + ': Arkansas ' + (isHb ? 'vs ' : '@ ') + bb.opp + '</div>'
                + '<div class="rpc-banner-meta">' + _long(k) + ' &bull; ' + bb.time + (bb.tv ? ' &bull; ' + bb.tv : '') + '</div>'
                + '<span class="rpc-banner-pill bph">' + (isHb ? 'HOME' : 'AWAY') + ' GAME</span>'
                + sdHint;
        } else {
            banner.className = 'rpc-game-banner no-game';
            banner.innerHTML = '<div style="font-size:11px;color:#aaa">No game &bull; ' + _long(k) + '</div>' + sdHint;
        }
    };

    Cal.prototype._renderSlots = function () {
        var sEl = document.getElementById('rpc-slots-' + this.id);
        if (!sEl || !this.arriveKey) { if (sEl) sEl.innerHTML = ''; return; }
        var isArr = this.phase === 'arrive-time';
        var isDep = this.phase === 'depart-time';
        if (!isArr && !isDep) { sEl.innerHTML = ''; return; }
        var activeKey = isArr ? this.arriveKey : this.departKey;
        if (!activeKey) { sEl.innerHTML = ''; return; }

        var isSameDay = this.arriveKey === this.departKey;
        var i = this.id;
        var ref = "window['_rpc_" + i + "']";
        var bk = this.blockedSlots[activeKey] || [];
        var fb = FB_SCHEDULE[activeKey], bb = BB_SCHEDULE[activeKey];
        var fbTime = fb ? fb.time : null, bbTime = bb ? bb.time : null;
        var selIdx = isArr ? this.arriveIdx : this.departIdx;
        var showNext = isDep && !isSameDay;
        var slots = showNext ? ALL_SLOTS : DAY_SLOTS;

        var nextDayD = new Date(activeKey + 'T12:00:00');
        nextDayD.setDate(nextDayD.getDate() + 1);
        var nextLabel = nextDayD.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

        var lbl = isArr ? 'Arrival time' : (isSameDay ? 'Departure time (after arrival)' : 'Departure time');
        var html = '<div class="rpc-slots-lbl">' + lbl + '</div><div class="rpc-sgrid">';
        var crossedMid = false, hasAnyOpen = false;

        for (var x = 0; x < slots.length; x++) {
            var s = slots[x];
            var isND = x >= DAY_COUNT;

            // Same-day depart: skip slots at or before arrival
            if (isSameDay && isDep && this.arriveIdx !== null && x <= this.arriveIdx) continue;

            var isB = !isND && bk.indexOf(s) >= 0;
            var isFbG = !isND && s === fbTime && !isB;
            var isBbG = !isND && s === bbTime && !isB && !isFbG;
            var isSel = selIdx === x;

            if (isND && !crossedMid) {
                crossedMid = true;
                html += '</div><div class="rpc-nd-div">' + nextLabel + ' (next day)</div><div class="rpc-sgrid">';
            }

            if (!isB) hasAnyOpen = true;
            var cls = 'rpc-slot';
            if (isB) cls += ' bk';
            else if (isSel) cls += isArr ? ' arr-s' : ' dep-s';
            else if (isFbG) cls += ' fb-g';
            else if (isBbG) cls += ' bb-g';
            if (isND) cls += ' nd';

            var tag = isSel ? '<span class="rpc-rtag ' + (isArr ? 'ts' : 'te') + '">' + (isArr ? 'IN' : 'OUT') + '</span>' : '';
            var status = isB ? 'Booked' : isSel ? (isArr ? 'Arrive' : 'Depart') : isFbG ? 'Kickoff' : isBbG ? 'First pitch' : isND ? '+1 day' : 'Open';

            html += '<button class="' + cls + '"' + (isB ? ' disabled' : '') + ' onclick="' + ref + '._pick(' + x + ',\'' + s + '\',' + isArr + ')">'
                + tag
                + '<div class="rpc-slot-t">' + s + '</div>'
                + '<div class="rpc-slot-s">' + status + '</div>'
                + '</button>';
        }
        html += '</div>';
        if (!hasAnyOpen) html += '<div class="rpc-no-slots">No available slots on this date</div>';
        sEl.innerHTML = html;
    };

    Cal.prototype._pick = function (idx, s, isArr) {
        var activeKey = isArr ? this.arriveKey : this.departKey;
        var bk = this.blockedSlots[activeKey] || [];
        if (bk.indexOf(s) >= 0) return;

        var isSameDay = this.arriveKey === this.departKey;

        if (isArr) {
            this.arriveTime = s; this.arriveIdx = idx;
            this.departTime = null; this.departIdx = null;
            this.phase = 'depart-time';
            var ba = document.getElementById('rpc-ba-' + this.id);
            var bd = document.getElementById('rpc-bd-' + this.id);
            if (ba) ba.classList.remove('active');
            if (bd) bd.classList.add('active');
        } else {
            if (isSameDay && this.arriveIdx !== null && idx <= this.arriveIdx) {
                var dur = document.getElementById('rpc-dur-' + this.id);
                if (dur) dur.textContent = 'Pick a departure time after your arrival time';
                return;
            }
            this.departTime = s; this.departIdx = idx;
            this.phase = 'done';
        }
        this._updateBBoxes();
        this._renderSlots();
        this._syncBar();
        this._updateResBtn();
    };

    Cal.prototype._updateBBoxes = function () {
        var i = this.id;
        var adEl = document.getElementById('rpc-ad-' + i);
        var ddEl = document.getElementById('rpc-dd-' + i);
        var atEl = document.getElementById('rpc-at-' + i);
        var dtEl = document.getElementById('rpc-dt-' + i);
        var ba = document.getElementById('rpc-ba-' + i);
        var bd = document.getElementById('rpc-bd-' + i);
        var dur = document.getElementById('rpc-dur-' + i);
        var isSameDay = this.arriveKey && this.departKey && this.arriveKey === this.departKey;
        if (adEl) { adEl.textContent = this.arriveKey ? _short(this.arriveKey) : 'Select date'; adEl.className = 'rpc-bbox-date' + (this.arriveKey ? '' : ' ph'); }
        if (ddEl) { ddEl.textContent = this.departKey ? _short(this.departKey) : (this.arriveKey ? 'Same or later date' : 'Select date'); ddEl.className = 'rpc-bbox-date' + (this.departKey ? '' : ' ph'); }
        if (atEl) { atEl.textContent = this.arriveTime || ''; atEl.style.display = this.arriveTime ? 'block' : 'none'; }
        if (dtEl) { dtEl.textContent = this.departTime || ''; dtEl.style.display = this.departTime ? 'block' : 'none'; }
        if (ba) ba.classList.toggle('active', this.phase === 'arrive-time');
        if (bd) bd.classList.toggle('active', this.phase === 'depart-time');
        if (dur) {
            if (!this.arriveKey) { dur.textContent = 'Click a date to get started'; }
            else if (!this.departKey) { dur.textContent = 'Click depart date (same date OK for same-day)'; }
            else if (this.arriveTime && this.departTime) {
                var nights = Math.round((_ms(this.departKey) - _ms(this.arriveKey)) / 86400000);
                var nightStr = isSameDay ? '<strong>Same day</strong>' : '<strong>' + nights + ' night' + (nights !== 1 ? 's' : '') + '</strong>';
                dur.innerHTML = nightStr + ' &bull; ' + _short(this.arriveKey) + ' ' + this.arriveTime + ' &rarr; ' + _short(this.departKey) + ' ' + this.departTime;
            } else if (this.arriveTime) { dur.textContent = 'Now pick departure time'; }
            else {
                var nights2 = Math.round((_ms(this.departKey) - _ms(this.arriveKey)) / 86400000);
                var ns = isSameDay ? 'Same day' : nights2 + ' night' + (nights2 !== 1 ? 's' : '');
                dur.innerHTML = '<strong>' + ns + '</strong> &bull; ' + _short(this.arriveKey) + ' &rarr; ' + _short(this.departKey) + ' &bull; Pick arrival time';
            }
        }
    };

    Cal.prototype._updateResBtn = function () {
        var btn = document.getElementById('rp-res-' + this.id);
        var sum = document.getElementById('rpc-sum-' + this.id);
        var ready = this.arriveKey && this.departKey && this.arriveTime && this.departTime;
        if (btn) btn.classList.toggle('show', !!ready);
        if (sum) {
            if (ready) sum.textContent = _short(this.arriveKey) + ' ' + this.arriveTime + ' to ' + _short(this.departKey) + ' ' + this.departTime;
            else if (this.arriveKey && this.departKey && this.arriveTime) sum.textContent = 'Pick a departure time';
            else if (this.arriveKey && this.departKey) sum.textContent = 'Pick arrival time';
            else if (this.arriveKey) sum.textContent = 'Click depart date (same date OK)';
        }
    };

    Cal.prototype._confirm = function () {
        if (!this.arriveKey || !this.departKey || !this.arriveTime || !this.departTime) return;
        window.calendarArriveKey = this.arriveKey;
        window.calendarDepartKey = this.departKey;
        window.calendarArriveTime = this.arriveTime;
        window.calendarDepartTime = this.departTime;
        window.calendarStartISO = this.arriveKey + 'T' + _to24(this.arriveTime);
        window.calendarEndISO = this.departKey + 'T' + _to24(this.departTime);
        var se = document.getElementById('res-start');
        var ee = document.getElementById('res-end');
        if (se) se.value = window.calendarStartISO;
        if (ee) ee.value = window.calendarEndISO;
        var rb = document.getElementById('res-submit-btn');
        if (rb) rb.disabled = false;
        if (typeof this.onConfirm === 'function') this.onConfirm(this.arriveKey, this.departKey, this.arriveTime, this.departTime);
        var sum = document.getElementById('rpc-sum-' + this.id);
        var btn = document.getElementById('rp-res-' + this.id);
        if (sum) sum.textContent = 'Reserved: ' + _short(this.arriveKey) + ' ' + this.arriveTime + ' to ' + _short(this.departKey) + ' ' + this.departTime;
        if (btn) btn.classList.remove('show');
    };

    Cal.prototype._syncBar = function () {
        var btn = document.getElementById('cal-date-display');
        if (!btn) return;
        var same = this.arriveKey && this.departKey && this.arriveKey === this.departKey;
        if (this.arriveKey && this.departKey) {
            btn.textContent = '📅 ' + _short(this.arriveKey) + (same ? ' (same day)' : ' to ' + _short(this.departKey));
            btn.style.borderColor = '#9d2235'; btn.style.color = '#9d2235'; btn.style.fontWeight = '600';
        } else if (this.arriveKey) {
            btn.textContent = '📅 ' + _short(this.arriveKey) + ' — click depart date...';
            btn.style.borderColor = '#9d2235'; btn.style.color = '#9d2235';
        } else {
            btn.textContent = '📅 Select dates — click to open calendar';
            btn.style.borderColor = ''; btn.style.color = ''; btn.style.fontWeight = '';
        }
        window.calendarArriveKey = this.arriveKey;
        window.calendarDepartKey = this.departKey;
        window.calendarArriveTime = this.arriveTime;
        window.calendarDepartTime = this.departTime;
    };

    Cal.prototype._renderGameList = function () {
        var gl = document.getElementById('rpc-gamelist-' + this.id);
        if (!gl) return;
        var sport = this.sport, i = this.id;
        var ref = "window['_rpc_" + i + "']";
        var games = [];
        if (sport === 'all' || sport === 'fb') {
            Object.keys(FB_SCHEDULE).sort().forEach(function (k) { games.push({ k: k, g: FB_SCHEDULE[k], sport: 'fb' }); });
        }
        if (sport === 'all' || sport === 'bb') {
            Object.keys(BB_SCHEDULE).sort().forEach(function (k) {
                if (sport === 'all' && FB_SCHEDULE[k]) return;
                games.push({ k: k, g: BB_SCHEDULE[k], sport: 'bb' });
            });
        }
        games.sort(function (a, b) { return _ms(a.k) - _ms(b.k); });
        var html = '', lastMonth = '';
        games.forEach(function (item) {
            var d = new Date(item.k + 'T12:00:00');
            var mon = MONTH_NAMES[d.getMonth()] + ' ' + d.getFullYear();
            if (mon !== lastMonth) { lastMonth = mon; html += '<div class="rpc-gl-month">' + mon + '</div>'; }
            var isFb = item.sport === 'fb', isH = item.g.home;
            var barCls = isFb ? (isH ? 'fb-h' : 'fb-a') : (isH ? 'bb-h' : 'bb-a');
            var pillCls = isFb ? (isH ? 'fph' : 'fpa') : (isH ? 'bph' : 'bpa');
            var emoji = isFb ? '' : '';
            html += '<div class="rpc-gl-item" onclick="' + ref + '._jumpToGame(\'' + item.k + '\')">'
                + '<div class="rpc-gl-date">' + d.getDate() + '<span>' + d.toLocaleDateString('en-US', { weekday: 'short' }) + '</span></div>'
                + '<div class="rpc-gl-bar ' + barCls + '"></div>'
                + '<div class="rpc-gl-info">'
                + '<div class="rpc-gl-matchup">Arkansas ' + (isH ? 'vs ' : '@ ') + item.g.opp + '</div>'
                + '<div class="rpc-gl-meta">' + item.g.time + (item.g.tv ? ' &bull; ' + item.g.tv : '') + '</div>'
                + '</div>'
                + '<span class="rpc-gl-pill ' + pillCls + '">' + (isH ? 'HOME' : 'AWAY') + '</span>'
                + '</div>';
        });
        if (!html) html = '<div style="padding:20px;text-align:center;color:#bbb;font-size:12px">No games in selected sport</div>';
        gl.innerHTML = html;
    };

    Cal.prototype._jumpToGame = function (k) {
        var d = new Date(k + 'T12:00:00');
        this.bYear = d.getFullYear(); this.bMonth = d.getMonth();
        this._renderCal();
        this._click(k);
    };

    return Cal;
})();

function initSearchCalendar() {
    var cal = new RazorParkedCalendar({ containerId: 'rp-cal-search' });
    cal.mount();
    return cal;
}

async function initReserveCalendar(listingId) {
    var cal = new RazorParkedCalendar({
        containerId: 'rp-cal-reserve',
        onConfirm: function (aKey, dKey, aTime, dTime) {
            var se = document.getElementById('res-start');
            var ee = document.getElementById('res-end');
            if (se) se.value = aKey + 'T' + _to24(aTime);
            if (ee) ee.value = dKey + 'T' + _to24(dTime);
            var rb = document.getElementById('res-submit-btn');
            if (rb) rb.disabled = false;
        }
    });
    cal.mount();
    if (listingId) await cal.loadBlockedSlots(listingId);
    return cal;
}

window.RazorParkedCalendar = RazorParkedCalendar;
window.initSearchCalendar = initSearchCalendar;
window.initReserveCalendar = initReserveCalendar;