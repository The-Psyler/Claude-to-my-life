/* ============================================================
   CTML — Claude to My Life
   App Logic — Phase 3
   ============================================================ */

// ============================================================
// GUARD
// ============================================================

if (typeof Dexie === 'undefined') {
    document.body.innerHTML = '<p style="color:#E57373;padding:20px;font-family:system-ui;">Error: dexie.min.js not found. Place it in the src/ folder alongside app.js.</p>';
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

// ============================================================
// STATE
// ============================================================

const SEED_VAULT = [
    { id: 1, title: 'CTML Pipeline',              category: 'System',   state: 'Active', potential: 'High',   nextAction: 'Build daily rhythm into habit',     date: 'Apr 9', workLog: [] },
    { id: 2, title: 'OnTime App',                 category: 'App',      state: 'New',    potential: 'High',   nextAction: 'Define core loop in one paragraph', date: 'Apr 9', workLog: [] },
    { id: 3, title: 'AI Experience Presentation', category: 'Creative', state: 'New',    potential: 'Medium', nextAction: 'Outline 3 key moments to show',     date: 'Apr 9', workLog: [] },
    { id: 4, title: 'CTML Web App',               category: 'App',      state: 'Future', potential: 'High',   nextAction: 'Hand V0 spec to Claude Code',       date: 'Apr 9', workLog: [] }
];

let state = {
    karma:        47,
    vault:        [...SEED_VAULT],
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
                    { key: 'karmaAtDayStart', value: state.karmaAtDayStart }
                ]);
                // Clear + re-put handles deletions atomically
                await db.ideas.clear();
                await db.ideas.bulkPut(state.vault);
            });
        } catch (e) {
            console.warn('saveState failed:', e);
            showToast('Save failed', 'error');
        }
    }).catch(() => {}); // keep queue alive if a save throws unexpectedly
    return _saveQueue;
}

async function loadState() {
    try {
        await migrateOldStorage();

        const ideas = await db.ideas.toArray();
        if (ideas.length > 0) {
            state.vault = ideas.map(idea => ({ workLog: [], ...idea }));
        }

        const playbook = await db.playbook.orderBy('id').toArray();
        if (playbook.length > 0) {
            state.playbook = playbook;
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

        // Auto-start new day if lastBootDate is from a previous day
        const today = todayISO();
        if (state.lastBootDate && state.lastBootDate < today) {
            await startDay();
        }
    } catch (e) {
        console.warn('loadState failed:', e);
        showToast('Could not load saved data', 'error');
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

function navigateTo(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + screen).classList.add('active');

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navItem = document.getElementById('nav-' + screen);
    if (navItem) navItem.classList.add('active');

    // Screen-specific refresh
    if (screen === 'morning') {
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
    }

    setTimeout(() => {
        const first = document.querySelector(
            `#screen-${screen} button, #screen-${screen} input, #screen-${screen} textarea`
        );
        if (first) first.focus();
    }, 50);
}

function goBack() { navigateTo('home'); }

// ============================================================
// RENDER
// ============================================================

function renderAll() {
    renderKarma();
    renderMorningFocus();
    renderMorningStats();
    renderMorningVaultPicker();
    renderWorkList();
    renderVault();
    renderPlaybook();
    if (state.dayLocked) applyLockedState();
}

function renderKarma() {
    const homeDisplay   = document.getElementById('karma-display');
    const morningKarma  = document.getElementById('morning-karma-text');
    if (homeDisplay)  homeDisplay.textContent  = state.karma + ' pts';
    if (morningKarma) morningKarma.textContent = state.karma + ' karma';
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
            ? 'Next: ' + state.focus.nextAction
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
        container.innerHTML = '<p style="color:var(--muted);font-size:13px;padding:8px 0;">No ideas yet — capture one first.</p>';
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
        container.innerHTML = '<p style="text-align:center;padding:20px 0;">No ideas yet — capture one first.</p>';
        return;
    }

    state.vault.forEach(idea => {
        const stateClass = idea.state.toLowerCase().replace(/\s+/g, '-');
        const isFocused  = state.focus.ideaId === idea.id;
        const workLog    = idea.workLog || [];

        const focusLabel = isFocused
            ? '<span style="color:var(--purple);font-size:11px;margin-left:6px;">● focus</span>'
            : '';

        const logEntries = workLog.length > 0
            ? [...workLog].reverse().map(e => `
                <div class="work-log-entry">
                    <span class="work-log-date">${escapeHtml(e.date)}</span>
                    <span class="work-log-note">${escapeHtml(e.note)}</span>
                </div>`).join('')
            : '<div class="work-log-empty">No progress logged yet.</div>';

        const card = document.createElement('div');
        card.className = 'card';
        if (isFocused) card.style.borderColor = 'var(--purple)';

        card.innerHTML = `
            <div class="card-title">${escapeHtml(idea.title)}${focusLabel}</div>
            <div>
                <span class="badge ${stateClass}">${escapeHtml(idea.state)}</span>
                <span class="badge ${idea.potential.toLowerCase()}">${escapeHtml(idea.potential)}</span>
            </div>
            <div class="expanded-card" style="display:none;">
                <div class="expanded-title">Category: ${escapeHtml(idea.category)}</div>
                <div class="expanded-next">
                    <div style="font-size:11px;color:var(--muted);margin-bottom:4px;">Next action</div>
                    <input type="text" class="input"
                           style="margin:0 0 4px;font-size:13px;padding:6px 10px;"
                           id="next-action-input-${idea.id}"
                           value="${escapeHtml(idea.nextAction)}"
                           placeholder="What's the next action?"
                           onclick="event.stopPropagation()">
                    <button class="work-log-btn"
                            onclick="event.stopPropagation(); saveNextAction(${idea.id})">
                        Update next action
                    </button>
                </div>
                <div class="expanded-action">
                    <button class="expanded-action-btn ${isFocused ? 'is-focus' : ''}"
                            onclick="event.stopPropagation(); setFocus(${idea.id})">
                        ${isFocused ? "Today's focus ✓" : "This is today's focus →"}
                    </button>
                </div>
                <div class="work-log-section">
                    <div class="work-log-section-label">Progress log</div>
                    <textarea class="textarea work-log-input"
                              id="work-log-input-${idea.id}"
                              placeholder="What did you do? What did you learn?"
                              onclick="event.stopPropagation()"
                              rows="2"></textarea>
                    <button class="work-log-btn"
                            onclick="event.stopPropagation(); logProgress(${idea.id})">
                        Log progress
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

    state.vault.forEach((idea, idx) => {
        const stateClass = idea.state.toLowerCase().replace(/\s+/g, '-');
        const logCount   = (idea.workLog || []).length;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${idx + 1}</td>
            <td>${escapeHtml(idea.title)}</td>
            <td>${escapeHtml(idea.category)}</td>
            <td><span class="badge ${stateClass}">${escapeHtml(idea.state)}</span></td>
            <td><span class="badge ${idea.potential.toLowerCase()}">${escapeHtml(idea.potential)}</span></td>
            <td>${escapeHtml(idea.nextAction)}</td>
            <td>${escapeHtml(idea.date)}</td>
            <td style="color:var(--muted);font-size:11px;">${logCount > 0 ? logCount + ' log' + (logCount > 1 ? 's' : '') : '—'}</td>
            <td style="white-space:nowrap;">
                <button class="vault-action-btn"        onclick="editIdea(${idea.id})"   aria-label="Edit ${escapeHtml(idea.title)}">Edit</button>
                <button class="vault-action-btn delete" onclick="deleteIdea(${idea.id})" aria-label="Delete ${escapeHtml(idea.title)}">✕</button>
            </td>
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

    if (state.focus.title) items.push('Focus: ' + state.focus.title);

    // Ideas captured today
    state.vault
        .filter(v => v.date === today)
        .filter(v => !items.some(i => i.includes(v.title)))
        .slice(0, 2)
        .forEach(v => items.push('Captured: ' + v.title));

    // Ideas with work logged today
    state.vault
        .filter(v => (v.workLog || []).some(l => l.date === todayISO_))
        .filter(v => !items.some(i => i.includes(v.title)))
        .slice(0, 2)
        .forEach(v => items.push('Worked on: ' + v.title));

    if (items.length === 0) {
        movedList.innerHTML = '<li style="color:var(--muted)">Nothing logged yet today</li>';
    } else {
        movedList.innerHTML = items.map(item => `<li>${escapeHtml(item)}</li>`).join('');
    }
}

function renderEveningAttachOption() {
    const section = document.getElementById('evening-attach-section');
    const label   = document.getElementById('evening-attach-label');
    if (!section) return;

    if (state.focus.isVaultLinked && state.focus.ideaId && state.focus.title) {
        if (label) label.textContent = 'Attach this reflection to "' + state.focus.title + '"?';
        section.style.display = 'block';
    } else {
        section.style.display = 'none';
    }
}

function renderEveningKarma() {
    const karmaDisplay = document.getElementById('today-karma-display');
    if (!karmaDisplay || state.dayLocked) return;
    const earned = state.karma - (state.karmaAtDayStart ?? state.karma);
    karmaDisplay.textContent = earned + ' karma earned today';
}

function renderReflectionHistory() {
    const list = document.getElementById('reflection-history-list');
    if (!list) return;
    const entries = [...state.reflections].reverse().slice(0, 30);
    if (entries.length === 0) {
        list.innerHTML = '<p style="color:var(--muted);font-size:13px;margin:8px 0 0;">No past reflections yet.</p>';
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
    const today      = todayISO();
    const inputEl    = document.getElementById('morning-focus-input');
    const inputTitle = inputEl?.value.trim() || '';

    // Guard: prevent same-day re-start
    if (state.lastBootDate === today && !state.dayLocked) {
        showToast('Day already started', 'info');
        navigateTo('home');
        return;
    }

    // Auto-unlock if a new day has started
    if (state.dayLocked && state.lastBootDate !== today) {
        state.dayLocked = false;
        applyLockedState();
    }

    // Commit focus
    let newFocus = { ideaId: null, title: inputTitle, nextAction: '', isVaultLinked: false, date: today };
    if (_pendingMorningIdeaId) {
        const idea = state.vault.find(v => v.id === _pendingMorningIdeaId);
        if (idea) {
            newFocus = { ideaId: idea.id, title: idea.title, nextAction: idea.nextAction, isVaultLinked: true, date: today };
        }
    }
    state.focus           = newFocus;
    state.lastBootDate    = today;
    state.karmaAtDayStart = state.karma; // snapshot before awarding +5
    _pendingMorningIdeaId = null;

    await updateKarma(5);
    showToast('+5 karma — Day started!', 'success');
    navigateTo('home');
}

// ============================================================
// IDEA CAPTURE
// ============================================================

async function saveIdea() {
    const titleInput = document.getElementById('idea-title');
    if (!titleInput || !titleInput.value.trim()) {
        showToast('Please enter a title', 'error');
        return;
    }

    const note      = document.getElementById('idea-note')?.value.trim() || '';
    const category  = Array.from(document.querySelectorAll('.chip.selected')).map(c => c.textContent).join(', ') || 'Other';
    const potentialRaw = Array.from(document.querySelectorAll('.potential-btn.selected')).map(b => b.dataset.value)[0] || 'Medium';
    const potential    = potentialRaw.charAt(0).toUpperCase() + potentialRaw.slice(1).toLowerCase();

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
    showToast('+8 pts — Saved to Vault', 'success');
}

async function saveIdeaQuick() {
    const titleInput = document.getElementById('idea-title');
    if (!titleInput || !titleInput.value.trim()) {
        showToast('Please enter a title', 'error');
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
    showToast('+3 pts — Saved to Vault', 'success');
}

function clearCaptureForm() {
    const titleInput = document.getElementById('idea-title');
    const noteInput  = document.getElementById('idea-note');
    if (titleInput) titleInput.value = '';
    if (noteInput)  noteInput.value  = '';
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
    document.querySelectorAll('.potential-btn').forEach(b => b.classList.remove('selected'));
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
    expanded.style.display = expanded.style.display === 'none' ? 'block' : 'none';
}

async function deleteIdea(id) {
    const idx = state.vault.findIndex(v => v.id === id);
    if (idx === -1) return;
    const title = state.vault[idx].title;

    if (state.focus.ideaId === id) {
        state.focus = { ideaId: null, title: '', nextAction: '', isVaultLinked: false, date: null };
    }

    state.vault.splice(idx, 1);
    renderVault();
    await saveState();
    showToast('Deleted: ' + title, 'info');
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
    const id  = parseInt(document.getElementById('idea-edit-id').value, 10);
    const idx = state.vault.findIndex(v => v.id === id);
    if (idx === -1) return;

    const title = document.getElementById('idea-edit-title').value.trim();
    if (!title) { showToast('Title cannot be empty', 'error'); return; }

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
    showToast('Saved', 'success');
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.remove('active');
}

// ============================================================
// FOCUS
// ============================================================

// Called from Work on It expanded card
async function setFocus(ideaId) {
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
    showToast('Focus set: ' + idea.title, 'success');
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
    const input = document.getElementById('next-action-input-' + ideaId);
    const val   = input?.value.trim();
    if (!val) { showToast('Next action cannot be empty', 'error'); return; }

    const idea = state.vault.find(v => v.id === ideaId);
    if (!idea) return;
    idea.nextAction = val;
    if (state.focus.ideaId === ideaId) state.focus.nextAction = val;

    await saveState();
    showToast('Next action updated', 'success');
}

// ============================================================
// WORK LOG
// ============================================================

async function logProgress(ideaId) {
    const textarea = document.getElementById('work-log-input-' + ideaId);
    const note     = textarea?.value.trim();
    if (!note) { showToast('Write what you did first', 'error'); return; }

    const idea = state.vault.find(v => v.id === ideaId);
    if (!idea) return;

    if (!idea.workLog) idea.workLog = [];
    idea.workLog.push({ date: todayISO(), note });

    await saveState();
    if (textarea) textarea.value = '';
    renderWorkList();
    showToast('Progress logged', 'success');
}

// ============================================================
// PLAYBOOK
// ============================================================

// ============================================================
// EVENING / DAY CLOSE
// ============================================================

async function closeDay() {
    if (state.dayLocked) return;

    const textarea   = document.getElementById('evening-reflection-textarea');
    const reflection = textarea?.value.trim() || '';

    if (!reflection) {
        showToast('Write one thing before closing the day', 'error');
        return;
    }

    const today = todayISO();

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
    showToast('+18 pts — Day closed. Good work.', 'success');
}

async function unlockDay() {
    state.dayLocked = false;
    await saveState();
    applyLockedState();
    showToast('Day unlocked', 'info');
}

function applyLockedState() {
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
        if (eveningHeading) eveningHeading.textContent  = 'Day is closed.';
        if (karmaDisplay)   karmaDisplay.textContent    = 'Today is complete';
        if (karmaPill)      karmaPill.style.display     = 'none';
        if (closeDayBtn)  { closeDayBtn.disabled = true;  closeDayBtn.style.opacity  = '0.4'; }
        if (unlockBtn)      unlockBtn.style.display     = 'block';
        if (backBtn)      { backBtn.disabled = true;      backBtn.style.opacity      = '0.3'; backBtn.style.cursor = 'not-allowed'; }

        // Home screen
        if (homeBanner)     homeBanner.style.display    = 'block';
        if (homeBannerKarma) {
            const earned = state.karma - (state.karmaAtDayStart ?? state.karma);
            homeBannerKarma.textContent = earned + ' karma earned today';
        }
        if (morningCard)    morningCard.style.opacity   = '0.45';
    } else {
        // Evening screen
        if (eveningHeading) eveningHeading.textContent  = 'Good work. What are you taking into tomorrow?';
        if (karmaDisplay) {
            const earned = state.karma - (state.karmaAtDayStart ?? state.karma);
            karmaDisplay.textContent = earned + ' karma earned today';
        }
        if (karmaPill)      karmaPill.style.display     = 'inline-block';
        if (closeDayBtn)  { closeDayBtn.disabled = false; closeDayBtn.style.opacity  = '1'; }
        if (unlockBtn)      unlockBtn.style.display     = 'none';
        if (backBtn)      { backBtn.disabled = false;     backBtn.style.opacity      = '1'; backBtn.style.cursor = 'pointer'; }

        // Home screen
        if (homeBanner)     homeBanner.style.display    = 'none';
        if (morningCard)    morningCard.style.opacity   = '1';
    }
}

function attachReflectionToIdea() {
    _attachDecision = true;
    const section = document.getElementById('evening-attach-section');
    if (section) section.style.display = 'none';
    showToast('Will attach when you close the day', 'info');
}

function skipAttachment() {
    _attachDecision = false;
    const section = document.getElementById('evening-attach-section');
    if (section) section.style.display = 'none';
}

// ============================================================
// EXPORT / IMPORT
// ============================================================

function exportVault() {
    const data = {
        exported:     todayISO(),
        karma:        state.karma,
        vault:        state.vault,
        playbook:     state.playbook,
        reflections:  state.reflections,
        lastBootDate: state.lastBootDate
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'ctml-vault-' + data.exported + '.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Vault exported', 'success');
}

async function importVault(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!Array.isArray(data.vault)) throw new Error('Invalid format');

            state.vault = data.vault.map(idea => ({ workLog: [], ...idea }));
            if (Array.isArray(data.reflections)) state.reflections = data.reflections;
            if (typeof data.karma === 'number' && !isNaN(data.karma)) state.karma = data.karma;
            if (data.lastBootDate !== undefined) state.lastBootDate = data.lastBootDate;

            await saveState();
            renderAll();
            showToast('Imported — ' + state.vault.length + ' ideas loaded', 'success');
        } catch (err) {
            showToast('Import failed: invalid file', 'error');
        }
        event.target.value = '';
    };
    reader.readAsText(file);
}

// ============================================================
// UTILITY
// ============================================================

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
// INIT
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    document.getElementById('morning-date').textContent = dateStr;
    document.getElementById('evening-date').textContent = dateStr;
    document.getElementById('evening-time').textContent = 'Evening';

    await loadState();
    renderAll();
});

// Persistence Sentinel: force-save when tab is hidden (browser switch, close, Alt+Tab)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveState();
});

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 's') {
        const captureScreen = document.getElementById('screen-capture');
        if (captureScreen?.classList.contains('active')) {
            e.preventDefault();
            saveIdea();
        }
    }
    if (e.key === 'Escape') closeEditModal();
});
