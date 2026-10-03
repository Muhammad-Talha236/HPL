import prisma from "../../database/prisma.js";
import { createAuditLog } from "../../utils/auditLog.util.js";
import { AUDIT_ACTIONS } from "../../constants/auditActions.js";
import { RANKING_GENDERS, recalculateTeamRankings } from "./ranking.service.js";

export const getRankings = async (req, res) => {
  try {
    const gender = req.query.gender || "MEN";
    if (!RANKING_GENDERS.includes(gender)) return res.status(400).json({ success: false, message: "Gender must be MEN or WOMEN" });

    const rankings = await prisma.teamRanking.findMany({
      where: { gender, team: { status: "ACTIVE" } },
      orderBy: [{ rank: "asc" }, { team_id: "asc" }],
      select: {
        ranking_id: true, team_id: true, gender: true, rating: true, rank: true,
        matches_counted: true, wins: true, draws: true, losses: true, updated_at: true,
        team: { select: { team_id: true, name: true, logo: true, gender: true } },
      },
    });

    return res.status(200).json({ success: true, data: { gender, rankings } });
  } catch (error) {
    console.error("Get rankings error:", error);
    return res.status(500).json({ success: false, message: "Unable to fetch team rankings" });
  }
};

export const rebuildRankings = async (req, res) => {
  try {
    const rankings = await prisma.$transaction(
      (tx) => recalculateTeamRankings(tx),
      { isolationLevel: "Serializable" }
    );

    await createAuditLog({
      actor_user_id: req.user.user_id,
      action: AUDIT_ACTIONS.RANKINGS_REBUILT,
      entity_type: "TEAM_RANKING",
      details: { rankings_rebuilt: rankings.length, algorithm: "ELO_V1" },
    });

    return res.status(200).json({ success: true, message: "Team rankings rebuilt successfully", data: { rankings_rebuilt: rankings.length } });
  } catch (error) {
    console.error("Rebuild rankings error:", error);
    return res.status(500).json({ success: false, message: "Unable to rebuild team rankings" });
  }
};
