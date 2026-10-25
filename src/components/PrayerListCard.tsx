"use client";
import { useEffect, useState } from "react";
import { T } from "./LanguageProvider";
import { churchConfig } from "@/config/church";

interface PrayerItem {
  id: number;
  name: string;
  note: string | null;
}

export default function PrayerListCard({ showHeading = true }: { showHeading?: boolean }) {
  const [items, setItems] = useState<PrayerItem[] | null>(null);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    if (!churchConfig.prayerList.enabled) return;
    let cancelled = false;
    fetch("/api/prayer", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setItems(data.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!churchConfig.prayerList.enabled) return null;
  if (!available || !items || items.length === 0) return null;

  return (
    <div className="site-width prayer-open-list">
      {showHeading && (
        <h3 className="prayer-open-heading">
          <T text={churchConfig.prayerList.title} />
        </h3>
      )}
      <ul className="prayer-rows">
        {items.map((item) => (
          <li className="prayer-row" key={item.id}>
            <strong>
              {item.id}. {item.name}
            </strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
