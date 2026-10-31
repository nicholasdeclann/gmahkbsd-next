"use client";
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { notificationQueue, type Notice, type NoticeType } from "@/lib/notificationQueue";
import { CloseIcon } from "../icons";
import "./notifications.css";

export type NotifyInput = { type: NoticeType; message: string; key?: string; action?: Notice["action"] };
interface NotificationContextValue {
  notify: (input: NotifyInput) => string;
  dismiss: (key: string) => void;
  scope: (id: string, element: HTMLElement | null) => void;
}
const Context = createContext<NotificationContextValue | null>(null);
export function useNotifications() {
  const value = useContext(Context);
  if (!value) throw new Error("NotificationProvider is missing");
  return value;
}

/** Existing action handlers can retain their local error flags without rendering banners.
 * Notifications are emitted by the handler's setter, never by an effect watching messages. */
export function useActionNotice(type: NoticeType, key?: string, action?: Notice["action"]) {
  const { notify, dismiss } = useNotifications();
  const id = useId();
  const [message, setMessage] = useState("");
  const latest = useRef({ notify, dismiss, type, key: key ?? id, action });
  latest.current = { notify, dismiss, type, key: key ?? id, action };
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; latest.current.dismiss(latest.current.key); }; }, []);
  const update = useCallback((text: string) => {
    if (!alive.current) return;
    const current = latest.current;
    setMessage(text);
    if (text) current.notify({ type: current.type, message: text, key: current.key, action: current.action });
    else current.dismiss(current.key);
  }, []);
  return [message, update] as const;
}

export function useNotificationScope(id: string, element: HTMLElement | null) {
  const { scope } = useNotifications();
  useEffect(() => { if (element) scope(id, element); return () => scope(id, null); }, [scope, id, element]);
}

export default function NotificationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [queue, dispatch] = useReducer(notificationQueue, []);
  const [scopes, setScopes] = useState<{ id: string; element: HTMLElement }[]>([]);
  const [mounted, setMounted] = useState(false);
  const [offset, setOffset] = useState(80);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const paused = hovered || focused;
  const [hidden, setHidden] = useState(false);
  const sequence = useRef(0);
  const remaining = useRef(6000);
  const activeId = useRef("");
  const pathRef = useRef(pathname); pathRef.current = pathname;
  const host = useRef<HTMLDivElement>(null);
  const hostId = useId();
  const current = queue.find(n => n.scope === pathname);
  const target = scopes.at(-1)?.element;
  // Stay inside MUI's focus-trap container, outside the animated/draggable paper.
  const portalTarget = target?.closest<HTMLElement>(".MuiDialog-container");
  useEffect(() => {
    if (!target || !current) return;
    const previous = target.getAttribute("aria-owns");
    target.setAttribute("aria-owns", [previous, hostId].filter(Boolean).join(" "));
    return () => { if (previous) target.setAttribute("aria-owns", previous); else target.removeAttribute("aria-owns"); };
  }, [target, Boolean(current), hostId]);
  const notify = useCallback((input: NotifyInput) => {
    const key = input.key ?? `notice-${++sequence.current}`;
    dispatch({ type: "notify", notice: { ...input, key, id: String(++sequence.current), scope: pathRef.current } });
    return key;
  }, []);
  const dismiss = useCallback((key: string) => dispatch({ type: "dismiss", key }), []);
  const scope = useCallback((id: string, element: HTMLElement | null) => {
    setScopes(previous => [...previous.filter(s => s.id !== id), ...(element ? [{ id, element }] : [])]);
  }, []);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { dispatch({ type: "route", scope: pathname }); setHovered(false); setFocused(false); }, [pathname]);
  useEffect(() => {
    const visibility = () => setHidden(document.hidden);
    visibility(); document.addEventListener("visibilitychange", visibility);
    return () => document.removeEventListener("visibilitychange", visibility);
  }, []);
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      const header = document.querySelector<HTMLElement>(".admin-header, .site-header");
      setOffset(Math.max(12, header?.getBoundingClientRect().bottom ?? 0) + 12);
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    const header = document.querySelector(".admin-header, .site-header"); if (header) observer.observe(header);
    measure(); window.addEventListener("resize", schedule); window.addEventListener("scroll", schedule, { passive: true });
    window.visualViewport?.addEventListener("resize", schedule);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); window.removeEventListener("resize", schedule); window.removeEventListener("scroll", schedule); window.visualViewport?.removeEventListener("resize", schedule); };
  }, [pathname]);
  useEffect(() => {
    if (!current) { activeId.current = ""; return; }
    if (activeId.current !== current.id) { activeId.current = current.id; remaining.current = 6000; }
    if (current.type === "error" || paused || hidden) return;
    const started = Date.now();
    const timer = window.setTimeout(() => dismiss(current.key), remaining.current);
    return () => { clearTimeout(timer); remaining.current = Math.max(0, remaining.current - (Date.now() - started)); };
  }, [current, paused, hidden, dismiss]);
  useEffect(() => { setHovered(false); setFocused(false); }, [current?.id, target]);
  const value = useMemo(() => ({ notify, dismiss, scope }), [notify, dismiss, scope]);
  const icon = current?.type === "success" ? <path d="m5 12 4 4L19 6"/> : current?.type === "error" ? <><path d="m9 9 6 6m0-6-6 6"/><circle cx="12" cy="12" r="9"/></> : <><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/></>;
  const notice = current && <div ref={host} id={hostId} className="notice-host" style={{ top: `max(${offset}px, env(safe-area-inset-top, 0px))` }}>
    <div key={current.id} className={`glass-notice glass-notice--${current.type}`} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      <svg className="glass-notice-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icon}</svg>
      <div className="glass-notice-content">
        <div role={current.type === "error" ? "alert" : "status"} aria-live={current.type === "error" ? "assertive" : "polite"} aria-atomic="true"><strong className="glass-sr-only">{t(current.type === "success" ? "Berhasil" : current.type === "error" ? "Terjadi kesalahan" : "Informasi")}. </strong>{t(current.message)}</div>
        {current.action && <button className="glass-notice-action" type="button" onClick={() => { dismiss(current.key); current.action!.onClick(); }}>{t(current.action.label)}</button>}
      </div>
      <button className="glass-notice-close" type="button" aria-label={t("Tutup notifikasi")} onClick={() => dismiss(current.key)}><CloseIcon aria-hidden="true"/></button>
    </div>
  </div>;
  return <Context.Provider value={value}>{children}{mounted && notice && createPortal(notice, portalTarget ?? document.body)}</Context.Provider>;
}
