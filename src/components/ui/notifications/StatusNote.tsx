import { Box, type BoxProps } from "@mui/material";
import type { ReactNode } from "react";

/** Persistent page information, deliberately not an action notification. */
export default function StatusNote({ children, action, severity: _severity, ...props }: BoxProps & { action?: ReactNode; severity?: string }) {
  return <Box {...props} className={`persistent-status ${props.className ?? ""}`} sx={{ color: "text.secondary", fontSize: 14, lineHeight: 1.6, mb: 2, ...props.sx }}><div>{children}</div>{action}</Box>;
}
