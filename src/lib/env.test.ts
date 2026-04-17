import { getWhatsAppHref } from "@/lib/env";

describe("env helpers", () => {
  const previousNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const previousMessage = process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE;

  afterEach(() => {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = previousNumber;
    process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE = previousMessage;
  });

  it("builds whatsapp CTA links using environment variables", () => {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = "5585988887777";
    process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE = "Quero uma demo";

    expect(getWhatsAppHref()).toBe(
      "https://wa.me/5585988887777?text=Quero%20uma%20demo",
    );
  });
});
