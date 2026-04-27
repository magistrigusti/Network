import { OrganizationSwitcher, SignedIn, UserButton } from "@clerk/nextjs"
import Image from "next/image"
import Link from "next/link";
import {  shadesOfPurple } from "@clerk/themes";
import { getCurrentPortalUser } from "@/lib/auth/session";
import TelegramLogoutButton from "../auth/TelegramLogoutButton";

const TopBar = async () => {
  const user = await getCurrentPortalUser();

  return (
    <>
      <nav className="topbar">
        <Link href="/" className="flex items-center gap-4">
          <Image src='/images/logo.png' alt="logo"
            width={75} height={50}
          />
        </Link>

        <div className="flex items-center gap-3">
          <SignedIn>
            <OrganizationSwitcher
              appearance={
                {
                  baseTheme: shadesOfPurple,
                  elements: {
                    organizationSwitcherTrigger: 'py-2 px-4'
                  }
                }
              }
            />

            <UserButton />
          </SignedIn>
          {user?.authProvider === "telegram" && (
            <div className="flex items-center gap-3">
              <Image
                src={user.imageUrl}
                alt={user.username || "Telegram user"}
                width={28}
                height={28}
                className="rounded-full object-cover"
              />
              <span className="max-sm:hidden text-small-medium text-light-1">
                {user.username ? `@${user.username}` : user.firstName}
              </span>
              <TelegramLogoutButton />
            </div>
          )}
        </div>
      </nav>
    </>
  )
}

export default TopBar;
