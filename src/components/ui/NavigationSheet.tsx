"use client";
import {type ReactNode} from "react";
import {ThemeProvider} from "@mui/material/styles";
import {useColorMode} from "../ColorModeContext";
import {createSiteTheme} from "@/app/theme";
import GlassDialog from "./glass/GlassDialog";
const themes={light:createSiteTheme(false),dark:createSiteTheme(true)};
export default function NavigationSheet({open,onClose,title,children}:{open:boolean;onClose:()=>void;title:string;children:ReactNode}){
 const {dark}=useColorMode();return <ThemeProvider theme={dark?themes.dark:themes.light}><GlassDialog open={open} onClose={onClose} title={title} className="navigation-sheet"><div className="sheet-content">{children}</div></GlassDialog></ThemeProvider>;
}