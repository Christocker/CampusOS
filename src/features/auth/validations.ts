import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email").max(254),
  // bcrypt silently truncates at 72 bytes, so reject longer inputs up front.
  password: z
    .string()
    .min(1, "Password is required")
    .max(72, "Password must be 72 characters or fewer"),
});

export const codeLoginSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Code is required")
    .max(32, "Enter a valid access code")
    .regex(/^[A-Za-z0-9-]+$/, "Enter a valid access code"),
});
