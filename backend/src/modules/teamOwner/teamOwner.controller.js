import { eligiblePlayerGenders, isPlayerGenderCompatible } from "../../utils/playerEligibility.util.js";
import prisma from "../../database/prisma.js";
import { getTeamSquadReadiness } from "../teams/teamVerification.service.js";

const page = (query) => { const current = Number(query.page || 1); const limit = Number(query.limit || 20); return Number.isInteger(current) && current > 0 && Number.isInteger(limit) && limit > 0 && limit <= 50 ? { current, limit } : null; };
const teamWhere = (ownerId) => ({ owner_id: ownerId });
const teamSelect = { team_id: true, home_venue_id: true, name: true, logo: true, status: true, verification_status: true, gender: true, team_type: true, region: true, district: true, city: true, description: true, contact_email: true, contact_phone: true, created_at: true, updated_at: true, home_venue: { select: { venue_id: true, name: true, city: true } }, club: { select: { name: true } }, registration_request: { select: { status: true, squad_deadline: true, review_reason: true } } };
const membershipSelect = { team_player_id: true, jersey_number: true, status: true, joined_at: true, left_at: true, player: { select: { player_id: true, name: true, profile_photo: true, position: true, gender: true, registration_number: true } }, team: { select: { team_id: true, name: true } } };
const membershipDetailSelect = { ...membershipSelect, player: { select: { player_id: true, name: true, profile_photo: true, position: true, gender: true, registration_number: true, user_id: true } } };
const ownedTeam = async (ownerId, rawId) => { const teamId = Number(rawId); if (!Number.isInteger(teamId) || teamId < 1) return { error: "INVALID" }; const team = await prisma.team.findFirst({ where: { team_id: teamId, owner_id: ownerId }, select: { team_id: true, gender: true, status: true, verification_status: true, name: true } }); return team ? { team } : { error: "NOT_FOUND" }; };
const ownedTeamResponse = (res, result) => result.error === "INVALID" ? res.status(400).json({ success: false, message: "Team ID must be a valid positive integer" }) : result.error === "NOT_FOUND" ? res.status(404).json({ success: false, message: "Team not found" }) : null;
const dateOnly = (value) => value.toISOString().slice(0, 10);
const todayDateOnly = () => dateOnly(new Date());
const competitionEligibility = (competition, team, approvedCount) => {
  const registration = competition.registrations[0];
  if (registration) return { state: registration.registration_status, message: "A registration already exists for this team." };
  if (team.status !== "ACTIVE") return { state: "INACTIVE", message: "This team is inactive." };
  if (team.verification_status !== "VERIFIED") return { state: "NOT_VERIFIED", message: "Independent teams must be HPL-verified before registration." };
  if (!isPlayerGenderCompatible(team.gender, competition.gender)) return { state: "GENDER_MISMATCH", message: "Team and competition genders do not match." };
  if (competition.status !== "ACTIVE") return { state: "INACTIVE", message: "This competition is inactive." };
  if (competition.season.status !== "ACTIVE") return { state: "INACTIVE", message: "This competition's season is inactive." };
  const today = todayDateOnly();
  if (today < dateOnly(competition.registration_start_date) || today > dateOnly(competition.registration_end_date)) return { state: "REGISTRATION_CLOSED", message: "Registration is not currently open." };
  if (dateOnly(competition.competition_start_date) <= today) return { state: "STARTED", message: "This competition has already started." };
  if (competition.max_teams !== null && approvedCount >= competition.max_teams) return { state: "FULL", message: "The approved-team capacity has been reached." };
  return { state: "ELIGIBLE", message: "This team meets the current registration requirements." };
};

const MATCH_STATUSES = ["SCHEDULED", "LIVE", "COMPLETED", "CANCELLED", "POSTPONED"];
const matchListSelect = {
  match_id: true, competition_id: true, season_id: true, home_team_id: true, away_team_id: true,
  venue_id: true, referee_id: true, match_date: true, start_time: true, started_at: true,
  status: true, home_score: true, away_score: true,
  competition: { select: { competition_id: true, name: true, gender: true } },
  season: { select: { season_id: true, name: true } },
  home_team: { select: { team_id: true, name: true, logo: true } },
  away_team: { select: { team_id: true, name: true, logo: true } },
  venue: { select: { venue_id: true, name: true, city: true } },
  referee: { select: { referee_id: true, name: true, profile_photo: true } },
};

const ownedMatchWhere = (ownerId, filters = {}) => ({
  AND: [
    { OR: [{ home_team: { owner_id: ownerId } }, { away_team: { owner_id: ownerId } }] },
    ...(filters.team_id ? [{ OR: [{ home_team_id: filters.team_id }, { away_team_id: filters.team_id }] }] : []),
    ...(filters.competition_id ? [{ competition_id: filters.competition_id }] : []),
    ...(filters.season_id ? [{ season_id: filters.season_id }] : []),
    ...(filters.status ? [{ status: filters.status }] : []),
  ],
});

const positiveQueryId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export const matches = async (req, res, next) => { try {
  const pagination = page(req.query);
  if (!pagination) return res.status(400).json({ success: false, message: "Invalid pagination" });
  const filters = {};
  for (const key of ["team_id", "competition_id", "season_id"]) {
    if (req.query[key] !== undefined) {
      const id = positiveQueryId(req.query[key]);
      if (!id) return res.status(400).json({ success: false, message: `Invalid ${key}` });
      filters[key] = id;
    }
  }
  if (req.query.status !== undefined) {
    if (!MATCH_STATUSES.includes(req.query.status)) return res.status(400).json({ success: false, message: "Invalid match status" });
    filters.status = req.query.status;
  }
  if (filters.team_id) {
    const selected = await ownedTeam(req.user.user_id, filters.team_id);
    const rejected = ownedTeamResponse(res, selected);
    if (rejected) return rejected;
  }
  const where = ownedMatchWhere(req.user.user_id, filters);
  const [data, total] = await Promise.all([
    prisma.match.findMany({ where, select: matchListSelect, orderBy: [{ match_date: "desc" }, { start_time: "desc" }, { match_id: "desc" }], skip: (pagination.current - 1) * pagination.limit, take: pagination.limit }),
    prisma.match.count({ where }),
  ]);
  return res.json({ success: true, data, pagination: { page: pagination.current, limit: pagination.limit, total, total_pages: Math.ceil(total / pagination.limit), has_next_page: pagination.current * pagination.limit < total, has_previous_page: pagination.current > 1 } });
} catch (error) { next(error); } };

export const matchDetail = async (req, res, next) => { try {
  const matchId = positiveQueryId(req.params.match_id);
  if (!matchId) return res.status(400).json({ success: false, message: "Match ID must be a valid positive integer" });
  const where = ownedMatchWhere(req.user.user_id);
  where.AND.push({ match_id: matchId });
  const match = await prisma.match.findFirst({ where, select: {
    ...matchListSelect,
    events: { take: 100, orderBy: [{ minute: "asc" }, { extra_time: "asc" }, { event_id: "asc" }], select: {
      event_id: true, team_id: true, player_id: true, related_player_id: true, event_type: true, minute: true, extra_time: true, description: true,
      team: { select: { team_id: true, name: true, logo: true } },
      player: { select: { player_id: true, name: true, profile_photo: true, position: true } },
      related_player: { select: { player_id: true, name: true, profile_photo: true, position: true } },
    } },
    players: { take: 60, orderBy: [{ team_id: "asc" }, { starting_status: "asc" }, { shirt_number: "asc" }, { match_player_id: "asc" }], select: {
      match_player_id: true, team_id: true, player_id: true, starting_status: true, is_on_field: true, position: true, shirt_number: true, minutes_played: true, entered_at: true, exited_at: true,
      player: { select: { player_id: true, name: true, profile_photo: true, position: true } },
    } },
  } });
  if (!match) return res.status(404).json({ success: false, message: "Match not found" });
  const homePlayers = match.players.filter((player) => player.team_id === match.home_team_id);
  const awayPlayers = match.players.filter((player) => player.team_id === match.away_team_id);
  const homeEvents = match.events.filter((event) => event.team_id === match.home_team_id);
  const awayEvents = match.events.filter((event) => event.team_id === match.away_team_id);
  return res.json({ success: true, data: {
    match: { match_id: match.match_id, competition_id: match.competition_id, season_id: match.season_id, home_team_id: match.home_team_id, away_team_id: match.away_team_id, venue_id: match.venue_id, referee_id: match.referee_id, match_date: match.match_date, start_time: match.start_time, started_at: match.started_at, status: match.status, home_score: match.home_score, away_score: match.away_score },
    competition: match.competition, season: match.season, home_team: match.home_team, away_team: match.away_team, venue: match.venue, referee: match.referee,
    events: { total: match.events.length, home: homeEvents, away: awayEvents, all: match.events },
    squads: { home: { total: homePlayers.length, starters: homePlayers.filter((player) => player.starting_status === "STARTER").length, substitutes: homePlayers.filter((player) => player.starting_status === "SUBSTITUTE").length, players: homePlayers }, away: { total: awayPlayers.length, starters: awayPlayers.filter((player) => player.starting_status === "STARTER").length, substitutes: awayPlayers.filter((player) => player.starting_status === "SUBSTITUTE").length, players: awayPlayers } },
  } });
} catch (error) { next(error); } };

const withReadiness = async (teams) => Promise.all(teams.map(async (team) => ({ ...team, squad_readiness: team.club ? null : await getTeamSquadReadiness(team.team_id) })));
export const dashboard = async (req, res, next) => { try { const rawTeams = await prisma.team.findMany({ where: teamWhere(req.user.user_id), select: teamSelect }); const teams = await withReadiness(rawTeams); const ids = teams.map((team) => team.team_id); const [players, registrationsCount, paymentCount, completedMatches, upcoming, results] = await Promise.all([prisma.teamPlayer.count({ where: { team_id: { in: ids }, status: "ACTIVE", player: { status: "ACTIVE" } } }), prisma.competitionRegistration.count({ where: { team_id: { in: ids } } }), prisma.payment.count({ where: { registration: { team_id: { in: ids } } } }), prisma.match.count({ where: { status: "COMPLETED", OR: [{ home_team_id: { in: ids } }, { away_team_id: { in: ids } }] } }), prisma.match.findMany({ where: { status: "SCHEDULED", OR: [{ home_team_id: { in: ids } }, { away_team_id: { in: ids } }] }, select: { match_id: true, match_date: true, home_team: { select: { name: true } }, away_team: { select: { name: true } } }, take: 5, orderBy: { match_date: "asc" } }), prisma.match.findMany({ where: { status: "COMPLETED", OR: [{ home_team_id: { in: ids } }, { away_team_id: { in: ids } }] }, select: { match_id: true, home_score: true, away_score: true, home_team: { select: { name: true } }, away_team: { select: { name: true } } }, take: 5, orderBy: { match_date: "desc" } })]); return res.json({ success: true, data: { teams, counts: { players, registrations: registrationsCount, payments: paymentCount, completed_matches: completedMatches }, upcoming_matches: upcoming, recent_results: results } }); } catch (error) { next(error); } };
export const myTeam = async (req, res, next) => { try { const teams = await prisma.team.findMany({ where: teamWhere(req.user.user_id), select: teamSelect }); return res.json({ success: true, data: await withReadiness(teams) }); } catch (error) { next(error); } };
export const competitions = async (req, res, next) => { try {
  const pagination = page(req.query); if (!pagination) return res.status(400).json({ success: false, message: "Invalid pagination" });
  const selected = await ownedTeam(req.user.user_id, req.query.team_id); const rejected = ownedTeamResponse(res, selected); if (rejected) return rejected;
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const seasonId = req.query.season_id === undefined ? undefined : Number(req.query.season_id);
  if (search.length > 100 || (req.query.season_id !== undefined && (!Number.isInteger(seasonId) || seasonId < 1))) return res.status(400).json({ success: false, message: "Invalid competition filters" });
  if (req.query.status !== undefined && !["ACTIVE", "INACTIVE"].includes(req.query.status)) return res.status(400).json({ success: false, message: "Invalid competition status" });
  const where = { ...(search ? { name: { contains: search, mode: "insensitive" } } : {}), ...(typeof req.query.status === "string" && req.query.status ? { status: req.query.status } : {}), ...(seasonId ? { season_id: seasonId } : {}) };
  const select = { competition_id: true, name: true, gender: true, format: true, registration_fee: true, registration_start_date: true, registration_end_date: true, competition_start_date: true, competition_end_date: true, max_teams: true, squad_size: true, status: true, season: { select: { season_id: true, name: true, status: true } }, registrations: { where: { team_id: selected.team.team_id }, select: { registration_id: true, registration_status: true, payment_status: true } } };
  const [items, total] = await Promise.all([prisma.competition.findMany({ where, select, orderBy: [{ competition_start_date: "asc" }, { competition_id: "asc" }], skip: (pagination.current - 1) * pagination.limit, take: pagination.limit }), prisma.competition.count({ where })]);
  const counts = await prisma.competitionRegistration.groupBy({ by: ["competition_id"], where: { competition_id: { in: items.map((item) => item.competition_id) }, registration_status: "APPROVED" }, _count: { registration_id: true } });
  const countByCompetition = new Map(counts.map((item) => [item.competition_id, item._count.registration_id]));
  const data = items.map((competition) => { const registration = competition.registrations[0]; const approved_teams = countByCompetition.get(competition.competition_id) || 0; const eligibility = competitionEligibility(competition, selected.team, approved_teams); return { competition_id: competition.competition_id, name: competition.name, season: competition.season, gender: competition.gender, format: competition.format, start_date: competition.competition_start_date, end_date: competition.competition_end_date, registration_fee: competition.registration_fee, squad_size: competition.squad_size, max_teams: competition.max_teams, approved_teams, status: competition.status, eligibility, ...(registration ? { registration_id: registration.registration_id, registration_status: registration.registration_status, payment_status: registration.payment_status } : {}) }; });
  return res.json({ success: true, data, selected_team: selected.team, pagination: { page: pagination.current, limit: pagination.limit, total, total_pages: Math.ceil(total / pagination.limit) } });
} catch (error) { next(error); } };
export const competitionRegistrationDetail = async (req, res, next) => { try {
  const registrationId = Number(req.params.registration_id);
  if (!Number.isInteger(registrationId) || registrationId < 1) return res.status(400).json({ success: false, message: "Registration ID must be a valid positive integer" });
  const registration = await prisma.competitionRegistration.findFirst({ where: { registration_id: registrationId, team: teamWhere(req.user.user_id) }, select: { registration_id: true, team_id: true, registration_status: true, payment_status: true, registration_date: true, updated_at: true, team: { select: { team_id: true, name: true, gender: true } }, competition: { select: { competition_id: true, name: true, gender: true, registration_fee: true, squad_size: true, competition_start_date: true, competition_end_date: true, season: { select: { season_id: true, name: true } } } }, payments: { select: { amount: true, payment_status: true, created_at: true }, orderBy: { created_at: "desc" }, take: 1 }, players: { select: { player_id: true, player: { select: { name: true, registration_number: true, position: true } } } } } });
  if (!registration) return res.status(404).json({ success: false, message: "Registration not found" });
  const playerIds = registration.players.map((item) => item.player_id);
  const memberships = playerIds.length ? await prisma.teamPlayer.findMany({ where: { team_id: registration.team_id, player_id: { in: playerIds } }, select: { player_id: true, jersey_number: true } }) : [];
  const jerseyByPlayer = new Map(memberships.map((item) => [item.player_id, item.jersey_number]));
  const payment = registration.payments[0] || null;
  return res.json({ success: true, data: { registration_id: registration.registration_id, registration_status: registration.registration_status, payment_status: registration.payment_status, registration_date: registration.registration_date, updated_at: registration.updated_at, team: registration.team, competition: registration.competition, payment: payment ? { amount: payment.amount, payment_status: payment.payment_status, submitted_at: payment.created_at } : null, squad: registration.players.map(({ player_id, player }) => ({ player_id, name: player.name, registration_number: player.registration_number, position: player.position, jersey_number: jerseyByPlayer.get(player_id) ?? null })), squad_count: registration.players.length, squad_size: registration.competition.squad_size } });
} catch (error) { next(error); } };
export const competitionSquadCandidates = async (req, res, next) => { try {
  const registrationId = Number(req.params.registration_id);
  if (!Number.isInteger(registrationId) || registrationId < 1) return res.status(400).json({ success: false, message: "Registration ID must be a valid positive integer" });
  const registration = await prisma.competitionRegistration.findFirst({ where: { registration_id: registrationId, team: teamWhere(req.user.user_id) }, select: { registration_id: true, team_id: true, registration_status: true, team: { select: { name: true } }, competition: { select: { name: true, gender: true, squad_size: true } } } });
  if (!registration) return res.status(404).json({ success: false, message: "Registration not found" });
  const data = await prisma.teamPlayer.findMany({ where: { team_id: registration.team_id, status: "ACTIVE", player: { status: "ACTIVE", date_of_birth: { not: null }, position: { not: null }, NOT: { position: "" }, gender: { in: eligiblePlayerGenders(registration.competition.gender) } } }, select: { team_player_id: true, player_id: true, jersey_number: true, status: true, player: { select: { name: true, registration_number: true, position: true, gender: true } } }, orderBy: { player: { name: "asc" } } });
  return res.json({ success: true, data: data.map((membership) => ({ team_player_id: membership.team_player_id, player_id: membership.player_id, name: membership.player.name, registration_number: membership.player.registration_number, position: membership.player.position, gender: membership.player.gender, jersey_number: membership.jersey_number, membership_status: membership.status })), registration: { registration_id: registration.registration_id, registration_status: registration.registration_status, team_name: registration.team.name, competition_name: registration.competition.name, squad_size: registration.competition.squad_size, editable: registration.registration_status === "APPROVED" } });
} catch (error) { next(error); } };
export const venues = async (req, res, next) => { try { return res.json({ success: true, data: await prisma.venue.findMany({ where: { status: "ACTIVE" }, select: { venue_id: true, name: true, city: true }, orderBy: { name: "asc" } }) }); } catch (error) { next(error); } };
export const players = async (req, res, next) => { try { const pagination = page(req.query); if (!pagination) return res.status(400).json({ success: false, message: "Invalid pagination" }); const selected = await ownedTeam(req.user.user_id, req.query.team_id); const rejected = ownedTeamResponse(res, selected); if (rejected) return rejected; const where = { team_id: selected.team.team_id, status: req.query.status || "ACTIVE" }; const [data, total] = await Promise.all([prisma.teamPlayer.findMany({ where, select: membershipSelect, skip: (pagination.current - 1) * pagination.limit, take: pagination.limit, orderBy: { joined_at: "desc" } }), prisma.teamPlayer.count({ where })]); return res.json({ success: true, data, selected_team: selected.team, pagination: { page: pagination.current, limit: pagination.limit, total, total_pages: Math.ceil(total / pagination.limit) } }); } catch (error) { next(error); } };
export const playerDetail = async (req, res, next) => { try { const playerId = Number(req.params.player_id); if (!Number.isInteger(playerId) || playerId < 1) return res.status(400).json({ success: false, message: "Player ID must be a valid positive integer" }); const selected = await ownedTeam(req.user.user_id, req.query.team_id); const rejected = ownedTeamResponse(res, selected); if (rejected) return rejected; const data = await prisma.teamPlayer.findFirst({ where: { player_id: playerId, team_id: selected.team.team_id }, select: membershipDetailSelect }); if (!data) return res.status(404).json({ success: false, message: "Player membership not found" }); const { user_id, ...safePlayer } = data.player; return res.json({ success: true, data: { ...data, player: { ...safePlayer, account_linked: Boolean(user_id) } }, selected_team: selected.team }); } catch (error) { next(error); } };
export const registrations = async (req, res, next) => { try { const pagination = page(req.query); if (!pagination) return res.status(400).json({ success: false, message: "Invalid pagination" }); const where = { team: teamWhere(req.user.user_id) }; const [data, total] = await Promise.all([prisma.competitionRegistration.findMany({ where, select: { registration_id: true, registration_status: true, payment_status: true, competition: { select: { name: true } }, team: { select: { name: true } } }, skip: (pagination.current - 1) * pagination.limit, take: pagination.limit }), prisma.competitionRegistration.count({ where })]); return res.json({ success: true, data, pagination: { page: pagination.current, limit: pagination.limit, total, total_pages: Math.ceil(total / pagination.limit) } }); } catch (error) { next(error); } };
export const payments = async (req, res, next) => { try { const pagination = page(req.query); if (!pagination) return res.status(400).json({ success: false, message: "Invalid pagination" }); const where = { registration: { team: teamWhere(req.user.user_id) } }; const [data, total] = await Promise.all([prisma.payment.findMany({ where, select: { payment_id: true, registration_id: true, amount: true, payment_status: true, created_at: true, registration: { select: { team: { select: { name: true } }, competition: { select: { name: true } } } } }, skip: (pagination.current - 1) * pagination.limit, take: pagination.limit }), prisma.payment.count({ where })]); return res.json({ success: true, data, pagination: { page: pagination.current, limit: pagination.limit, total, total_pages: Math.ceil(total / pagination.limit) } }); } catch (error) { next(error); } };
