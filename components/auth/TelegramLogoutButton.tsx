const TelegramLogoutButton = () => {
  return (
    <form action="/api/auth/telegram/logout" method="post">
      <button
        type="submit"
        className="rounded-lg bg-dark-3 px-4 py-2 text-small-medium text-light-1 hover:bg-dark-4"
      >
        Logout
      </button>
    </form>
  );
};

export default TelegramLogoutButton;
