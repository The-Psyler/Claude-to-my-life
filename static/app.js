/* ============================================================
   CTML — Claude to My Life
   App Logic — Phase 3
   ============================================================ */

// ============================================================
// GUARD
// ============================================================

// ============================================================
// i18n
// ============================================================

let currentLang = 'en';

function t(key) {
    return (translations[currentLang] && translations[currentLang][key]) || translations.en[key] || key;
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
        el.setAttribute('aria-label', t(el.dataset.i18nAria));
    });
}

async function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('ctml_lang', lang);
    applyTranslations();
    await saveState();
}

// ============================================================
// Module state
// ============================================================

let _currentIdeaId = null;

// ============================================================
// GUARD
// ============================================================

if (typeof Dexie === 'undefined') {
    document.body.innerHTML = '<p style="color:#E57373;padding:20px;font-family:system-ui;">Error: dexie.min.js not found. Place it in the static/ folder alongside app.js.</p>';
    throw new Error('Dexie not loaded');
}

// ============================================================
// DATABASE
// ============================================================

const DB_NAME       = 'CTML';
const LS_LEGACY_KEY = 'ctml_state'; // kept only for migration

const db = new Dexie(DB_NAME);
db.version(1).stores({
    ideas:    'id, category, state, date',  // id = Date.now() — set at creation
    settings: 'key'                         // key-value store for scalars + arrays
});

// Sync Broadcast: keeps all open tabs in sync without echo loops (same-origin only)
const _bc = typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel('ctml_sync')
    : null;

// ============================================================
// STATE
// ============================================================

let state = {
    karma:        0,
    vault:        [],
    reflections:  [],
    focus: {
        ideaId:        null,
        title:         '',
        nextAction:    '',
        isVaultLinked: false,
        date:          null       // ISO YYYY-MM-DD
    },
    dayLocked:       false,
    lastBootDate:    null,        // ISO YYYY-MM-DD — date of last successful day start
    karmaAtDayStart: 0            // karma snapshot at day start — used for today's earned delta
};

// Temp vars — not persisted
let _pendingMorningIdeaId = null; // vault picker selection during morning flow
let _attachDecision       = null; // null | true | false — evening attach choice
let _currentDetailId      = null; // idea id open in the detail screen
let _sessionDate          = null; // ISO date anchored at loadState() — prevents midnight drift
let _expandedCardIds      = new Set(); // track which work cards are expanded

// ============================================================
// PERSISTENCE
// ============================================================

let _saveQueue = Promise.resolve(); // Persistence Sentinel: serializes concurrent saves

async function saveState() {
    _saveQueue = _saveQueue.then(async () => {
        try {
            await db.transaction('rw', db.ideas, db.settings, async () => {
                await db.settings.bulkPut([
                    { key: 'karma',           value: state.karma },
                    { key: 'focus',           value: state.focus },
                    { key: 'dayLocked',       value: state.dayLocked },
                    { key: 'lastBootDate',    value: state.lastBootDate },
                    { key: 'reflections',     value: state.reflections },
                    { key: 'karmaAtDayStart', value: state.karmaAtDayStart },
                    { key: 'language',        value: currentLang }
                ]);
                // Clear + re-put handles deletions atomically
                await db.ideas.clear();
                await db.ideas.bulkPut(state.vault);
            });
            // Sync Broadcast: notify other tabs that state has been saved
            if (_bc) _bc.postMessage({ type: 'state_saved' });
        } catch (e) {
            console.warn('saveState failed:', e);
            showToast(t('toast_save_failed'), 'error');
        }
    }).catch(() => {}); // keep queue alive if a save throws unexpectedly
    return _saveQueue;
}

async function loadState() {
    try {
        await migrateOldStorage();

        const ideas = await db.ideas.toArray();
        if (ideas.length > 0) {
            state.vault = ideas.map(idea => {
                const rawSparks = idea.sparks || idea.branches || [];
                const sparks = rawSparks.map(s => ({ notes: [], ...s }));
                return { workLog: [], ...idea, sparks };
            });
        }

        const rows     = await db.settings.toArray();
        const settings = Object.fromEntries(rows.map(r => [r.key, r.value]));

        if (typeof settings.karma === 'number' && !isNaN(settings.karma)) {
            state.karma = settings.karma;
        }
        if (settings.focus && typeof settings.focus === 'object') {
            state.focus = { ...state.focus, ...settings.focus };
        }
        if (typeof settings.dayLocked === 'boolean') {
            state.dayLocked = settings.dayLocked;
        }
        if (settings.lastBootDate !== undefined) {
            state.lastBootDate = settings.lastBootDate;
        }
        if (Array.isArray(settings.reflections)) {
            state.reflections = settings.reflections;
        }
        if (typeof settings.karmaAtDayStart === 'number') {
            state.karmaAtDayStart = settings.karmaAtDayStart;
        }
        if (settings.language && (settings.language === 'en' || settings.language === 'hu')) {
            currentLang = settings.language;
        }

        // Anchor the session date — all date-sensitive operations use this
        _sessionDate = todayISO();
    } catch (e) {
        console.warn('loadState failed:', e);
        showToast(t('toast_load_failed'), 'error');
    }
}

async function migrateOldStorage() {
    // Migrate pre-Phase-2 separate keys
    const hasLegacySeparate = localStorage.getItem('ctml_vault') || localStorage.getItem('ctml_karma');
    if (hasLegacySeparate) {
        try {
            const oldVault  = localStorage.getItem('ctml_vault');
            const oldKarma  = localStorage.getItem('ctml_karma');
            const oldLocked = localStorage.getItem('ctml_locked');
            if (oldVault) {
                const parsed = JSON.parse(oldVault);
                if (Array.isArray(parsed)) state.vault = parsed.map(i => ({ workLog: [], ...i }));
            }
            if (oldKarma) {
                const k = parseInt(oldKarma, 10);
                if (!isNaN(k)) state.karma = k;
            }
            if (oldLocked === 'true') state.dayLocked = true;
            localStorage.removeItem('ctml_vault');
            localStorage.removeItem('ctml_karma');
            localStorage.removeItem('ctml_locked');
        } catch (e) { console.warn('Legacy key migration failed:', e); }
    }

    // Migrate Phase-2 unified localStorage blob → Dexie
    const legacy = localStorage.getItem(LS_LEGACY_KEY);
    if (!legacy) return;
    try {
        const parsed = JSON.parse(legacy);
        if (!parsed || typeof parsed !== 'object') throw new Error('Invalid');

        if (Array.isArray(parsed.vault) && parsed.vault.every(i => i.id && i.title)) {
            state.vault = parsed.vault.map(idea => ({ workLog: [], ...idea }));
        }
        if (typeof parsed.karma === 'number') state.karma = parsed.karma;
        if (parsed.focus && typeof parsed.focus === 'object') {
            state.focus = { ...state.focus, ...parsed.focus };
        }
        if (typeof parsed.dayLocked === 'boolean') state.dayLocked = parsed.dayLocked;

        await saveState();
        localStorage.removeItem(LS_LEGACY_KEY);
    } catch (e) { console.warn('localStorage → Dexie migration failed:', e); }
}

// ============================================================
// NAVIGATION
// ============================================================

async function navigateTo(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + screen).classList.add('active');

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navItem = document.getElementById('nav-' + screen);
    if (navItem) navItem.classList.add('active');

    // Screen-specific refresh
    if (screen === 'home') {
        renderHomeFocus();
        renderKarma();
    } else if (screen === 'morning') {
        const today = _sessionDate || todayISO();
        if (state.dayLocked && (!state.lastBootDate || state.lastBootDate !== today)) {
            state.dayLocked = false;
            applyLockedState();
            await saveState();
        }
        _pendingMorningIdeaId = null;
        renderMorningFocus();
        renderMorningStats();
        renderMorningVaultPicker();
    } else if (screen === 'work') {
        renderWorkList();
    } else if (screen === 'evening') {
        _attachDecision = null;
        renderEveningMoved();
        renderEveningAttachOption();
        renderEveningKarma();
        renderReflectionHistory();
        const closeDayBtn = document.getElementById('close-day-btn');
        if (closeDayBtn && !state.dayLocked) {
            const needsBoot = !state.lastBootDate;
            closeDayBtn.disabled = needsBoot;
            closeDayBtn.style.opacity = needsBoot ? '0.4' : '1';
            closeDayBtn.title = needsBoot ? t('toast_no_boot') : '';
        }
    } else if (screen === 'idea-detail') {
        renderIdeaDetail();
    } else if (screen === 'vault') {
        renderVault();
    } else if (screen === 'settings') {
        const radio = document.querySelector(`input[name="lang"][value="${currentLang}"]`);
        if (radio) radio.checked = true;
    }

    setTimeout(() => {
        const first = document.querySelector(
            `#screen-${screen} button, #screen-${screen} input, #screen-${screen} textarea`
        );
        if (first) first.focus();
    }, 50);
}

function goBack() { navigateTo('home'); }

// ── Swipe navigation (home ↔ vault ↔ settings) ──
(function () {
    const SWIPE_SCREENS = ['home', 'vault', 'settings'];
    const THRESHOLD = 50; // px minimum horizontal swipe
    let startX = 0;
    let startY = 0;

    function currentSwipeScreen() {
        return SWIPE_SCREENS.find(s =>
            document.getElementById('screen-' + s)?.classList.contains('active')
        ) ?? null;
    }

    document.addEventListener('touchstart', e => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchmove', e => {
        const deltaX = Math.abs(e.touches[0].clientX - startX);
        const deltaY = Math.abs(e.touches[0].clientY - startY);

        // Only prevent scroll if horizontal movement is clearly greater than vertical
        if (deltaX > deltaY && deltaX > 10) {
            e.preventDefault();
        }
    }, { passive: false });

    document.addEventListener('touchend', e => {
        const delta = e.changedTouches[0].clientX - startX;
        if (Math.abs(delta) < THRESHOLD) return;

        const current = currentSwipeScreen();
        if (!current) return;

        const idx = SWIPE_SCREENS.indexOf(current);
        const app = document.getElementById('app');

        if (delta < 0 && idx < SWIPE_SCREENS.length - 1) {
            app.dataset.swipe = 'left';
            navigateTo(SWIPE_SCREENS[idx + 1]);
        } else if (delta > 0 && idx > 0) {
            app.dataset.swipe = 'right';
            navigateTo(SWIPE_SCREENS[idx - 1]);
        }
    }, { passive: true });
})();

// ============================================================
// RENDER
// ============================================================

function renderAll() {
    renderKarma();
    renderHomeFocus();
    renderMorningFocus();
    renderMorningStats();
    renderMorningVaultPicker();
    renderWorkList();
    renderVault();
    if (typeof renderPlaybook === 'function') renderPlaybook();
    applyLockedState();
}

function renderKarma() {
    const homeDisplay   = document.getElementById('karma-display');
    const morningKarma  = document.getElementById('morning-karma-text');
    if (homeDisplay)  homeDisplay.textContent  = state.karma + ' ' + t('label_karma');
    if (morningKarma) morningKarma.textContent = state.karma + ' ' + t('label_karma');
}

function renderHomeFocus() {
    const pill = document.getElementById('home-focus-pill');
    if (!pill) return;
    if (!state.focus || !state.focus.title) {
        pill.hidden = true;
        return;
    }
    pill.hidden = false;
    document.getElementById('home-focus-title').textContent = escapeHtml(state.focus.title);
    const na = document.getElementById('home-focus-next');
    if (state.focus.nextAction) {
        na.textContent = escapeHtml(state.focus.nextAction);
        na.hidden = false;
    } else {
        na.hidden = true;
    }
}

function renderMorningFocus() {
    const today             = todayISO();
    const yesterdayBlock    = document.getElementById('morning-yesterday-focus');
    const yesterdayTitle    = document.getElementById('morning-yesterday-title');
    const yesterdayAction   = document.getElementById('morning-yesterday-action');
    const focusInput        = document.getElementById('morning-focus-input');

    // Show "yesterday's focus" block if focus was set on a prior date
    const hasPriorFocus = state.focus.title && state.focus.date && state.focus.date !== today;
    if (yesterdayBlock) yesterdayBlock.style.display = hasPriorFocus ? 'block' : 'none';
    if (hasPriorFocus) {
        if (yesterdayTitle)  yesterdayTitle.textContent  = state.focus.title;
        if (yesterdayAction) yesterdayAction.textContent = state.focus.nextAction
            ? t('label_next') + ': ' + state.focus.nextAction
            : '';
    }

    // Pre-fill today's focus input with carried-forward title
    if (focusInput && !focusInput.value) {
        focusInput.value = state.focus.title || '';
        if (state.focus.isVaultLinked) _pendingMorningIdeaId = state.focus.ideaId;
    }
}

function renderMorningStats() {
    const total   = state.vault.length;
    const active  = state.vault.filter(v => v.state === 'Active').length;
    const waiting = state.vault.filter(v => v.state !== 'Active').length;

    const el = (id) => document.getElementById(id);
    if (el('stat-ideas'))   el('stat-ideas').textContent   = total;
    if (el('stat-active'))  el('stat-active').textContent  = active;
    if (el('stat-waiting')) el('stat-waiting').textContent = waiting;
}

const STATE_ORDER = { 'Active': 0, 'New': 1, 'Future': 2, 'On Hold': 3 };

function renderMorningVaultPicker() {
    const container = document.getElementById('morning-vault-picker');
    if (!container) return;

    if (state.vault.length === 0) {
        container.innerHTML = '<p style="color:var(--muted);font-size:13px;padding:8px 0;">' + escapeHtml(t('toast_no_ideas')) + '</p>';
        return;
    }

    const sorted = [...state.vault].sort((a, b) =>
        (STATE_ORDER[a.state] ?? 9) - (STATE_ORDER[b.state] ?? 9)
    );

    container.innerHTML = '';
    sorted.forEach(idea => {
        const isSelected = _pendingMorningIdeaId === idea.id;
        const stateClass = idea.state.toLowerCase().replace(/\s+/g, '-');
        const card = document.createElement('div');
        card.className = 'morning-picker-card' + (isSelected ? ' selected' : '');
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', 'Select ' + idea.title + ' as today\'s focus');
        card.innerHTML = `
            <div>
                <div class="morning-picker-title">${escapeHtml(idea.title)}</div>
                <div>
                    <span class="badge ${stateClass}">${escapeHtml(idea.state)}</span>
                    <span class="badge ${idea.potential.toLowerCase()}">${escapeHtml(idea.potential)}</span>
                </div>
            </div>
            ${isSelected ? '<span style="color:var(--purple);font-size:18px;">✓</span>' : ''}
        `;
        card.onclick = () => setMorningFocus(idea.id);
        card.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMorningFocus(idea.id); } };
        container.appendChild(card);
    });
}

function renderWorkList() {
    const container = document.getElementById('vault-list');
    if (!container) return;
    container.innerHTML = '';

    if (state.vault.length === 0) {
        container.innerHTML = '<p style="text-align:center;padding:20px 0;">' + escapeHtml(t('toast_no_ideas')) + '</p>';
        return;
    }

    state.vault.forEach(idea => {
        const stateClass = idea.state.toLowerCase().replace(/\s+/g, '-');
        const isFocused  = state.focus.ideaId === idea.id;
        const workLog    = idea.workLog || [];

        const focusLabel = isFocused
            ? '<span style="color:var(--purple);font-size:11px;margin-left:6px;">' + escapeHtml(t('work_focus_label')) + '</span>'
            : '';

        const sparks     = idea.sparks || [];
        const sparkItems = sparks.length > 0
            ? sparks.map(s => {
                const sparkNotes = s.notes || [];
                const notesList  = sparkNotes.length > 0
                    ? sparkNotes.map(n => `
                        <div class="spark-note-entry">
                            <span class="work-log-date">${escapeHtml(n.date)}</span>
                            <span class="work-log-note">${escapeHtml(n.note)}</span>
                        </div>`).join('')
                    : '<div class="work-log-empty">' + escapeHtml(t('work_spark_no_notes')) + '</div>';
                return `
                <div class="spark-item${s.done ? ' spark-done' : ''}">
                    <div class="spark-header" onclick="event.stopPropagation(); toggleSparkExpand(${s.id})">
                        <span class="spark-check">${s.done ? '✓' : '○'}</span>
                        <span class="spark-title">${escapeHtml(s.title)}</span>
                        <span class="spark-arrow" id="spark-arrow-${s.id}">›</span>
                    </div>
                    <div class="spark-notes-section" id="spark-notes-${s.id}" style="display:none;">
                        <div class="spark-notes-list">${notesList}</div>
                        <textarea class="textarea spark-note-input"
                                  id="spark-note-input-${s.id}"
                                  placeholder="${escapeHtml(t('work_spark_note_placeholder'))}"
                                  onclick="event.stopPropagation()"
                                  rows="2"
                                  data-lock-input></textarea>
                        <button class="work-log-btn"
                                onclick="event.stopPropagation(); logSparkNote(${idea.id}, ${s.id})"
                                data-lock-input>
                            ${escapeHtml(t('work_log_progress'))}
                        </button>
                    </div>
                </div>`;
            }).join('')
            : '<div class="work-log-empty">' + escapeHtml(t('work_no_sparks')) + '</div>';

        const logEntries = workLog.length > 0
            ? [...workLog].reverse().map(e => `
                <div class="work-log-entry">
                    <span class="work-log-date">${escapeHtml(e.date)}</span>
                    <span class="work-log-note">${escapeHtml(e.note)}</span>
                </div>`).join('')
            : '<div class="work-log-empty">' + escapeHtml(t('work_no_progress')) + '</div>';

        const card = document.createElement('div');
        card.className = 'card';
        card.setAttribute('data-idea-id', idea.id);
        if (isFocused) card.style.borderColor = 'var(--purple)';

        const isExpanded = _expandedCardIds.has(idea.id);
        const expandedDisplay = isExpanded ? 'block' : 'none';

        card.innerHTML = `
            <div class="card-title">${escapeHtml(idea.title)}${focusLabel}</div>
            <div>
                <span class="badge ${stateClass}">${escapeHtml(idea.state)}</span>
                <span class="badge ${idea.potential.toLowerCase()}">${escapeHtml(idea.potential)}</span>
            </div>
            <div class="expanded-card" style="display:${expandedDisplay};">
                <div class="expanded-title">${escapeHtml(t('work_category'))}: ${escapeHtml(idea.category)}</div>
                <div class="expanded-next">
                    <div style="font-size:11px;color:var(--muted);margin-bottom:4px;">${escapeHtml(t('work_next_action'))}</div>
                    <input type="text" class="input"
                           style="margin:0 0 4px;font-size:13px;padding:6px 10px;"
                           id="next-action-input-${idea.id}"
                           value="${escapeHtml(idea.nextAction)}"
                           placeholder="${escapeHtml(t('work_next_placeholder'))}"
                           onclick="event.stopPropagation()"
                           data-lock-input>
                    <button class="work-log-btn"
                            onclick="event.stopPropagation(); saveNextAction(${idea.id})"
                            data-lock-input>
                        ${escapeHtml(t('work_update_next'))}
                    </button>
                </div>
                <div class="expanded-action">
                    <button class="expanded-action-btn ${isFocused ? 'is-focus' : ''}"
                            onclick="event.stopPropagation(); setFocus(${idea.id})"
                            data-lock-input>
                        ${isFocused ? escapeHtml(t('work_is_focus')) : escapeHtml(t('work_set_focus'))}
                    </button>
                </div>
                <div class="spark-section">
                    <div class="work-log-section-label">${escapeHtml(t('work_sparks_label'))}</div>
                    <div class="spark-list">${sparkItems}</div>
                    <div class="spark-add-row">
                        <input type="text" class="input spark-input"
                               id="spark-input-${idea.id}"
                               placeholder="${escapeHtml(t('work_spark_placeholder'))}"
                               onclick="event.stopPropagation()">
                        <button class="work-log-btn"
                                onclick="event.stopPropagation(); addSpark(${idea.id})">
                            ${escapeHtml(t('work_add_spark'))}
                        </button>
                    </div>
                </div>
                <div class="work-log-section">
                    <div class="work-log-section-label">${escapeHtml(t('work_progress_log'))}</div>
                    <textarea class="textarea work-log-input"
                              id="work-log-input-${idea.id}"
                              placeholder="${escapeHtml(t('work_progress_placeholder'))}"
                              onclick="event.stopPropagation()"
                              rows="2"
                              data-lock-input></textarea>
                    <button class="work-log-btn"
                            onclick="event.stopPropagation(); logProgress(${idea.id})"
                            data-lock-input>
                        ${escapeHtml(t('work_log_progress'))}
                    </button>
                    <div class="work-log-entries" id="work-log-entries-${idea.id}">
                        ${logEntries}
                    </div>
                </div>
            </div>
        `;

        card.addEventListener('click', () => toggleCard(card));
        container.appendChild(card);
    });
}

function renderVault() {
    const tbody = document.getElementById('vault-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    state.vault.forEach((idea) => {
        const stateClass = idea.state.toLowerCase().replace(/\s+/g, '-');
        const row = document.createElement('tr');
        row.style.cursor = 'pointer';
        row.onclick = () => openIdeaDetail(idea.id);
        row.innerHTML = `
            <td>${escapeHtml(idea.title)}</td>
            <td><span class="badge ${stateClass}">${escapeHtml(idea.state)}</span></td>
            <td>${escapeHtml(idea.date)}</td>
        `;
        tbody.appendChild(row);
    });
}

function renderEveningMoved() {
    const movedList = document.querySelector('#screen-evening .moved-list');
    if (!movedList) return;

    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const todayISO_ = todayISO();
    const items = [];

    if (state.focus.title) items.push(t('label_focus') + ': ' + state.focus.title);

    // Ideas captured today
    state.vault
        .filter(v => v.date === today)
        .filter(v => !items.some(i => i.includes(v.title)))
        .slice(0, 2)
        .forEach(v => items.push(t('label_captured') + ': ' + v.title));

    // Ideas with work logged today
    state.vault
        .filter(v => (v.workLog || []).some(l => l.date === todayISO_))
        .filter(v => !items.some(i => i.includes(v.title)))
        .slice(0, 2)
        .forEach(v => items.push(t('label_worked_on') + ': ' + v.title));

    if (items.length === 0) {
        movedList.innerHTML = '<li style="color:var(--muted)">' + escapeHtml(t('toast_nothing_logged')) + '</li>';
    } else {
        movedList.innerHTML = items.map(item => `<li>${escapeHtml(item)}</li>`).join('');
    }
}

function renderEveningAttachOption() {
    const section = document.getElementById('evening-attach-section');
    const label   = document.getElementById('evening-attach-label');
    if (!section) return;

    if (state.focus.isVaultLinked && state.focus.ideaId && state.focus.title) {
        if (label) label.textContent = t('evening_attach_question') + ' "' + state.focus.title + '"?';
        section.style.display = 'block';
    } else {
        section.style.display = 'none';
    }
}

function renderEveningKarma() {
    const karmaDisplay = document.getElementById('today-karma-display');
    if (!karmaDisplay || state.dayLocked) return;
    const earned = state.karma - (state.karmaAtDayStart ?? state.karma);
    karmaDisplay.textContent = earned + ' ' + t('evening_karma_earned');
}

function renderReflectionHistory() {
    const list = document.getElementById('reflection-history-list');
    if (!list) return;
    const entries = [...state.reflections].reverse().slice(0, 30);
    if (entries.length === 0) {
        list.innerHTML = '<p style="color:var(--muted);font-size:13px;margin:8px 0 0;">' + escapeHtml(t('toast_no_reflections')) + '</p>';
        return;
    }
    list.innerHTML = entries.map(e => `
        <div style="padding:8px 0;border-bottom:var(--border);">
            <div style="font-size:11px;color:var(--muted);">${escapeHtml(e.date)}</div>
            <div style="font-size:13px;margin-top:2px;">${escapeHtml(e.text)}</div>
        </div>`).join('');
}

// ============================================================
// KARMA
// ============================================================

async function updateKarma(points) {
    state.karma += points;
    renderKarma();
    await saveState();
}

async function startDay() {
    const today      = _sessionDate || todayISO();
    const inputEl    = document.getElementById('morning-focus-input');
    const inputTitle = inputEl?.value.trim() || '';

    // Build focus from input first (used in both the guard and normal path)
    let newFocus = { ideaId: null, title: inputTitle, nextAction: '', isVaultLinked: false, date: today };
    if (_pendingMorningIdeaId) {
        const idea = state.vault.find(v => v.id === _pendingMorningIdeaId);
        if (idea) {
            newFocus = { ideaId: idea.id, title: idea.title, nextAction: idea.nextAction, isVaultLinked: true, date: today };
        }
    }
    _pendingMorningIdeaId = null;

    // Guard: prevent same-day re-start, and prevent locked days from starting until next day
    if (state.lastBootDate === today) {
        // Same day detected
        if (state.dayLocked) {
            // Day is locked and still same day — cannot start
            showToast(t('toast_day_already'), 'error');
            navigateTo('home');
            return;
        }
        // Day unlocked but already started — allow focus update only
        let focusUpdated = false;
        if (newFocus.title) {
            state.focus = newFocus;
            await saveState();
            focusUpdated = true;
        }
        const msg = focusUpdated ? 'Focus updated' : t('toast_day_already');
        showToast(msg, 'info');
        navigateTo('home');
        return;
    }

    // Auto-unlock if a new day has started (day is locked but different date now)
    if (state.dayLocked && state.lastBootDate !== today) {
        state.dayLocked = false;
        applyLockedState();
    }

    // Commit focus for new day
    state.focus           = newFocus;
    state.lastBootDate    = today;
    state.karmaAtDayStart = state.karma; // snapshot before awarding +5

    await updateKarma(5);
    showToast(t('toast_day_started'), 'success');
    navigateTo('home');
}

// ============================================================
// IDEA CAPTURE
// ============================================================

async function saveIdea() {
    if (guardLocked()) return;
    const titleInput = document.getElementById('idea-title');
    if (!titleInput || !titleInput.value.trim()) {
        showToast(t('toast_enter_title'), 'error');
        return;
    }

    const note     = document.getElementById('idea-note')?.value.trim() || '';
    const category = 'Other';
    const potential = 'Medium';

    const newIdea = {
        id:         Date.now(),
        title:      titleInput.value.trim(),
        category,
        state:      'New',
        potential,
        nextAction: note || 'No description',
        date:       new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        workLog:    []
    };

    state.vault.push(newIdea);
    renderVault();
    await updateKarma(8);
    clearCaptureForm();
    showToast(t('toast_saved_full'), 'success');
}

async function saveIdeaQuick() {
    if (guardLocked()) return;
    const titleInput = document.getElementById('idea-title');
    if (!titleInput || !titleInput.value.trim()) {
        showToast(t('toast_enter_title'), 'error');
        return;
    }

    const newIdea = {
        id:         Date.now(),
        title:      titleInput.value.trim(),
        category:   'Other',
        state:      'New',
        potential:  'Medium',
        nextAction: 'No description',
        date:       new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        workLog:    []
    };

    state.vault.push(newIdea);
    renderVault();
    await updateKarma(3);
    clearCaptureForm();
    showToast(t('toast_saved_quick'), 'success');
}

function clearCaptureForm() {
    const titleInput = document.getElementById('idea-title');
    const noteInput  = document.getElementById('idea-note');
    if (titleInput) titleInput.value = '';
    if (noteInput)  noteInput.value  = '';
}

// ============================================================
// VAULT ACTIONS
// ============================================================

function toggleChip(chip) {
    const isSelected = chip.classList.contains('selected');
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
    if (!isSelected) chip.classList.add('selected');
}

function togglePotential(btn) {
    document.querySelectorAll('.potential-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
}

function toggleCard(card) {
    const expanded = card?.querySelector('.expanded-card');
    if (!expanded) return;
    const isExpanding = expanded.style.display === 'none';
    expanded.style.display = isExpanding ? 'block' : 'none';

    // Track expanded state by idea ID
    const ideaId = card?.getAttribute('data-idea-id');
    if (ideaId) {
        if (isExpanding) {
            _expandedCardIds.add(parseInt(ideaId));
        } else {
            _expandedCardIds.delete(parseInt(ideaId));
        }
    }
}

async function deleteIdea(id) {
    if (guardLocked()) return;
    const idx = state.vault.findIndex(v => v.id === id);
    if (idx === -1) return;
    const title = state.vault[idx].title;

    if (state.focus.ideaId === id) {
        state.focus = { ideaId: null, title: '', nextAction: '', isVaultLinked: false, date: null };
    }

    state.vault.splice(idx, 1);
    renderVault();
    await saveState();
    showToast(t('toast_deleted') + ': ' + title, 'info');
}

function editIdea(id) {
    const idea = state.vault.find(v => v.id === id);
    if (!idea) return;
    document.getElementById('idea-edit-id').value        = id;
    document.getElementById('idea-edit-title').value     = idea.title;
    document.getElementById('idea-edit-state').value     = idea.state;
    document.getElementById('idea-edit-potential').value = idea.potential;
    document.getElementById('idea-edit-next').value      = idea.nextAction;
    document.getElementById('edit-modal').classList.add('active');
    setTimeout(() => document.getElementById('idea-edit-title').focus(), 50);
}

async function saveEdit() {
    if (guardLocked()) return;
    const id  = parseInt(document.getElementById('idea-edit-id').value, 10);
    const idx = state.vault.findIndex(v => v.id === id);
    if (idx === -1) return;

    const title = document.getElementById('idea-edit-title').value.trim();
    if (!title) { showToast(t('toast_title_empty'), 'error'); return; }

    state.vault[idx] = {
        ...state.vault[idx],
        title,
        state:     document.getElementById('idea-edit-state').value,
        potential: document.getElementById('idea-edit-potential').value,
        nextAction: document.getElementById('idea-edit-next').value.trim() || state.vault[idx].nextAction
    };

    // Keep focus in sync if this idea is the current focus
    if (state.focus.ideaId === id) {
        state.focus.title      = title;
        state.focus.nextAction = state.vault[idx].nextAction;
    }

    renderVault();
    await saveState();
    closeEditModal();
    showToast(t('toast_idea_saved'), 'success');
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.remove('active');
}

// ============================================================
// FOCUS
// ============================================================

// Called from Work on It expanded card
async function setFocus(ideaId) {
    if (guardLocked()) return;
    const idea = state.vault.find(v => v.id === ideaId);
    if (!idea) return;
    state.focus = {
        ideaId:        idea.id,
        title:         idea.title,
        nextAction:    idea.nextAction,
        isVaultLinked: true,
        date:          todayISO()
    };
    await saveState();
    renderWorkList();
    showToast(t('toast_focus_set') + ': ' + idea.title, 'success');
}

// Called from Morning Boot vault picker
function setMorningFocus(ideaId) {
    const idea = state.vault.find(v => v.id === ideaId);
    if (!idea) return;
    _pendingMorningIdeaId = idea.id;
    const input = document.getElementById('morning-focus-input');
    if (input) input.value = idea.title;
    renderMorningVaultPicker();
}

function clearMorningVaultSelection() {
    _pendingMorningIdeaId = null;
    renderMorningVaultPicker();
}

async function saveNextAction(ideaId) {
    if (guardLocked()) return;
    const input = document.getElementById('next-action-input-' + ideaId);
    const val   = input?.value.trim();
    if (!val) { showToast(t('toast_next_empty'), 'error'); return; }

    const idea = state.vault.find(v => v.id === ideaId);
    if (!idea) return;
    idea.nextAction = val;
    if (state.focus.ideaId === ideaId) state.focus.nextAction = val;

    await saveState();
    showToast(t('toast_next_updated'), 'success');
}

// ============================================================
// WORK LOG
// ============================================================

async function logProgress(ideaId) {
    if (guardLocked()) return;
    const textarea = document.getElementById('work-log-input-' + ideaId);
    const note     = textarea?.value.trim();
    if (!note) { showToast(t('toast_write_first'), 'error'); return; }

    const idea = state.vault.find(v => v.id === ideaId);
    if (!idea) return;

    if (!idea.workLog) idea.workLog = [];
    idea.workLog.push({ date: todayISO(), note });

    await saveState();
    if (textarea) textarea.value = '';
    renderWorkList();
    showToast(t('toast_progress_logged'), 'success');
}

async function addSpark(ideaId) {
    const input = document.getElementById('spark-input-' + ideaId);
    const title = input?.value.trim();
    if (!title) { showToast(t('toast_write_first'), 'error'); return; }

    const idea = state.vault.find(v => v.id === ideaId);
    if (!idea) return;

    if (!idea.sparks) idea.sparks = [];
    idea.sparks.push({ id: Date.now(), title, date: todayISO(), done: false, notes: [] });

    await saveState();
    if (input) input.value = '';
    renderWorkList();
}

async function toggleSpark(ideaId, sparkId) {
    const idea = state.vault.find(v => v.id === ideaId);
    if (!idea || !idea.sparks) return;
    const spark = idea.sparks.find(s => s.id === sparkId);
    if (!spark) return;
    spark.done = !spark.done;
    await saveState();
    renderWorkList();
}

function toggleSparkExpand(sparkId) {
    const section = document.getElementById('spark-notes-' + sparkId);
    const arrow   = document.getElementById('spark-arrow-' + sparkId);
    if (!section) return;
    const isOpen = section.style.display !== 'none';
    section.style.display = isOpen ? 'none' : 'block';
    if (arrow) arrow.textContent = isOpen ? '›' : '⌄';
}

async function toggleSparkInDetail(ideaId, sparkId) {
    const idea = state.vault.find(v => v.id === ideaId);
    const spark = idea?.sparks?.find(s => s.id === sparkId);
    if (!spark) return;
    spark.done = !spark.done;
    await saveState();
    renderIdeaDetail();
}

async function toggleIdeaDone() {
    const idea = state.vault.find(v => v.id === _currentIdeaId);
    if (!idea) return;
    idea.state = idea.state === 'Done' ? 'Active' : 'Done';
    // Keep focus in sync if this idea is the current focus
    if (state.focus.ideaId === idea.id) {
        state.focus.title = idea.title;
    }
    await saveState();
    renderIdeaDetail();
    renderVault();
    renderHomeFocus();
}

async function logSparkNote(ideaId, sparkId) {
    if (guardLocked()) return;
    const textarea = document.getElementById('spark-note-input-' + sparkId);
    const note     = textarea?.value.trim();
    if (!note) { showToast(t('toast_write_first'), 'error'); return; }

    const idea = state.vault.find(v => v.id === ideaId);
    if (!idea || !idea.sparks) return;
    const spark = idea.sparks.find(s => s.id === sparkId);
    if (!spark) return;

    if (!spark.notes) spark.notes = [];
    spark.notes.push({ date: todayISO(), note });

    await saveState();
    if (textarea) textarea.value = '';
    renderWorkList();
    showToast(t('toast_progress_logged'), 'success');
}

// ============================================================
// PLAYBOOK
// ============================================================

// ============================================================
// EVENING / DAY CLOSE
// ============================================================

async function closeDay() {
    if (state.dayLocked) return;
    if (!state.lastBootDate) { showToast(t('toast_no_boot'), 'error'); return; }

    const textarea   = document.getElementById('evening-reflection-textarea');
    const reflection = textarea?.value.trim() || '';

    if (!reflection) {
        showToast(t('toast_write_reflection'), 'error');
        return;
    }

    const today = _sessionDate || todayISO();

    // Persist reflection
    state.reflections.push({
        date:    today,
        text:    reflection,
        focusId: state.focus.ideaId || null
    });

    // Attach to vault idea workLog if user opted in
    if (_attachDecision === true && state.focus.ideaId) {
        const idea = state.vault.find(v => v.id === state.focus.ideaId);
        if (idea) {
            if (!idea.workLog) idea.workLog = [];
            idea.workLog.push({ date: today, note: reflection });
        }
    }
    _attachDecision = null;

    await updateKarma(18);
    state.dayLocked = true;
    await saveState();
    applyLockedState();
    showToast(t('toast_day_closed'), 'success');
}

async function unlockDay() {
    state.dayLocked = false;
    await saveState();
    applyLockedState();
    showToast(t('toast_day_unlocked'), 'info');
}

function guardLocked() {
    if (!state.dayLocked) return false;
    showToast(t('toast_day_locked'), 'error');
    return true;
}

function applyLockedState() {
    if (state.dayLocked) {
        document.documentElement.setAttribute('data-locked', '');
    } else {
        document.documentElement.removeAttribute('data-locked');
    }

    const closeDayBtn    = document.getElementById('close-day-btn');
    const unlockBtn      = document.getElementById('unlock-day-btn');
    const eveningHeading = document.getElementById('evening-heading');
    const karmaDisplay   = document.getElementById('today-karma-display');
    const karmaPill      = document.getElementById('today-karma-pill');
    const backBtn        = document.getElementById('evening-back-btn');

    // Home screen banner
    const homeBanner     = document.getElementById('home-day-closed');
    const homeBannerKarma = document.getElementById('home-day-closed-karma');
    const morningCard    = document.getElementById('mode-card-morning');

    if (state.dayLocked) {
        // Evening screen
        if (eveningHeading) eveningHeading.textContent  = t('evening_day_closed');
        if (karmaDisplay)   karmaDisplay.textContent    = t('evening_today_complete');
        if (karmaPill)      karmaPill.style.display     = 'none';
        if (closeDayBtn)  { closeDayBtn.disabled = true;  closeDayBtn.style.opacity  = '0.4'; }
        if (unlockBtn) {
            unlockBtn.style.display = 'block';
            unlockBtn.disabled = false;
            unlockBtn.style.opacity = '1';
            unlockBtn.style.cursor = 'pointer';
        }

        const refreshBtn = document.getElementById('refresh-app-btn');
        if (refreshBtn) {
            refreshBtn.disabled = true;
            refreshBtn.style.opacity = '0.4';
            refreshBtn.style.cursor = 'not-allowed';
        }

        // Home screen
        if (homeBanner)     homeBanner.style.display    = 'block';
        if (homeBannerKarma) {
            const earned = state.karma - (state.karmaAtDayStart ?? state.karma);
            homeBannerKarma.textContent = earned + ' ' + t('evening_karma_earned');
        }
        if (morningCard) {
            morningCard.style.opacity = '0.45';
        }
    } else {
        // Evening screen
        if (eveningHeading) eveningHeading.textContent  = t('evening_title');
        if (karmaDisplay) {
            const earned = state.karma - (state.karmaAtDayStart ?? state.karma);
            karmaDisplay.textContent = earned + ' ' + t('evening_karma_earned');
        }
        if (karmaPill)      karmaPill.style.display     = 'inline-block';
        if (closeDayBtn)  { closeDayBtn.disabled = false; closeDayBtn.style.opacity  = '1'; }
        if (unlockBtn)      unlockBtn.style.display     = 'none';

        const refreshBtn = document.getElementById('refresh-app-btn');
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.style.opacity = '1';
            refreshBtn.style.cursor = 'pointer';
        }

        // Home screen
        if (homeBanner)     homeBanner.style.display    = 'none';
        if (morningCard) {
            morningCard.style.opacity = '1';
        }
    }
}

function attachReflectionToIdea() {
    _attachDecision = true;
    const section = document.getElementById('evening-attach-section');
    if (section) section.style.display = 'none';
    showToast(t('toast_will_attach'), 'info');
}

function skipAttachment() {
    _attachDecision = false;
    const section = document.getElementById('evening-attach-section');
    if (section) section.style.display = 'none';
}

// ============================================================
// UTILITY
// ============================================================

function openIdeaDetail(ideaId) {
    _currentDetailId = ideaId;
    _currentIdeaId = ideaId;
    navigateTo('idea-detail');
}

function renderIdeaDetail() {
    const idea = state.vault.find(i => i.id === _currentDetailId);
    if (!idea) { navigateTo('vault'); return; }

    document.getElementById('idea-detail-title').textContent = idea.title;
    document.getElementById('idea-detail-date').textContent  = t('detail_captured') + ' ' + (idea.date || '');

    const badgeEl = document.getElementById('idea-detail-state-badge');
    const stateClass = (idea.state || 'New').toLowerCase().replace(/\s+/g, '-');
    badgeEl.innerHTML = `<span class="badge ${stateClass}">${escapeHtml(idea.state || 'New')}</span>`;

    // Set done button label
    const doneBtn = document.getElementById('idea-detail-done-btn');
    if (doneBtn) {
        doneBtn.textContent = idea.state === 'Done' ? t('btn_mark_active') : t('btn_mark_complete');
    }

    const sparkEl  = document.getElementById('idea-detail-branches');
    const sparks   = Array.isArray(idea.sparks) ? idea.sparks : [];
    if (sparks.length > 0) {
        sparkEl.innerHTML = `<div style="margin-bottom:20px;">
            <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">${escapeHtml(t('work_sparks_label'))}</div>
            ${sparks.map(s => {
                const notes = s.notes || [];
                const notesList = notes.map(n => `
                    <div style="padding:4px 0 4px 22px;font-size:12px;color:var(--muted);">
                        <span style="font-size:10px;margin-right:6px;">${escapeHtml(n.date)}</span>${escapeHtml(n.note)}
                    </div>`).join('');
                return `
                <div style="margin-bottom:8px;">
                    <div style="display:flex;align-items:center;gap:8px;font-size:13px;">
                        <span style="color:var(--teal);flex-shrink:0;cursor:pointer;" onclick="toggleSparkInDetail(${idea.id}, ${s.id})">${s.done ? '✓' : '○'}</span>
                        <span style="${s.done ? 'text-decoration:line-through;color:var(--muted);' : 'font-weight:600;'}">${escapeHtml(s.title)}</span>
                    </div>
                    ${notesList}
                </div>`;
            }).join('')}
        </div>`;
    } else {
        sparkEl.innerHTML = '';
    }

    const logEl   = document.getElementById('idea-detail-log');
    const entries = Array.isArray(idea.workLog) ? idea.workLog : [];

    if (entries.length === 0) {
        logEl.innerHTML = `<div class="detail-empty">${escapeHtml(t('detail_no_log'))}</div>`;
    } else {
        logEl.innerHTML = entries.map(entry =>
            `<div class="detail-log-entry">
                <div class="detail-log-date">${escapeHtml(entry.date || '')}</div>
                <div class="detail-log-note">${escapeHtml(entry.note || '')}</div>
            </div>`
        ).join('');
    }
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    applyTheme(next);
    localStorage.setItem('ctml_theme', next);
}

async function refreshApp() {
    if (state.dayLocked) return;
    showToast(t('toast_refreshing'), 'info');
    try { await saveState(); } catch (e) {}
    setTimeout(() => {
        location.reload();
    }, 300);
}

// ── Settings: Reset Data ──

function openResetModal() {
    document.getElementById('reset-modal').classList.add('active');
}

function closeResetModal() {
    document.getElementById('reset-modal').classList.remove('active');
}

// ── Settings: Feedback ──

function openFeedbackModal() {
    const modal = document.getElementById('feedback-modal');
    modal.classList.add('active');
    // Reset form fields each open
    document.getElementById('feedback-name').value = '';
    document.getElementById('feedback-message').value = '';
    const bug = document.querySelector('input[name="feedback-type"][value="bug"]');
    if (bug) bug.checked = true;
    setTimeout(() => document.getElementById('feedback-message').focus(), 50);
}

function closeFeedbackModal() {
    document.getElementById('feedback-modal').classList.remove('active');
}

async function submitFeedback() {
    const typeInput = document.querySelector('input[name="feedback-type"]:checked');
    const type = typeInput ? typeInput.value : 'other';
    const name = document.getElementById('feedback-name').value.trim();
    const message = document.getElementById('feedback-message').value.trim();

    if (!message) {
        showToast(t('feedback_empty'), 'error');
        return;
    }

    const lang = currentLang || localStorage.getItem('ctml_lang') || document.documentElement.lang || 'en';

    const payload = {
        type,
        name: name || 'Anonymous',
        message,
        language: lang,
        version: '0.5.3',
        timestamp: new Date().toISOString()
    };

    try {
        const res = await fetch('https://formspree.io/f/xlgabvoy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Formspree non-2xx: ' + res.status);
        showToast(t('feedback_sent'), 'success');
        closeFeedbackModal();
    } catch (e) {
        // Offline / blocked / failed — fall back to mailto
        const subject = encodeURIComponent('CTML Feedback [' + type + ']');
        const body = encodeURIComponent(
            message + '\n\n—\nName: ' + (name || 'Anonymous') +
            '\nVersion: 0.4.0\nLanguage: ' + lang
        );
        window.location.href = 'mailto:elemereross.ss@gmail.com?subject=' + subject + '&body=' + body;
        showToast(t('feedback_fallback'), 'info');
        closeFeedbackModal();
    }
}

async function confirmResetData() {
    await db.ideas.clear();
    await db.settings.clear();
    localStorage.removeItem('ctml_theme');
    location.reload();
}

function confirmDeleteIdea() {
    if (guardLocked()) return;
    document.getElementById('delete-idea-modal').classList.add('active');
}

function closeDeleteModal() {
    document.getElementById('delete-idea-modal').classList.remove('active');
}

async function actuallyDeleteIdea() {
    const id = _currentIdeaId;
    if (!id) return;
    await deleteIdea(id);
    closeDeleteModal();
    navigateTo('vault');
}

function applyTheme(theme) {
    if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
}

function todayISO() {
    return new Date().toISOString().split('T')[0];
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

let toastTimer = null;
function showToast(message, type = 'info', duration = 2500) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.className   = 'toast ' + type;
    void toast.offsetWidth;
    toast.classList.add('show');
    toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
}

// ============================================================
// SYNC BROADCAST HELPER
// ============================================================

// Re-renders the currently active screen without switching screens.
// Mirrors the render logic in navigateTo() for use after a remote state reload.
function renderCurrentScreen() {
    const active = document.querySelector('.screen.active');
    if (!active) return;
    const screen = active.id.replace('screen-', '');

    renderKarma();
    if (screen === 'morning') {
        renderMorningFocus();
        renderMorningStats();
        renderMorningVaultPicker();
    } else if (screen === 'work') {
        renderWorkList();
    } else if (screen === 'evening') {
        renderEveningMoved();
        renderEveningAttachOption();
        renderEveningKarma();
        renderReflectionHistory();
    } else if (screen === 'vault') {
        renderVault();
    } else if (screen === 'idea-detail') {
        renderIdeaDetail();
    } else if (screen === 'capture') {
        // Capture form is stateless; just refresh karma
    } else if (screen === 'playbook') {
        if (typeof renderPlaybook === 'function') renderPlaybook();
    } else {
        // home or unknown
        renderHomeFocus();
    }
    if (state.dayLocked) applyLockedState();
}

// ============================================================
// INIT
// ============================================================

function dismissWelcome() {
    localStorage.setItem('ctml_welcomeDismissed', 'true');
    document.getElementById('screen-welcome').classList.remove('active');
    // First-run flow: chain into how-to. Subsequent re-opens go straight home.
    if (!localStorage.getItem('ctml_howtoDismissed')) {
        document.getElementById('screen-howto').classList.add('active');
        document.querySelector('.nav-bar').style.display = 'none';
    } else {
        document.getElementById('screen-home').classList.add('active');
        document.querySelector('.nav-bar').style.display = '';
    }
}

function showWelcome() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-welcome').classList.add('active');
    document.querySelector('.nav-bar').style.display = 'none';
}

function dismissHowto() {
    localStorage.setItem('ctml_howtoDismissed', 'true');
    document.getElementById('screen-howto').classList.remove('active');
    document.getElementById('screen-home').classList.add('active');
    document.querySelector('.nav-bar').style.display = '';
}

function showHowto() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-howto').classList.add('active');
    document.querySelector('.nav-bar').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', async () => {
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    document.getElementById('morning-date').textContent = dateStr;
    document.getElementById('evening-date').textContent = dateStr;
    document.getElementById('evening-time').textContent = 'Evening';

    // Show welcome screen on first visit
    if (!localStorage.getItem('ctml_welcomeDismissed')) {
        document.getElementById('screen-home').classList.remove('active');
        document.getElementById('screen-welcome').classList.add('active');
        document.querySelector('.nav-bar').style.display = 'none';
    }

    applyTheme(localStorage.getItem('ctml_theme') || 'dark');
    const _savedLang = localStorage.getItem('ctml_lang');
    if (_savedLang === 'en' || _savedLang === 'hu') currentLang = _savedLang;
    applyTranslations();
    await loadState();
    renderAll();

    // Sync Broadcast: reload state from DB when another tab saves
    if (_bc) {
        _bc.onmessage = async (event) => {
            if (event.data?.type === 'state_saved') {
                await loadState();
                renderCurrentScreen();
                applyTranslations();
            }
        };
    }
});

// Persistence Sentinel: force-save when tab is hidden (browser switch, close, Alt+Tab)
// Atomic Ceremony: detect date drift when tab becomes visible again
document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'hidden') {
        await saveState();
    } else if (document.visibilityState === 'visible' && _sessionDate) {
        if (todayISO() !== _sessionDate) {
            showToast(t('toast_new_day'), 'info');
        }
    }
});

// Close BroadcastChannel on page unload to avoid orphaned listeners across reloads
window.addEventListener('pagehide', () => {
    if (_bc) try { _bc.close(); } catch (e) {}
});

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 's') {
        const captureScreen = document.getElementById('screen-capture');
        if (captureScreen?.classList.contains('active')) {
            e.preventDefault();
            saveIdea();
        }
    }
    if (e.key === 'Escape') {
        const detailScreen = document.getElementById('screen-idea-detail');
        if (detailScreen?.classList.contains('active')) {
            navigateTo('vault');
        } else {
            closeEditModal();
        }
    }
});
