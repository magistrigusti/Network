import { SignUp } from "@clerk/nextjs";
import TelegramLoginButton from "@/components/auth/TelegramLoginButton";

const Page = () => {
  return (
    <>
      <div className="flex flex-col items-center gap-5">
        <SignUp />
        <TelegramLoginButton />
      </div>
    </>
  )
}

export default Page;
