import { zValidator } from "@hono/zod-validator"
import { z } from "zod"

export const createSheetValidator = zValidator("json", z.object({}))
