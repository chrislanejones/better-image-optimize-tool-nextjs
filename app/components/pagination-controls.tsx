"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { NavigationDirection } from "@/types/types";

interface SimplePaginationProps {
  currentPage: number;
  totalPages: number;
  onBackTen?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onForwardTen?: () => void;
  onNavigate?: (direction: NavigationDirection) => void; // Added for compatibility
  isDisabled?: boolean;
  className?: string;
}

function SimplePagination({
  currentPage,
  totalPages,
  onBackTen,
  onPrevious,
  onNext,
  onForwardTen,
  onNavigate, // Support the onNavigate prop used in other files
  isDisabled = false,
  className = "",
}: SimplePaginationProps) {
  // NOTE: We're removing the totalPages check to ensure the pagination control always renders

  // Create handlers that use either the direct handlers or onNavigate
  const handleBackTen = () => {
    if (onBackTen) {
      onBackTen();
    } else if (onNavigate) {
      onNavigate("prev10");
    }
  };

  const handlePrevious = () => {
    if (onPrevious) {
      onPrevious();
    } else if (onNavigate) {
      onNavigate("prev");
    }
  };

  const handleNext = () => {
    if (onNext) {
      onNext();
    } else if (onNavigate) {
      onNavigate("next");
    }
  };

  const handleForwardTen = () => {
    if (onForwardTen) {
      onForwardTen();
    } else if (onNavigate) {
      onNavigate("next10");
    }
  };

  // Always render the pagination controls
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* Back 10 images */}
      <Button
        variant="outline"
        onClick={handleBackTen}
        disabled={(currentPage === 1 && !onNavigate) || isDisabled}
        className="h-9 px-3"
        title="Back 10 images"
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>

      {/* Previous image */}
      <Button
        variant="outline"
        onClick={handlePrevious}
        disabled={(currentPage === 1 && !onNavigate) || isDisabled}
        className="h-9 px-3"
        title="Previous image"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Page indicator */}
      <span className="text-sm px-2 text-white">
        {currentPage} / {Math.max(totalPages, 1)}
      </span>

      {/* Next image */}
      <Button
        variant="outline"
        onClick={handleNext}
        disabled={(currentPage >= totalPages && !onNavigate) || isDisabled}
        className="h-9 px-3"
        title="Next image"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Forward 10 images */}
      <Button
        variant="outline"
        onClick={handleForwardTen}
        disabled={(currentPage >= totalPages && !onNavigate) || isDisabled}
        className="h-9 px-3"
        title="Forward 10 images"
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

export { SimplePagination };
export default SimplePagination;
