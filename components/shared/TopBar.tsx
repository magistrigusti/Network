import { OrganizationSwitcher, SignedIn, UserButton } from "@clerk/nextjs"
import Image from "next/image"
import Link from "next/link";
import {  shadesOfPurple } from "@clerk/themes";

const TopBar = () => {
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
        </div>
      </nav>
    </>
  )
}

export default TopBar;