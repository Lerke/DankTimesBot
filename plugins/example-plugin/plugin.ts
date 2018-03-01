import { AbstractPlugin } from "../../src/plugin-host/plugin/plugin";
import { PluginEvent } from "../../src/plugin-host/plugin-events/plugin-event-types"
import { UserScoreChangedPluginEventArguments } from "../../src/plugin-host/plugin-events/event-arguments/user-score-changed-plugin-event-arguments";
import { PrePostMessagePluginEventArguments } from "../../src/plugin-host/plugin-events/event-arguments/pre-post-message-plugin-event-arguments";
import { LeaderboardResetPluginEventArguments } from "../../src/plugin-host/plugin-events/event-arguments/leaderboard-reset-plugin-event-arguments";
import { NoArgumentsPluginEventArguments } from "../../src/plugin-host/plugin-events/event-arguments/no-arguments-plugin-event-arguments";
import { ChatMessage } from "../../src/chat/chat-message/chat-message";

/**
 * Example of auxiliary data classes.
 */
class ExamplePluginData {
  public TestNumber: number = 0;
}

/**
 * Example of the simplest DankTimesBot
 * plugin. Can be used as a template to
 * build new plugins.
 */
export class Plugin extends AbstractPlugin {
  /**
   * A plugin should call its base constructor to
   * provide it with an identifier, a version
   * and some optional data.
   */
  constructor() {
    super("Example Plugin", "1.0.0", {});

    // Example of sample dat
    this.data = new ExamplePluginData();
    this.data.TestNumber = 1;

    this.subscribeToPluginEvent(PluginEvent.PreMesssage, (data: PrePostMessagePluginEventArguments) => {
      return [`Example of a Pre Message Event`];
    });
    this.subscribeToPluginEvent(PluginEvent.UserScoreChange, (data: UserScoreChangedPluginEventArguments) => {
      return [`A player changed score! Player: ${data.user.name}, change: ${data.changeInScore}`,
        `Example of current leaderboard:`,
      `${JSON.stringify(this.services.Leaderboard().entries)} Okay.`];
    });
    this.subscribeToPluginEvent(PluginEvent.PostMessage, (data: PrePostMessagePluginEventArguments) => {
      return [`Example of a Post Message Event`];
    });
    this.subscribeToPluginEvent(PluginEvent.LeaderboardReset, (data: LeaderboardResetPluginEventArguments) => {
      return [`The leaderboard was reset for chat: ${data.chat.id}`];
    });
    this.subscribeToPluginEvent(PluginEvent.DankShutdown, (data: NoArgumentsPluginEventArguments) => {
      console.log("Shutting down plugin! " + this.name);
    });

    this.registerCommand("test", (msg: ChatMessage) => {
      return [`success: ${msg.text}`];
    });

    this.registerCommand("test-reply", (msg: ChatMessage) => {
      return [`Succes: ${msg.reply_text}`];
    });

    this.registerCommand("test-services", (params: ChatMessage) => {
      return this.services.users().map((v, i) => `{${i}: ${v}`);
    });
  }
} 