'use client';

import { createContext, useContext } from 'react';

/**
 * Lets node cards trigger canvas-level actions (duplicate/delete/set start
 * node/card colour) without stuffing callback functions into React Flow's
 * node.data — which gets persisted to the backend on save.
 */
export const FlowActionsContext = createContext({
  startNodeKey: null,
  onEdit: () => {},
  onDuplicate: () => {},
  onDelete: () => {},
  onSetStartNode: () => {},
  onSetCardColor: () => {},
});

export function useFlowActions() {
  return useContext(FlowActionsContext);
}
