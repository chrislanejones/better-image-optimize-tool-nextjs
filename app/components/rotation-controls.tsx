import React, { useState, useCallback } from "react";
import {
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  RotateCcw as Reset,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { RotationControlsProps } from "@/types/types";
export const RotationControls: React.FC<RotationControlsProps> = ({
  onRotate,
  onFlipHorizontal,
  onFlipVertical,
  onReset,
  currentRotation = 0,
}) => {
  const [rotation, setRotation] = useState(currentRotation);
  const [isAdjusting, setIsAdjusting] = useState(false);

  const handleRotationChange = useCallback((values: number[]) => {
    const newRotation = values[0];
    setRotation(newRotation);
    setIsAdjusting(true);
  }, []);

  const handleRotationCommit = useCallback(() => {
    if (isAdjusting) {
      onRotate(rotation);
      setIsAdjusting(false);
    }
  }, [rotation, isAdjusting, onRotate]);

  const handleQuickRotate = useCallback(
    (degrees: number) => {
      const newRotation = (currentRotation + degrees) % 360;
      setRotation(newRotation);
      onRotate(newRotation);
    },
    [currentRotation, onRotate]
  );

  return (
    <div className="bg-gray-700 p-4 rounded-lg space-y-4">
      <h3 className="text-sm font-medium text-white mb-2">Rotation & Flip</h3>

      {/* Fine rotation control */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm text-white">Rotation</label>
          <span className="text-sm text-gray-300">{rotation}°</span>
        </div>
        <Slider
          value={[rotation]}
          min={-180}
          max={180}
          step={1}
          onValueChange={handleRotationChange}
          onPointerUp={handleRotationCommit}
          onKeyUp={handleRotationCommit}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>-180°</span>
          <span>0°</span>
          <span>180°</span>
        </div>
      </div>

      {/* Apply button for fine adjustments */}
      {isAdjusting && (
        <Button
          onClick={handleRotationCommit}
          variant="default"
          size="sm"
          className="w-full"
        >
          Apply Rotation
        </Button>
      )}
    </div>
  );
};
