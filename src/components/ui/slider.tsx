"use client"

import * as React from "react"
import ReactSlider from "react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  ReactSlider,
  React.ComponentProps<typeof ReactSlider>
>(({ className, ...props }, ref) => (
  <ReactSlider
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
    renderThumb={(props, state) => (
      <div
        {...props}
        className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      />
    )}
    renderTrack={(props, state) => (
      <div
        {...props}
        className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary"
      >
        <div
          className="absolute h-full bg-primary"
          style={{ width: `${state.valueNow}%` }}
        />
      </div>
    )}
  />
))
Slider.displayName = "Slider"

export { Slider }
