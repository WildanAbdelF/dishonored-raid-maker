const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createParty, setMessageId } = require('../utils/partyStore');
const { buildEmbed, buildComponents } = require('../utils/partyView');

// Emoji default untuk role yang namanya dikenali (silakan tambah/ubah sesuai game kamu)
const KNOWN_ROLE_EMOJIS = {
  fu: '🧙‍♀️',
  pr: '❤️',
  mc: '🔨',
  sm: '🗡',
  mt: '🛡',
  'ice stacking': '❄️',
  saleana: '🪄',
  archer: '🏹',
  dps: '⚔️',
  kali: '🪭',
};
const FALLBACK_EMOJIS = ['🔹', '🔸', '🔷', '🔶', '⭐', '✨', '🎯', '🎲'];

const PRESETS = {
  classic_lineup: {
    label: 'Classic Lineup',
    roles: 'MT:1, PR:1, Ice Stacking:1, FU:1, MC:1, SM:1, Archer:1, DPS:1',
  },
  no_mc: {
    label: 'NO MC (MT, PR, FU, SM, Ice Stacking, Archer, DPS)',
    roles: 'MT:1, PR:1, Ice Stacking:1, FU:1, SM:1, Archer:1, DPS:2',
  },
  kali_over_mc: {
    label: 'Kali Over MC (MT, PR, FU, SM, Ice Stacking, Kali, Archer, DPS)',
    roles: 'MT:1, PR:1, Ice Stacking:1, FU:1, SM:1, Kali:1, Archer:1, DPS:1',
  },
  saleana_over_icestack: {
    label: 'Saleana Over Ice Stacking (MT, PR, FU, SM, Saleana, Ice Stacking, Archer, DPS)',
    roles: 'MT:1, PR:1, Saleana:1, FU:1, SM:1, MC:1, Archer:1, DPS:1',
  },

  dps_no_mc: {
    label: '3 DPS (MT, PR, FU, SM, Ice Stacking, Archer, DPS)',
    roles: 'MT:1, PR:1, Ice Stacking:1, FU:1, SM:1, DPS:3',
  },



};

const PRESET_CHOICES = Object.entries(PRESETS).map(([value, { label }]) => ({ name: label, value }));
function parseRoles(rolesString) {
  const parts = rolesString.split(',').map((p) => p.trim()).filter(Boolean);
  return parts.map((part, index) => {
    const [namePart, maxPart] = part.split(':').map((s) => s.trim());
    const max = Math.max(1, parseInt(maxPart, 10) || 1);
    const key = namePart.toLowerCase();
    const emoji = KNOWN_ROLE_EMOJIS[key] || FALLBACK_EMOJIS[index % FALLBACK_EMOJIS.length];
    return { name: namePart, max, emoji };
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('party')
    .setDescription('Buat party finder baru')
    .addSubcommand((sub) =>
      sub
        .setName('create')
        .setDescription('Buat party finder baru dengan role kustom')
        .addStringOption((opt) =>
          opt.setName('title').setDescription('Judul party, misal: GDN HC TO CLASSIC DD').setRequired(true),
        )
        .addStringOption((opt) =>
          opt
            .setName('roles')
            .setDescription('Format: Nama:Jumlah, dipisah koma. Contoh: Tank:1,Healer:1,DPS:3')
            .setRequired(false),
        )
        .addStringOption((opt) =>
          opt
            .setName('preset')
            .setDescription('Pakai template role yang sudah jadi')
            .addChoices(...PRESET_CHOICES)
            .setRequired(false),
        )
        .addBooleanOption((opt) =>
          opt.setName('notify').setDescription('Kirim @here saat party dibuat? (default: ya)').setRequired(false),
        ),
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    if (subcommand !== 'create') return;

    const title = interaction.options.getString('title');
    const preset = interaction.options.getString('preset');
    const rolesInput = interaction.options.getString('roles');
    const notify = interaction.options.getBoolean('notify') ?? true;

    const rolesString = preset && PRESETS[preset] ? PRESETS[preset].roles : rolesInput;
    if (!rolesString) {
      await interaction.reply({
        content: '⚠️ Kamu harus isi opsi `roles` (contoh: `Tank:1,Healer:1,DPS:3`) atau pilih `preset`.',
        ephemeral: true,
      });
      return;
    }

    let roles;
    try {
      roles = parseRoles(rolesString);
      if (roles.length === 0) throw new Error('empty');
    } catch (err) {
      await interaction.reply({
        content: '⚠️ Format `roles` tidak valid. Contoh yang benar: `Tank:1,Healer:1,DPS:3`',
        ephemeral: true,
      });
      return;
    }

    const totalSlots = roles.reduce((sum, role) => sum + role.max, 0);
    if (totalSlots > 8) {
      await interaction.reply({
        content: `⚠️ Maximal 8 Orang Goblog. Yang lu buat itu ${totalSlots} slot.`,
        ephemeral: true,
      });
      return;
    }

    const party = createParty({
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      hostId: interaction.user.id,
      title,
      roles,
    });

    const embed = buildEmbed(party);
    const components = buildComponents(party);

    const content = notify ? '@here' : undefined;

    await interaction.reply({
      content,
      embeds: [embed],
      components,
      allowedMentions: notify ? { parse: ['everyone'] } : undefined,
    });

    const message = await interaction.fetchReply();
    setMessageId(party.id, message.id);
  },
};
