# Sabat Ini homepage summary

The homepage reads `/api/sabat-ini`, which uses the current saved spreadsheet
settings. It reads only `Kertas Acara!B2:C4` and `A1:N40` of the quarterly
participant tab. No admin session or private prayer notes are returned.

The target is the upcoming Saturday in Asia/Jakarta, including today when
today is Saturday. It changes at Sunday midnight WIB. Title and main verse
appear only when C2 matches the target Saturday. Speaker is matched against
the participant date header and `Pembicara` row, including its explicit
year. Text date headers without a source year do not reuse old assignments.
Unprepared details show neutral pending copy. Names and entered sermon text
remain as written when switching UI language.

Service times come from `churchConfig.services[0]`. The section supports
ID/EN, light/dark mode, and narrow screens without cards. It links to the
full order of service.

Validated sheet responses cache for five minutes per server instance;
concurrent loads share the same request. Google reads retry once with an
eight-second timeout per attempt. On transient failure, validated data from
the same source pair may be reused for up to one hour, with a visible notice.
Even fallback data is checked against today's target Sabbath. Date matching
is recomputed per request. The page reloads data every five minutes and on
returning to a visible tab. No database or additional credentials.

Checks: `node --test scripts/sabbath-summary.test.mjs`.
