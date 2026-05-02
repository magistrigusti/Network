import { SignIn } from "@clerk/nextjs";
import TelegramLoginPanel from "@/components/auth/TelegramLoginPanel";

const Page = () => {
  return (
    <>
      <div className="flex flex-col items-center gap-5">
        <SignIn />
        <TelegramLoginPanel />
      </div>
    </>
  )
}

export default Page;
