import { IBM_Plex_Sans } from 'next/font/google';
import AccessControl from './components/AccessControl';
import { AccessProvider } from './context/AccessContext';
import UpgradeGateModal from './components/access/UpgradeGateModalLazy';
import Sidebar from './components/Sidebar';
import GlobalDialer from './components/GlobalDialer';
import ReminderMonitor from './components/ReminderMonitor';
import BusinessAssistantRoot from './components/assistant/BusinessAssistantRoot';
import NotificationsHost from './components/NotificationsHost';
import { TourProvider } from './components/shared/tour/TourProvider';
import HelpLauncher from './components/shared/tour/HelpLauncher';

// App typeface (owner decision 2026-10-03, docs/design/research.md). Exposed
// as --font-plex-sans; consumed by the `font-app` token in globals.css.
const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-plex-sans',
});

export const metadata = {
  title: 'Automation - LeadForGrow',
  description: 'Lead management and automation dashboard'
};

export default function AutomationLayout({ children }) {
  return (
    <AccessControl>
      <AccessProvider>
      <TourProvider>
      <BusinessAssistantRoot>
        <div className={`${plexSans.variable} crm-app font-app flex h-screen bg-canvas dark:bg-slate-950 relative overflow-hidden transition-colors duration-300`}>
          <style dangerouslySetInnerHTML={{
            __html: `body { overflow: hidden !important; height: 100vh !important; }`
          }} />

          <Sidebar />
          <main className="flex-1 min-w-0 pt-12 lg:pt-0 overflow-y-auto overflow-x-hidden relative flex flex-col bg-canvas dark:bg-slate-950 transition-colors duration-300">
            <div className="flex-1">{children}</div>
          </main>

          <GlobalDialer />
          <ReminderMonitor />
          {/* Invisible — subscribes to real-time and plays sounds + shows
              browser notifications on new lead / message events. Global so
              it works from any page, not just Inbox. */}
          <NotificationsHost />
          <HelpLauncher />
        </div>
      </BusinessAssistantRoot>
      <UpgradeGateModal />
      </TourProvider>
      </AccessProvider>
    </AccessControl>
  );
}
