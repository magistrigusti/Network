import * as z from 'zod';

export const UserValidation = z.object({
  bio: z.string().min(10, {
    message: 'Minimum 10 chracter!'
  }).max(1000)
})