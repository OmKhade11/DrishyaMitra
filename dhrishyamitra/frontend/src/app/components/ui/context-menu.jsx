import * as React from "react";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { Check, ChevronRight, Circle } from "lucide-react";
import { cn } from "./utils";

function ContextMenu(props) {
  return <ContextMenuPrimitive.Root {...props} />;
}

function ContextMenuTrigger(props) {
  return <ContextMenuPrimitive.Trigger {...props} />;
}

function ContextMenuGroup(props) {
  return <ContextMenuPrimitive.Group {...props} />;
}

function ContextMenuPortal(props) {
  return <ContextMenuPrimitive.Portal {...props} />;
}

function ContextMenuSub(props) {
  return <ContextMenuPrimitive.Sub {...props} />;
}

function ContextMenuRadioGroup(props) {
  return <ContextMenuPrimitive.RadioGroup {...props} />;
}

function ContextMenuSubTrigger({ className, children, ...props }) {
  return (
    <ContextMenuPrimitive.SubTrigger
      className={cn(
        "flex items-center px-2 py-1.5 text-sm rounded hover:bg-gray-100 cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto w-4 h-4" />
    </ContextMenuPrimitive.SubTrigger>
  );
}

function ContextMenuSubContent({ className, ...props }) {
  return (
    <ContextMenuPrimitive.SubContent
      className={cn(
        "min-w-[8rem] rounded-md border bg-white p-1 shadow-md",
        className
      )}
      {...props}
    />
  );
}

function ContextMenuContent({ className, ...props }) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        className={cn(
          "min-w-[8rem] rounded-md border bg-white p-1 shadow-md",
          className
        )}
        {...props}
      />
    </ContextMenuPrimitive.Portal>
  );
}

function ContextMenuItem({ className, ...props }) {
  return (
    <ContextMenuPrimitive.Item
      className={cn(
        "flex items-center px-2 py-1.5 text-sm rounded hover:bg-gray-100 cursor-pointer",
        className
      )}
      {...props}
    />
  );
}

function ContextMenuCheckboxItem({ className, children, checked, ...props }) {
  return (
    <ContextMenuPrimitive.CheckboxItem
      className={cn(
        "relative flex items-center pl-8 pr-2 py-1.5 text-sm rounded hover:bg-gray-100",
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="absolute left-2 flex items-center justify-center">
        <ContextMenuPrimitive.ItemIndicator>
          <Check className="w-4 h-4" />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.CheckboxItem>
  );
}

function ContextMenuRadioItem({ className, children, ...props }) {
  return (
    <ContextMenuPrimitive.RadioItem
      className={cn(
        "relative flex items-center pl-8 pr-2 py-1.5 text-sm rounded hover:bg-gray-100",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex items-center justify-center">
        <ContextMenuPrimitive.ItemIndicator>
          <Circle className="w-3 h-3 fill-current" />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.RadioItem>
  );
}

function ContextMenuLabel({ className, ...props }) {
  return (
    <ContextMenuPrimitive.Label
      className={cn("px-2 py-1.5 text-sm font-medium", className)}
      {...props}
    />
  );
}

function ContextMenuSeparator({ className, ...props }) {
  return (
    <ContextMenuPrimitive.Separator
      className={cn("my-1 h-px bg-gray-200", className)}
      {...props}
    />
  );
}

function ContextMenuShortcut({ className, ...props }) {
  return (
    <span
      className={cn("ml-auto text-xs text-gray-400 tracking-widest", className)}
      {...props}
    />
  );
}

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
};