import { useSyncExternalStore } from 'react';

let labels: Record<string, string> = {};
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return labels;
}

export function setBreadcrumbLabel(segment: string, label: string) {
  labels = { ...labels, [segment]: label };
  for (const listener of listeners) listener();
}

export function useBreadcrumbLabels() {
  return useSyncExternalStore(subscribe, getSnapshot);
}
