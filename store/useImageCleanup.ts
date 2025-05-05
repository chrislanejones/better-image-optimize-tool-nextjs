// store/useImageCleanup.ts
import { useEffect } from "react";
import { useImageStore } from "./useImageStore";

export const useImageCleanup = () => {
  useEffect(() => {
    const cleanup = useImageStore.getState().cleanupObjectURLs;
    return cleanup;
  }, []);
};
