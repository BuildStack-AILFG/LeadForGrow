import Footer from "./components/Footer";
import CookieConsentManager from "./components/consent/CookieConsentManager";
import LeadForGrowWidget from "./EnquiryLazy";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Inter, Inter_Tight, Plus_Jakarta_Sans, Barlow, Libre_Baskerville } from "next/font/google";

// Self-hosted by Next at build time: no render-blocking request to Google on
// page load, and size-matched fallbacks so text doesn't jump when fonts arrive.
// globals.css reads these through --font-sans / --font-* tokens.
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--nf-inter" });
const interTight = Inter_Tight({ subsets: ["latin"], weight: ["700", "800"], display: "swap", variable: "--nf-inter-tight", preload: false });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap", variable: "--nf-plus-jakarta", preload: false });
const barlow = Barlow({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap", variable: "--nf-barlow", preload: false });
const libreBaskerville = Libre_Baskerville({ subsets: ["latin"], weight: ["400", "700"], display: "swap", variable: "--nf-libre-baskerville", preload: false });
const fontVariables = [inter, interTight, plusJakarta, barlow, libreBaskerville].map((f) => f.variable).join(" ");

// FIXED: Clean metadata without conflicts
export const metadata = {
  metadataBase: new URL("https://www.leadforgrow.com"),
  title: {
    template: "%s | LeadForGrow",
    default: "LeadForGrow - All-in-One Agency Operating System",
  },
  description: "Run your agency on one powerful platform. Build no-code pages, manage clients, capture leads, track analytics, and scale faster with a complete agency operating system",
  icons: {
    icon: [
      { url: "/favicon-green.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-green.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon-green.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon-green.png",
    apple: "/favicon-green.png",
  },
  other: {
    "google-adsense-account": "ca-pub-4902724266607481",
  },
};
const currentYear = new Date().getFullYear();
// FIXED: Remove manual head tags - let Next.js handle it
import { ThemeProvider } from "./components/ThemeContext";
import { ConfirmProvider } from "./components/ConfirmProvider";

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme')||'light';document.documentElement.classList.toggle('dark',t==='dark');document.documentElement.classList.toggle('light',t==='light');}catch(e){}})();`
          }}
        />
      </head>
      <body suppressHydrationWarning className="font-sans antialiased text-[#111827] bg-[#F8FAFC] transition-colors duration-300">
        {/* <Script
  id="interakt-sdk"
  strategy="afterInteractive"
  dangerouslySetInnerHTML={{
    __html: `
      (function(w,d,s,c,r,a,m){
        w['KiwiObject']=r;w[r]=w[r]||function(){(w[r].q=w[r].q||[]).push(arguments)};
        w[r].l=1*new Date();a=d.createElement(s);m=d.getElementsByTagName(s)[0];a.async=1;a.src=c;m.parentNode.insertBefore(a,m)
      })(window,document,'script',"https://app.interakt.ai/kiwi-sdk/kiwi-sdk-17-prod-min.js",'kiwi');
    `,
  }}
/> */}

        {/* Separate init script - CRITICAL: Load AFTER SDK */}
        {/* <Script
  id="interakt-init"
  strategy="lazyOnload"
  dangerouslySetInnerHTML={{
    __html: `
      (function() {
        function initKiwi() {
          if (typeof window !== 'undefined' && window.kiwi && typeof window.kiwi.init === 'function') {
            window.kiwi.init('', 'e44NElePOvKgorqrHc5T7ZhowwlY6UAq', {});
            return true;
          }
          return false;
        }
        
        // Wait for SDK to fully load
        const initAttempts = setInterval(() => {
          if (initKiwi()) {
            clearInterval(initAttempts);
          }
        }, 300);
        
        // Max 10 seconds
        setTimeout(() => clearInterval(initAttempts), 10000);
      })();
    `,
  }}
/> */}


        <ThemeProvider>
          <ConfirmProvider>
            {children}
            <CookieConsentManager />
            <LeadForGrowWidget />
            <Toaster position="top-right" />
            <Footer></Footer>
          </ConfirmProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
