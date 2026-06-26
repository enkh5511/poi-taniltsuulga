POI Site V25 — Member Model Refresh Fixed

Fix:
- Data refresh now uses protected performance_snapshot member/campaign data directly.
- Old local cache is cleared on forced refresh.
- Dashboard member card updates after members_model changes without needing a new site deploy.
- Logout clears cached member/campaign credentials.

Upload/overwrite at minimum:
- app/performance.html
