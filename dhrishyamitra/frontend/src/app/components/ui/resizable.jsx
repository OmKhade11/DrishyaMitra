import * as React from "react";
import { GripVertical } from "lucide-react";
import * as ResizablePrimitive from "react-resizable-panels";

import { cn } from "./utils";

function ResizablePanelGroup({ className, ...props }) {
  return (
    <ResizablePrimitive.PanelGroup
      className={cn("flex h-full w-full", className)}
      {...props}
    />
  );
}

function ResizablePanel(props) {
  return <ResizablePrimitive.Panel {...props} />;
}

function ResizableHandle({ withHandle, className, ...props }) {
  return (
    <ResizablePrimitive.PanelResizeHandle
      className={cn(
        "relative flex items-center justify-center bg-gray-200",
        "hover:bg-gray-300 transition-colors",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="flex items-center justify-center rounded border bg-white p-1 shadow">
          <GripVertical className="h-3 w-3" />
        </div>
      )}
    </ResizablePrimitive.PanelResizeHandle>
  );
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };