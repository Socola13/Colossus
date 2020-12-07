const Command = require("../../structures/Command");
const hierarchy = require("../../utils/hierarchy");
const yn = require("../../utils/ask").yesNo;

class banCommand extends Command {
  constructor(...args) {
    super(...args, {
      aliases: ["b"],
      args: "<member:member&strict> [reason:string]",
      description: "Bans a member from the server.",
      clientperms: "banMembers",
      requiredperms: "manageMessages",
      staff: true,
    });
  }

  async run(msg, args, pargs) {
    const user = pargs[0].value;
    let reason = args.slice(1).join(" ");
    if (!reason.length) reason = "No reason provided.";
    else if (reason.length > 512) reason = reason.slice(0, 512);

    // If bot doesn't have high enough role
    if (!hierarchy(msg.channel.guild.members.get(this.bot.user.id), user)) {
      return this.bot.embed("❌ Error", `I don't have a high enough role to ban **${user.username}**.`, msg, "error");
    }

    // Asks for confirmation
    if (hierarchy(msg.member, user)) {
      const banmsg = await this.bot.embed("🔨 Ban", `Are you sure you'd like to ban **${user.username}**?`, msg);
      const response = await yn(this.bot, { author: msg.author, channel: msg.channel });
      if (!response) return this.bot.embed.edit("🔨 Ban", `Cancelled banning **${user.username}**.`, banmsg);

      try {
        await user.ban(1, `${reason} (by ${this.bot.tag(msg.author, true)})`);
      } catch (err) {
        return this.bot.embed.edit("❌ Error", `Failed to ban **${user.username}**.`, banmsg, "error");
      }

      // Tries to DM banned user
      const dmchannel = await user.user.getDMChannel().catch(() => {});

      if (dmchannel) {
        dmchannel.createMessage({
          embed: {
            title: `🚪 Banned from ${msg.channel.guild.name}`,
            description: `You were banned for \`${reason}\`.`,
            color: this.bot.embed.color("general"),
          },
        }).catch(() => {});
      }

      this.bot.embed.edit("🔨 Ban", `**${user.username}** was banned by **${msg.author.username}**.`, banmsg);
    }
  }
}

module.exports = banCommand;
