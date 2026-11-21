(function () {
  // Runs before a bundled copy of ocr_helper.js. The live page loads its own
  // older helper, which has already inserted a panel with the same element ids.
  // Remove that panel and its error banner so the bundled helper owns the UI
  // and every button (Load, Skip, Clear list) keeps working.
  const input = document.getElementById('ocr_input');
  const stale = input && input.closest ? input.closest('.admin-field') : null;
  if (stale) stale.remove();
  const error = document.getElementById('ocr_error');
  if (error) error.remove();
})();
