        const MATCH_STATUS = {
        COMPLETED: "COMPLETED",
        };

        const REGISTRATION_STATUS = {
        APPROVED: "APPROVED",
        };

        /*
        * Recalculate standings for one competition.
        *
        * IMPORTANT:
        * This function expects a Prisma transaction client (tx).
        *
        * It should be called INSIDE the same transaction
        * that completes a match.
        *
        * Standard football points:
        *
        * Win   = 3 points
        * Draw  = 1 point
        * Loss  = 0 points
        */
        export const recalculateCompetitionStandings = async (
        tx,
        competitionId
        ) => {
        // ==================================================
        // 1. GET APPROVED TEAMS
        // ==================================================

        const registrations =
            await tx.competitionRegistration.findMany({
            where: {
                competition_id: competitionId,

                registration_status:
                REGISTRATION_STATUS.APPROVED,
            },

            select: {
                team_id: true,
            },
            });

        const approvedTeamIds =
            registrations
            .map(
                (registration) =>
                registration.team_id
            )
            .filter(
                (teamId) =>
                Number.isInteger(teamId)
            );

        // ==================================================
        // 2. REMOVE OLD STANDINGS FOR NON-APPROVED TEAMS
        // ==================================================

        if (approvedTeamIds.length > 0) {
            await tx.teamStanding.deleteMany({
            where: {
                competition_id:
                competitionId,

                team_id: {
                notIn: approvedTeamIds,
                },
            },
            });
        } else {
            /*
            * If there are no approved teams,
            * there should be no standings for
            * this competition.
            */
            await tx.teamStanding.deleteMany({
            where: {
                competition_id:
                competitionId,
            },
            });

            return [];
        }

        // ==================================================
        // 3. INITIALIZE STANDING DATA
        // ==================================================

        const standingMap = new Map();

        for (const teamId of approvedTeamIds) {
            standingMap.set(teamId, {
            team_id: teamId,

            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,

            goals_for: 0,
            goals_against: 0,

            goal_difference: 0,
            points: 0,

            position: null,
            });
        }

        // ==================================================
        // 4. GET ALL COMPLETED MATCHES
        // ==================================================

        const completedMatches =
            await tx.match.findMany({
            where: {
                competition_id:
                competitionId,

                status:
                MATCH_STATUS.COMPLETED,
            },

            select: {
                match_id: true,

                home_team_id: true,
                away_team_id: true,

                home_score: true,
                away_score: true,
            },

            orderBy: {
                match_id: "asc",
            },
            });

        // ==================================================
        // 5. PROCESS MATCH RESULTS
        // ==================================================

        for (const match of completedMatches) {
            const homeTeam =
            standingMap.get(
                match.home_team_id
            );

            const awayTeam =
            standingMap.get(
                match.away_team_id
            );

            /*
            * A completed match should normally
            * involve approved teams.
            *
            * If data somehow becomes inconsistent,
            * skip that match rather than crashing
            * the entire standings calculation.
            */
            if (
            !homeTeam ||
            !awayTeam
            ) {
            continue;
            }

            const homeScore =
            Number(match.home_score);

            const awayScore =
            Number(match.away_score);

            // ------------------------------------------------
            // HOME TEAM
            // ------------------------------------------------

            homeTeam.played += 1;

            homeTeam.goals_for +=
            homeScore;

            homeTeam.goals_against +=
            awayScore;

            // ------------------------------------------------
            // AWAY TEAM
            // ------------------------------------------------

            awayTeam.played += 1;

            awayTeam.goals_for +=
            awayScore;

            awayTeam.goals_against +=
            homeScore;

            // ==================================================
            // RESULT
            // ==================================================

            if (homeScore > awayScore) {
            // Home win

            homeTeam.wins += 1;
            homeTeam.points += 3;

            awayTeam.losses += 1;
            } else if (
            homeScore < awayScore
            ) {
            // Away win

            awayTeam.wins += 1;
            awayTeam.points += 3;

            homeTeam.losses += 1;
            } else {
            // Draw

            homeTeam.draws += 1;
            awayTeam.draws += 1;

            homeTeam.points += 1;
            awayTeam.points += 1;
            }
        }

        // ==================================================
        // 6. CALCULATE GOAL DIFFERENCE
        // ==================================================

        for (const standing of standingMap.values()) {
            standing.goal_difference =
            standing.goals_for -
            standing.goals_against;
        }

        // ==================================================
        // 7. SORT TABLE
        // ==================================================

        /*
        * Standard league-table ordering:
        *
        * 1. Points
        * 2. Goal difference
        * 3. Goals scored
        * 4. Team ID as deterministic fallback
        *
        * Team ID is only a technical tie-breaker so
        * the ordering remains deterministic when all
        * football statistics are identical.
        */
        const sortedStandings =
            Array.from(
            standingMap.values()
            ).sort((a, b) => {
            if (
                b.points !==
                a.points
            ) {
                return (
                b.points -
                a.points
                );
            }

            if (
                b.goal_difference !==
                a.goal_difference
            ) {
                return (
                b.goal_difference -
                a.goal_difference
                );
            }

            if (
                b.goals_for !==
                a.goals_for
            ) {
                return (
                b.goals_for -
                a.goals_for
                );
            }

            return (
                a.team_id -
                b.team_id
            );
            });

        // ==================================================
        // 8. ASSIGN POSITIONS
        // ==================================================

        sortedStandings.forEach(
            (standing, index) => {
            standing.position =
                index + 1;
            }
        );

        // ==================================================
        // 9. UPSERT STANDINGS
        // ==================================================

        for (const standing of sortedStandings) {
            await tx.teamStanding.upsert({
            where: {
                competition_id_team_id: {
                competition_id:
                    competitionId,

                team_id:
                    standing.team_id,
                },
            },

            create: {
                competition_id:
                competitionId,

                team_id:
                standing.team_id,

                played:
                standing.played,

                wins:
                standing.wins,

                draws:
                standing.draws,

                losses:
                standing.losses,

                goals_for:
                standing.goals_for,

                goals_against:
                standing.goals_against,

                goal_difference:
                standing.goal_difference,

                points:
                standing.points,

                position:
                standing.position,
            },

            update: {
                played:
                standing.played,

                wins:
                standing.wins,

                draws:
                standing.draws,

                losses:
                standing.losses,

                goals_for:
                standing.goals_for,

                goals_against:
                standing.goals_against,

                goal_difference:
                standing.goal_difference,

                points:
                standing.points,

                position:
                standing.position,
            },
            });
        }

        // ==================================================
        // 10. RETURN FINAL STANDINGS
        // ==================================================

        return sortedStandings;
        };