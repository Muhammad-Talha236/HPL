import prisma from "../../database/prisma.js";

export const getHomeStatistics = async (req, res) => {
  try {
    const [teams, players, seasons, venues] = await Promise.all([
      prisma.team.count(),
      prisma.player.count(),
      prisma.season.count(),
      prisma.venue.count(),
    ]);

    return res.status(200).json({
      success: true,
      data: { teams, players, seasons, venues },
    });
  } catch (error) {
    console.error("Get home statistics error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch home statistics",
    });
  }
};
