import { Check, X, Shield, Rocket, Building2, Users } from 'lucide-react';
import Heading from '@/app/components/ui/Heading';

export default function AgencyOSLanding() {
  return (
    <div id="features" className="min-h-screen bg-white dark:bg-black transition-colors duration-500 py-24 border-t dark:border-slate-800">
      <main className="px-8 max-w-7xl mx-auto">
        
        {/* SECTION 4: WHY NOT A CRM? */}
         <div className="mb-32">
           <div className="text-center mb-16">
             <h2 className="text-6xl font-bold tracking-tight text-[#0f172a] mb-8 leading-[1.1]">
               The missing layer between<br /> <span className="text-[#0081ff]">enquiry and revenue.</span>
             </h2>
             <p className="text-xl font-medium text-slate-500 max-w-3xl mx-auto leading-relaxed">
               CRMs are databases. LeadForGrow is a discipline engine. Here is the difference.
             </p>
           </div>

           {/* ADDED NEW FEATURE SECTIONS HERE */}
           <div className="space-y-24 mt-24">
              <div className="flex flex-col lg:flex-row items-center gap-16">
                 <div className="flex-1 space-y-6">
                    <h3 className="text-3xl font-bold">Capture leads from all Portals</h3>
                    <p className="text-slate-600 font-medium">Why manage leads manually from 15 different platforms when you can manage them from a centralized hub?</p>
                    <ul className="space-y-4">
                       {["Effortlessly capture leads from everywhere in one place", "Automatically assign leads to your agents.", "Connect with leads instantly with LeadForGrow's WhatsApp Chatbot."].map((p, i) => (
                         <li key={i} className="flex items-center gap-3 font-semibold text-slate-700">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div> {p}
                         </li>
                       ))}
                    </ul>
                 </div>
                 <div className="flex-1">
                    <img src="/portal-integrations.webp" alt="Portal Integrations" className="w-full h-auto rounded-3xl" />
                 </div>
              </div>

              <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
                 <div className="flex-1 space-y-6">
                    <h3 className="text-3xl font-bold">Boost calling efficiency</h3>
                    <p className="text-slate-600 font-medium">Because quick, efficient calling = more calls = more deals</p>
                    <ul className="space-y-4">
                       {["With 1-click dialer, your team spends less time typing numbers and more in closing deals", "Use LeadForGrow's web application to make calls from your mobile in one click.", "Eliminate manual effort and automatically sync call feedback"].map((p, i) => (
                         <li key={i} className="flex items-center gap-3 font-semibold text-slate-700">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div> {p}
                         </li>
                       ))}
                    </ul>
                 </div>
                 <div className="flex-1">
                    <img src="/calling-list.webp" alt="Calling List" className="w-full h-auto rounded-3xl" />
                 </div>
              </div>

              <div className="flex flex-col lg:flex-row items-center gap-16">
                 <div className="flex-1 space-y-6">
                    <h3 className="text-3xl font-bold">Intelligent WhatsApp Lead Routing & Automation</h3>
                    <p className="text-slate-600 font-medium">Optimize engagement with AI-powered paths.</p>
                    <ul className="space-y-4">
                       {["Autonomous Lead Qualification: AI engine detects high-intent leads instantly.", "Seamless Routing: Sync leads to Sales or Support teams based on intent.", "Automated Follow-ups: Initiate onboarding sequences without manual work."].map((p, i) => (
                         <li key={i} className="flex items-center gap-3 font-semibold text-slate-700">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div> {p}
                         </li>
                       ))}
                    </ul>
                 </div>
                 <div className="flex-1">
                    <img src="/whatsapp-automation.webp" alt="WhatsApp Automation" className="w-full h-auto rounded-3xl" />
                 </div>
              </div>
           </div>

           <div className="overflow-x-auto mt-32">
            <table className="w-full text-left border-collapse bg-white dark:bg-slate-900/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="px-8 py-8 text-xs font-bold text-slate-400 uppercase tracking-widest">Feature / Outcome</th>
                  <th className="px-8 py-8 text-xl font-bold text-slate-900 dark:text-white">LeadForGrow (Rev-OS)</th>
                  <th className="px-8 py-8 text-lg font-bold text-slate-400">Traditional CRM</th>
                  <th className="px-8 py-8 text-lg font-bold text-slate-400">WhatsApp/Manual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {[
                  { label: "Lead Capture Speed", lfg: "Instant (Seconds)", crm: "Delayed (Minutes/Hours)", manual: "Chaos" },
                  { label: "Follow-up Enforcement", lfg: "Automated & Mandatory", crm: "Optional / Manual Log", manual: "None" },
                  { label: "Revenue Leak Visibility", lfg: "Real-time Dashboard", crm: "Buried in Reports", manual: "Invisible" },
                  { label: "Accountability", lfg: "Enforced tasks", crm: "Self-governed", manual: "Non-existent" },
                  { label: "Cost of Inaction", lfg: "Minimized", crm: "High", manual: "Losing 50%+ Revenue" }
                ].map((row, i) => (
                  <tr key={i} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-8 py-6 text-sm font-bold text-slate-500 dark:text-slate-500">{row.label}</td>
                    <td className="px-8 py-6 text-indigo-600 dark:text-indigo-400 font-black">
                      <div className="flex items-center gap-2"><Check className="w-4 h-4" /> {row.lfg}</div>
                    </td>
                    <td className="px-8 py-6 text-slate-400 font-medium">
                      <div className="flex items-center gap-2"><X className="w-4 h-4" /> {row.crm}</div>
                    </td>
                    <td className="px-8 py-6 text-slate-400 font-medium italic">{row.manual}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 6: FOR WHO IS THIS? */}
        <div className="mb-32">
           <div className="text-center mb-16">
              <Heading level={2} className="font-serif">
                Built for those who care about ROI.
              </Heading>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { 
                  icon: Shield, 
                  title: "SMB Owners", 
                  pain: "Losing leads while focus is on ops.", 
                  solution: "LeadForGrow becomes your 'Automated Manager', ensuring your staff never misses a callback.",
                  cta: "Fix My Business"
                },
                { 
                  icon: Rocket, 
                  title: "Agencies", 
                  pain: "Clients complaining about lead quality.", 
                  solution: "Prove the problem is 'Follow-up' not 'Leads'. Provide a Rev-OS to clients and increase your retention.",
                  cta: "Scale My Agency"
                },
                { 
                  icon: Users, 
                  title: "Sales Teams", 
                  pain: "Sales team underperforming benchmarks.", 
                  solution: "Enforce a standardized follow-up culture. See exactly who is closing and why.",
                  cta: "Unblock My Team"
                }
              ].map((item, i) => (
                <div key={i} className="p-10 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex flex-col h-full">
                   <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-indigo-600 mb-6 shadow-sm">
                      <item.icon className="w-6 h-6" />
                   </div>
                   <Heading level={3} className="mb-4">
                     {item.title}
                   </Heading>
                   <p className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-2">The Pain: {item.pain}</p>
                   <p className="font-medium mb-8 flex-grow">
                     {item.solution}
                   </p>
                   <button suppressHydrationWarning className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm hover:bg-indigo-600 dark:hover:bg-indigo-500 dark:hover:text-white transition-all uppercase tracking-widest">
                      {item.cta}
                   </button>
                </div>
              ))}
           </div>
        </div>

        

        {/* SECTION 8: TESTIMONIALS */}
        <div className="pt-24 border-t dark:border-slate-800">
          <div className="text-center mb-16">
            <Heading level={2} className="font-serif mb-6">
              What Early Users Are Saying.
            </Heading>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto">Real outcomes from teams who stopped treating follow-up as an option.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              {
                text: "Speed of response changed everything for us. We went from losing 40% of leads to 0 leakage in under a month. The discipline is now automated.",
                author: "Rahul",
                role: "Agency Owner"
              },
              {
                text: "The automated reminders fixed our team's discipline. We don't have to 'ask' anyone to follow up anymore — the system just enforces it.",
                author: "Sarah",
                role: "Sales Head"
              },
              {
                text: "The visibility into 'Revenue at Risk' is a game changer. We finally know exactly where our money is being lost and who is fixing it.",
                author: "Amit",
                role: "SMB Founder"
              }
            ].map((t, i) => (
              <div key={i} className="p-8 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between group hover:shadow-lg transition-all">
                <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed italic mb-8">
                  "{t.text}"
                </p>
                <div>
                  <p className="text-slate-900 dark:text-white font-bold">{t.author}</p>
                  <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
              Feedback from pilot users and early customers.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
