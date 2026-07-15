const {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
} = require('discord.js');
const {
  getParty,
  joinRole,
  cancelRole,
  removeMember,
  findUserRole,
} = require('../utils/partyStore');
const { buildEmbed, buildComponents } = require('../utils/partyView');

async function updatePartyMessage(interaction, party) {
  const embed = buildEmbed(party);
  const components = buildComponents(party);
  await interaction.update({ embeds: [embed], components });
}

function isHost(interaction, party) {
  return interaction.user.id === party.hostId;
}

async function handleButton(interaction) {
  const [, partyId, action, extra] = interaction.customId.split(':');
  const party = getParty(partyId);

  if (!party) {
    await interaction.reply({ content: '⚠️ Party ini sudah tidak tersedia (mungkin bot restart).', ephemeral: true });
    return;
  }

  switch (action) {
    case 'role': {
      const roleIndex = parseInt(extra, 10);
      const result = joinRole(party, interaction.user.id, roleIndex);
      if (!result.ok) {
        const messages = {
          full: '⚠️ Slot role ini sudah penuh.',
          already_in_role: '⚠️ Kamu sudah ada di role ini.',
          role_not_found: '⚠️ Role tidak ditemukan.',
        };
        await interaction.reply({ content: messages[result.reason] || '⚠️ Gagal join role.', ephemeral: true });
        return;
      }
      await updatePartyMessage(interaction, party);
      return;
    }

    case 'cancelrole': {
      const result = cancelRole(party, interaction.user.id);
      if (!result.ok) {
        await interaction.reply({ content: '⚠️ Kamu belum join role manapun di party ini.', ephemeral: true });
        return;
      }
      await updatePartyMessage(interaction, party);
      return;
    }

    case 'lock': {
      if (!isHost(interaction, party)) {
        await interaction.reply({ content: '⚠️ Hanya host yang bisa lock/unlock party.', ephemeral: true });
        return;
      }
      party.status = party.status === 'locked' ? 'open' : 'locked';
      await updatePartyMessage(interaction, party);
      return;
    }

    case 'remove': {
      if (!isHost(interaction, party)) {
        await interaction.reply({ content: '⚠️ Hanya host yang bisa remove member.', ephemeral: true });
        return;
      }
      const memberOptions = [];
      party.roles.forEach((role) => {
        role.members.forEach((userId) => {
          memberOptions.push({ label: `${role.name} - ${userId}`, value: userId });
        });
      });
      if (memberOptions.length === 0) {
        await interaction.reply({ content: 'ℹ️ Belum ada member yang join.', ephemeral: true });
        return;
      }
      const select = new StringSelectMenuBuilder()
        .setCustomId(`party:${party.id}:removeselect`)
        .setPlaceholder('Pilih member yang mau di-remove')
        .addOptions(memberOptions.slice(0, 25));
      const row = new ActionRowBuilder().addComponents(select);
      await interaction.reply({ content: 'Pilih member yang mau di-remove:', components: [row], ephemeral: true });
      return;
    }

    case 'done': {
      if (!isHost(interaction, party)) {
        await interaction.reply({ content: '⚠️ Hanya host yang bisa menandai party selesai.', ephemeral: true });
        return;
      }
      party.status = 'done';
      await updatePartyMessage(interaction, party);
      return;
    }

    case 'cancelrun': {
      if (!isHost(interaction, party)) {
        await interaction.reply({ content: '⚠️ Hanya host yang bisa cancel run.', ephemeral: true });
        return;
      }
      party.status = 'cancelled';
      await updatePartyMessage(interaction, party);
      return;
    }

    case 'edittitle': {
      if (!isHost(interaction, party)) {
        await interaction.reply({ content: '⚠️ Hanya host yang bisa edit title.', ephemeral: true });
        return;
      }
      const modal = new ModalBuilder().setCustomId(`party:${party.id}:edittitlemodal`).setTitle('Edit Judul Party');
      const input = new TextInputBuilder()
        .setCustomId('newtitle')
        .setLabel('Judul baru')
        .setStyle(TextInputStyle.Short)
        .setValue(party.title)
        .setRequired(true)
        .setMaxLength(100);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await interaction.showModal(modal);
      return;
    }

    case 'notify': {
      if (!isHost(interaction, party)) {
        await interaction.reply({ content: '⚠️ Hanya host yang bisa notify ulang.', ephemeral: true });
        return;
      }
      await interaction.reply({ content: `@here | Party **${party.title}** masih butuh member! Yuk join 🙌` });
      return;
    }

    default:
      return;
  }
}

async function handleSelectMenu(interaction) {
  const [, partyId, action] = interaction.customId.split(':');
  const party = getParty(partyId);
  if (!party) {
    await interaction.update({ content: '⚠️ Party ini sudah tidak tersedia.', components: [] });
    return;
  }

  if (action === 'removeselect') {
    if (!isHost(interaction, party)) {
      await interaction.reply({ content: '⚠️ Hanya host yang bisa melakukan ini.', ephemeral: true });
      return;
    }
    const targetUserId = interaction.values[0];
    const result = removeMember(party, targetUserId);

    // Update pesan party utama
    const channel = await interaction.client.channels.fetch(party.channelId);
    const partyMessage = await channel.messages.fetch(party.messageId);
    await partyMessage.edit({ embeds: [buildEmbed(party)], components: buildComponents(party) });

    await interaction.update({
      content: result.ok ? `✅ <@${targetUserId}> berhasil di-remove dari party.` : '⚠️ Gagal remove member.',
      components: [],
    });
  }
}

async function handleModal(interaction) {
  const [, partyId, action] = interaction.customId.split(':');
  const party = getParty(partyId);
  if (!party) {
    await interaction.reply({ content: '⚠️ Party ini sudah tidak tersedia.', ephemeral: true });
    return;
  }

  if (action === 'edittitlemodal') {
    if (!isHost(interaction, party)) {
      await interaction.reply({ content: '⚠️ Hanya host yang bisa edit title.', ephemeral: true });
      return;
    }
    const newTitle = interaction.fields.getTextInputValue('newtitle');
    party.title = newTitle;

    const channel = await interaction.client.channels.fetch(party.channelId);
    const partyMessage = await channel.messages.fetch(party.messageId);
    await partyMessage.edit({ embeds: [buildEmbed(party)], components: buildComponents(party) });

    await interaction.reply({ content: '✅ Judul party berhasil diubah.', ephemeral: true });
  }
}

module.exports = { handleButton, handleSelectMenu, handleModal };
