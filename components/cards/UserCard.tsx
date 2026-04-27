'use client'

import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "../ui/button"
import StartConversationButton from "../messages/StartConversationButton"

interface Props {
  id: string,
  name: string,
  username: string,
  imgUrl: string,
  currentUserId?: string
}

const UserCard = ({
  id,
  name,
  username,
  imgUrl,
  currentUserId
}: Props) => {
  const router = useRouter()

  return (
    <>
      <article className="user-card">
        <div className="user-card_avatar">
          <Image
            src={imgUrl}
            alt='Logo'
            width={48}
            height={48}
            className="rounded-full"
          />

          <div className="flex-1 text-ellipsis">
            <h4 className="text-base-semibold text-light-1">
              {name}
            </h4>
            <p className="text-small-medium text-gray-1">
              @{username}
            </p>
          </div>

        </div>

        <div className="flex gap-2">
          {currentUserId && currentUserId !== id && (
            <StartConversationButton
              currentUserId={currentUserId}
              targetUserId={id}
              compact
            />
          )}
          <Button
            className="user-card_btn"
            onClick={() => {
              router.push(`/profile/${id}`)
            }}>
            View
          </Button>
        </div>
      </article>
    </>
  )
}

export default UserCard
