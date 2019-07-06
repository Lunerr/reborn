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
const { Argument, Command } = require('patron.js');
const db = require('../../services/database.js');
const discord = require('../../utilities/discord.js');

module.exports = new class ToggleCleanServer extends Command {
  constructor() {
    super({
      args: [
        new Argument({
          key: 'bool',
          type: 'bool',
          example: 'yes',
          name: 'cleanse',
          defaultValue: true
        })
      ],
      description: 'Cleans the server of any unholy stuff.',
      groupName: 'owners',
      names: ['toggle_clean_server', 'purify_server', 'cleanse_server']
    });
  }

  async run(msg, args) {
    db.update('guilds', {
      guild_id: msg.channel.guild.id,
      cleanse: args.bool ? 1 : 0
    });
    await discord.create_msg(
      msg.channel, `${discord.tag(msg.author).boldified}, I have \
${args.bool ? 'enabled' : 'disabled'} the cleansing feature.`
    );
  }
}();