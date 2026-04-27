import AccountInfo from "@/components/forms/AccountInfo"
import { syncUserFromClerk } from "@/lib/actions/user.actions"
import { UserProfile } from "@clerk/nextjs"
import { shadesOfPurple } from "@clerk/themes"
import { redirect } from "next/navigation"
import { getCurrentPortalUser } from "@/lib/auth/session"

const Page = async () => {
    const user = await getCurrentPortalUser()
    if(!user) return null
    const userInfo = user.authProvider === "clerk" ? await syncUserFromClerk({
        userId: user.id,
        email: user.emailAddress,
        username: user.username,
        name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
        image: user.imageUrl,
    }) : await import("@/lib/actions/user.actions").then(({ fetchUser }) => fetchUser(user.id))
    if(userInfo?.onboarded) redirect('/')
    
    const userData = {
        id: user?.id,
        objectID: userInfo?._id,
        userName: userInfo ? userInfo?.username : user?.username,
        name: userInfo ? userInfo?.name : user?.firstName || '',
        bio: userInfo ? userInfo?.bio : '',
        image: userInfo ? userInfo?.image : user?.imageUrl
    }

    return (
        <>
            <main className="mx-auto flex flex-col justify-start px-10 py-20"> 
                <div className="text-center">
                    <h1 className="head-text">Welcome to Twiddle</h1>
                    <p className="mt-3 text-base-regular text-light-2">
                        Complete your profile now to use Twiddle</p>
                </div>

                {user.authProvider === "clerk" && (
                <div className="mt-10">
                    <UserProfile
                        appearance={{
                            baseTheme:  shadesOfPurple
                        }}
                        //routing="hash"
                    />
                </div>
                )}

                <AccountInfo
                    user={userData}
                />
            </main>
        </>
    )
}

export default Page
