import prisma from "@/lib/prisma"
import { Hono } from "hono"
import { Webhook } from "svix"

const authRouter = new Hono()

authRouter.post("/webhook", async (c) => {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET
  if (!WEBHOOK_SECRET) {
    throw new Error("You need a WEBHOOK_SECRET in your .env")
  }

  const payload = await c.req.text()

  const svix_id = c.req.header("svix-id")
  const svix_timestamp = c.req.header("svix-timestamp")
  const svix_signature = c.req.header("svix-signature")

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return c.text("Error occured -- no svix headers", {
      status: 400,
    })
  }

  const webhook = new Webhook(WEBHOOK_SECRET)

  let event: any

  try {
    event = webhook.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    })
  } catch (err: any) {
    console.log("Webhook failed to verify. Error:", err.message)
    return c.json(
      {
        success: false,
        message: err.message,
      },
      400
    )
  }

  if (event.type !== "user.created") {
    return c.json(
      {
        message: "Only `user.created` event is handled.",
      },
      400
    )
  }

  const { id } = event.data
  const email = event.data.email_addresses[0].email_address

  await prisma.user.upsert({
    where: { id },
    update: { id, email },
    create: { id, email },
  })

  return c.json({
    success: true,
    message: "User is created.",
  })
})

export default authRouter
