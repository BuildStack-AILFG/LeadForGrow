import { openBookDemoPopup } from './BookDemoModal';

// Default click handlers for the homepage CTAs. They live here (not in the
// page) so the homepage itself can render on the server.
export function goToGetStarted() {
  const userId = localStorage.getItem('userid');
  window.location.href = userId ? '/automation' : '/user/register';
}

export function openBookDemo() {
  const popup = openBookDemoPopup();
  if (popup) popup.focus();
}
