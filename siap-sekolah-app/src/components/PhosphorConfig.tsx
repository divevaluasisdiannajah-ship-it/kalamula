"use client";

import React from "react";
import { IconContext } from "@phosphor-icons/react";

export function PhosphorConfig({ children }: { children: React.ReactNode }) {
  return (
    <IconContext.Provider
      value={{
        weight: "light",
        mirrored: false,
      }}
    >
      {children}
    </IconContext.Provider>
  );
}
