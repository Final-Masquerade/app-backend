import prisma from "@/lib/prisma"
import {
  createSheetValidator,
  createXMLValidator,
} from "@/validators/userValidators"
import { clerkMiddleware, getAuth } from "@hono/clerk-auth"
import { SheetStatus } from "@prisma/client"
import { Hono } from "hono"
import { StatusCode } from "hono/utils/http-status"

const userRouter = new Hono()

userRouter.get("/sheets", clerkMiddleware(), async (c) => {
  const auth = getAuth(c)

  if (!auth || !auth.userId)
    return c.json({ message: "Please sign in to retrieve sheets." }, 401)

  const id = auth.userId

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

userRouter.post(
  "/createSheet",
  createSheetValidator,
  clerkMiddleware(),
  async (c) => {
    const auth = getAuth(c)

    if (!auth || !auth.userId)
      return c.json({ message: "Please sign in to create sheets." }, 401)

    const id = auth.userId
    const body = c.req.valid("json")

    try {
      await prisma.user.update({
        where: { id },
        data: {
          sheets: {
            create: {
              id: body.id,
              name: body.name,
              composer: body.composer,
              date: body.date,
              difficulty: body.difficulty,
              key: body.key,
              status: SheetStatus.PROCESSING,
              tempo: body.tempo,
            },
          },
        },
      })
    } catch (error) {
      return c.json(
        { message: "Error in creating sheet.", error },
        500 as StatusCode
      )
    }

    return c.json(
      {
        message: `Created the sheet '${body.name}'.`,
      },
      201 as StatusCode
    )
  }
)

userRouter.put("/updateSheetStatus", createXMLValidator, async (c) => {
  const secret = c.req.header("Authorization")
  const body = c.req.valid("json")

  if (!secret) return c.json({ dc: "Please provide a secret." }, 400)

  if (process.env.RECOGNIZER_SECRET !== secret)
    return c.json(
      {
        message:
          "The provided secret is not correct. Only recognizer microservice can update sheets.",
      },
      403 as StatusCode
    )

  return c.json({ message: "Updated" })
})

export default userRouter
