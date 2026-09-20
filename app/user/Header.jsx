"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { clearUserStorage } from "@/lib/clientStorage";
import {
  ChevronDown,
  Plus,
  Home,
  GraduationCap,
  Landmark,
  HeartPulse,
  Briefcase,
  Shield,
  Wallet,
  Plane,
  Globe,
  Sparkles,
  Share2,
  Search,
  TrendingUp,
  Users,
  Menu,
  X,
} from "lucide-react";

function NavDropdownTrigger({ children, isOpen }) {
  return (
    <button
      suppressHydrationWarning
      type="button"
      className="group inline-flex items-center gap-1 py-2 text-[14px] font-medium text-[#374151] hover:text-[#111827] transition-colors"
    >
      {children}
      <ChevronDown
        className={`w-3.5 h-3.5 text-[#64748B] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
      />
    </button>
  );
}

const UserNavbar = () => {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [businessPlan, setBusinessPlan] = useState(null);
  const [hasAgency, setHasAgency] = useState(false);
  const [context, setContext] = useState("business");

  const productDropdown = [
    { label: "Website & Funnel Builder", href: "/product/builder" },
    { label: "Lead Capture Forms", href: "/product/forms" },
    { label: "Lead Management & CRM", href: "/product/crm" },
    { label: "Automation & Follow-ups", href: "/product/automation" },
    { label: "Analytics & Reporting", href: "/product/analytics" },
    { label: "Custom Domain & Hosting", href: "/product/hosting" },
  ];

  const servicesDropdown = [
    { label: "Done-For-You Website", href: "/services/dfy-website", description: "We build your site end-to-end", icon: Globe },
    { label: "Lead System Setup", href: "/services/lead-setup", description: "CRM & capture configured for you", icon: Users },
    { label: "Automation Setup", href: "/services/automation-setup", description: "Hands-free workflow automation", icon: Sparkles },
    { label: "Social Profile Setup", href: "/services/social-setup", description: "Branded social presence setup", icon: Share2 },
    { label: "SEO Setup", href: "/services/seo-setup", description: "Rank higher on Google", icon: Search },
    { label: "Managed Growth Service", href: "/services/managed-growth", description: "Full-service growth management", icon: TrendingUp },
  ];

  const agenciesDropdown = [
    { label: "Agency Platform Overview", href: "/agencies/overview" },
    { label: "Manage Multiple Clients", href: "/agencies/clients" },
    { label: "White-Label Solution", href: "/agencies/white-label" },
    { label: "Agency Pricing", href: "/pricing" },
    { label: "Become a Partner", href: "/agencies/partner" },
  ];

  const industryDropdown = [
    { label: "Real Estate", href: "/industry/real-estate", description: "Automate property enquiries", icon: Home },
    { label: "Education", href: "/industry/education", description: "Streamline student admissions", icon: GraduationCap },
    { label: "Bank", href: "/industry/bank", description: "Secure financial lead routing", icon: Landmark },
    { label: "Hospital", href: "/industry/hospital", description: "Manage patient appointments", icon: HeartPulse },
    { label: "Business", href: "/industry/business", description: "General sales automation", icon: Briefcase },
    { label: "Insurance", href: "/industry/insurance", description: "Fast claim & lead handling", icon: Shield },
    { label: "Fintech", href: "/industry/fintech", description: "Modern finance lead ops", icon: Wallet },
    { label: "Travel", href: "/industry/travel", description: "Booking & tour automation", icon: Plane },
  ];

  const resourcesDropdown = [
    { label: "About Us", href: "/resources/about" },
    { label: "How It Works", href: "/resources/how-it-works" },
    { label: "Use Cases", href: "/resources/use-cases" },
    { label: "Case Studies", href: "/resources/case-studies" },
    { label: "Blog", href: "/resources/blog" },
    { label: "Help Center", href: "/resources/help" },
  ];

  const isPaid = isLoggedIn && businessPlan && businessPlan !== "free";

  const handleProfileClick = () => {
    const userid = localStorage.getItem("userid");
    if (userid) {
      window.location.href = `/user/profile/${userid}`;
    } else {
      window.location.href = "/user/register";
    }
  };

  const handleLogout = () => {
    clearUserStorage();
    setIsLoggedIn(false);
    window.location.href = "/";
  };

  const fetchSession = async (userId) => {
    try {
      const response = await fetch(`/api/user/profile/${userId}`);
      if (response.ok) {
        const data = await response.json();
        const plan = (data.businessPlan || "free").toLowerCase();
        setBusinessPlan(plan);
        setHasAgency(data.hasAgency);
        localStorage.setItem("businessPlan", plan);
        localStorage.setItem("hasAgency", data.hasAgency);
      }
    } catch (error) {
      console.error("Failed to fetch session:", error);
    }
  };

  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes("/agency/clients/")) setContext("client");
    else if (path.startsWith("/agency")) setContext("agency");
    else setContext("business");

    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handleScroll);
    handleScroll();

    const userid = localStorage.getItem("userid");
    if (userid) {
      setIsLoggedIn(true);
      const storedPlan = localStorage.getItem("businessPlan");
      const storedHasAgency = localStorage.getItem("hasAgency") === "true";
      if (storedPlan) setBusinessPlan(storedPlan);
      setHasAgency(storedHasAgency);
      fetchSession(userid);
    }

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  let activePaidItems = [];
  if (context === "client") {
    activePaidItems = [
      { label: "Business Home", icon: "Home", href: "/", special: true },
      { label: "Leads", href: "#leads" },
      { label: "Financials", href: "#invoices" },
      { label: "Overview", href: "#overview" },
    ];
  } else if (isPaid) {
    activePaidItems = [
      { label: "Websites", href: "/websites" },
      { label: "Leads", href: "/automation/leads" },
      { label: "Dashboard", href: "/automation" },
      { label: "Report", href: "/automation/reports" },
    ];
    if (hasAgency) {
      activePaidItems.push({ label: "Clients / Agency", href: "/agency", highlighted: true });
    }
  }

  const activeCreateItems =
    hasAgency && isPaid
      ? [
          { label: "Create Website", href: "/website-funnel" },
          { label: "Add New Client", href: "/agency/clients" },
        ]
      : [
          { label: "Create Website", href: "/website-funnel" },
          { label: "Create Form", href: "/automation/forms" },
        ];

  const DropdownMenu = ({ items, isOpen }) => {
    if (!isOpen) return null;
    return (
      <div className="absolute top-full right-0 pt-3 w-64 z-50">
        <div className="rounded-lg border border-[#E2E8F0] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.1)] py-2 overflow-hidden">
          {items.map((item, idx) => (
            <a
              key={idx}
              href={item.href}
              className="block px-4 py-2.5 text-sm font-medium text-[#374151] hover:text-[#2563EB] hover:bg-[#F8FAFC] transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    );
  };

  const IndustryDropdownMenu = ({ items, isOpen }) => {
    if (!isOpen) return null;
    return (
      <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 z-50 w-[520px] max-w-[calc(100vw-2rem)]">
        <div className="rounded-lg border border-[#E2E8F0] bg-white shadow-[0_12px_40px_rgba(15,23,42,0.12)] p-4">
          <div className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-[0.12em] px-2 pb-3">
            Select your industry
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {items.map((item, idx) => {
              const Icon = item.icon;
              return (
                <a
                  key={idx}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#F8FAFC] transition-all duration-200 group"
                >
                  <div className="w-9 h-9 rounded-md bg-[#F1F5F9] group-hover:bg-[#EFF6FF] flex items-center justify-center shrink-0 transition-colors">
                    {Icon && (
                      <Icon className="w-4 h-4 text-[#64748B] group-hover:text-[#2563EB] transition-colors" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#111827] group-hover:text-[#2563EB] transition-colors">
                      {item.label}
                    </div>
                    {item.description && (
                      <div className="text-[11px] text-[#94A3B8] leading-tight mt-0.5 truncate">{item.description}</div>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const isLandingGuest = isLanding && !isLoggedIn;

  const navShellClass = isLandingGuest
    ? isScrolled
      ? "bg-white/90 backdrop-blur-md border-b border-[#E2E8F0]/60 shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
      : "bg-transparent border-b border-transparent"
    : isScrolled
      ? "bg-white border-b border-[#E2E8F0] shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
      : "bg-white border-b border-[#E2E8F0]";

  const NavLink = ({ href, children, className = "", onClick }) => (
    <a
      href={href}
      onClick={onClick}
      className={`inline-flex items-center py-2 text-[14px] font-medium text-[#374151] hover:text-[#111827] transition-colors ${className}`}
    >
      {children}
    </a>
  );

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navShellClass}`}>
      {/* Announcement bar — hidden on premium landing */}
      {isLanding && !isLandingGuest && businessPlan !== "trial" && (
        <div className="bg-[#111827] text-white text-center py-2.5 px-4 text-xs sm:text-sm font-medium">
          Turn every lead enquiry into revenue — before your competitor does.
        </div>
      )}

      {businessPlan === "trial" && (
        <div className="bg-[#111827] text-white text-center py-2.5 text-xs sm:text-sm font-medium">
          You are on a free trial — contact sales for full access
        </div>
      )}

      {/* Utility row — hidden on premium landing */}
      {isLanding && !isLandingGuest && !(isLoggedIn && (isPaid || context === "client")) && (
        <div className="hidden md:block border-b border-[#E2E8F0] bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-end gap-5 lg:gap-6">
            <a
              href="/resources/about"
              className="text-[12px] text-[#64748B] hover:text-[#111827] transition-colors"
            >
              Careers
            </a>
            <a
              href="/resources/help"
              className="text-[12px] text-[#64748B] hover:text-[#111827] transition-colors"
            >
              Customer support
            </a>
            <a
              href="tel:+918810873052"
              className="text-[12px] text-[#64748B] hover:text-[#111827] transition-colors"
            >
              +91 8810 873 052
            </a>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-[12px] text-[#64748B] hover:text-[#111827] transition-colors"
            >
              <Globe className="w-3.5 h-3.5" strokeWidth={1.75} />
              English (IN)
              <ChevronDown className="w-3 h-3 text-[#94A3B8]" />
            </button>
          </div>
        </div>
      )}

      <nav>

      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 lg:h-[4.25rem]">
          {/* Logo */}
          <div className="flex-shrink-0">
            <a href="/" className="flex items-center gap-2 group">
              {isLandingGuest ? (
                <span
                  className="text-xl font-bold tracking-[-0.03em] text-[#0F172A] sm:text-[1.35rem]"
                  style={{ fontFamily: "var(--font-inter-tight)" }}
                >
                  LeadForGrow<span className="text-[10px] align-super text-[#64748B]">™</span>
                </span>
              ) : (
                <>
                  <img
                    src="/image.png"
                    alt="LeadForGrow"
                    className="w-10 h-9 object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className="text-lg sm:text-xl font-bold tracking-tight text-[#111827]">
                    Lead<span className="text-[#2563EB]">For</span>Grow
                  </span>
                </>
              )}
            </a>
          </div>

          {/* Desktop nav */}
          <div className="hidden xl:flex flex-1 justify-center px-6">
            {isLoggedIn && (isPaid || context === "client") ? (
              <div className="flex items-center gap-7">
                {activePaidItems.map((item) =>
                  item.special ? (
                    <a
                      key={item.href}
                      href={item.href}
                      className="inline-flex items-center gap-2 rounded-lg bg-slate-900 dark:bg-white px-4 py-2 text-[12px] font-semibold text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm"
                    >
                      {item.label}
                    </a>
                  ) : item.highlighted ? (
                    <NavLink
                      key={item.href}
                      href={item.href}
                      className="text-[#2563EB] hover:text-[#1D4ED8]"
                    >
                      {item.label}
                    </NavLink>
                  ) : (
                    <NavLink key={item.href} href={item.href}>
                      {item.label}
                    </NavLink>
                  )
                )}
              </div>
            ) : isLandingGuest ? (
              <div className="flex items-center gap-8">
                <NavLink href="/">Home</NavLink>
                <div
                  className="relative"
                  onMouseEnter={() => setOpenDropdown("product")}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <NavDropdownTrigger isOpen={openDropdown === "product"}>Platform</NavDropdownTrigger>
                  <DropdownMenu items={productDropdown} isOpen={openDropdown === "product"} />
                </div>
                <div
                  className="relative"
                  onMouseEnter={() => setOpenDropdown("automation")}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <NavDropdownTrigger isOpen={openDropdown === "automation"}>Automation</NavDropdownTrigger>
                  <DropdownMenu
                    items={[
                      { label: "WhatsApp Automation", href: "/product/automation" },
                      { label: "Instagram Automation", href: "/product/automation" },
                      { label: "Email Automation", href: "/product/automation" },
                      { label: "Workflow Builder", href: "/product/automation" },
                    ]}
                    isOpen={openDropdown === "automation"}
                  />
                </div>
                <NavLink href="/agencies/overview">Enterprise</NavLink>
                <NavLink href="/contact">Contact us</NavLink>
              </div>
            ) : (
              <div className="flex items-center gap-8">
                <div
                  className="relative"
                  onMouseEnter={() => setOpenDropdown("product")}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <NavDropdownTrigger isOpen={openDropdown === "product"}>Platform</NavDropdownTrigger>
                  <DropdownMenu items={productDropdown} isOpen={openDropdown === "product"} />
                </div>

                <div
                  className="relative"
                  onMouseEnter={() => setOpenDropdown("services")}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <NavDropdownTrigger isOpen={openDropdown === "services"}>Services</NavDropdownTrigger>
                  <IndustryDropdownMenu items={servicesDropdown} isOpen={openDropdown === "services"} />
                </div>

                <div
                  className="relative"
                  onMouseEnter={() => setOpenDropdown("industry")}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <NavDropdownTrigger isOpen={openDropdown === "industry"}>Industry</NavDropdownTrigger>
                  <IndustryDropdownMenu items={industryDropdown} isOpen={openDropdown === "industry"} />
                </div>

                <NavLink href="/pricing">Pricing</NavLink>
              </div>
            )}
          </div>

          {/* Desktop auth */}
          <div className="hidden xl:flex items-center gap-3">
            {!isLoggedIn ? (
              isLandingGuest ? (
                <>
                  <a
                    href="/user/login"
                    className="inline-flex items-center justify-center px-2 py-2 text-[14px] font-medium text-[#374151] hover:text-[#111827] transition-colors"
                  >
                    Login
                  </a>
                  <a
                    href="/user/register"
                    className="inline-flex items-center justify-center rounded-full bg-[#111827] px-6 py-2.5 text-[14px] font-semibold text-white hover:bg-[#0F172A] transition-colors duration-200"
                  >
                    Join
                  </a>
                </>
              ) : isLanding ? (
                <>
                  <a
                    href="/contact"
                    className="inline-flex items-center justify-center rounded-[3px] bg-[#FF5C35] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#E84E2A] transition-colors duration-200"
                  >
                    Get a demo
                  </a>
                  <a
                    href="/user/register"
                    className="inline-flex items-center justify-center rounded-[3px] border border-[#FF5C35] bg-white px-5 py-2.5 text-[14px] font-semibold text-[#FF5C35] hover:bg-[#FFF5F2] transition-colors duration-200"
                  >
                    Get started free
                  </a>
                </>
              ) : (
                <>
                  <NavLink href="/contact">Contact us</NavLink>
                  <a
                    href="/user/register"
                    className="inline-flex items-center justify-center rounded-md bg-[#111827] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#0F172A] transition-colors duration-200"
                  >
                    Get started
                  </a>
                </>
              )
            ) : (
              <>
                <div
                  className="relative"
                  onMouseEnter={() => setOpenDropdown("create")}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button
                    suppressHydrationWarning
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-md bg-[#111827] px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-[#0F172A] transition-colors duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    Create
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === "create" ? "rotate-180" : ""}`} />
                  </button>
                  <DropdownMenu items={activeCreateItems} isOpen={openDropdown === "create"} />
                </div>
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={handleProfileClick}
                  className="inline-flex items-center py-2 text-[14px] font-medium text-[#374151] hover:text-[#111827] transition-colors"
                >
                  Profile
                </button>
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={handleLogout}
                  className="rounded-md border border-[#E2E8F0] px-4 py-2.5 text-[14px] font-medium text-[#374151] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] transition-all duration-200"
                >
                  Log out
                </button>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <div className="xl:hidden">
            <button
              suppressHydrationWarning
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      </nav>

      {/* Mobile menu */}
      <div
        className={`xl:hidden border-t border-[#E2E8F0] bg-white transition-all duration-300 ease-out ${
          isMenuOpen ? "max-h-[85vh] opacity-100 visible overflow-y-auto" : "max-h-0 opacity-0 invisible overflow-hidden"
        }`}
      >
        <div className="px-4 pt-3 pb-6 space-y-1">
          {isLoggedIn && (isPaid || context === "client") ? (
            <>
              {activePaidItems.map((item, idx) => (
                <a
                  key={idx}
                  href={item.href}
                  className="block px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em] px-3 py-1.5">Create</div>
                {activeCreateItems.map((item, idx) => (
                  <a
                    key={idx}
                    href={item.href}
                    className="block px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </>
          ) : isLandingGuest ? (
            <>
              <a href="/" className="block px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50 transition-colors" onClick={() => setIsMenuOpen(false)}>Home</a>
              <div className="space-y-1 pb-2">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em] px-3 py-1.5">Platform</div>
                {productDropdown.map((item, idx) => (
                  <a key={idx} href={item.href} className="block px-3 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-50 transition-colors" onClick={() => setIsMenuOpen(false)}>{item.label}</a>
                ))}
              </div>
              <a href="/product/automation" className="block px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50 transition-colors" onClick={() => setIsMenuOpen(false)}>Automation</a>
              <a href="/agencies/overview" className="block px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50 transition-colors" onClick={() => setIsMenuOpen(false)}>Enterprise</a>
              <a href="/contact" className="block px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50 transition-colors" onClick={() => setIsMenuOpen(false)}>Contact us</a>
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <a href="/user/login" className="block px-3 py-2.5 text-center text-sm font-semibold text-slate-700 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors" onClick={() => setIsMenuOpen(false)}>Login</a>
                <a href="/user/register" className="block px-3 py-2.5 text-center text-sm font-semibold text-white bg-[#111827] hover:bg-[#0F172A] rounded-full transition-colors" onClick={() => setIsMenuOpen(false)}>Join</a>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1 pb-2">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em] px-3 py-1.5">Product</div>
                {productDropdown.map((item, idx) => (
                  <a
                    key={idx}
                    href={item.href}
                    className="block px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
              <div className="space-y-1 py-2 border-t border-slate-100 dark:border-slate-800">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em] px-3 py-1.5">Services</div>
                {servicesDropdown.map((item, idx) => (
                  <a
                    key={idx}
                    href={item.href}
                    className="block px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
              <a
                href="/pricing"
                className="block px-3 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </a>
              {!isLoggedIn && (
                <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <a
                    href="/user/login"
                    className="block px-3 py-2.5 text-center text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Log in
                  </a>
                  <a
                    href="/contact"
                    className="block px-3 py-2.5 text-center text-sm font-semibold text-white bg-[#FF5C35] hover:bg-[#E84E2A] rounded-[3px] transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Get a demo
                  </a>
                  <a
                    href="/user/register"
                    className={`block px-3 py-2.5 text-center text-sm font-semibold rounded-[3px] transition-colors ${
                      isLanding
                        ? 'border border-[#FF5C35] text-[#FF5C35] bg-white hover:bg-[#FFF5F2]'
                        : 'text-white bg-[#111827] hover:bg-[#0F172A]'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {isLanding ? 'Get started free' : 'Get started'}
                  </a>
                </div>
              )}
            </>
          )}

          {isLoggedIn && (
            <div className="space-y-1 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => {
                  handleProfileClick();
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Profile
              </button>
              <button
                suppressHydrationWarning
                type="button"
                onClick={handleLogout}
                className="w-full text-left px-3 py-2.5 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default UserNavbar;
