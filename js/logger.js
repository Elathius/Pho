/* ============================================
   LOGGER MODULE
   Tracks all user interactions and sends to
   a configurable endpoint.
   ============================================ */

const Logger = (() => {
  // ---- CONFIGURATION ----
  const ENDPOINT = 'https://script.google.com/macros/s/AKfycbxJ08VtF5NIXNgJui1yIssN4YqVvTtAgqFyNrtssRQMJVD5Yx8VNgWQRlG7b_nWFyMgQw/exec';

  // ---- STATE ----
  let sessionId = '';
  let startTimestamp = null;
  let currentScreen = null;
  let screenEnterTime = null;
  const hoverTrackers = {};
  const clickLog = []; // stores all click events

  const log = {
    session_id: '',
    start_timestamp: '',
    end_timestamp: '',
    completion_status: 'abandoned',
    total_duration_seconds: 0,
    screens: {
      welcome:       { time_spent_seconds: 0 },
      front_page:    { visit_count: 0, visits: [], decline_attempts: 0 },
      intro:         { time_spent_seconds: 0 },
      control_quiz:  { visit_count: 0, visits: [] },
      date_picker:   { visit_count: 0, visits: [] },
      success_screen:{ time_spent_seconds: 0 },
      planning_quiz: { visit_count: 0, visits: [] },
      gift_intro:    { time_spent_seconds: 0 },
      card_gallery:  { time_spent_seconds: 0, cards_viewed: [], time_before_continue_seconds: 0 },
      farewell:      { time_spent_seconds: 0 },
      feedback:      { time_spent_seconds: 0, option_hovers: {}, selected: null, time_before_selection_seconds: 0 },
      final_screen:  { time_spent_seconds: 0 }
    },
    accepted_date: null,    // which date was ultimately accepted
    thursday_dodge_count: 0,
    clicks: [],             // all click events
    navigation: {
      back_button_clicks: [],
      screen_revisit_count: {},
      total_back_clicks: 0
    },
    summary: {}
  };

  let currentVisit = {};

  function generateId() {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  }

  function now() {
    return new Date().toISOString();
  }

  function elapsed(from) {
    return Math.round((Date.now() - from) / 100) / 10;
  }

  // ---- PUBLIC API ----

  function initSession() {
    sessionId = generateId();
    startTimestamp = Date.now();
    log.session_id = sessionId;
    log.start_timestamp = now();
    console.log('[Logger] Session started:', sessionId);
  }

  function logScreenEnter(screenName) {
    if (currentScreen && screenEnterTime) {
      _closeScreenTime(currentScreen);
    }
    currentScreen = screenName;
    screenEnterTime = Date.now();
    currentVisit = { visit_number: 0, enter_time: Date.now() };

    const screenData = log.screens[screenName];
    if (screenData && typeof screenData.visit_count === 'number') {
      screenData.visit_count++;
      currentVisit.visit_number = screenData.visit_count;
    }
    console.log('[Logger] Screen enter:', screenName);
  }

  function _closeScreenTime(screenName) {
    const seconds = elapsed(screenEnterTime);
    const screenData = log.screens[screenName];

    if (!screenData) {
      // Screen not in predefined structure — store dynamically
      log.screens[screenName] = { time_spent_seconds: seconds };
      return;
    }

    if (screenData.visits) {
      currentVisit.time_spent_seconds = seconds;
      screenData.visits.push({ ...currentVisit });
    } else {
      screenData.time_spent_seconds = (screenData.time_spent_seconds || 0) + seconds;
    }
  }

  function logHoverStart(elementKey) {
    if (!hoverTrackers[elementKey]) {
      hoverTrackers[elementKey] = { start: null, totalMs: 0, count: 0 };
    }
    hoverTrackers[elementKey].start = Date.now();
    hoverTrackers[elementKey].count++;
  }

  function logHoverEnd(elementKey) {
    const tracker = hoverTrackers[elementKey];
    if (tracker && tracker.start) {
      tracker.totalMs += Date.now() - tracker.start;
      tracker.start = null;
    }
  }

  function getHoverData(elementKey) {
    const tracker = hoverTrackers[elementKey];
    if (!tracker) return { total_time_seconds: 0, hover_count: 0 };
    return {
      total_time_seconds: Math.round(tracker.totalMs / 100) / 10,
      hover_count: tracker.count
    };
  }

  function logClick(elementKey) {
    const entry = { element: elementKey, timestamp: now() };
    log.clicks.push(entry);
    console.log('[Logger] Click:', elementKey, 'at', entry.timestamp);
  }

  function logSelection(screenName, question, answer) {
    console.log('[Logger] Selection:', screenName, question, '=', answer);
    if (currentVisit) {
      currentVisit[question] = answer;
    }
  }

  function logDateAttempt(date, result, insistCount) {
    const screenData = log.screens.date_picker;
    const lastVisit = screenData.visits[screenData.visits.length - 1] || currentVisit;
    if (!lastVisit.dates_attempted) lastVisit.dates_attempted = [];
    lastVisit.dates_attempted.push({
      date,
      click_timestamp: now(),
      result,
      insist_attempts: insistCount || 0
    });
  }

  function logAcceptedDate(date) {
    log.accepted_date = date;
  }

  function logThursdayDodges(count) {
    log.thursday_dodge_count = count;
  }

  function logDeclineAttempt(count) {
    log.screens.front_page.decline_attempts = count;
  }

  function logControlSelection(option, hoverData) {
    currentVisit.selected = option;
    currentVisit.time_before_selection_seconds = elapsed(screenEnterTime);
    currentVisit.option_hovers = hoverData;
  }

  function logPlanningAnswers(answers) {
    currentVisit.answers = answers;
  }

  function logPlanningTextInput(text, typingTimeSeconds) {
    currentVisit.special_request_text = text;
    currentVisit.special_request_typing_seconds = typingTimeSeconds;
    currentVisit.special_request_blank = !text || text.trim() === '';
  }

  function logCardView(cardName) {
    const screenData = log.screens.card_gallery;
    if (!screenData.cards_viewed.includes(cardName)) {
      screenData.cards_viewed.push(cardName);
    }
  }

  function logFeedbackSelection(feedback, hoverData) {
    log.screens.feedback.selected = feedback;
    log.screens.feedback.option_hovers = hoverData;
    log.screens.feedback.time_before_selection_seconds = elapsed(screenEnterTime);
  }

  function logBackNavigation(fromScreen, toScreen) {
    log.navigation.back_button_clicks.push({
      from: fromScreen,
      to: toScreen,
      timestamp: now()
    });
    log.navigation.total_back_clicks++;
    log.navigation.screen_revisit_count[toScreen] = (log.navigation.screen_revisit_count[toScreen] || 0) + 1;
  }

  function completeSession() {
    if (currentScreen && screenEnterTime) {
      _closeScreenTime(currentScreen);
    }

    log.end_timestamp = now();
    log.completion_status = 'completed';
    log.total_duration_seconds = elapsed(startTimestamp);
    log.summary = _buildSummary();

    console.log('[Logger] Session completed');
    console.log('[Logger] Full log:', JSON.stringify(log, null, 2));
    console.log('[Logger] Human-readable:\n' + generateHumanReadableLog());

    sendLog();
  }

  function _buildSummary() {
    // Determine the selected date
    const dateScreen = log.screens.date_picker;
    let selectedDate = log.accepted_date || 'unknown';
    let dateMethod = 'unknown';
    if (dateScreen.visits.length > 0) {
      const lastVisit = dateScreen.visits[dateScreen.visits.length - 1];
      if (lastVisit.dates_attempted) {
        const successful = lastVisit.dates_attempted.find(d => d.result === 'success');
        const insisted = lastVisit.dates_attempted.find(d => d.result === 'accepted_after_insist');
        if (successful) {
          selectedDate = successful.date;
          dateMethod = 'direct';
        } else if (insisted) {
          selectedDate = insisted.date;
          dateMethod = 'insisted';
        }
      }
    }

    // Planning answers
    const planningVisits = log.screens.planning_quiz.visits;
    const planningAnswers = planningVisits.length > 0 ? planningVisits[planningVisits.length - 1].answers : {};

    // Control selection
    const controlVisits = log.screens.control_quiz.visits;
    const controlSelection = controlVisits.length > 0 ? controlVisits[controlVisits.length - 1].selected : null;

    // Capitalize date name
    const dateName = selectedDate.charAt(0).toUpperCase() + selectedDate.slice(1);

    return {
      total_screens_visited: Object.values(log.screens).filter(s =>
        (s.visit_count && s.visit_count > 0) || (s.time_spent_seconds && s.time_spent_seconds > 0)
      ).length,
      completion_percentage: log.completion_status === 'completed' ? 100 : 0,
      total_duration_seconds: log.total_duration_seconds,
      selected_date: dateName,
      date_selection_method: dateMethod,
      control_selection: controlSelection,
      planning_answers: planningAnswers,
      feedback: log.screens.feedback.selected,
      decline_attempts: log.screens.front_page.decline_attempts,
      thursday_dodges: log.thursday_dodge_count,
      cards_viewed: log.screens.card_gallery.cards_viewed,
      total_clicks: log.clicks.length,
      total_back_clicks: log.navigation.total_back_clicks
    };
  }

  function generateHumanReadableLog() {
    const s = log.summary;
    const lines = [];
    lines.push('=== DINNER INVITATION SESSION ===');
    lines.push('Session: ' + log.session_id);
    lines.push('Started: ' + log.start_timestamp);
    lines.push('Ended: ' + log.end_timestamp);
    lines.push('Duration: ' + log.total_duration_seconds + 's');
    lines.push('Status: ' + log.completion_status);
    lines.push('');
    lines.push('--- JOURNEY ---');
    lines.push('Decline attempts: ' + (s.decline_attempts || 0));
    lines.push('Control selection: ' + (s.control_selection || 'none'));
    lines.push('Selected date: ' + (s.selected_date || 'none') + ' (' + (s.date_selection_method || '') + ')');
    lines.push('Thursday dodges: ' + (s.thursday_dodges || 0));
    if (s.planning_answers) {
      lines.push('Planning: ' + JSON.stringify(s.planning_answers));
    }
    lines.push('Cards viewed: ' + (s.cards_viewed ? s.cards_viewed.join(', ') : 'none'));
    lines.push('Feedback: ' + (s.feedback || 'none'));
    lines.push('');
    lines.push('--- NAVIGATION ---');
    lines.push('Back clicks: ' + log.navigation.total_back_clicks);
    lines.push('Total clicks: ' + log.clicks.length);
    if (log.navigation.back_button_clicks.length > 0) {
      log.navigation.back_button_clicks.forEach(n => {
        lines.push('  ' + n.from + ' -> ' + n.to + ' at ' + n.timestamp);
      });
    }
    lines.push('');
    lines.push('--- FULL DATA ---');
    lines.push(JSON.stringify(log.screens, null, 2));
    return lines.join('\n');
  }

  function sendLog() {
    if (!ENDPOINT) {
      console.log('[Logger] No endpoint configured. Log saved to console only.');
      return;
    }
    fetch(ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(log)
    }).then(() => {
      console.log('[Logger] Log sent.');
    }).catch(err => {
      console.warn('[Logger] Failed to send log:', err);
      try {
        const queued = JSON.parse(localStorage.getItem('log_queue') || '[]');
        queued.push(log);
        localStorage.setItem('log_queue', JSON.stringify(queued));
      } catch (e) { /* ignore */ }
    });
  }

  function getLog() {
    return log;
  }

  return {
    initSession,
    logScreenEnter,
    logHoverStart,
    logHoverEnd,
    getHoverData,
    logClick,
    logSelection,
    logDateAttempt,
    logAcceptedDate,
    logThursdayDodges,
    logDeclineAttempt,
    logControlSelection,
    logPlanningAnswers,
    logPlanningTextInput,
    logCardView,
    logFeedbackSelection,
    logBackNavigation,
    completeSession,
    generateHumanReadableLog,
    sendLog,
    getLog
  };
})();
