'use client';

import { useState } from 'react';
import { MapPin } from 'lucide-react';
import PremiumCard from './PremiumCard';
import WidgetMenu from './WidgetMenu';

const BLUE = '#059669';
const BLUE_SOFT = '#10B981';
const MAP_IDLE = '#E2E8F0';
const MAP_BG = '#F8FAFC';

const COUNTRY_FLAGS = {
  Australia: '🇦🇺',
  India: '🇮🇳',
  Indonesia: '🇮🇩',
  Singapore: '🇸🇬',
  'United States': '🇺🇸',
  USA: '🇺🇸',
  'United Kingdom': '🇬🇧',
  UK: '🇬🇧',
  Canada: '🇨🇦',
  Germany: '🇩🇪',
  France: '🇫🇷',
  Japan: '🇯🇵',
  China: '🇨🇳',
  Brazil: '🇧🇷',
  UAE: '🇦🇪',
  'United Arab Emirates': '🇦🇪',
};

function getFlag(country) {
  return COUNTRY_FLAGS[country] || '🌍';
}

/** Simplified continent shapes — reads as a world map, not random polygons. */
function SimpleWorldMap({ highlightCountries = [] }) {
  const highlights = new Set(highlightCountries.map((c) => c.toLowerCase()));

  const regions = [
    {
      id: 'na',
      // North America
      d: 'M12,22 C14,18 20,16 26,17 C32,18 36,22 38,28 C36,34 32,38 26,40 C20,41 14,38 12,32 C10,28 10,24 12,22 Z',
      countries: ['united states', 'usa', 'canada'],
    },
    {
      id: 'sa',
      // South America
      d: 'M28,44 C32,42 36,44 38,50 C39,56 36,62 32,66 C28,68 26,64 25,58 C24,52 25,46 28,44 Z',
      countries: ['brazil'],
    },
    {
      id: 'eu',
      // Europe
      d: 'M46,20 C50,18 54,19 56,23 C57,27 54,30 50,31 C46,30 44,26 46,20 Z',
      countries: ['united kingdom', 'uk', 'germany', 'france'],
    },
    {
      id: 'af',
      // Africa / Middle East
      d: 'M48,34 C54,32 58,36 58,44 C57,52 52,56 48,54 C44,50 44,40 48,34 Z',
      countries: ['uae', 'united arab emirates'],
    },
    {
      id: 'as',
      // Asia (India, SE Asia, China, Japan)
      d: 'M58,22 C66,18 76,20 82,28 C84,36 80,44 72,48 C64,50 58,44 56,36 C55,28 56,24 58,22 Z',
      countries: ['india', 'china', 'japan', 'singapore', 'indonesia'],
    },
    {
      id: 'au',
      // Australia
      d: 'M74,52 C80,50 86,52 88,58 C87,62 82,64 76,63 C72,60 72,54 74,52 Z',
      countries: ['australia'],
    },
  ];

  return (
    <div className="rounded-[12px] bg-[#F8FAFC] border border-[#E8ECEF] px-2 py-3">
      <svg viewBox="0 0 100 72" className="w-full h-auto max-h-[120px]" aria-hidden>
        {/* Soft ocean wash */}
        <rect x="0" y="0" width="100" height="72" fill={MAP_BG} rx="6" />
        {regions.map((r) => {
          const active = r.countries.some((c) => highlights.has(c));
          return (
            <path
              key={r.id}
              d={r.d}
              fill={active ? BLUE : MAP_IDLE}
              stroke={active ? BLUE_SOFT : '#CBD5E1'}
              strokeWidth={active ? 0.6 : 0.35}
              className="transition-all duration-300"
            />
          );
        })}
      </svg>
    </div>
  );
}

export default function TopLocationsCard({ locations = [], onRefresh }) {
  const [collapsed, setCollapsed] = useState(false);
  const highlightCountries = locations.map((l) => l.country);
  const maxPct = Math.max(...locations.map((l) => l.percent || 0), 1);

  return (
    <PremiumCard padding="p-4" className="h-full flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center w-8 h-8 rounded-[9px] bg-[#E8EFFC] text-[#059669]">
            <MapPin className="w-4 h-4" strokeWidth={2} />
          </span>
          <h2 className="text-[13px] font-medium text-[#1A1D1F] tracking-[-0.01em]">
            Top Customer Locations
          </h2>
        </div>
        <WidgetMenu
          onRefresh={onRefresh}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          collapsed={collapsed}
        />
      </div>

      <div
        className={`flex flex-col flex-1 transition-all duration-300 ease-out ${
          collapsed ? 'max-h-0 opacity-0 overflow-hidden' : 'opacity-100'
        }`}
      >
        <SimpleWorldMap highlightCountries={highlightCountries} />

        <div className="mt-5 space-y-3.5 flex-1">
          {locations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
              <div className="w-11 h-11 rounded-full bg-[#F2F4F3] flex items-center justify-center">
                <MapPin className="w-5 h-5 text-[#CBD3DA]" />
              </div>
              <p className="text-[13px] text-[#98A2B3] max-w-[200px]">
                Add lead or contact locations to see insights
              </p>
            </div>
          ) : (
            locations.map((loc, i) => {
              const widthPct = Math.max(8, (Number(loc.percent || 0) / maxPct) * 100);
              return (
                <div key={loc.country || i} className="flex items-center gap-3">
                  <span className="text-[12px] font-normal text-[#94A3B8] w-4 tabular-nums">
                    {i + 1}
                  </span>
                  <span className="text-lg leading-none shrink-0">{getFlag(loc.country)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      <p className="text-[13px] font-normal text-[#475569] truncate">
                        {loc.country}
                      </p>
                      <span className="text-[13px] font-medium text-[#1A1D1F] tabular-nums shrink-0">
                        {loc.percent}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[#EEF1F0] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                        style={{
                          width: `${widthPct}%`,
                          backgroundColor: BLUE,
                          minWidth: loc.percent > 0 ? 8 : 0,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </PremiumCard>
  );
}
