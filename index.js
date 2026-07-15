require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { handleButton, handleSelectMenu, handleModal } = require('./handlers/interactionHandler');

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
fs.readdirSync(commandsPath)
  .filter((file) => file.endsWith('.js'))
  .forEach((file) => {
    const command = require(path.join(commandsPath, file));
    client.commands.set(command.data.name, command);
  });

client.once('ready', () => {
  console.log(`✅ Bot login sebagai ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      await command.execute(interaction);
      return;
    }

    if (interaction.isButton()) {
      await handleButton(interaction);
      return;
    }

    if (interaction.isStringSelectMenu()) {
      await handleSelectMenu(interaction);
      return;
    }

    if (interaction.isModalSubmit()) {
      await handleModal(interaction);
      return;
    }
  } catch (err) {
    console.error('Terjadi error saat memproses interaksi:', err);
    const errorMessage = { content: '⚠️ Terjadi kesalahan saat memproses aksi ini.', ephemeral: true };
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(errorMessage).catch(() => {});
    } else {
      await interaction.reply(errorMessage).catch(() => {});
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
