import moment from "moment";

const locale = window.navigator.language;

const formatDate = (date: Date | undefined) => {
  if (!date) return "";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const dateAgo = (date: Date | undefined) => {
  if (!date) return "";
  return moment(date).fromNow();
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

export { formatDate, dateAgo, truncateFileName };
