# Database Notice

setup.sql should be treated as a schema reference only.

The live Supabase database is the source of truth for:

* RLS policies
* GRANT permissions
* Authorization behavior
* Operational fixes

Implemented phases may require permissions or policies that are not represented in setup.sql.

Before making authorization decisions, always verify the live database state.
