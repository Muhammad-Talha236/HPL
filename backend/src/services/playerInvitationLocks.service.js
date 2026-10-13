// One query per locked snapshot. Nested Prisma includes issue multiple relation
// queries, some concurrently, on the PostgreSQL adapter's single tx connection.
export async function lockInvitationTeam(tx, id) {
  const [row] = await tx.$queryRaw`
    SELECT t.team_id, t.name, t.logo, t.gender, t.owner_id, t.status,
           t.verification_status, t.club_id,
           c.owner_id AS club_owner_id, c.status AS club_status, c.name AS club_name,
           r.squad_deadline
    FROM "Team" t
    LEFT JOIN "Club" c ON c.club_id = t.club_id
    LEFT JOIN "TeamRegistrationRequest" r ON r.linked_team_id = t.team_id
    WHERE t.team_id = ${id} FOR UPDATE OF t`;
  if (!row) return null;
  return { ...row, club: row.club_id === null ? null : { owner_id: row.club_owner_id, status: row.club_status, name: row.club_name }, registration_request: { squad_deadline: row.squad_deadline } };
}

export async function lockInvitationAccount(tx, id) {
  const [row] = await tx.$queryRaw`
    SELECT u.user_id, u.name, u.email, u.status, u.email_verified, u.email_verified_at,
           p.player_id AS linked_player_id
    FROM "User" u LEFT JOIN "Player" p ON p.user_id = u.user_id
    WHERE u.user_id = ${id} FOR UPDATE OF u`;
  if (!row) return null;
  return { ...row, player: row.linked_player_id ? { player_id: row.linked_player_id, user_id: row.user_id } : null };
}

export async function lockInvitationPlayer(tx, id) {
  const [player] = await tx.$queryRaw`
    SELECT player_id, user_id, status, gender FROM "Player"
    WHERE player_id = ${id} FOR UPDATE`;
  return player || null;
}
