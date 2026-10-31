export type NoticeType = "success" | "error" | "info";
export interface Notice {
  id: string; key: string; scope: string; type: NoticeType; message: string;
  action?: { label: string; onClick: () => void };
}
export type NoticeEvent = { type: "notify"; notice: Notice } | { type: "dismiss"; key: string } | { type: "route"; scope: string };
export function notificationQueue(state: Notice[], event: NoticeEvent): Notice[] {
  if (event.type === "dismiss") return state.filter(n => n.key !== event.key);
  if (event.type === "route") return state.filter(n => n.scope === event.scope);
  const next = event.notice;
  const match = state.find(n => n.key === next.key);
  if (match?.message === next.message && match.type === next.type) return state;
  const rest = state.filter(n => n.key !== next.key);
  if (match && state[0]?.key === next.key) return [next, ...rest].slice(0, 4);
  if (next.type === "error") {
    if (rest[0]?.type === "error") return [rest[0], next, ...rest.slice(1)].slice(0, 4);
    return [next, ...rest].slice(0, 4);
  }
  return [...rest, next].slice(0, 4);
}
