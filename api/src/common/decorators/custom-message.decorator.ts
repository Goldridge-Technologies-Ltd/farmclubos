import { SetMetadata } from "@nestjs/common";

export const CUSTOM_MESSAGE_KEY = "custom_message_key";
export const CustomMessage = (message: string) =>
  SetMetadata(CUSTOM_MESSAGE_KEY, message);
