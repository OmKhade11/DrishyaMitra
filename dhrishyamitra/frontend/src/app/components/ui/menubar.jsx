import * as React from "react";
import * as MenubarPrimitive from "@radix-ui/react-menubar";
import { Check, ChevronRight, Circle } from "lucide-react";

import { cn } from "./utils";

function Menubar({ className, ...props }) {
  return (
    <MenubarPrimitive.Root
      className={cn(
        "flex h-9 items-center gap-1 rounded-md border bg-white p-1 shadow-sm",
        className
      )}
      {...props}
    />
  );
}

function MenubarMenu(props) {
  return <MenubarPrimitive.Menu {...props} />;
}

function MenubarGroup(props) {
  return <MenubarPrimitive.Group {...props} />;
}

function MenubarPortal(props) {
  return <MenubarPrimitive.Portal {...props} />;
}

function MenubarRadioGroup(props) {
  return <MenubarPrimitive.RadioGroup {...props} />;
}

function MenubarTrigger({ className, ...props }) {
  return (
    <MenubarPrimitive.Trigger
      className={cn(
        "flex items-center px-3 py-1.5 text-sm rounded hover:bg-gray-100 cursor-pointer",
        className
      )}
      {...props}
    />
  );
}

function MenubarContent({ className, align = "start", sideOffset = 8, ...props }) {
  return (
    <MenubarPrimitive.Portal>
      <MenubarPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "min-w-[8rem] rounded-md border bg-white p-1 shadow-md",
          className
        )}
        {...props}
      />
    </MenubarPrimitive.Portal>
  );
}

function MenubarItem({ className, ...props }) {
  return (
    <MenubarPrimitive.Item
      className={cn(
        "flex items-center px-2 py-1.5 text-sm rounded hover:bg-gray-100 cursor-pointer",
        className
      )}
      {...props}
    />
  );
}

function MenubarCheckboxItem({ className, children, checked, ...props }) {
  return (
    <MenubarPrimitive.CheckboxItem
      checked={checked}
      className={cn(
        "relative flex items-center pl-8 pr-2 py-1.5 text-sm rounded hover:bg-gray-100",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex items-center justify-center">
        <MenubarPrimitive.ItemIndicator>
          <Check className="w-4 h-4" />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {children}
    </MenubarPrimitive.CheckboxItem>
  );
}

function MenubarRadioItem({ className, children, ...props }) {
  return (
    <MenubarPrimitive.RadioItem
      className={cn(
        "relative flex items-center pl-8 pr-2 py-1.5 text-sm rounded hover:bg-gray-100",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex items-center justify-center">
        <MenubarPrimitive.ItemIndicator>
          <Circle className="w-3 h-3 fill-current" />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {children}
    </MenubarPrimitive.RadioItem>
  );
}

function MenubarLabel({ className, ...props }) {
  return (
    <MenubarPrimitive.Label
      className={cn("px-2 py-1.5 text-sm font-medium", className)}
      {...props}
    />
  );
}

function MenubarSeparator({ className, ...props }) {
  return (
    <MenubarPrimitive.Separator
      className={cn("my-1 h-px bg-gray-200", className)}
      {...props}
    />
  );
}

function MenubarShortcut({ className, ...props }) {
  return (
    <span
      className={cn("ml-auto text-xs text-gray-400 tracking-widest", className)}
      {...props}
    />
  );
}

function MenubarSub(props) {
  return <MenubarPrimitive.Sub {...props} />;
}

function MenubarSubTrigger({ className, children, ...props }) {
  return (
    <MenubarPrimitive.SubTrigger
      className={cn(
        "flex items-center px-2 py-1.5 text-sm rounded hover:bg-gray-100 cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto w-4 h-4" />
    </MenubarPrimitive.SubTrigger>
  );
}

function MenubarSubContent({ className, ...props }) {
  return (
    <MenubarPrimitive.SubContent
      className={cn(
        "min-w-[8rem] rounded-md border bg-white p-1 shadow-md",
        className
      )}
      {...props}
    />
  );
}

export {
  Menubar,
  MenubarPortal,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarGroup,
  MenubarSeparator,
  MenubarLabel,
  MenubarItem,
  MenubarShortcut,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
};