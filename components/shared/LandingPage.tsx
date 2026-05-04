import { SignInButton, SignUpButton } from "@clerk/nextjs"
import Image from "next/image"

const LandingPage = () => {
  return (
    <>
      <div className="flex flex-col md:flex-row items-center justify-center min-h-screen bg-black">
        <div className="flex-shrink-0 mb-8 md:mb-0 md:mr-10">
          <Image className="w-52 md:w-80 lg:w-80"
            src="/img/logo.png" alt=""
            width={350} height={480}
          />
        </div>

        <div className="flex flex-col items-center md:items-start">
          <Image className="w-52 md:w-80 lg:w-80"
            src="/images/logo.png" alt=""
            width={240} height={120}
          />
          <h1 className="text-center lg:text-left font-extrabold text-white text-3xl mb-7"
          >
             Welcome to PORTAL
          </h1>


          <SignInButton>
            <button className="w-full text-black mb-3 px-6 py-2 rounded-lg bg-white hover:bg-slate-300"
            >
              Log in
            </button>
          </SignInButton>

          <SignUpButton>
            <button className="w-full text-black px-6 py-2 rounded-lg bg-emerald-100 hover:bg-green-300" 
            >
              Register
            </button>
          </SignUpButton>
        </div>
      </div>
    </>
  )
}

export default LandingPage
