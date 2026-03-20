import { useTimeAgo } from "@vueuse/core";
import { computed, type MaybeRefOrGetter, toValue } from "vue";

const locale = window.navigator.language;

const formatDate = (date: Date | undefined) => {
  if (!date) return "";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

// Returns a reactive ref that auto-updates
const createTimeAgo = (date: MaybeRefOrGetter<Date | undefined>) => {
  return useTimeAgo(computed(() => toValue(date) || new Date()));
};

// Static version for non-reactive contexts (e.g., conversation list)
const dateAgo = (date: Date | undefined) => {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(date);
};

const truncateFileName = (fileName: string | undefined, maxLength = 20) => {
  if (!fileName) return "";
  const lastDotIndex = fileName.lastIndexOf(".");
  if (lastDotIndex === -1) return fileName;
  const name = fileName.slice(0, lastDotIndex);
  const extension = fileName.slice(lastDotIndex);
  if (fileName.length <= maxLength) return fileName;
  const truncatedLength = maxLength - extension.length - 1;
  return `${name.slice(0, truncatedLength)}...${extension}`;
};

export { formatDate, dateAgo, createTimeAgo, truncateFileName };
