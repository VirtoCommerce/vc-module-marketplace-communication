const ALLOWED_FILE_TYPES = {
  // Images
  images: ".jpg,.jpeg,.png,.gif,.webp,.svg,.bmp,.ico,.tif,.tiff,.jfif,.jpe,.dib,.wdp,.wbmp,.xbm,.xpm",

  // Documents
  documents:
    ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.odt,.ods,.odp,.csv,.xps," +
    ".vsd,.vsdx,.vst,.vstx,.vssx,.vssm,.vsdm,.vstm,.docm,.dotx,.dotm,.xlsm,.xltx," +
    ".xltm,.xlsb,.ppsx,.ppsm,.potx,.potm,.pptm,.pub",
};

export function getAllowedFileTypes() {
  return Object.values(ALLOWED_FILE_TYPES).join(",");
}
