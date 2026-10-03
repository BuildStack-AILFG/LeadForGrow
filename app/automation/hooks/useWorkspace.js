'use client';

import { useState, useCallback } from 'react';

const DEFAULT_WORKSPACE = {
  id: 'ws_1',
  name: 'LeadForGrow HQ',
  plan: 'Growth',
  members: 3,
  createdAt: 'Jan 2025'
};

export function useWorkspace() {
  const [workspace, setWorkspace] = useState(DEFAULT_WORKSPACE);
  const [workspaces] = useState([DEFAULT_WORKSPACE]);

  const switchWorkspace = useCallback((id) => {
    const ws = workspaces.find((w) => w.id === id);
    if (ws) setWorkspace(ws);
  }, [workspaces]);

  return { workspace, workspaces, switchWorkspace };
}
