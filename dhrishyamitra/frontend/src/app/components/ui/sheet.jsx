"use client";

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "./utils";

export function Sheet(props) {
  return <SheetPrimitive.Root {...props} />;
}

export function SheetTrigger(props) {
  return <SheetPrimitive.Trigger {...props} />;
}

export function SheetClose(props) {
  return <SheetPrimitive.Close {...props} />;
}

export function SheetPortal(props) {
  return <SheetPrimitive.Portal {...props} />;
}

export function SheetOverlay({ className, ...props }) {
  return (
    <SheetPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
}

export function SheetContent({
  className,
  children,
  side = "right",
  ...props
}) {
  return (
    <SheetPortal>
      <SheetOverlay />

      <SheetPrimitive.Content
        className={cn(
          "fixed z-50 bg-white shadow-lg",

          side === "right" && "right-0 top-0 h-full w-[350px]",
          side === "left" && "left-0 top-0 h-full w-[350px]",
          side === "top" && "top-0 left-0 w-full h-[300px]",
          side === "bottom" && "bottom-0 left-0 w-full h-[300px]",

          className
        )}
        {...props}
      >
        {children}

        <SheetPrimitive.Close className="absolute right-4 top-4 opacity-70 hover:opacity-100">
          <X className="h-4 w-4" />
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

export function SheetHeader({ className, ...props }) {
  return (
    <div
      className={cn("flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
}

export function SheetFooter({ className, ...props }) {
  return (
    <div
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
}

export function SheetTitle({ className, ...props }) {
  return (
    <SheetPrimitive.Title
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  );
}

export function SheetDescription({ className, ...props }) {
  return (
    <SheetPrimitive.Description
      className={cn("text-sm text-gray-500", className)}
      {...props}
    />
  );
}