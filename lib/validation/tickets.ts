import { z } from "zod";
import { nullableText, requiredText } from "./shared";
import { TICKET_TYPE_VALUES } from "@/types/entities";
import { toE164 } from "@/lib/phone";

export const TicketRejectSchema = z.object({
  note: requiredText("A rejection note is required."),
});

export const ManualTicketSchema = z.object({
  holder_name: nullableText(),
  customer_name: nullableText(),
  phone: requiredText("Phone is required.")
    .transform((value) => toE164(value) ?? value)
    .refine((value) => toE164(value) !== null, {
      message: "Enter a valid phone number. Jordan numbers can be typed as 07XXXXXXXX.",
    }),
  email: nullableText().refine(
    (value) => value === null || z.email().safeParse(value).success,
    { message: "Enter a valid email or leave it blank." },
  ),
  ticket_ref: requiredText("Ticket reference is required."),
  ticket_type: z.enum(TICKET_TYPE_VALUES),
  gate_token: nullableText(),
});

export const TicketUpdateSchema = z.object({
  holder_name: nullableText(),
  customer_name: nullableText(),
  phone: requiredText("Phone is required.")
    .transform((value) => toE164(value) ?? value)
    .refine((value) => toE164(value) !== null, {
      message: "Enter a valid phone number. Jordan numbers can be typed as 07XXXXXXXX.",
    }),
  email: nullableText().refine(
    (value) => value === null || z.email().safeParse(value).success,
    { message: "Enter a valid email or leave it blank." },
  ),
  ticket_ref: requiredText("Ticket reference is required."),
  ticket_type: z.enum(TICKET_TYPE_VALUES),
});

export type ManualTicketFormValues = z.input<typeof ManualTicketSchema>;
export type TicketUpdateFormValues = z.input<typeof TicketUpdateSchema>;
