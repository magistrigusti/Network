import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import FriendRow from "@/components/friends/FriendRow";
import SearchBar from "@/components/shared/SearchBar";
import { fetchFriendsDashboard } from "@/lib/actions/friend.actions";
import { fetchUser } from "@/lib/actions/user.actions";
import { getCurrentPortalUser } from "@/lib/auth/session";

type FriendSummary = {
  id: string;
  name: string;
  username: string;
  image: string;
  bio: string;
  friendsCount: number;
  mutualCount: number;
};

const tabs = [
  { key: "all", label: "All friends" },
  { key: "incoming", label: "Friend requests" },
  { key: "outgoing", label: "Sent requests" },
  { key: "suggestions", label: "Find friends" },
];

const Page = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const user = await getCurrentPortalUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  const activeTab = searchParams.section ?? "all";
  const dashboard = await fetchFriendsDashboard({
    currentUserId: user.id,
    searchString: searchParams.q ?? "",
  });

  const list =
    activeTab === "incoming"
      ? dashboard.incoming
      : activeTab === "outgoing"
        ? dashboard.outgoing
        : activeTab === "suggestions"
          ? dashboard.suggestions
          : dashboard.friends;

  const status =
    activeTab === "incoming"
      ? "incoming"
      : activeTab === "outgoing"
        ? "outgoing"
        : activeTab === "suggestions"
          ? "none"
          : "friends";

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-lg border border-dark-4 bg-dark-2 p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <Link
                key={tab.key}
                href={`/friends?section=${tab.key}`}
                className={`rounded-lg px-4 py-2 text-small-medium ${
                  activeTab === tab.key
                    ? "bg-light-1 text-dark-1"
                    : "bg-dark-3 text-light-3 hover:text-light-1"
                }`}
              >
                {tab.label}
                {tab.key === "all" && ` ${dashboard.friends.length}`}
                {tab.key === "incoming" && ` ${dashboard.incoming.length}`}
              </Link>
            ))}
          </div>
          <Link
            href="/search"
            className="rounded-lg bg-light-1 px-5 py-2 text-small-semibold text-dark-1"
          >
            Find friends
          </Link>
        </div>

        <SearchBar routeType="friends" />

        <div className="mt-4">
          {list.length === 0 ? (
            <div className="rounded-lg bg-dark-3 p-8 text-center">
              <h2 className="text-heading4-medium text-light-1">
                Nothing here yet
              </h2>
              <p className="mt-2 text-small-regular text-light-3">
                Add people from suggestions or open a profile and send a request.
              </p>
            </div>
          ) : (
            (list as FriendSummary[]).map((friend) => (
              <FriendRow
                key={friend.id}
                user={friend}
                currentUserId={user.id}
                status={status}
              />
            ))
          )}
        </div>
      </div>

      <aside className="flex flex-col gap-4">
        <div className="rounded-lg border border-dark-4 bg-dark-2 p-5">
          <h2 className="text-base-semibold text-light-1">My friends</h2>
          <div className="mt-4 flex flex-col gap-3 text-small-medium text-light-3">
            <Link href="/friends?section=all">All friends</Link>
            <Link href="/friends?section=incoming">
              Requests in {dashboard.incoming.length}
            </Link>
            <Link href="/friends?section=outgoing">
              Requests out {dashboard.outgoing.length}
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-dark-4 bg-dark-2 p-5">
          <h2 className="text-base-semibold text-light-1">Possible friends</h2>
          <div className="mt-4 flex flex-col gap-4">
            {dashboard.suggestions.slice(0, 5).map((suggestion) => (
              <div key={suggestion.id} className="flex items-center gap-3">
                <Image
                  src={suggestion.image}
                  alt={suggestion.name}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-small-semibold text-light-1">
                    {suggestion.name}
                  </p>
                  <p className="text-subtle-medium text-light-4">
                    {suggestion.mutualCount} mutual friends
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </section>
  );
};

export default Page;
