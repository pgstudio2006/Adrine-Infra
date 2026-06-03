-- Run once on adrine-postgres (after kernel is up).
-- Coolify → Servers → localhost → Terminal, or any shell on the VPS:
--   docker exec -i $(docker ps -qf name=dp2gns8ygjh0w20s84z7kofl) psql -U adrine -d adrine_kernel -c "CREATE DATABASE adrine_domain;"

CREATE DATABASE adrine_domain;
