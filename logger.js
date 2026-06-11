/**
 * logger.js — Client-side error logging to Firebase Realtime Database
 * Writes to: logs/errors/{push-id}
 * Readable only via Firebase Console (client has write-only access).
 */
(function () {
  const MAX_MSG   = 500;
  const MAX_STACK = 1200;

  function ctx() {
    const p = new URLSearchParams(location.search);
    return {
      ts:   Date.now(),
      url:  location.pathname + location.search,
      room: p.get('room') || null,
      ua:   navigator.userAgent.substring(0, 200),
    };
  }

  function write(data) {
    try {
      firebase.database().ref('logs/errors').push(data);
    } catch (_) {
      // Never throw from logger
    }
  }

  // ── Unhandled JS errors ─────────────────────────────────
  window.onerror = function (msg, src, line, col, err) {
    write({
      ...ctx(),
      type:  'onerror',
      msg:   String(msg).substring(0, MAX_MSG),
      stack: err?.stack?.substring(0, MAX_STACK) ?? null,
      src, line, col,
    });
    return false; // preserve default browser behaviour
  };

  // ── Unhandled Promise rejections ────────────────────────
  window.addEventListener('unhandledrejection', function (e) {
    const reason = e.reason;
    write({
      ...ctx(),
      type:  'unhandledrejection',
      msg:   String(reason?.message ?? reason ?? 'Unknown rejection').substring(0, MAX_MSG),
      stack: reason?.stack?.substring(0, MAX_STACK) ?? null,
    });
  });

  // ── Manual logging API ──────────────────────────────────
  // Usage: logError('Something went wrong', { extra: 'context' })
  window.logError = function (msg, extra) {
    write({ ...ctx(), type: 'manual', msg: String(msg).substring(0, MAX_MSG), ...extra });
  };
})();
