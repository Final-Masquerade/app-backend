import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { Difficulty, Key, SheetStatus } from "@prisma/client"

export const createSheetValidator = zValidator(
  "json",
  z.object({
    id: z.string({
      required_error: "Provide a valid job_id.",
    }),
    name: z.string({ required_error: "Provide a name for the sheet." }).min(3),
    tempo: z.number().optional(),
    composer: z.string().optional(),
    date: z.number().optional(),
    key: z.nativeEnum(Key).optional(),
    difficulty: z.nativeEnum(Difficulty).optional(),
  })
)

export const createXMLValidator = zValidator(
  "json",
  z.object({
    status: z.nativeEnum(SheetStatus),
    user_id: z.string(),
    job_id: z.string(),
    xml: z.string(),
  })
)
