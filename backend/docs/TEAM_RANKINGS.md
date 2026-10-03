# HPL Team Rankings (ELO V1)

Team Rankings are HPL-wide performance ratings. They are separate from competition standings: standings use the 3/1/0 points table within one competition, while rankings compare completed HPL competition matches across seasons and competitions.

## Scope and eligibility

- Pools are separate for `MEN` and `WOMEN`; the competition and both teams must have the same supported gender.
- Only matches whose status is `COMPLETED` are counted. Scheduled, live, cancelled and postponed matches never affect ratings.
- A team becomes publicly ranked after its first eligible completed match. New teams are therefore unranked rather than shown with an invented position.
- Ratings persist across seasons. Inactive teams remain in the stored history so previous results stay mathematically correct, but are hidden from the public response.

## Formula

Every team starts internally at `1500`. For each eligible match, processed in the deterministic order `match_date`, `start_time`, then `match_id`:

`expected = 1 / (1 + 10 ^ ((opponentRating - teamRating) / 400))`

`newRating = oldRating + 32 * (actual - expected)`

`actual` is `1` for a win, `0.5` for a draw and `0` for a loss. Ratings are rounded to two decimal places after every match. V1 uses neither home advantage nor a goal-margin multiplier because neither is currently supported by HPL domain rules.

Example: two new teams at 1500 play and Team A wins. Expected score is 0.5 each, so Team A becomes 1516 and Team B becomes 1484.

Ties are ordered deterministically by rating (descending), eligible matches counted (descending), then `team_id` (ascending). Public rank positions are sequential within each gender pool.

## Correctness and operations

On a successful match completion, the service rebuilds rankings from all canonical completed matches inside the same database transaction as standings. This makes retries idempotent and prevents a fixture from being applied twice. It also means a corrected historical result is handled safely by rebuilding the table.

Super administrators may rebuild all rankings with `POST /api/rankings/rebuild`. The action is transactional, uses serializable isolation, and writes a `RANKINGS_REBUILT` audit-log entry. The public endpoint is `GET /api/rankings?gender=MEN` (or `WOMEN`).
