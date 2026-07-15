const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { totalSlots } = require('./partyStore');

const STATUS_INFO = {
  open: { color: 0x2ecc71, label: 'Open' },
  locked: { color: 0xf1c40f, label: 'Locked' },
  done: { color: 0x2ecc71, label: 'Done' },
  cancelled: { color: 0xe74c3c, label: 'Cancelled' },
};

function buildEmbed(party) {
  const { filled, max } = totalSlots(party);
  const status = STATUS_INFO[party.status] || STATUS_INFO.open;

  const roleLines = party.roles
    .map((role) => {
      const filledSlots = role.members.map((id) => `<@${id}>`);
      const emptySlots = Array(role.max - role.members.length).fill('*empty*');
      const slotText = [...filledSlots, ...emptySlots].join(', ');
      const countText = role.max > 1 ? ` (${role.members.length}/${role.max})` : '';
      return `**${role.emoji} ${role.name}**${countText} — ${slotText}`;
    })
    .join('\n');

  const embed = new EmbedBuilder()
    .setColor(status.color)
    .setTitle(`⚔️ ${party.title}`)
    .setDescription(roleLines)
    .addFields(
      { name: 'Host', value: `<@${party.hostId}>`, inline: true },
      { name: 'Slot', value: `${filled}/${max}`, inline: true },
      { name: 'Status', value: `${party.status === 'open' ? '🟢' : party.status === 'locked' ? '🔒' : party.status === 'done' ? '✅' : '🔴'} ${status.label}`, inline: true },
    )
    .setFooter({ text: 'Klik tombol role di bawah untuk join' })
    .setTimestamp(party.createdAt);

  return embed;
}

function buildComponents(party) {
  const disabled = party.status !== 'open';
  const rows = [];

  // Tombol role, maksimal 5 per baris
  let currentRow = new ActionRowBuilder();
  party.roles.forEach((role, index) => {
    if (currentRow.components.length === 5) {
      rows.push(currentRow);
      currentRow = new ActionRowBuilder();
    }
    const isFull = role.members.length >= role.max;
    currentRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`party:${party.id}:role:${index}`)
        .setLabel(role.name)
        .setEmoji(role.emoji)
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disabled || isFull),
    );
  });
  if (currentRow.components.length > 0) rows.push(currentRow);

  // Baris aksi untuk semua orang
  const actionRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`party:${party.id}:cancelrole`)
      .setLabel('Cancel My Role')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(party.status === 'done' || party.status === 'cancelled'),
  );
  rows.push(actionRow);

  // Baris aksi khusus host
  const hostRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`party:${party.id}:lock`)
      .setLabel(party.status === 'locked' ? 'Unlock Party' : 'Lock Party')
      .setEmoji('🔒')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(party.status === 'done' || party.status === 'cancelled'),
    new ButtonBuilder()
      .setCustomId(`party:${party.id}:remove`)
      .setLabel('Remove Member')
      .setEmoji('🚫')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(party.status === 'done' || party.status === 'cancelled'),
    new ButtonBuilder()
      .setCustomId(`party:${party.id}:done`)
      .setLabel('Done')
      .setEmoji('✅')
      .setStyle(ButtonStyle.Success)
      .setDisabled(party.status === 'done' || party.status === 'cancelled'),
    new ButtonBuilder()
      .setCustomId(`party:${party.id}:cancelrun`)
      .setLabel('Cancel Run')
      .setEmoji('⛔')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(party.status === 'done' || party.status === 'cancelled'),
  );
  rows.push(hostRow);

  const hostRow2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`party:${party.id}:edittitle`)
      .setLabel('Edit Title')
      .setEmoji('📝')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(party.status === 'done' || party.status === 'cancelled'),
    new ButtonBuilder()
      .setCustomId(`party:${party.id}:notify`)
      .setLabel('Notify Again')
      .setEmoji('📢')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(party.status === 'done' || party.status === 'cancelled'),
  );
  rows.push(hostRow2);

  return rows;
}

module.exports = { buildEmbed, buildComponents };
