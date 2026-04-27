const fileThumbnails = [
  { image: "lucide-file-text", extensions: ["pdf"] },
  { image: "lucide-file-text", extensions: ["doc", "docx"] },
  { image: "lucide-file-spreadsheet", extensions: ["xls", "xlsx"] },
  { image: "lucide-presentation", extensions: ["ppt", "pptx"] },
  { image: "lucide-file-spreadsheet", extensions: ["csv"] },
  { image: "lucide-file-archive", extensions: ["zip"] },
  { image: "lucide-file-audio", extensions: ["mp3", "aac"] },
  { image: "lucide-file-video", extensions: ["mp4", "avi"] },
];

const imageExtensions = new Set(["png", "jpg", "jpeg", "svg", "gif", "webp"]);

function getExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase();
}

function isImage(name: string | undefined) {
  if (!name) return false;
  return imageExtensions.has(getExtension(name) ?? "");
}

function getFileThumbnail(name: string | undefined) {
  if (!name) return "lucide-file";
  return (
    fileThumbnails.find((thumb) => thumb.extensions.some((ext) => ext === getExtension(name)))?.image || "lucide-file"
  );
}

const extensionColors: Record<string, string> = {
  pdf: "var(--danger-500)",
  doc: "var(--primary-500)",
  docx: "var(--primary-500)",
  xls: "var(--success-500)",
  xlsx: "var(--success-500)",
  csv: "var(--success-500)",
  ppt: "var(--warning-600)",
  pptx: "var(--warning-600)",
  zip: "var(--warning-500)",
  rar: "var(--warning-500)",
  "7z": "var(--warning-500)",
};

function getExtensionColor(name: string | undefined): string {
  if (!name) return "var(--info-500)";
  const ext = getExtension(name) ?? "";
  return extensionColors[ext] ?? "var(--info-500)";
}

function readableSize(bytes: number | undefined, decimals = 2) {
  if (!bytes) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

const createThumbnailLink = (url: string | undefined) => {
  if (!url) return "";

  const lastDotIndex = url.lastIndexOf(".");
  if (lastDotIndex === -1) return url;

  const thumbnailUrl = url.substring(0, lastDotIndex) + "_md." + url.substring(lastDotIndex + 1);

  const img = new Image();
  img.onerror = () => {
    const imgElement = document.querySelector(`img[src="${thumbnailUrl}"]`);
    if (imgElement) {
      (imgElement as HTMLImageElement).src = url;
    }
  };
  img.src = thumbnailUrl;

  return thumbnailUrl;
};

export {
  imageExtensions,
  getExtension,
  isImage,
  getFileThumbnail,
  getExtensionColor,
  readableSize,
  createThumbnailLink,
};
