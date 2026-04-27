import Image from "next/image";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { fetchConversations } from "@/lib/actions/message.actions";
import { fetchUser } from "@/lib/actions/user.actions";

const formatMessageTime = (value: string) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const Page = async () => {
  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  const conversations = await fetchConversations(user.id);

  return (
    <section>
      <h1 className="head-text mb-10">Messages</h1>

      {conversations.length === 0 ? (
        <div className="rounded-lg border border-dark-4 bg-dark-2 p-8">
          <h2 className="text-heading4-medium text-light-1">No messages yet</h2>
          <p className="mt-2 text-base-regular text-light-3">
            Open a user profile and start a private conversation.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {conversations.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/messages/${conversation.id}`}
              className="flex items-center gap-4 rounded-lg border border-dark-4 bg-dark-2 p-4 transition hover:border-primary-500 hover:bg-dark-3"
            >
              <Image
                src={conversation.otherUser.image}
                alt={conversation.otherUser.name}
                width={52}
                height={52}
                className="rounded-full object-cover"
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="truncate text-base-semibold text-light-1">
                    {conversation.otherUser.name}
                  </h2>
                  <p className="shrink-0 text-subtle-medium text-light-4">
                    {formatMessageTime(conversation.lastMessageAt)}
                  </p>
                </div>
                <p className="text-small-medium text-gray-1">
                  @{conversation.otherUser.username}
                </p>
                <p className="mt-2 truncate text-small-regular text-light-3">
                  {conversation.lastMessage?.text ?? "Conversation opened"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};

export default Page;
