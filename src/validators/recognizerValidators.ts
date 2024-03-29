import { zValidator } from "@hono/zod-validator"
import { z } from "zod"

export const captureValidator = zValidator(
  "json",
  z.object({
    file: z.string({
      required_error: "A base64 file must be passed.",
    }),
  })
)
