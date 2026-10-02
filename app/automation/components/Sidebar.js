'use client';

import { Suspense } from 'react';
import SidebarInner from './layout/Sidebar';

function SidebarFallback() {
  return (
    <aside className="w-[240px] h-screen flex-shrink-0 bg-sidebar border-r border-line" />
  );
}

export default function Sidebar() {
  return (
    <Suspense fallback={<SidebarFallback />}>
      <SidebarInner />
    </Suspense>
  );
}
