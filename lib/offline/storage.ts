export interface PendingScoringAction {
  id: string; // client-side idempotency uuid
  matchId: string;
  type: "BALL" | "WICKET" | "UNDO";
  payload: any;
  timestamp: number;
}

const STORAGE_PREFIX = "cricket_scorer_offline_queue_";

export function getOfflineQueue(matchId: string): PendingScoringAction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${matchId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveToOfflineQueue(matchId: string, action: Omit<PendingScoringAction, "id" | "timestamp">) {
  if (typeof window === "undefined") return;
  try {
    const queue = getOfflineQueue(matchId);
    const newAction: PendingScoringAction = {
      ...action,
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
    };
    queue.push(newAction);
    localStorage.setItem(`${STORAGE_PREFIX}${matchId}`, JSON.stringify(queue));
    return newAction;
  } catch (err) {
    console.error("Failed to save offline action:", err);
  }
}

export function removeFromOfflineQueue(matchId: string, actionId: string) {
  if (typeof window === "undefined") return;
  try {
    const queue = getOfflineQueue(matchId);
    const updated = queue.filter((a) => a.id !== actionId);
    localStorage.setItem(`${STORAGE_PREFIX}${matchId}`, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to remove action from offline queue:", err);
  }
}

export function clearOfflineQueue(matchId: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${matchId}`);
  } catch (err) {
    console.error("Failed to clear offline queue:", err);
  }
}
