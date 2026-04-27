"use client";

import { SendHorizonal } from "lucide-react";
import { usePathname } from "next/navigation";
import { FormEvent, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { sendMessage } from "@/lib/actions/message.actions";

interface Props {
  conversationId: string;
  currentUserId: string;
}

const MessageComposer = ({ conversationId, currentUserId }: Props) => {
  const pathname = usePathname();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const text = String(formData.get("message") ?? "");

    startTransition(async () => {
      try {
        await sendMessage({
          conversationId,
          currentUserId,
          text,
          path: pathname,
        });
        formRef.current?.reset();
      } catch (err: any) {
        setError(err.message ?? "Failed to send message");
      }
    });
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="sticky bottom-0 mt-6 border-t border-dark-4 bg-dark-1 pt-4"
    >
      <div className="flex items-end gap-3">
        <textarea
          name="message"
          rows={2}
          maxLength={2000}
          placeholder="Write a message..."
          className="no-focus min-h-[52px] flex-1 resize-none rounded-lg border border-dark-4 bg-dark-3 px-4 py-3 text-small-regular text-light-1 placeholder:text-light-4"
          disabled={isPending}
        />
        <Button
          type="submit"
          className="h-[52px] rounded-lg bg-primary-500 px-4 text-light-1"
          disabled={isPending}
          aria-label="Send message"
        >
          <SendHorizonal className="h-4 w-4" />
        </Button>
      </div>
      {error && <p className="mt-2 text-small-regular text-red-400">{error}</p>}
    </form>
  );
};

export default MessageComposer;
