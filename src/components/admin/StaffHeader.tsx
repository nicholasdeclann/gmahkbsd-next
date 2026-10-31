import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Box, Container } from "@mui/material";
import { churchConfig } from "@/config/church";
import { imageAsset } from "@/lib/asset";

/** Shared appearance only: authentication remains the responsibility of each route. */
export default function StaffHeader({ href = "/admin", subtitle = "Dashboard Staf", navigation, children }: { href?: string; subtitle?: string; navigation?: ReactNode; children: ReactNode }) {
  return <Box component="header" className="admin-header glass-header">
    <Container maxWidth="lg" sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      <div className="staff-brand"><Link href={href} className="staff-brand-link"><Image src={imageAsset(churchConfig.assets.logo)} width={34} height={34} alt=""/><span>GMAHK BSD<small>{subtitle}</small></span></Link></div>
      {navigation}
      <div className="header-icon-actions" style={{ marginLeft: "auto" }}>{children}</div>
    </Container>
  </Box>;
}
