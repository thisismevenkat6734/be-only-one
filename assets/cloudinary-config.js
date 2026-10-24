/*
 * BE ONLY ONE
 * File: assets/js/cloudinary-config.js
 * Cloudinary unsigned media uploads
 */

export const CLOUDINARY_CONFIG = Object.freeze({
  cloudName: "lqfozcs3",
  uploadPreset: "create_your_own_identity",
  uploadEndpoint:
    "https://api.cloudinary.com/v1_1/lqfozcs3/auto/upload",
  maxVideoDurationSeconds: 30
});

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "audio/mpeg",
  "audio/mp4",
  "audio/aac",
  "audio/ogg",
  "audio/wav",
  "video/mp4",
  "video/webm",
  "video/quicktime"
]);

function getVideoDuration(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(file);

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute("src");
      video.load();
    };

    video.preload = "metadata";

    video.onloadedmetadata = () => {
      const duration = video.duration;
      cleanup();

      if (!Number.isFinite(duration)) {
        reject(new Error("Could not verify video duration."));
        return;
      }

      resolve(duration);
    };

    video.onerror = () => {
      cleanup();
      reject(new Error("Could not read the video file."));
    };

    video.src = objectUrl;
  });
}

export async function uploadMedia(file, onProgress) {
  if (!(file instanceof File)) {
    throw new Error("Please select a valid file.");
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("This media file type is not supported.");
  }

  const isVideo = file.type.startsWith("video/");
  const isAudio = file.type.startsWith("audio/");

  const maxBytes = isVideo
    ? 50 * 1024 * 1024
    : isAudio
      ? 20 * 1024 * 1024
      : 10 * 1024 * 1024;

  if (file.size > maxBytes) {
    throw new Error(
      isVideo
        ? "Video must be 50 MB or smaller."
        : isAudio
          ? "Audio must be 20 MB or smaller."
          : "Image must be 10 MB or smaller."
    );
  }

  if (isVideo) {
    const duration = await getVideoDuration(file);

    if (duration > CLOUDINARY_CONFIG.maxVideoDurationSeconds) {
      throw new Error("Videos must be 30 seconds or shorter.");
    }
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);

  onProgress?.(0);

  const response = await fetch(CLOUDINARY_CONFIG.uploadEndpoint, {
    method: "POST",
    body: formData
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result?.error?.message || "Cloudinary upload failed."
    );
  }

  if (!result.secure_url) {
    throw new Error("Cloudinary did not return a secure media URL.");
  }

  onProgress?.(100);

  return {
    assetId: result.asset_id || null,
    publicId: result.public_id || null,
    secureUrl: result.secure_url,
    resourceType: result.resource_type || null,
    format: result.format || null,
    bytes: result.bytes || file.size,
    duration: result.duration ?? null
  };
}
