import { IDankTimesBotCommandsRegistrar } from "./bot-commands/registrar/i-danktimesbot-commands-registrar";
import { IChatRegistry } from "./chat-registry/i-chat-registry";
import { Chat } from "./chat/chat";
import { IDankTimeScheduler } from "./dank-time-scheduler/i-dank-time-scheduler";
import { Config } from "./misc/config";
import { Release } from "./misc/release";
import { ITelegramClient } from "./telegram-client/i-telegram-client";
import { IFileIO } from "./util/file-io/i-file-io";
import { IUtil } from "./util/i-util";

export class Server {

  private dailyUpdate = null;

  constructor(
    private readonly util: IUtil,
    private readonly fileIO: IFileIO,
    private readonly chatRegistry: IChatRegistry,
    private readonly releaseLog: Release[],
    private readonly telegramClient: ITelegramClient,
    private readonly scheduler: IDankTimeScheduler,
    private readonly config: Config,
    private readonly nodeCleanup: any,
    private readonly moment: any,
    private readonly cronJob: any,
    private readonly dankTimesBotCommandsRegistrar: IDankTimesBotCommandsRegistrar,
    private readonly version: string,
  ) { }

  public run(): void {

    // Register available Telegram bot commands.
    this.dankTimesBotCommandsRegistrar.registerDankTimesBotCommands();

    // Schedule to persist chats map to file every X minutes.
    this.scheduleChatsPersistence();

    // Schedule to persist chats map to file on program exit.
    this.ensureChatsPersistenceOnExit();

    // Generate new random dank times and schedule everything.
    this.generateAndScheduleRandomDankTimes();

    // Generates random dank times daily for all chats and schedules notifications for them at every 00:00:00.
    // Also, punishes players that have not scored in the past 24 hours.
    this.scheduleNightlyUpdates();

    // Send a release log message to all chats, assuming there are release logs.
    this.sendWhatsNewMessageIfApplicable();

    // Inform server.
    console.info(`Bot is now running! Version: ${this.version}.`);
  }

  private scheduleChatsPersistence(): void {
    setInterval(() => {
      this.fileIO.saveChatsToFile(this.chatRegistry.chats);
      console.info("Persisted data to file.");
    }, this.config.persistenceRate * 60 * 1000);
  }

  private ensureChatsPersistenceOnExit(): void {
    this.nodeCleanup((exitCode: number | null, signal: string | null) => {
      console.info("Persisting data to file before exiting...");
      this.fileIO.saveChatsToFile(this.chatRegistry.chats);
      return true;
    });
  }

  private generateAndScheduleRandomDankTimes(): void {
    this.chatRegistry.chats.forEach((chat: Chat) => {
      chat.generateRandomDankTimes();
      this.scheduler.scheduleAllOfChat(chat);
    });
  }

  private scheduleNightlyUpdates(): void {
    this.dailyUpdate = new this.cronJob("0 0 0 * * *", () => {
      console.info("Doing the nightly update!");
      const now = this.moment().unix();
      this.chatRegistry.chats.forEach((chat: Chat) => {
        if (chat.running) {

          // Unschedule
          this.scheduler.unscheduleRandomDankTimesOfChat(chat);
          this.scheduler.unscheduleAutoLeaderboardsOfChat(chat);

          // Generate random dank times
          chat.generateRandomDankTimes();

          // Reschedule
          this.scheduler.scheduleRandomDankTimesOfChat(chat);
          this.scheduler.scheduleAutoLeaderboardsOfChat(chat);

          // Your punishment must be more severe!
          chat.hardcoreModeCheck(now);

          // Remove plebs whose score is 0.
          chat.removeUsersWithZeroScore();
        }
      });
    }, undefined, true);
  }

  private sendWhatsNewMessageIfApplicable(): void {
    if (this.config.sendWhatsNewMsg) {

      // Prepare message.
      const message = this.util.releaseLogToWhatsNewMessage(this.releaseLog);

      // Send it to all chats.
      this.chatRegistry.chats.forEach((chat: Chat) => {
        this.telegramClient.sendMessage(chat.id, message);
      });

      // Update config so the what's new message is not sent on subsequent bot startups.
      this.config.sendWhatsNewMsg = false;
      this.fileIO.saveConfigToFile(this.config);
    }
  }
}