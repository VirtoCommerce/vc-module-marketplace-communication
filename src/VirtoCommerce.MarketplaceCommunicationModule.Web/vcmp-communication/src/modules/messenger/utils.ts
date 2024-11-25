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

export { formatDate, dateAgo };
