/* ============================================
   MAIN APPLICATION
   Screen navigation and all interaction logic.
   ============================================ */

(function () {
  'use strict';

  // ---- SCREEN MAP ----
  const SCREEN_MAP = {
    welcome:  'screen-welcome',
    front:      'screen-front',
    intro:      'screen-intro',
    control:    'screen-control',
    dates:      'screen-dates',
    success:    'screen-success',
    planning:   'screen-planning',
    giftintro:  'screen-gift-intro',
    cards:      'screen-cards',
    farewell:   'screen-farewell',
    feedback:   'screen-feedback',
    final:      'screen-final'
  };

  // Logger screen name mapping
  const LOG_SCREEN = {
    welcome:  'welcome',
    front:      'front_page',
    intro:      'intro',
    control:    'control_quiz',
    dates:      'date_picker',
    success:    'success_screen',
    planning:   'planning_quiz',
    giftintro:  'gift_intro',
    cards:      'card_gallery',
    farewell:   'farewell',
    feedback:   'feedback',
    final:      'final_screen'
  };

  let currentScreenKey = 'welcome';

  // ---- STATE ----
  const state = {
    controlSelection: null,
    thursdayDodges: 0,
    thursdayDone: false,
    dateInsistCounts: { wednesday: 0, friday: 0, sunday: 0 },
    planningAnswers: {},
    specialRequest: '',
    feedbackSelection: null,
    textInputStart: null
  };

  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  // ============================================
  // NAVIGATION
  // ============================================

  function showScreen(key) {
    const prevKey = currentScreenKey;
    // Deactivate all screens
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    // Activate target
    const target = document.getElementById(SCREEN_MAP[key]);
    if (target) {
      target.classList.add('active');
    }
    currentScreenKey = key;
    Logger.logScreenEnter(LOG_SCREEN[key]);
  }

  // ---- BACK BUTTONS ----
  document.querySelectorAll('.btn-back').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.back;
      if (target) {
        Logger.logBackNavigation(LOG_SCREEN[currentScreenKey], LOG_SCREEN[target]);
        showScreen(target);
      }
    });
  });

  // ============================================
  // HOVER TRACKING HELPER
  // ============================================

  function trackHovers(elements, keyPrefix) {
    elements.forEach(el => {
      const key = keyPrefix + '_' + (el.dataset.option || el.dataset.date || el.dataset.value || el.dataset.feedback || el.dataset.card || 'unknown');
      el.addEventListener('mouseenter', () => Logger.logHoverStart(key));
      el.addEventListener('mouseleave', () => Logger.logHoverEnd(key));
    });
  }

  // ============================================
  // SCREEN 1: FRONT PAGE
  // ============================================

  function initFrontPage() {
    Chibi.register('chibi-front');
    Chibi.setExpression('chibi-front', 'knight');

    const btnAccept = document.getElementById('btn-accept');
    const btnDecline = document.getElementById('btn-decline');

    btnAccept.addEventListener('mouseenter', () => Logger.logHoverStart('accept_button'));
    btnAccept.addEventListener('mouseleave', () => Logger.logHoverEnd('accept_button'));
    btnDecline.addEventListener('mouseenter', () => Logger.logHoverStart('decline_button'));
    btnDecline.addEventListener('mouseleave', () => Logger.logHoverEnd('decline_button'));

    btnAccept.addEventListener('click', () => {
      Logger.logClick('accept_button');
      showScreen('intro');
    });

    // Decline: chibi gets sad, button shakes, then text changes
    let declineCount = 0;
    btnDecline.addEventListener('click', () => {
      declineCount++;
      Logger.logClick('decline_button_' + declineCount);
      Logger.logDeclineAttempt(declineCount);
      Chibi.setExpression('chibi-front', 'crying');
      btnDecline.style.animation = 'shake 0.4s ease';
      setTimeout(() => { btnDecline.style.animation = ''; }, 400);

      if (declineCount === 1) {
        btnDecline.textContent = 'Are you sure?';
      } else if (declineCount === 2) {
        btnDecline.textContent = 'Really? :(';
      } else {
        btnDecline.textContent = 'Too bad, no choice';
        setTimeout(() => {
          Chibi.setExpression('chibi-front', 'knight');
          showScreen('intro');
        }, 800);
      }
    });
  }

  // ============================================
  // SCREEN 1B: INTRO
  // ============================================

  function initIntro() {
    Chibi.register('chibi-intro');
    Chibi.setExpression('chibi-intro', 'happy');

    document.getElementById('btn-intro-continue').addEventListener('click', () => {
      Logger.logClick('intro_continue');
      showScreen('control');
    });
  }

  // ============================================
  // SCREEN 2: CONTROL QUIZ
  // ============================================

  function initControlQuiz() {
    Chibi.register('chibi-control');
    const optionsGrid = document.getElementById('control-options');
    const options = document.querySelectorAll('#control-options .option-card');
    const resultBox = document.getElementById('control-result');
    const resultText = document.getElementById('control-result-text');
    const btnSoundsGood = document.getElementById('btn-sounds-good');

    trackHovers(options, 'control');

    const CHOICE_LABELS = {
      talking_topics: 'Talking topics',
      menu_items: 'Menu items we order',
      drive_location: 'Drive anywhere location',
      dessert: 'Dessert decisions',
      post_dinner: 'Post-dinner activity'
    };

    options.forEach(card => {
      card.addEventListener('click', () => {
        // Remove previous selection
        options.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        state.controlSelection = card.dataset.option;

        const label = CHOICE_LABELS[card.dataset.option] || card.dataset.option;
        resultText.textContent = 'Deal! You\'ve got full control over ' + label + '. I\'ll handle everything else \u{1F60A}';

        // Hide options, show result
        optionsGrid.classList.add('hidden');
        resultBox.classList.remove('hidden');
        Chibi.setExpression('chibi-control', 'happy');

        // Collect hover data
        const hoverData = {};
        options.forEach(o => {
          hoverData[o.dataset.option] = Logger.getHoverData('control_' + o.dataset.option);
        });
        Logger.logControlSelection(CHOICE_LABELS[card.dataset.option] || card.dataset.option, hoverData);
      });
    });

    btnSoundsGood.addEventListener('click', () => {
      Logger.logClick('sounds_good');
      showScreen('dates');
    });

    // If user navigates back, restore options grid
    const backBtn = document.querySelector('#screen-control .btn-back');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        optionsGrid.classList.remove('hidden');
        resultBox.classList.add('hidden');
      });
    }
  }

  // ============================================
  // SCREEN 3: DATE PICKER
  // ============================================

  function initDatePicker() {
    Chibi.register('chibi-dates');
    const dateGrid = document.getElementById('date-grid');
    const dateBtns = document.querySelectorAll('.date-btn');
    const rejectionPanel = document.getElementById('date-rejection');
    const rejectionMsg = document.getElementById('rejection-message');
    const rejectionBtns = document.getElementById('rejection-buttons');
    const dateQuote = document.getElementById('date-quote');

    // Excuse quotes shown under chibi on hover
    const DATE_QUOTES = {
      wednesday: '"Tomorrow?! I have a CS match!"',
      thursday:  '"Haha, nice try."',
      friday:    '"I\'ll be so exhausted..."',
      saturday:  '"This would be perfect..."',
      sunday:    '"Hmm... I guess it could work..."'
    };

    trackHovers(dateBtns, 'date');

    // Chibi reacts to date hovers + show excuse quote
    dateBtns.forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        Chibi.handleDateHover('chibi-dates', btn.dataset.date);
        dateQuote.textContent = DATE_QUOTES[btn.dataset.date] || '';
        dateQuote.classList.add('visible');
      });
      btn.addEventListener('mouseleave', () => {
        Chibi.resetToNeutral('chibi-dates');
        dateQuote.classList.remove('visible');
      });
    });

    // ---- DATE CLICK HANDLERS ----

    dateBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const date = btn.dataset.date;
        Logger.logClick('date_' + date);

        switch (date) {
          case 'saturday':
            handleSaturday();
            break;
          case 'wednesday':
            handleWednesday();
            break;
          case 'thursday':
            // Thursday is handled by dodge logic, not click
            break;
          case 'friday':
            handleFriday();
            break;
          case 'sunday':
            handleSunday();
            break;
        }
      });
    });

    // ---- THURSDAY: DODGE FOREVER (never clickable) ----

    const thursdayBtn = document.querySelector('[data-date="thursday"]');
    let thursdayDodging = false;

    // Place a spacer so removing Thursday from flow doesn't shift other buttons
    const thursdaySpacer = document.createElement('div');
    thursdaySpacer.style.display = 'none';
    thursdayBtn.parentNode.insertBefore(thursdaySpacer, thursdayBtn);

    function dodgeThursday() {
      if (thursdayDodging) return;
      thursdayDodging = true;
      state.thursdayDodges++;
      Chibi.setExpression('chibi-dates', 'mischievous');

      // On first dodge, take it out of flow and replace with spacer
      if (!thursdayBtn.dataset.dodging) {
        thursdayBtn.dataset.dodging = 'true';
        const rect = thursdayBtn.getBoundingClientRect();
        thursdaySpacer.style.display = 'block';
        thursdaySpacer.style.height = rect.height + 'px';
        thursdaySpacer.style.marginBottom = '12px';
        const screen = document.getElementById('screen-dates');
        thursdayBtn.style.position = 'fixed';
        thursdayBtn.style.width = rect.width + 'px';
        thursdayBtn.style.zIndex = '20';
        thursdayBtn.style.transition = 'left 0.3s ease, top 0.3s ease';
        screen.appendChild(thursdayBtn);
      }

      // Pick a random position away from current cursor area
      const margin = 60;
      const btnW = thursdayBtn.offsetWidth;
      const btnH = thursdayBtn.offsetHeight;
      const maxX = window.innerWidth - btnW - margin;
      const maxY = window.innerHeight - btnH - margin;
      const newX = margin + Math.random() * (maxX - margin);
      const newY = margin + Math.random() * (maxY - margin);

      thursdayBtn.style.left = newX + 'px';
      thursdayBtn.style.top = newY + 'px';

      Logger.logClick('thursday_dodge_' + state.thursdayDodges);
      Logger.logThursdayDodges(state.thursdayDodges);

      // Cooldown so it doesn't fire in a loop
      setTimeout(() => { thursdayDodging = false; }, 350);
    }

    thursdayBtn.addEventListener('mouseenter', dodgeThursday);

    // Block click entirely
    thursdayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
    });

    // Mobile: dodge on touch
    thursdayBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      dodgeThursday();
    }, { passive: false });

    // ---- SHARED: bribe then accept flow ----

    function bribeStep(date) {
      state.dateInsistCounts[date]++;
      showRejection(
        'worried',
        'What if I give you a printed pokemon-style free dare card if you reconsider?',
        [
          { text: 'Okay, I\'ll reconsider', style: 'btn-primary', action: resetDatePicker },
          { text: 'I still insist', style: 'btn-insist', action: () => { acceptDate(date); } }
        ]
      );
      Logger.logDateAttempt(date, 'bribed', state.dateInsistCounts[date]);
    }

    function acceptDate(date) {
      state.acceptedDate = date;
      Logger.logAcceptedDate(date);
      Logger.logDateAttempt(date, 'accepted_after_insist', state.dateInsistCounts[date]);
      showRejection(
        'neutral',
        'Okay, ' + date.charAt(0).toUpperCase() + date.slice(1) + ' it is! Let\'s make it happen.',
        [
          { text: 'Continue', style: 'btn-primary', action: () => { showScreen('planning'); } }
        ]
      );
    }

    // ---- WEDNESDAY ----

    function handleWednesday() {
      showRejection(
        'panicked',
        'But it\'s so close! So fast! No time to plan! I have a CS match! Tomorrow?!',
        [
          { text: 'Pick another day', style: 'btn-primary', action: resetDatePicker },
          { text: 'I insist!', style: 'btn-insist', action: () => { bribeStep('wednesday'); } }
        ]
      );
      Logger.logDateAttempt('wednesday', 'rejected', 0);
    }

    // ---- FRIDAY ----

    function handleFriday() {
      showRejection(
        'tired',
        'It\'s such a busy dayyyyy I\'ll be so exhausted...',
        [
          { text: 'Pick another day', style: 'btn-primary', action: resetDatePicker },
          { text: 'I insist!', style: 'btn-insist', action: () => { bribeStep('friday'); } }
        ]
      );
      Logger.logDateAttempt('friday', 'rejected', 0);
    }

    // ---- SUNDAY ----

    function handleSunday() {
      showRejection(
        'thinking',
        'Hmmmm... Sunday could work... but Saturday is actually way better for both of us, don\'t you think?',
        [
          { text: 'You\'re right, Saturday!', style: 'btn-primary', action: () => { resetDatePicker(); handleSaturday(); } },
          { text: 'No, Sunday works', style: 'btn-secondary', action: () => { bribeStep('sunday'); } }
        ]
      );
      Logger.logDateAttempt('sunday', 'rejected', 0);
    }

    // ---- SATURDAY ----

    function handleSaturday() {
      Logger.logAcceptedDate('saturday');
      Logger.logDateAttempt('saturday', 'success', 0);
      launchConfetti();
      Chibi.setExpression('chibi-dates', 'celebrating');
      setTimeout(() => {
        showScreen('success');
      }, 1200);
    }

    // ---- HELPERS ----

    function showRejection(expression, message, buttons) {
      // Hide the date grid, quote, and main chibi so rejection gets full view
      dateGrid.classList.add('hidden');
      dateQuote.style.display = 'none';
      document.getElementById('chibi-dates').classList.add('hidden');

      Chibi.register('chibi-rejection');
      Chibi.setExpression('chibi-rejection', expression);
      rejectionMsg.textContent = message;
      rejectionBtns.innerHTML = '';
      buttons.forEach(b => {
        const el = document.createElement('button');
        el.textContent = b.text;
        el.className = b.style;
        el.addEventListener('click', b.action);
        rejectionBtns.appendChild(el);
      });
      rejectionPanel.classList.remove('hidden');
    }

    function resetDatePicker() {
      rejectionPanel.classList.add('hidden');
      dateGrid.classList.remove('hidden');
      dateQuote.style.display = '';
      dateQuote.classList.remove('visible');
      document.getElementById('chibi-dates').classList.remove('hidden');
      Chibi.resetToNeutral('chibi-dates');
    }
  }

  // ============================================
  // SCREEN 4: SUCCESS
  // ============================================

  function initSuccess() {
    Chibi.register('chibi-success');
    Chibi.setExpression('chibi-success', 'celebrating');

    document.getElementById('btn-continue-success').addEventListener('click', () => {
      Logger.logClick('continue_success');
      showScreen('planning');
    });
  }

  // ============================================
  // SCREEN 5: PLANNING QUIZ
  // ============================================

  function initPlanningQuiz() {
    Chibi.register('chibi-planning');
    Chibi.setExpression('chibi-planning', 'happy');

    // Readable labels for log output
    const PLANNING_LABELS = {
      vibe: {
        dress_up: 'Royal court attire',
        smart_casual: "Adventurer's garb",
        casual: 'Tavern clothes'
      },
      food: {
        light_fresh: 'Nom & nom',
        comfort: 'yum :p',
        heavy: 'Chomp',
        spicy: 'NOM NOM CHOMP CHOMP GRRRRRRRRR'
      },
      timing: {
        early: 'Early dinner (6pm)',
        classic: 'Perfecto (7-8pm)',
        late: 'Cozy after-dark (9pm+)'
      },
      transport: {
        drive: 'My horsie',
        pick_up: 'Your horsie',
        meet: 'You on your horsie and me on my horsie'
      }
    };

    function readableValue(question, value) {
      return (PLANNING_LABELS[question] && PLANNING_LABELS[question][value]) || value;
    }

    const sections = document.querySelectorAll('.quiz-section[data-question]');
    const allOptions = document.querySelectorAll('.quiz-option');
    const textarea = document.getElementById('special-requests');
    const btnAllSet = document.getElementById('btn-all-set');

    trackHovers(allOptions, 'planning');

    // Option selection (one per section)
    sections.forEach(section => {
      const question = section.dataset.question;
      const options = section.querySelectorAll('.quiz-option');

      options.forEach(opt => {
        opt.addEventListener('click', () => {
          options.forEach(o => o.classList.remove('selected'));
          opt.classList.add('selected');
          state.planningAnswers[question] = opt.dataset.value;
          Logger.logSelection('planning_quiz', question, readableValue(question, opt.dataset.value));
        });
      });
    });

    // Text input tracking
    textarea.addEventListener('focus', () => {
      state.textInputStart = Date.now();
    });
    textarea.addEventListener('blur', () => {
      state.specialRequest = textarea.value;
    });

    btnAllSet.addEventListener('click', () => {
      state.specialRequest = textarea.value;

      // Log text input with typing time
      const typingTime = state.textInputStart ? Math.round((Date.now() - state.textInputStart) / 100) / 10 : 0;
      Logger.logPlanningTextInput(textarea.value, typingTime);

      // Translate answers to readable labels
      const answers = {};
      for (const q in state.planningAnswers) {
        answers[q] = readableValue(q, state.planningAnswers[q]);
      }
      if (textarea.value) {
        answers.special_request = textarea.value;
      }

      Logger.logPlanningAnswers(answers);
      Logger.logClick('all_set');
      showScreen('giftintro');
    });
  }

  // ============================================
  // SCREEN 6A: GIFT INTRO
  // ============================================

  function initGiftIntro() {
    // Typewriter with glow is triggered when screen becomes active
    let played = false;

    // Watch for this screen becoming active
    const observer = new MutationObserver(() => {
      const screen = document.getElementById('screen-gift-intro');
      if (screen.classList.contains('active') && !played) {
        played = true;
        playGiftIntro();
      }
    });
    observer.observe(document.getElementById('screen-gift-intro'), { attributes: true, attributeFilter: ['class'] });
  }

  function playGiftIntro() {
    const textEl = document.getElementById('gift-intro-text');
    const text = 'And now, for a little gift, i present thee';
    textEl.innerHTML = '';

    text.split('').forEach((char, i) => {
      const span = document.createElement('span');
      span.className = 'char';
      span.textContent = char === ' ' ? '\u00A0' : char;
      span.style.animationDelay = (i * 0.06) + 's';
      textEl.appendChild(span);
    });

    const totalTime = text.length * 60 + 1500;
    setTimeout(() => {
      showScreen('cards');
    }, totalTime);
  }

  // ============================================
  // SCREEN 6B: CARD GALLERY
  // ============================================

  function initCardGallery() {
    const cards = document.querySelectorAll('.deck-card');
    const lightbox = document.getElementById('card-lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const btnContinue = document.getElementById('btn-cards-continue');

    // Track card hovers
    trackHovers(cards, 'card');

    // Click card to zoom
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const img = card.querySelector('img');
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightbox.classList.remove('hidden');
        Logger.logClick('card_view_' + card.dataset.card);
        Logger.logCardView(card.dataset.card);
      });
    });

    // Click lightbox to close
    lightbox.addEventListener('click', () => {
      lightbox.classList.add('hidden');
    });

    btnContinue.addEventListener('click', () => {
      Logger.logClick('cards_continue');
      showScreen('farewell');
    });
  }

  // ============================================
  // SCREEN 6C: FAREWELL
  // ============================================

  function initFarewell() {
    let played = false;
    const observer = new MutationObserver(() => {
      const screen = document.getElementById('screen-farewell');
      if (screen.classList.contains('active') && !played) {
        played = true;
        playFarewell();
      }
    });
    observer.observe(document.getElementById('screen-farewell'), { attributes: true, attributeFilter: ['class'] });
  }

  function playFarewell() {
    const textEl = document.getElementById('farewell-text');
    const text = 'Fare thee well & may all the stars align in your favor';
    textEl.innerHTML = '';

    text.split('').forEach((char, i) => {
      const span = document.createElement('span');
      span.className = 'char';
      span.textContent = char === ' ' ? '\u00A0' : char;
      span.style.animationDelay = (i * 0.06) + 's';
      textEl.appendChild(span);
    });

    const totalTime = text.length * 60 + 1800;
    setTimeout(() => {
      showScreen('feedback');
    }, totalTime);
  }

  // ============================================
  // SCREEN 7: FEEDBACK
  // ============================================

  function initFeedback() {
    const options = document.querySelectorAll('.feedback-option');
    trackHovers(options, 'feedback');

    // All feedback options use the same response and chibi

    options.forEach(opt => {
      opt.addEventListener('click', () => {
        const fb = opt.dataset.feedback;
        state.feedbackSelection = fb;
        options.forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');

        // Collect hover data
        const hoverData = {};
        options.forEach(o => {
          hoverData[o.dataset.feedback] = Logger.getHoverData('feedback_' + o.dataset.feedback);
        });
        Logger.logFeedbackSelection(fb, hoverData);

        // Set up final screen
        const selectedDay = state.acceptedDate || 'Saturday';
        const dayLabel = selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1);
        const finalMsg = document.getElementById('final-message');
        finalMsg.textContent = 'Noted! See you on ' + dayLabel + '!';
        Chibi.register('chibi-final');
        Chibi.setExpression('chibi-final', 'shy');

        // Small delay before transitioning
        setTimeout(() => {
          showScreen('final');
          Logger.completeSession();
        }, 600);
      });
    });
  }

  // ============================================
  // CONFETTI
  // ============================================

  function launchConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#FF9B9B', '#7EC8A0', '#FFD700', '#87CEEB', '#FFB6C1', '#DDA0DD', '#98FB98'];
    const particles = [];

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        w: Math.random() * 10 + 5,
        h: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        rot: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        opacity: 1
      });
    }

    let startTime = Date.now();
    const DURATION = 3000;

    function animate() {
      const elapsed = Date.now() - startTime;
      if (elapsed > DURATION) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Fade out in last 800ms
      const fadeStart = DURATION - 800;
      const globalAlpha = elapsed > fadeStart ? 1 - (elapsed - fadeStart) / 800 : 1;

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // gravity
        p.rot += p.rotSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.globalAlpha = globalAlpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      requestAnimationFrame(animate);
    }

    animate();
  }

  // ============================================
  // HANDLE PAGE UNLOAD
  // ============================================

  window.addEventListener('beforeunload', () => {
    // Try to send partial log
    const logData = Logger.getLog();
    if (logData.session_id && logData.completion_status !== 'completed') {
      logData.completion_status = 'abandoned_at_' + currentScreenKey;
      logData.end_timestamp = new Date().toISOString();
      // Use sendBeacon for reliability
      const endpoint = 'https://script.google.com/macros/s/AKfycbxJ08VtF5NIXNgJui1yIssN4YqVvTtAgqFyNrtssRQMJVD5Yx8VNgWQRlG7b_nWFyMgQw/exec';
      if (endpoint) {
        navigator.sendBeacon(endpoint, JSON.stringify(logData));
      }
    }
  });

  // ============================================
  // INITIALIZE EVERYTHING
  // ============================================

  // ============================================
  // SCREEN 0: WELCOME
  // ============================================

  function initWelcome() {
    const textEl = document.getElementById('welcome-text');
    const lines = ['Welcome,', 'Sofia'];

    let charIndex = 0;
    lines.forEach((line, lineIdx) => {
      line.split('').forEach((char, i) => {
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = char === ' ' ? '\u00A0' : char;
        span.style.animationDelay = (charIndex * 0.08) + 's';
        textEl.appendChild(span);
        charIndex++;
      });
      if (lineIdx < lines.length - 1) {
        textEl.appendChild(document.createElement('br'));
      }
    });

    const totalChars = lines.join('').length;
    const totalTypeTime = totalChars * 80 + 1500;
    setTimeout(() => {
      showScreen('front');
    }, totalTypeTime);
  }

  function init() {
    Logger.initSession();
    Logger.logScreenEnter('welcome');

    initWelcome();
    initFrontPage();
    initIntro();
    initControlQuiz();
    initDatePicker();
    initSuccess();
    initPlanningQuiz();
    initGiftIntro();
    initCardGallery();
    initFarewell();
    initFeedback();
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
