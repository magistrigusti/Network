import crypto from "crypto";

export type MercatusSsoWallets = {
  ton?: string[];
  solana?: string[];
  ethereum?: string[];
};

export type MercatusSsoTicketPayload = {
  source: "mercatus";
  user: {
    id: number;
    firstName?: string;
    lastName?: string;
    username?: string;
    photoUrl?: string;
  };
  wallets?: MercatusSsoWallets;
  nonce: string;
  exp: number;
};

const getMercatusSsoSecret = () => {
  const secret = process.env.PORTAL_SSO_SECRET;
  if (!secret) throw new Error("Missing PORTAL_SSO_SECRET");

  return secret;
};

const sign = (payload: string) =>
  crypto
    .createHmac("sha256", getMercatusSsoSecret())
    .update(payload)
    .digest("base64url");

const decodePayload = (value: string) =>
  Buffer.from(value, "base64url").toString("utf8");

const isMercatusTicketPayload = (
  value: MercatusSsoTicketPayload
): value is MercatusSsoTicketPayload => {
  return (
    value.source === "mercatus" &&
    Boolean(value.user?.id) &&
    Boolean(value.nonce) &&
    Boolean(value.exp)
  );
};

export const verifyMercatusSsoTicket = (
  ticket?: string
): MercatusSsoTicketPayload => {
  if (!ticket) throw new Error("Mercatus SSO ticket missing");

  const [encodedPayload, signature] = ticket.split(".");
  if (!encodedPayload || !signature) {
    throw new Error("Mercatus SSO ticket malformed");
  }

  const expectedSignature = sign(encodedPayload);
  if (signature.length !== expectedSignature.length) {
    throw new Error("Mercatus SSO signature malformed");
  }

  const signatureIsValid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );

  if (!signatureIsValid) {
    throw new Error("Mercatus SSO signature invalid");
  }

  const payload = JSON.parse(
    decodePayload(encodedPayload)
  ) as MercatusSsoTicketPayload;

  if (!isMercatusTicketPayload(payload)) {
    throw new Error("Mercatus SSO payload invalid");
  }

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Mercatus SSO ticket expired");
  }

  return payload;
};
