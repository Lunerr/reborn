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
const system = require('../../utilities/system.js');
const content = `Granting unlawful warrants will result in \
impeachment and **national disgrace**.

If you have **ANY DOUBTS WHATSOEVER ABOUT THE VALIDITY OF THIS WARRANT**, \
do not proceed with this warrant.

__IGNORANCE IS NOT A DEFENSE.__

If you are sure you wish to proceed with the warrant given the aforementioned terms, \
please type \`yes\`.`;
const empty_argument = Symbol('Empty Argument');

module.exports = new class GrantWarrantForArrest extends Command {
  constructor() {
    super({
      args: [
        new Argument({
          example: 'Nͥatͣeͫ763#0554',
          key: 'member',
          name: 'member',
          type: 'member'
        }),
        new Argument({
          example: 'Murder',
          key: 'law',
          name: 'law',
          type: 'law',
          preconditions: ['active_law']
        }),
        new Argument({
          example: 'https://i.imgur.com/gkxUedu.png',
          key: 'evidence',
          name: 'evidence',
          type: 'string',
          defaultValue: empty_argument,
          remainder: true
        })
      ],
      description: 'Creates a warrant.',
      groupName: 'courts',
      names: ['grant_warrant_for_arrest', 'grant_warrant', 'grant']
    });
  }

  async run(msg, args) {
    if (args.evidence === empty_argument && !msg.attachments.length) {
      return CommandResult.fromError('You must provide evidence in an image or link.');
    }

    const verified = await discord.verify_msg(
      msg, `**${discord.tag(msg.author)}**, ${content}`, null, 'yes'
    );

    if (!verified) {
      return CommandResult.fromError('The command has been cancelled.');
    }

    let evidence;

    if (args.evidence !== empty_argument && msg.attachments.length) {
      evidence = `${args.evidence}\n\n${msg.attachments.map(x => x.proxy_url).join(', ')}`;
    } else if (msg.attachments.length) {
      evidence = msg.attachments.map(x => x.proxy_url).join(', ');
    } else {
      ({ evidence } = args);
    }

    const obj = {
      guild_id: msg.channel.guild.id,
      law_id: args.law.id,
      defendant_id: args.member.id,
      judge_id: msg.author.id,
      evidence
    };
    const { lastInsertRowid: id } = db.insert('warrants', obj);

    obj.id = id;
    await discord.create_msg(
      msg.channel,
      `**${discord.tag(msg.author)}**, A warrant has been granted against ${args.member.mention}.`
    );

    const { warrant_channel } = db.fetch('guilds', { guild_id: msg.channel.guild.id });
    const w_channel = msg.channel.guild.channels.get(warrant_channel);

    if (w_channel) {
      await system.add_warrant(w_channel, obj);
    }
  }
}();