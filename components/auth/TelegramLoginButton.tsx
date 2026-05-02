"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

const TelegramLoginButton = ({ botUsername }: { botUsername?: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!botUsername || !containerRef.current) {
      return;
    }

    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "8");
    script.setAttribute("data-userpic", "true");
    script.setAttribute(
      "data-auth-url",
      `${window.location.origin}/api/auth/telegram/callback`
    );
    script.setAttribute("data-request-access", "write");
    script.onload = () => setIsLoaded(true);

    containerRef.current.appendChild(script);
  }, [botUsername]);

  if (!botUsername) {
    return (
      <button
        type="button"
        disabled
        className="mt-3 flex w-full max-w-xs items-center justify-center gap-2 rounded-lg bg-[#2aabee]/40 px-5 py-3 text-small-semibold text-light-2"
      >
        <Send className="h-4 w-4" />
        Continue with Telegram
      </button>
    );
  }

  return (
    <div className="mt-3 flex min-h-[44px] w-full max-w-xs justify-center">
      {!isLoaded && (
        <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2aabee] px-5 py-3 text-small-semibold text-white">
          <Send className="h-4 w-4" />
          Continue with Telegram
        </div>
      )}
      <div ref={containerRef} className={isLoaded ? "flex justify-center" : "hidden"} />
    </div>
  );
};

export default TelegramLoginButton;
