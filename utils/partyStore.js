const crypto = require('crypto');

/**
 * Struktur satu party:
 * {
 *   id: string,
 *   guildId, channelId, messageId,
 *   hostId: string,
 *   title: string,
 *   status: 'open' | 'locked' | 'done' | 'cancelled',
 *   roles: [
 *     { name: 'FU', emoji: '🔴', max: 2, members: ['userId1'] },
 *     ...
 *   ],
 *   createdAt: number
 * }
 */

// Menyimpan semua party yang sedang aktif di memori.
// Catatan: karena in-memory, data akan hilang kalau bot restart.
// Kalau butuh persisten, tinggal ganti Map ini dengan database (SQLite/MongoDB/dll).
const parties = new Map();

function createParty({ guildId, channelId, hostId, title, roles }) {
  const id = crypto.randomBytes(4).toString('hex');
  const party = {
    id,
    guildId,
    channelId,
    messageId: null,
    hostId,
    title,
    status: 'open',
    roles: roles.map((r) => ({ ...r, members: [] })),
    createdAt: Date.now(),
  };
  parties.set(id, party);
  return party;
}

function getParty(id) {
  return parties.get(id);
}

function setMessageId(id, messageId) {
  const party = parties.get(id);
  if (party) party.messageId = messageId;
}

function deleteParty(id) {
  parties.delete(id);
}

// Cari role tempat user itu terdaftar (kalau ada). Return { roleIndex } atau null.
function findUserRole(party, userId) {
  for (let i = 0; i < party.roles.length; i++) {
    if (party.roles[i].members.includes(userId)) return i;
  }
  return null;
}

// User join ke role tertentu. Kalau user sudah di role lain, dia dipindah (bukan double slot).
function joinRole(party, userId, roleIndex) {
  const role = party.roles[roleIndex];
  if (!role) return { ok: false, reason: 'role_not_found' };
  if (role.members.includes(userId)) return { ok: false, reason: 'already_in_role' };
  if (role.members.length >= role.max) return { ok: false, reason: 'full' };

  const existingIndex = findUserRole(party, userId);
  if (existingIndex !== null) {
    party.roles[existingIndex].members = party.roles[existingIndex].members.filter((m) => m !== userId);
  }
  role.members.push(userId);
  return { ok: true };
}

function cancelRole(party, userId) {
  const existingIndex = findUserRole(party, userId);
  if (existingIndex === null) return { ok: false, reason: 'not_in_party' };
  party.roles[existingIndex].members = party.roles[existingIndex].members.filter((m) => m !== userId);
  return { ok: true };
}

function removeMember(party, userId) {
  const existingIndex = findUserRole(party, userId);
  if (existingIndex === null) return { ok: false, reason: 'not_in_party' };
  party.roles[existingIndex].members = party.roles[existingIndex].members.filter((m) => m !== userId);
  return { ok: true };
}

function totalSlots(party) {
  const max = party.roles.reduce((sum, r) => sum + r.max, 0);
  const filled = party.roles.reduce((sum, r) => sum + r.members.length, 0);
  return { filled, max };
}

module.exports = {
  parties,
  createParty,
  getParty,
  setMessageId,
  deleteParty,
  findUserRole,
  joinRole,
  cancelRole,
  removeMember,
  totalSlots,
};
