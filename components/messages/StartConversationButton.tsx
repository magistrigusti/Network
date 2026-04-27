"use client";

import { MessageCircle } from "lucide-react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { startConversation } from "@/lib/actions/message.actions";

interface Props {
  currentUserId: string;
  targetUserId: string;
  compact?: boolean;
}

const StartConversationButton = ({
  currentUserId,
  targetUserId,
  compact = false,
}: Props) => {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      className={
        compact
          ? "user-card_btn"
          : "rounded-lg bg-primary-500 px-5 py-2 text-light-1"
      }
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await startConversation(currentUserId, targetUserId);
        });
      }}
    >
      <MessageCircle className="h-4 w-4" />
      {isPending ? "Opening" : "Message"}
    </Button>
  );
};

export default StartConversationButton;
