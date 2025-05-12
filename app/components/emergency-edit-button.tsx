// app/components/emergency-edit-button.tsx
"use client";

import React, { useEffect, useState } from "react";
import { type ImageFile } from "@/types/editor";

// Define the props interface
interface EmergencyEditButtonProps {
  selectedImage: ImageFile | null;
  images: ImageFile[];
  onForceEditMode: () => void;
  onSelectImage: (image: ImageFile) => void;
}

// Define the component
const EmergencyEditButton: React.FC<EmergencyEditButtonProps> = ({
  selectedImage,
  images,
  onForceEditMode,
  onSelectImage,
}) => {
  const [isActive, setIsActive] = useState(false);

  // Register global handler that doesn't require params
  useEffect(() => {
    // Simple handler that doesn't need params
    const emergencyHandler = () => {
      console.log("EMERGENCY EDIT MODE ACTIVATED");
      setIsActive(true);

      // Ensure we have an image selected
      if (!selectedImage && images.length > 0) {
        console.log("Setting selected image in emergency mode");
        onSelectImage(images[0]);
      }

      // Force edit mode on
      onForceEditMode();

      // Visual feedback
      setTimeout(() => {
        setIsActive(false);
      }, 2000);
    };

    // Register global handler
    window.__EMERGENCY_EDIT_MODE = emergencyHandler;

    return () => {
      // Cleanup
      delete window.__EMERGENCY_EDIT_MODE;
    };
  }, [onForceEditMode, onSelectImage, selectedImage, images]);

  const triggerEmergencyMode = () => {
    console.log("Emergency button clicked");

    // Call the global handler directly, no params needed
    if (window.__EMERGENCY_EDIT_MODE) {
      window.__EMERGENCY_EDIT_MODE();
    }
  };

  return (
    <>
      {/* The emergency button */}
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 9999,
          backgroundColor: isActive ? "#00cc00" : "red",
          color: "white",
          padding: "10px",
          borderRadius: "4px",
          cursor: "pointer",
          boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
          transition: "background-color 0.3s ease",
        }}
        onClick={triggerEmergencyMode}
      >
        {isActive ? "ACTIVATING..." : "EMERGENCY EDIT MODE"}
      </div>

      {/* Overlay indicator when active */}
      {isActive && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(0, 204, 0, 0.9)",
            color: "white",
            padding: "8px 16px",
            borderRadius: "4px",
            fontWeight: "bold",
            zIndex: 9999,
          }}
        >
          EMERGENCY MODE ACTIVATED
        </div>
      )}
    </>
  );
};

// Define the global window interface
declare global {
  interface Window {
    __EMERGENCY_EDIT_MODE?: () => void;
  }
}

export default EmergencyEditButton;
