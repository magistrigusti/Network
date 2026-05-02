"use client";

import { UserCheck, UserMinus, UserPlus, UserRoundX } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  FriendshipStatus,
  removeFriend,
  sendFriendRequest,
} from "@/lib/actions/friend.actions";

interface Props {
  currentUserId: string;
  targetUserId: string;
  status: FriendshipStatus;
  compact?: boolean;
}

const FriendActionButton = ({
  currentUserId,
  targetUserId,
  status,
  compact = false,
}: Props) => {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  if (status === "self") return null;

  const run = (action: () => Promise<void>) => {
    startTransition(async () => {
      await action();
    });
  };

  const className = compact
    ? "user-card_btn"
    : "rounded-lg bg-primary-500 px-5 py-2 text-light-1";

  if (status === "friends") {
    return (
      <Button
        type="button"
        className={className}
        disabled={isPending}
        onClick={() =>
          run(() => removeFriend({ currentUserId, targetUserId, path: pathname }))
        }
      >
        <UserMinus className="h-4 w-4" />
        Friends
      </Button>
    );
  }

  if (status === "incoming") {
    return (
      <div className="flex gap-2">
        <Button
          type="button"
          className={className}
          disabled={isPending}
          onClick={() =>
            run(() =>
              acceptFriendRequest({ currentUserId, targetUserId, path: pathname })
            )
          }
        >
          <UserCheck className="h-4 w-4" />
          Accept
        </Button>
        {!compact && (
          <Button
            type="button"
            className="rounded-lg bg-dark-3 px-5 py-2 text-light-2"
            disabled={isPending}
            onClick={() =>
              run(() =>
                declineFriendRequest({
                  currentUserId,
                  targetUserId,
                  path: pathname,
                })
              )
            }
          >
            <UserRoundX className="h-4 w-4" />
            Decline
          </Button>
        )}
      </div>
    );
  }

  if (status === "outgoing") {
    return (
      <Button
        type="button"
        className={className}
        disabled={isPending}
        onClick={() =>
          run(() =>
            cancelFriendRequest({ currentUserId, targetUserId, path: pathname })
          )
        }
      >
        <UserRoundX className="h-4 w-4" />
        Requested
      </Button>
    );
  }

  return (
    <Button
      type="button"
      className={className}
      disabled={isPending}
      onClick={() =>
        run(() => sendFriendRequest({ currentUserId, targetUserId, path: pathname }))
      }
    >
      <UserPlus className="h-4 w-4" />
      Add friend
    </Button>
  );
};

export default FriendActionButton;
