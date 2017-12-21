import { BotCommand } from "../bot-commands/bot-command";
import { ITelegramClient } from "./i-telegram-client";

export class TelegramClientMock implements ITelegramClient {

  public readonly commands = new Map<string, BotCommand>();
  public readonly botname = "testbot";

  public retrieveBotName(): Promise<string> {
    return new Promise(() => {
      return this.botname;
    });
  }

  public setOnAnyText(action: (msg: any, match: string[]) => string): void {
    // Don't do anything, this is a mock.
   }

  public registerCommand(command: BotCommand): void {
    // Don't do anything, this is a mock.
  }

  public sendMessage(chatId: number, htmlMessage: string): void {
    // Don't do anything, this is a mock.
  }
}
