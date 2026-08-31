import { z } from "zod";
import { requiredText } from "./shared";
import { ADMIN_LEVEL_VALUES } from "@/types/entities";

export const CreateAdminSchema = z.object({
  first_name: requiredText("First name is required."),
  last_name: requiredText("Last name is required."),
  role: requiredText("Role is required."),
  admin_level: z.enum(ADMIN_LEVEL_VALUES),
  email: z.email({ message: "Enter a valid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
});

export const UpdateAdminSchema = CreateAdminSchema.extend({
  password: z
    .string()
    .trim()
    .refine((value) => value === "" || value.length >= 8, {
      message: "Password must be at least 8 characters.",
    }),
});

export type AdminFormValues = z.infer<typeof CreateAdminSchema>;
