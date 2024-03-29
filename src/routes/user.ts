import prisma from "@/lib/prisma"
import { createSheetValidator } from "@/validators/userValidators"
import { Hono } from "hono"

const userRouter = new Hono()

// TODO: Authentication
userRouter.get("/sheets", async (c) => {
  const id = c.req.header("User-Id")

  if (!id) return c.json({ message: "Please provide a valid id header." }, 400)

  const user = await prisma.user.findUnique({
    where: {
      id,
    },
    select: {
      sheets: true,
    },
  })

  if (!user)
    return c.json(
      {
        message: `Cannot find user ${id}.`,
      },
      404
    )

  return c.json({
    sheetCount: user.sheets.length ?? 0,
    sheets: user.sheets,
  })
})

userRouter.post("/createSheet", createSheetValidator, async (c) => {})

export default userRouter
