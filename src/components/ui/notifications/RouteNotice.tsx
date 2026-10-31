"use client";
import { useEffect } from "react";
import { useNotifications, type NotifyInput } from "./NotificationProvider";
/** A server redirect result is an arrival event, not a message-state observer. */
export default function RouteNotice({ type, message, noticeKey }: NotifyInput & { noticeKey: string }) {
  const { notify } = useNotifications();
  useEffect(() => { notify({ type, message, key: noticeKey }); }, [notify, type, message, noticeKey]);
  return null;
}
