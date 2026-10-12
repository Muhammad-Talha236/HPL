import validator from "validator";

// Storage policy: trim surrounding whitespace and lowercase the whole address.
// Preserve dots and tags for display/delivery, regardless of provider.
export const normalizeStoredEmail = (value) => typeof value === "string" ? value.trim().toLowerCase() : "";
export const isValidAccountEmail = (value) => {
  const email = normalizeStoredEmail(value);
  return email.length <= 254 && /^[\x21-\x7e]+$/.test(email)
    && validator.isEmail(email, { allow_utf8_local_part: false });
};

// Identity policy: ONLY consumer Gmail aliases share dot/plus-insensitive keys.
// Outlook/Yahoo/custom domains preserve both dots and plus tags.
export const getEmailLookupKey = (value) => {
  const email = normalizeStoredEmail(value);
  const at = email.lastIndexOf("@");
  if (at < 1) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  return ["gmail.com", "googlemail.com"].includes(domain)
    ? `${local.split("+")[0].replaceAll(".", "")}@gmail.com` : email;
};
