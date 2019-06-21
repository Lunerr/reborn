/**
 * Reborn - The core control of the only truly free and fair discord server.
 * Copyright (C) 2019  John Boyer
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
'use strict';
const { Command, CommandResult } = require('patron.js');
const catch_discord = require('../../utilities/catch_discord.js');
const client = require('../../services/client.js');
const verdict = require('../../enums/verdict.js');
const db = require('../../services/database.js');
const discord = require('../../utilities/discord.js');
const removeRole = catch_discord(client.removeGuildMemberRole.bind(client));
const to_week = 6048e5;

module.exports = new class Guilty extends Command {
  constructor() {
    super({
      preconditions: ['court_only', 'can_trial', 'can_imprison', 'judge_creator'],
      description: 'Impeaches the prosecutor.',
      groupName: 'courts',
      names: ['mistrial']
    });
  }

  async run(msg) {
    const {
      channel_id, id: case_id, plaintiff_id, defendant_id
    } = db.get_channel_case(msg.channel.id);
    const cop = msg.channel.guild.members.get(plaintiff_id);

    if (!channel_id) {
      return CommandResult.fromError('This channel has no ongoing court case.');
    } else if (!cop) {
      return CommandResult.fromError('The prosecutor is no longer in the server.');
    }

    const prefix = `**${discord.tag(msg.author)}**, `;
    const verified = await discord.verify_msg(
      msg,
      `${prefix}**Warning:** Are you sure you want to declare this case a mistrial?
Doing so will impeach the prosecutor of this case, ${cop.mention}. No verdict will be delivered \
and the defendant may be able to be prosecuted again. Unjust mistrials will \
result in an impeachment. Type \`I'm sure\` if this is your final decision.`
    );

    if (!verified) {
      return CommandResult.fromError('The command has been cancelled.');
    }

    db.insert('verdicts', {
      guild_id: msg.channel.guild.id,
      case_id,
      defendant_id,
      verdict: verdict.mistrial
    });

    const {
      officer_role, impeachment_time, imprisoned_role
    } = db.fetch('guilds', { guild_id: msg.channel.guild.id });
    const weeks = impeachment_time / to_week;

    await removeRole(msg.channel.guild.id, plaintiff_id, officer_role);
    await removeRole(msg.channel.guild.id, defendant_id, imprisoned_role);
    db.insert('impeachments', {
      member_id: plaintiff_id,
      guild_id: msg.channel.guild.id
    });
    await discord.create_msg(
      msg.channel,
      `${prefix}This court case has been declared as a mistrial.\n${cop.mention} has been \
impeached and will not be able to recieve any government official role for ${weeks} weeks.`
    );
  }
}();