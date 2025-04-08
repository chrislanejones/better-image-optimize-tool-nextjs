// components/ui/slider.tsx
"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => {
  // Create a stable reference to the onValueChange handler
  const onValueChangeRef = React.useRef(props.onValueChange);

  // Update the ref when the prop changes
  React.useEffect(() => {
    onValueChangeRef.current = props.onValueChange;
  }, [props.onValueChange]);

  // Create a stable wrapper function that uses the ref
  const handleValueChange = React.useCallback(
    (value: number[]) => {
      if (onValueChangeRef.current) {
        onValueChangeRef.current(value);
      }
    },
    [] // No dependencies needed since we use the ref
  );

  // Remove the original onValueChange to avoid duplicate calls
  const { onValueChange, ...restProps } = props;

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      // Use our stable wrapper instead of the original prop
      onValueChange={handleValueChange}
      {...restProps}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
    </SliderPrimitive.Root>
  );
});

Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
