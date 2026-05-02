import Image from "next/image";
import Link from "next/link";
import FriendActionButton from "./FriendActionButton";
import StartConversationButton from "../messages/StartConversationButton";
import { FriendshipStatus } from "@/lib/actions/friend.actions";

interface Props {
  user: {
    id: string;
    name: string;
    username: string;
    image: string;
    bio: string;
    friendsCount: number;
    mutualCount: number;
  };
  currentUserId: string;
  status: FriendshipStatus;
}

const FriendRow = ({ user, currentUserId, status }: Props) => {
  return (
    <article className="flex items-center justify-between gap-4 border-b border-dark-4 py-5 last:border-b-0">
      <Link href={`/profile/${user.id}`} className="flex min-w-0 flex-1 gap-4">
        <Image
          src={user.image}
          alt={user.name}
          width={72}
          height={72}
          className="h-[72px] w-[72px] rounded-full object-cover"
        />
        <div className="min-w-0">
          <h3 className="truncate text-base-semibold text-light-1">
            {user.name}
          </h3>
          <p className="text-small-medium text-gray-1">@{user.username}</p>
          {user.bio && (
            <p className="mt-2 line-clamp-1 text-small-regular text-light-3">
              {user.bio}
            </p>
          )}
          <p className="mt-2 text-subtle-medium text-light-4">
            {user.mutualCount > 0
              ? `${user.mutualCount} mutual friends`
              : `${user.friendsCount} friends`}
          </p>
        </div>
      </Link>

      <div className="flex shrink-0 flex-wrap justify-end gap-2">
        <StartConversationButton
          currentUserId={currentUserId}
          targetUserId={user.id}
          compact
        />
        <FriendActionButton
          currentUserId={currentUserId}
          targetUserId={user.id}
          status={status}
          compact
        />
      </div>
    </article>
  );
};

export default FriendRow;
