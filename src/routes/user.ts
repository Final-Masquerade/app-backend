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

/**
 *  Returns all sheet metadata.
 */
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
      sheets: {
        select: {
          id: true,
          name: true,
          createdAt: true,
          status: true,
        },
      },
    },
  })

  if (!user)
    return c.json(
      {
        message: `Cannot find user ${id}.`,
      },
      404,
    )

  return c.json({
    sheetCount: user.sheets.length ?? 0,
    sheets: user.sheets,
  })
})

/**
 *  Creates sheet metadata.
 */
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
            upsert: {
              where: {
                id: body.id,
              },
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
              update: {
                name: body.name,
                composer: body.composer,
                date: body.date,
                difficulty: body.difficulty,
                key: body.key,
                tempo: body.tempo,
              },
            },
          },
        },
      })
    } catch (error) {
      return c.json(
        { message: "Error in creating sheet.", error },
        500 as StatusCode,
      )
    }

    return c.json(
      {
        message: `Created the sheet '${body.name}'.`,
      },
      201 as StatusCode,
    )
  },
)

/**
 *  Updates sheet metadata.
 */
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
      403 as StatusCode,
    )

  console.log(body.status)

  switch (body.status) {
    case SheetStatus.FAILED: {
      await prisma.user.update({
        where: {
          id: body.user_id,
        },
        data: {
          sheets: {
            upsert: {
              where: {
                id: body.job_id,
              },
              update: {
                status: SheetStatus.FAILED,
              },
              create: {
                id: body.job_id,
                name: "",
                status: SheetStatus.FAILED,
              },
            },
          },
        },
      })
      break
    }

    case SheetStatus.SUCCESS: {
      await prisma.user.update({
        where: {
          id: body.user_id,
        },
        data: {
          sheets: {
            upsert: {
              where: {
                id: body.job_id,
              },
              update: {
                status: SheetStatus.SUCCESS,
                data: {
                  create: {
                    xml: body.xml,
                  },
                },
              },
              create: {
                id: body.job_id,
                name: "",
                status: SheetStatus.SUCCESS,
                data: {
                  create: {
                    xml: body.xml,
                  },
                },
              },
            },
          },
        },
      })
      break
    }
    default:
      break
  }

  return c.json({ message: "Updated" })
})

userRouter.get("/sheet/:id", clerkMiddleware(), async (c) => {
  const auth = getAuth(c)

  if (!auth || !auth.userId)
    return c.json(
      { message: "Please sign in to retrieve sheet metadata." },
      401,
    )

  const { userId } = auth
  const { id } = c.req.param()

  const sheet = await prisma.sheet.findUnique({
    where: {
      id,
      creatorId: userId,
    },
  })

  if (!sheet)
    return c.json(
      {
        message: `Cannot find sheet ${id}.`,
      },
      404,
    )

  return c.json({ ...sheet })
})

userRouter.delete(
  "/sheet/:id",
  /* clerkMiddleware(),*/ async (c) => {
    // const auth = getAuth(c)

    // if (!auth || !auth.userId)
    //   return c.json({ message: "Please sign in to delete sheet." }, 401)

    // const { userId } = auth
    const { id } = c.req.param()

    const deleteData = prisma.sheetXML.deleteMany({
      where: {
        metaId: id,
      },
    })

    const deleteSheet = prisma.sheet.delete({
      where: {
        id,
        // creatorId: userId,
      },
    })

    try {
      const transaction = await prisma.$transaction([deleteData, deleteSheet])
      return c.json({ ...transaction })
    } catch {
      return c.json(
        {
          message: `Cannot find and delete sheet ${id}.`,
        },
        404,
      )
    }
  },
)

export default userRouter
