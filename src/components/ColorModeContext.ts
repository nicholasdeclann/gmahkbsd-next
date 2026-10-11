"use client";

import { createContext, useContext } from "react";

export const ColorModeContext = createContext({ dark: false, toggle: () => {} });
export const useColorMode = () => useContext(ColorModeContext);
