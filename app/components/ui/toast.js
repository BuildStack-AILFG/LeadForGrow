// Toast styling for react-hot-toast (already installed): neutral surface,
// bottom-right, short past-tense message. Pass to <Toaster toastOptions={…} position="bottom-right" />.
export const TOAST_OPTIONS = {
  duration: 3500,
  style: {
    background: 'var(--bg-app)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-popover)',
    borderRadius: '8px',
    fontSize: '14px',
    lineHeight: '20px',
    padding: '8px 12px',
  },
  success: { iconTheme: { primary: 'var(--success)', secondary: '#fff' } },
  error: { iconTheme: { primary: 'var(--danger)', secondary: '#fff' } },
};
