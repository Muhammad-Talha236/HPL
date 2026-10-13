import crypto from "node:crypto";

export const generateRegistrationNumber = () => `HPL-${crypto.randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`;
