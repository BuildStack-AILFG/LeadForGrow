'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { BusinessAssistantProvider, useBusinessAssistant } from '../../context/BusinessAssistantContext';
import BusinessAssistantFab from './BusinessAssistantFab';

// The panel (and the animation library it uses) is downloaded the first time someone opens
// the assistant, not on every page load.
const BusinessAssistantPanel = dynamic(() => import('./BusinessAssistantPanel'), { ssr: false });

function LazyPanel() {
  const { isOpen } = useBusinessAssistant();
  const [wanted, setWanted] = useState(false);
  useEffect(() => {
    if (isOpen) setWanted(true);
  }, [isOpen]);
  // Stays mounted after the first open so its close animation still plays.
  return wanted ? <BusinessAssistantPanel /> : null;
}

export default function BusinessAssistantRoot({ children }) {
  return (
    <BusinessAssistantProvider>
      {children}
      <LazyPanel />
      <BusinessAssistantFab />
    </BusinessAssistantProvider>
  );
}

export { BusinessAssistantTrigger } from './BusinessAssistantFab';
