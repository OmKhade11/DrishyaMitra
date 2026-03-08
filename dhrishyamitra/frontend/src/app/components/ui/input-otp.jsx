import * as React from "react";
import { OTPInput, OTPInputContext } from "input-otp";
import { Minus } from "lucide-react";

import { cn } from "./utils";

function InputOTP({ className, containerClassName, ...props }) {
  return (
    <OTPInput
      containerClassName={cn(
        "flex items-center gap-2",
        containerClassName
      )}
      className={cn("disabled:opacity-50", className)}
      {...props}
    />
  );
}

function InputOTPGroup({ className, ...props }) {
  return (
    <div
      className={cn("flex items-center gap-1", className)}
      {...props}
    />
  );
}

function InputOTPSlot({ index, className, ...props }) {
  const inputOTPContext = React.useContext(OTPInputContext);
  const slot = inputOTPContext?.slots?.[index];

  const char = slot?.char;
  const hasFakeCaret = slot?.hasFakeCaret;
  const isActive = slot?.isActive;

  return (
    <div
      data-active={isActive}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center border rounded text-lg font-medium",
        isActive && "border-blue-500",
        className
      )}
      {...props}
    >
      {char}

      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-5 w-px bg-gray-800 animate-pulse" />
        </div>
      )}
    </div>
  );
}

function InputOTPSeparator(props) {
  return (
    <div role="separator" {...props}>
      <Minus className="w-4 h-4" />
    </div>
  );
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };