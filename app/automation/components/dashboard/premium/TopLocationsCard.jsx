'use client';

import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { ComposableMap, Geographies, Geography, Sphere, Graticule } from 'react-simple-maps';
import PremiumCard from './PremiumCard';
import WidgetMenu from './WidgetMenu';

// World topojson served from CDN — no local asset needed. Loaded client-side
// by react-simple-maps.
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// Our stored country strings → the names used in the world-atlas dataset.
// Anything not listed matches by its own name (India, Canada, Germany, …).
const ATLAS_NAME = {
  'united states': 'United States of America',
  usa: 'United States of America',
  uk: 'United Kingdom',
  'united kingdom': 'United Kingdom',
  uae: 'United Arab Emirates',
  'united arab emirates': 'United Arab Emirates',
};

const BLUE = '#059669';
const BLUE_SOFT = '#10B981';
const MAP_IDLE = '#DCE3D8';   // land (soft sage)
const OCEAN = '#DBEAF7';      // water
const GRID = '#C4DAEC';       // faint lat/long lines
const BORDER = '#F4F7F2';     // country outlines

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

/** Real world map (react-simple-maps) with customer countries highlighted. */
function SimpleWorldMap({ highlightCountries = [] }) {
  const highlights = new Set(
    highlightCountries
      .filter(Boolean)
      .map((c) => (ATLAS_NAME[c.toLowerCase()] || c).toLowerCase())
  );

  return (
    <div className="rounded-[12px] border border-[#E8ECEF] overflow-hidden" style={{ backgroundColor: OCEAN }}>
      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{ scale: 145 }}
        width={420}
        height={190}
        style={{ width: '100%', height: 'auto', maxHeight: 150 }}
      >
        {/* Ocean + faint graticule for a real-map feel */}
        <Sphere stroke={GRID} strokeWidth={0.4} fill={OCEAN} />
        <Graticule stroke={GRID} strokeWidth={0.3} />
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies
              // Antarctica adds dead space at the bottom — drop it.
              .filter((geo) => geo.properties?.name !== 'Antarctica')
              .map((geo) => {
                const name = geo.properties?.name || '';
                const active = highlights.has(name.toLowerCase());
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={active ? BLUE : MAP_IDLE}
                    stroke={active ? BLUE_SOFT : BORDER}
                    strokeWidth={active ? 0.5 : 0.4}
                    style={{
                      default: { outline: 'none' },
                      hover: { fill: active ? BLUE_SOFT : '#CBD8C2', outline: 'none' },
                      pressed: { outline: 'none' },
                    }}
                  />
                );
              })
          }
        </Geographies>
      </ComposableMap>
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
