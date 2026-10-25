import type { ReactNode } from "react";
import "./settings.css";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <div className="settings-area">{children}</div>;
}
