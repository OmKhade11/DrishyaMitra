"use client";

import React, { createContext, useContext, useState } from "react";
import { PanelLeft } from "lucide-react";
import { cn } from "./utils";
import { Button } from "./button";

const SidebarContext = createContext(null);

export function useSidebar() {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error("useSidebar must be used inside SidebarProvider");
  }

  return context;
}

export function SidebarProvider({ children }) {
  const [open, setOpen] = useState(true);

  const toggleSidebar = () => {
    setOpen((prev) => !prev);
  };

  return (
    <SidebarContext.Provider value={{ open, setOpen, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function Sidebar({ className, children }) {
  const { open } = useSidebar();

  return (
    <aside
      className={cn(
        "bg-gray-900 text-white h-screen transition-all duration-300",
        open ? "w-64" : "w-16",
        className
      )}
    >
      {children}
    </aside>
  );
}

export function SidebarTrigger({ className }) {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("m-2", className)}
      onClick={toggleSidebar}
    >
      <PanelLeft />
    </Button>
  );
}

export function SidebarHeader({ className, children }) {
  return (
    <div className={cn("p-4 border-b border-gray-700", className)}>
      {children}
    </div>
  );
}

export function SidebarContent({ className, children }) {
  return <div className={cn("p-4 flex flex-col gap-2", className)}>{children}</div>;
}

export function SidebarFooter({ className, children }) {
  return (
    <div className={cn("p-4 border-t border-gray-700 mt-auto", className)}>
      {children}
    </div>
  );
}

export function SidebarMenu({ className, children }) {
  return <ul className={cn("flex flex-col gap-2", className)}>{children}</ul>;
}

export function SidebarMenuItem({ className, children }) {
  return (
    <li
      className={cn(
        "p-2 rounded-md hover:bg-gray-800 cursor-pointer",
        className
      )}
    >
      {children}
    </li>
  );
}