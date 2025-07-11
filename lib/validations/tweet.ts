import { z } from "zod";

export const TweetValidation = z.object({
  tweet: z.string().min(3, {
    message: 'Minimun 3 characters !'
  }),
  accountId: z.string()
})