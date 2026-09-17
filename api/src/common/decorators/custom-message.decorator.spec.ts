import { Reflector } from "@nestjs/core";
import {
  CUSTOM_MESSAGE_KEY,
  CustomMessage,
} from "./custom-message.decorator.js";

class Handlers {
  @CustomMessage("Institution created")
  create(): void {}

  undecorated(): void {}
}

describe("CustomMessage", () => {
  const reflector = new Reflector();

  it("stores the message on the handler under CUSTOM_MESSAGE_KEY", () => {
    expect(
      reflector.get<string>(CUSTOM_MESSAGE_KEY, Handlers.prototype.create),
    ).toBe("Institution created");
  });

  it("leaves an undecorated handler without a message", () => {
    expect(
      reflector.get<string>(CUSTOM_MESSAGE_KEY, Handlers.prototype.undecorated),
    ).toBeUndefined();
  });
});
