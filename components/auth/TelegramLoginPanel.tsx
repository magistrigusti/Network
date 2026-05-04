import TelegramLoginButton from "./TelegramLoginButton";

const TelegramLoginPanel = () => {
  const botUsername =
    process.env.TELEGRAM_BOT_USERNAME ||
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
  const normalizedBotUsername = botUsername?.replace(/^@/, "").trim();

  return <TelegramLoginButton botUsername={normalizedBotUsername} />;
};

export default TelegramLoginPanel;
