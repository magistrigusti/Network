import Image from "next/image";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import MessageComposer from "@/components/messages/MessageComposer";
import { fetchConversation } from "@/lib/actions/message.actions";
import { fetchUser } from "@/lib/actions/user.actions";

const formatBubbleTime = (value: string) =>
  new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const Page = async ({ params }: { params: { id: string } }) => {
  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  const conversation = await fetchConversation(params.id, user.id);

  return (
    <section className="flex min-h-[calc(100vh-9rem)] flex-col">
      <div className="mb-6 flex items-center justify-between border-b border-dark-4 pb-5">
        <Link
          href={`/profile/${conversation.otherUser.id}`}
          className="flex min-w-0 items-center gap-4"
        >
          <Image
            src={conversation.otherUser.image}
            alt={conversation.otherUser.name}
            width={52}
            height={52}
            className="rounded-full object-cover"
          />
          <div className="min-w-0">
            <h1 className="truncate text-heading4-medium text-light-1">
              {conversation.otherUser.name}
            </h1>
            <p className="text-small-medium text-gray-1">
              @{conversation.otherUser.username}
            </p>
          </div>
        </Link>

        <Link href="/messages" className="text-small-medium text-primary-500">
          Inbox
        </Link>
      </div>

      <div className="custom-scrollbar flex flex-1 flex-col gap-4 overflow-auto">
        {conversation.messages.length === 0 ? (
          <div className="rounded-lg border border-dark-4 bg-dark-2 p-6 text-center">
            <p className="text-base-regular text-light-2">
              This portal is open. Write the first message.
            </p>
          </div>
        ) : (
          conversation.messages.map((message) => {
            const isMine = message.sender.id === user.id;

            return (
              <div
                key={message.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-4 py-3 ${
                    isMine
                      ? "bg-primary-500 text-light-1"
                      : "bg-dark-2 text-light-2"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words text-small-regular">
                    {message.text}
                  </p>
                  <p
                    className={`mt-2 text-right text-tiny-medium ${
                      isMine ? "text-light-2" : "text-light-4"
                    }`}
                  >
                    {formatBubbleTime(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <MessageComposer conversationId={conversation.id} currentUserId={user.id} />
    </section>
  );
};

export default Page;
