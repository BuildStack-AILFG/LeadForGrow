'use client';

const TRUSTED_COMPANIES = [
  'Scaledesk technology',
  'Homies4u',
  'Pistons Garage',
  'PMKR',
  'CXO',
  'Moodli',
];

export default function TrustedCompanies() {
  return (
    <section className="relative bg-white pt-10 pb-10 sm:pt-12 sm:pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-[13px] sm:text-[15px] font-semibold text-[#94A3B8]">
          Trusted by growing businesses across industries
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 sm:gap-x-14 lg:gap-x-16 xl:gap-x-20">
          {TRUSTED_COMPANIES.map((name) => (
            <span
              key={name}
              className="text-[15px] sm:text-[17px] font-semibold tracking-[-0.02em] text-[#374151] select-none grayscale opacity-80 transition-opacity hover:opacity-100"
              style={{ fontFamily: 'var(--font-plus-jakarta)' }}
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
