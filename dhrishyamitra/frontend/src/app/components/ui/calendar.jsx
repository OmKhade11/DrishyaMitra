"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "./utils";
import { buttonVariants } from "./button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months
        month
        caption
        caption_label
        nav
        nav_button
          buttonVariants({ variant),
          "size-7 bg-transparent p-0 opacity-50 hover
        ),
        nav_button_previous
        nav_button_next
        table
        head_row
        head_cell:
          "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
        row
        cell
          "relative p-0 text-center text-sm focus-within)])]
          props.mode === "range"
            ? "[&)])])])]
            )]
        ),
        day
          buttonVariants({ variant),
          "size-8 p-0 font-normal aria-selected
        ),
        day_range_start:
          "day-range-start aria-selected
        day_range_end:
          "day-range-end aria-selected
        day_selected:
          "bg-primary text-primary-foreground hover
        day_today
        day_outside:
          "day-outside text-muted-foreground aria-selected
        day_disabled
        day_range_middle:
          "aria-selected
        day_hidden
        ...classNames,
      }}
      components={{
        IconLeft) => (
          <ChevronLeft className={cn("size-4", className)} {...props} />
        ),
        IconRight) => (
          <ChevronRight className={cn("size-4", className)} {...props} />
        ),
      }}
      {...props}
    />
  );
}

export { Calendar };
