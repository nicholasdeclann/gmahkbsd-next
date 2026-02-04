import { Card, CardProps } from "@mui/material";
import { ReactNode } from "react";

interface GlassCardProps extends Omit<CardProps, "sx"> {
  children: ReactNode;
  borderLeft?: string;
  sx?: CardProps["sx"];
}

export default function GlassCard({
  children,
  borderLeft,
  sx = {},
  ...props
}: GlassCardProps) {
  return (
    <Card
      {...props}
      sx={{
        bgcolor: "rgba(255, 255, 255, 0.7)",
        backdropFilter: "blur(10px)",
        borderRadius: 3,
        border: "1px solid rgba(255, 255, 255, 0.3)",
        ...(borderLeft && { borderLeft }),
        boxShadow: "0 4px 16px 0 rgba(46, 108, 232, 0.1)",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 6px 20px 0 rgba(46, 108, 232, 0.2)",
        },
        ...sx,
      }}
    >
      {children}
    </Card>
  );
}
