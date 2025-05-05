// store/hooks/useImageProcessing.ts
import { useCallback } from "react";
import { useImageStore } from "../useImageStore";
import { useImageActions } from "../useImageActions";
import { PixelCrop } from "react-image-crop";
import {
  cropImage,
  resizeImage,
  getMimeType,
  calculateSizeReduction,
} from "../../app/utils/image-utils";

export const useImageProcessing = () => {
  const actions = useImageActions();
  const { selectedImage, format } = useImageStore();

  const handleCropComplete = useCallback(
    async (crop: PixelCrop, imgElement: HTMLImageElement) => {
      try {
        const croppedUrl = await cropImage(imgElement, crop, format as any);

        actions.setWidth(crop.width);
        actions.setHeight(crop.height);
        actions.setPreviewUrl(croppedUrl);
        actions.setHasEdited(true);

        // Fetch blob for stats
        const blob = await fetch(croppedUrl).then((r) => r.blob());

        actions.setNewStats({
          width: crop.width,
          height: crop.height,
          size: blob.size,
          format: format,
        });

        const state = useImageStore.getState();
        if (state.originalStats) {
          const savings = calculateSizeReduction(
            state.originalStats.size,
            blob.size
          );
          actions.setDataSavings(savings);
        }
      } catch (error) {
        console.error("Error cropping image:", error);
      }
    },
    [actions, format]
  );

  const handleResize = useCallback(
    (newWidth: number, newHeight: number) => {
      actions.setWidth(newWidth);
      actions.setHeight(newHeight);
    },
    [actions]
  );

  const handleResizeApply = useCallback(async () => {
    const state = useImageStore.getState();
    if (!state.selectedImage || !state.imageRef?.current) return;

    try {
      const resizedUrl = await resizeImage(
        state.imageRef.current,
        state.width,
        state.height,
        state.format as any
      );

      actions.setPreviewUrl(resizedUrl);
      actions.setHasEdited(true);

      const blob = await fetch(resizedUrl).then((r) => r.blob());

      actions.setNewStats({
        width: state.width,
        height: state.height,
        size: blob.size,
        format: state.format,
      });

      if (state.originalStats) {
        const savings = calculateSizeReduction(
          state.originalStats.size,
          blob.size
        );
        actions.setDataSavings(savings);
      }
    } catch (error) {
      console.error("Error resizing image:", error);
    }
  }, [actions]);

  const downloadImage = useCallback(() => {
    const state = useImageStore.getState();
    if (!state.canvasRef?.current || !state.selectedImage?.file?.name) return;

    const canvas = state.canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx || !state.imageRef?.current) return;

    canvas.width = state.imageRef.current.naturalWidth;
    canvas.height = state.imageRef.current.naturalHeight;
    ctx.drawImage(state.imageRef.current, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          const fileName =
            state.selectedImage!.file.name.split(".")[0] || "image";
          a.download = `${fileName}-edited.${
            state.format === "webp"
              ? "webp"
              : state.format === "jpeg"
              ? "jpg"
              : "png"
          }`;
          a.click();
          URL.revokeObjectURL(url);
        }
      },
      getMimeType(state.format),
      0.9
    );
  }, []);

  return {
    handleCropComplete,
    handleResize,
    handleResizeApply,
    downloadImage,
  };
};
