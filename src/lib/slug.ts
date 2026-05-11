import { customAlphabet } from "nanoid";

// URL-safe, no easily-confused chars (0/O, 1/l/I, etc.). 10 chars = ~52 bits.
export const newTripSlug = customAlphabet("23456789abcdefghjkmnpqrstuvwxyz", 10);
