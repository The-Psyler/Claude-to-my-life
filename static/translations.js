/* ============================================================
   CTML — Translations (EN / HU)
   ============================================================ */

// eslint-disable-next-line no-unused-vars
const translations = {

  en: {
    // ── Navigation ──
    nav_home: 'Home',
    nav_vault: 'Vault',
    nav_settings: 'Settings',

    // ── Home screen ──
    home_title: 'What are we doing?',
    home_subtitle: 'Pick a mode and let\'s go.',
    home_focus_label: 'Today\'s focus',
    home_day_complete: 'Day complete',
    home_unlock: 'Unlock day →',
    home_morning: 'Morning boot',
    home_morning_hint: 'Set your focus for the day',
    home_capture: 'Capture idea',
    home_capture_hint: 'Log it before it disappears',
    home_work: 'Work on it',
    home_work_hint: 'Pick an idea and make progress',
    home_evening: 'Evening wrap',
    home_evening_hint: 'Close the day, bank the karma',

    // ── Morning Boot ──
    morning_title: 'Good morning. One thing today.',
    morning_yesterday: 'Yesterday\'s focus',
    morning_focus_label: 'What\'s your focus today?',
    morning_placeholder: 'Type it, or pick from your vault below...',
    morning_pick_vault: 'Or pick from vault',
    morning_ideas: 'ideas',
    morning_active: 'active',
    morning_waiting: 'waiting',
    morning_karma: 'karma',
    morning_start: 'Start the day',

    // ── Capture ──
    capture_title: 'What\'s the idea?',
    capture_subtitle: 'Name it. The rest can wait.',
    capture_placeholder: 'Give it a name...',
    capture_note_placeholder: 'One sentence is enough.',
    capture_save: 'Save to Vault',
    capture_quick: 'Just save the name →',

    // ── Work on It ──
    work_title: 'What are we working on?',
    work_subtitle: 'Pick an idea and set it as today\'s focus.',
    work_focus_label: '● focus',
    work_no_progress: 'No progress logged yet.',
    work_category: 'Category',
    work_next_action: 'Next action',
    work_next_placeholder: 'What\'s the next action?',
    work_update_next: 'Update next action',
    work_is_focus: 'Today\'s focus ✓',
    work_set_focus: 'This is today\'s focus →',
    work_progress_log: 'Progress log',
    work_progress_placeholder: 'What did you do? What did you learn?',
    work_log_progress: 'Log progress',
    work_branches_label: 'Branches',
    work_add_branch: 'Add branch',
    work_branch_placeholder: 'Branch name...',
    work_no_branches: 'No branches yet',
    work_kind_log: 'Progress',
    work_kind_spark: 'Spark',

    // ── Evening Wrap ──
    evening_title: 'Good work. What are you taking into tomorrow?',
    evening_moved: 'What moved today',
    evening_reflection_placeholder: 'One thing, or a few words. Whatever feels true.',
    evening_past: 'Past reflections',
    evening_attach_question: 'Attach this reflection to',
    evening_attach_yes: 'Yes, attach it',
    evening_attach_no: 'No thanks',
    evening_karma_earned: 'karma earned today',
    evening_locked: 'Day is locked — need to add something? Unlock it →',
    evening_close: 'Close the day',
    evening_day_closed: 'Day is closed.',
    evening_today_complete: 'Today is complete',

    // ── Vault ──
    vault_title: 'Vault',
    vault_col_num: '#',
    vault_col_title: 'Title',
    vault_col_state: 'State',
    vault_col_note: 'Last note',
    vault_col_date: 'Date',

    // ── Edit modal ──
    edit_title: 'Edit idea',
    edit_placeholder_title: 'Title',
    edit_state: 'State',
    edit_state_new: 'New',
    edit_state_active: 'Active',
    edit_state_future: 'Future',
    edit_state_hold: 'On Hold',
    edit_potential: 'Potential',
    edit_potential_low: 'Low potential',
    edit_potential_med: 'Medium potential',
    edit_potential_high: 'High potential',
    edit_next_action: 'Next action',

    // ── Idea Detail ──
    detail_work_log: 'Work log',
    detail_no_log: 'No work log yet. Use "Work on it" to add entries.',
    detail_captured: 'Captured',

    // ── Settings ──
    settings_title: 'Settings',
    settings_language: 'Language',
    settings_theme: 'Theme',
    settings_toggle_theme: 'Toggle light / dark',
    settings_data: 'Data',
    settings_reset: 'Reset all data',
    settings_about: 'About',
    settings_version: 'Version',

    // ── Reset modal ──
    reset_title: 'Reset all data?',
    reset_warning: 'This will permanently delete all ideas, reflections, karma, and settings. This cannot be undone.',
    reset_confirm: 'Delete everything',

    // ── Buttons (shared) ──
    btn_back: 'Back',
    btn_save: 'Save',
    btn_cancel: 'Cancel',
    btn_edit: 'Edit',

    // ── Toasts ──
    toast_save_failed: 'Save failed',
    toast_load_failed: 'Could not load saved data',
    toast_no_ideas: 'No ideas yet — capture one first.',
    toast_nothing_logged: 'Nothing logged yet today',
    toast_no_reflections: 'No past reflections yet.',
    toast_day_already: 'Day already started',
    toast_day_started: '+5 karma — Day started!',
    toast_enter_title: 'Please enter a title',
    toast_saved_full: '+8 pts — Saved to Vault',
    toast_saved_quick: '+3 pts — Saved to Vault',
    toast_deleted: 'Deleted',
    toast_title_empty: 'Title cannot be empty',
    toast_idea_saved: 'Saved',
    toast_focus_set: 'Focus set',
    toast_next_empty: 'Next action cannot be empty',
    toast_next_updated: 'Next action updated',
    toast_write_first: 'Write what you did first',
    toast_progress_logged: 'Progress logged',
    toast_write_reflection: 'Write one thing before closing the day',
    toast_day_closed: '+18 pts — Day closed. Good work.',
    toast_day_unlocked: 'Day unlocked',
    toast_will_attach: 'Will attach when you close the day',
    toast_new_day: 'New day detected — refresh to start fresh',

    // ── Dynamic labels ──
    label_focus: 'Focus',
    label_captured: 'Captured',
    label_worked_on: 'Worked on',
    label_next: 'Next',
    label_pts: 'pts',
    label_karma: 'karma',
  },

  hu: {
    // ── Navigáció ──
    nav_home: 'Kezdőlap',
    nav_vault: 'Trezor',
    nav_settings: 'Beállítások',

    // ── Kezdőlap ──
    home_title: 'Mit csinálunk?',
    home_subtitle: 'Válassz egy módot és kezdjünk!',
    home_focus_label: 'Mai fókusz',
    home_day_complete: 'A nap kész',
    home_unlock: 'Nap feloldása →',
    home_morning: 'Reggeli indítás',
    home_morning_hint: 'Állítsd be a napi fókuszod',
    home_capture: 'Ötlet rögzítése',
    home_capture_hint: 'Írd le, mielőtt elfelejtened',
    home_work: 'Dolgozz rajta',
    home_work_hint: 'Válassz egy ötletet és haladj',
    home_evening: 'Esti lezárás',
    home_evening_hint: 'Zárd le a napot, gyűjts karmát',

    // ── Reggeli indítás ──
    morning_title: 'Jó reggelt! Egy dolog mára.',
    morning_yesterday: 'Tegnapi fókusz',
    morning_focus_label: 'Mi a mai fókuszod?',
    morning_placeholder: 'Írd be, vagy válassz a trezorból...',
    morning_pick_vault: 'Vagy válassz a trezorból',
    morning_ideas: 'ötlet',
    morning_active: 'aktív',
    morning_waiting: 'várakozó',
    morning_karma: 'karma',
    morning_start: 'Nap indítása',

    // ── Ötlet rögzítése ──
    capture_title: 'Mi az ötlet?',
    capture_subtitle: 'Adj neki nevet. A többi ráér.',
    capture_placeholder: 'Adj neki egy nevet...',
    capture_note_placeholder: 'Egy mondat elég.',
    capture_save: 'Mentés a Trezorba',
    capture_quick: 'Csak a nevet mentsd →',

    // ── Dolgozz rajta ──
    work_title: 'Min dolgozunk?',
    work_subtitle: 'Válassz egy ötletet és állítsd be fókusznak.',
    work_focus_label: '● fókusz',
    work_no_progress: 'Még nincs haladás rögzítve.',
    work_category: 'Kategória',
    work_next_action: 'Következő lépés',
    work_next_placeholder: 'Mi a következő lépés?',
    work_update_next: 'Következő lépés frissítése',
    work_is_focus: 'Ma ez a fókusz ✓',
    work_set_focus: 'Legyen ez a mai fókusz →',
    work_progress_log: 'Haladási napló',
    work_progress_placeholder: 'Mit csináltál? Mit tanultál?',
    work_log_progress: 'Haladás rögzítése',
    work_branches_label: 'Ágak',
    work_add_branch: 'Ág hozzáadása',
    work_branch_placeholder: 'Ág neve...',
    work_no_branches: 'Még nincs ág',
    work_kind_log: 'Haladás',
    work_kind_spark: 'Szikra',

    // ── Esti lezárás ──
    evening_title: 'Szép munka! Mit viszel tovább holnapra?',
    evening_moved: 'Mi történt ma',
    evening_reflection_placeholder: 'Egy gondolat, pár szó. Ami igaz.',
    evening_past: 'Korábbi reflexiók',
    evening_attach_question: 'Csatolod ezt a reflexiót ehhez:',
    evening_attach_yes: 'Igen, csatolom',
    evening_attach_no: 'Nem, köszi',
    evening_karma_earned: 'karma ma',
    evening_locked: 'Nap lezárva — hozzá akarsz adni? Feloldás →',
    evening_close: 'Nap lezárása',
    evening_day_closed: 'A nap lezárva.',
    evening_today_complete: 'A mai nap kész',

    // ── Trezor ──
    vault_title: 'Trezor',
    vault_col_num: '#',
    vault_col_title: 'Cím',
    vault_col_state: 'Állapot',
    vault_col_note: 'Utolsó jegyzet',
    vault_col_date: 'Dátum',

    // ── Szerkesztés modal ──
    edit_title: 'Ötlet szerkesztése',
    edit_placeholder_title: 'Cím',
    edit_state: 'Állapot',
    edit_state_new: 'Új',
    edit_state_active: 'Aktív',
    edit_state_future: 'Jövőbeli',
    edit_state_hold: 'Várakozik',
    edit_potential: 'Potenciál',
    edit_potential_low: 'Alacsony',
    edit_potential_med: 'Közepes',
    edit_potential_high: 'Magas',
    edit_next_action: 'Következő lépés',

    // ── Ötlet részletek ──
    detail_work_log: 'Munkanapló',
    detail_no_log: 'Még nincs munkanapló. Használd a "Dolgozz rajta" gombot.',
    detail_captured: 'Rögzítve',

    // ── Beállítások ──
    settings_title: 'Beállítások',
    settings_language: 'Nyelv',
    settings_theme: 'Téma',
    settings_toggle_theme: 'Világos / sötét váltás',
    settings_data: 'Adatok',
    settings_reset: 'Összes adat törlése',
    settings_about: 'Névjegy',
    settings_version: 'Verzió',

    // ── Törlés modal ──
    reset_title: 'Összes adat törlése?',
    reset_warning: 'Ez véglegesen töröl minden ötletet, reflexiót, karmát és beállítást. Ez nem visszavonható.',
    reset_confirm: 'Mindent törlök',

    // ── Gombok (közös) ──
    btn_back: 'Vissza',
    btn_save: 'Mentés',
    btn_cancel: 'Mégse',
    btn_edit: 'Szerkesztés',

    // ── Toast üzenetek ──
    toast_save_failed: 'Mentés sikertelen',
    toast_load_failed: 'Nem sikerült betölteni a mentett adatokat',
    toast_no_ideas: 'Még nincsenek ötletek — rögzíts egyet!',
    toast_nothing_logged: 'Ma még nincs rögzített haladás',
    toast_no_reflections: 'Még nincsenek reflexiók.',
    toast_day_already: 'A nap már elindult',
    toast_day_started: '+5 karma — Nap elindítva!',
    toast_enter_title: 'Adj meg egy címet',
    toast_saved_full: '+8 pont — Mentve a Trezorba',
    toast_saved_quick: '+3 pont — Mentve a Trezorba',
    toast_deleted: 'Törölve',
    toast_title_empty: 'A cím nem lehet üres',
    toast_idea_saved: 'Mentve',
    toast_focus_set: 'Fókusz beállítva',
    toast_next_empty: 'A következő lépés nem lehet üres',
    toast_next_updated: 'Következő lépés frissítve',
    toast_write_first: 'Írd le először, mit csináltál',
    toast_progress_logged: 'Haladás rögzítve',
    toast_write_reflection: 'Írj le egy gondolatot a nap lezárása előtt',
    toast_day_closed: '+18 pont — Nap lezárva. Szép munka!',
    toast_day_unlocked: 'Nap feloldva',
    toast_will_attach: 'Csatolva lesz a nap lezárásakor',
    toast_new_day: 'Új nap érkezett — frissíts az induláshoz',

    // ── Dinamikus címkék ──
    label_focus: 'Fókusz',
    label_captured: 'Rögzítve',
    label_worked_on: 'Dolgozott rajta',
    label_next: 'Következő',
    label_pts: 'pont',
    label_karma: 'karma',
  }
};
