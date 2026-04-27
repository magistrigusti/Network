"use client";

import { useEffect, useRef, useState } from "react";

const TelegramLoginButton = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isConfigured, setIsConfigured] = useState(true);

  useEffect(() => {
    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
    if (!botUsername || !containerRef.current) {
      setIsConfigured(false);
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

    containerRef.current.appendChild(script);
  }, []);

  if (!isConfigured) {
    return (
      <p className="mt-3 max-w-xs text-center text-small-regular text-light-4">
        Telegram login needs NEXT_PUBLIC_TELEGRAM_BOT_USERNAME and TELEGRAM_BOT_TOKEN.
      </p>
    );
  }

  return <div ref={containerRef} className="mt-3 flex justify-center" />;
};

export default TelegramLoginButton;
