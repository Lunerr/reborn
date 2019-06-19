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
const { Argument, Command, CommandResult } = require('patron.js');
const db = require('../../services/database.js');
const discord = require('../../utilities/discord.js');

module.exports = new class NominateJudge extends Command {
  constructor() {
    super({
      preconditions: ['usable_judge', 'usable_officer'],
      args: [
        new Argument({
          example: 'Ashley',
          key: 'member',
          name: 'member',
          type: 'member',
          remainder: true
        })
      ],
      description: 'Nominates a judge.',
      groupName: 'owners',
      names: ['nominate_judge']
    });
  }

  async run(msg, args) {
    const { judge_role, officer_role } = db.fetch('guilds', { guild_id: msg.channel.guild.id });
    const { roles } = args.member;

    if (roles.includes(judge_role)) {
      return CommandResult.fromError('This user already has the Judge role.');
    } else if (roles.includes(officer_role)) {
      return CommandResult.fromError(
        'This user cannot receive the Judge role since they have the Officer role.'
      );
    }

    await args.member.addRole(judge_role);
    await discord.create_msg(
      msg.channel,
      `**${discord.tag(msg.author)}**, You have nominated ${args.member.mention} to the Judge role.`
    );
  }
}();