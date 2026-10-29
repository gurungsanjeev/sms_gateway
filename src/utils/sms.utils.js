

// string containing the characters supported by the standard GSM 7 bit alphabet used for SMS
const GSM_BASIC =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";

  // contain additional characters supported by GMS SMS
const GSM_EXTENSION = "^{}\\[~]|€\f";

export const calculateSmsParts = (message) => {
  if (typeof message !== "string" || message.length === 0) {
    throw new Error("Message must be a non-empty string.");
  }

  let septets = 0;
  let isGsm = true;

  for (const char of message) {
    if (GSM_BASIC.includes(char)) {
      septets += 1;
    } else if (GSM_EXTENSION.includes(char)) {
      // Extension-table characters consume two septets.
      septets += 2;
    } else {
      isGsm = false;
      break;
    }
  }

  if (isGsm) {
    return {
      encoding: "GSM-7",
      parts: septets <= 160 ? 1 : Math.ceil(septets / 153),
      characters: message.length,
    };
  }

  // Unicode messages use UTF-16 code units.
  const characters = message.length;

  return {
    encoding: "Unicode",
    parts: characters <= 70 ? 1 : Math.ceil(characters / 67),
    characters,
  };
};

export const normalizeNepaliPhone = (phone) => {
  if (typeof phone !== "string") {
    return null;
  }

  // Allow 10 digits, 977 + 10 digits, or +977 + 10 digits.
  const match = phone.match(/^(?:\+977|977)?(9[78]\d{8})$/);

  if (!match) {
    return null;
  }

  return match[1];
};
