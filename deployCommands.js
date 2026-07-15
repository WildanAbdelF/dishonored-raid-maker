require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
fs.readdirSync(commandsPath)
  .filter((file) => file.endsWith('.js'))
  .forEach((file) => {
    const command = require(path.join(commandsPath, file));
    commands.push(command.data.toJSON());
  });

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`🔄 Mendaftarkan ${commands.length} slash command...`);

    const route = process.env.GUILD_ID
      ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
      : Routes.applicationCommands(process.env.CLIENT_ID);

    await rest.put(route, { body: commands });

    console.log('✅ Slash command berhasil didaftarkan!');
    if (process.env.GUILD_ID) {
      console.log('   (Terdaftar hanya di 1 server, harusnya langsung muncul)');
    } else {
      console.log('   (Terdaftar global, bisa butuh waktu sampai ~1 jam untuk muncul)');
    }
  } catch (err) {
    console.error('❌ Gagal deploy command:', err);
  }
})();
