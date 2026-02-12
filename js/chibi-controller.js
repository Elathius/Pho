/* ============================================
   CHIBI CONTROLLER
   Manages chibi character expressions.
   Add your own images to assets/chibi/ and
   update the EXPRESSIONS map below.
   ============================================ */

const Chibi = (() => {

  // Map expression names to image files or emoji fallbacks.
  // To add a new image: set the value to the image path.
  // Emoji fallback is used when no image is available.
  // We have 3 chibi images. They're reused across expressions.
  // Replace image paths below as you add more images.
  const CRYING  = 'assets/chibi/crying-chibi.png';
  const PANIC   = 'assets/chibi/panic-chibi.png';
  const WORRIED = 'assets/chibi/worried-chibi.png';
  const KNIGHT  = 'assets/chibi/knight-chibi.png';
  const NORMAL   = 'assets/chibi/normal-chibi.png';
  const SHY      = 'assets/chibi/shy-chibi.png';
  const THINKING = 'assets/chibi/thinking-chibi.png';

  const EXPRESSIONS = {
    knight:        { image: KNIGHT },
    neutral:       { image: NORMAL },
    happy:         { image: NORMAL },
    sad:           { image: CRYING },
    crying:        { image: CRYING },
    panicked:      { image: PANIC },
    exploded:      { image: PANIC },
    worried:       { image: WORRIED },
    mischievous:   { image: NORMAL },      // swap when you have a mischievous img
    tired:         { image: WORRIED },
    exhausted:     { image: CRYING },
    thinking:      { image: THINKING },
    giggling:      { image: SHY },
    shy:           { image: SHY },
    giving_flower: { image: SHY },
    celebrating:   { image: SHY },
    waving:        { image: NORMAL },
    shrugging:     { image: NORMAL },
    proud:         { image: NORMAL },
    devil:         { image: NORMAL },
  };

  // Track which containers exist
  const containers = {};

  function register(containerId) {
    const el = document.getElementById(containerId);
    if (el) {
      containers[containerId] = el;
      // Set default expression
      setExpression(containerId, 'neutral');
    }
  }

  function setExpression(containerId, expressionName) {
    const container = containers[containerId] || document.getElementById(containerId);
    if (!container) return;

    const expr = EXPRESSIONS[expressionName] || EXPRESSIONS.neutral;

    if (expr.image) {
      container.innerHTML = '<img src="' + expr.image + '" alt="' + expressionName + '">';
    } else {
      container.innerHTML = '<span class="chibi-emoji">' + expr.emoji + '</span>';
    }
  }

  // Map date names to chibi expressions
  const DATE_EXPRESSIONS = {
    wednesday: 'panicked',
    thursday: 'sad',
    friday: 'tired',
    saturday: 'giggling',
    sunday: 'thinking'
  };

  function handleDateHover(containerId, date) {
    const expr = DATE_EXPRESSIONS[date] || 'neutral';
    setExpression(containerId, expr);
  }

  function resetToNeutral(containerId) {
    setExpression(containerId, 'neutral');
  }

  return {
    register,
    setExpression,
    handleDateHover,
    resetToNeutral,
    EXPRESSIONS,
    DATE_EXPRESSIONS
  };
})();
