import PostTweet from "@/components/forms/PostTweet";
import { fetchUser } from "@/lib/actions/user.actions";
import { getCurrentPortalUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

const Page = async () => {
  const user = await getCurrentPortalUser();
  if (!user) return null;
  
  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect('/onboarding');

  return (
    <>
      <h1 className="head-text">Create Tweet</h1>

      <PostTweet userId={userInfo._id} />
    </>
  )
}

export default Page;
