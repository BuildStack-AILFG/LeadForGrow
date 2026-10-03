'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAccess } from '../../context/AccessContext';

// Downloaded the first time an upgrade prompt is needed, not on every page load.
const UpgradeGateModal = dynamic(() => import('./UpgradeGateModal'), { ssr: false });

export default function UpgradeGateModalLazy() {
  const { upgradeModal } = useAccess();
  const [wanted, setWanted] = useState(false);
  useEffect(() => {
    if (upgradeModal?.open) setWanted(true);
  }, [upgradeModal?.open]);
  return wanted ? <UpgradeGateModal /> : null;
}
