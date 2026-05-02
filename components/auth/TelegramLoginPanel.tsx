import TelegramLoginButton from "./TelegramLoginButton";

const TelegramLoginPanel = () => {
  const botUsername =
    process.env.TELEGRAM_BOT_USERNAME ||
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

  return <TelegramLoginButton botUsername={botUsername} />;
};

export default TelegramLoginPanel;
