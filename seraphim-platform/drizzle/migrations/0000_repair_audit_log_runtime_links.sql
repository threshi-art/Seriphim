-- Repairs schema drift in existing deployments where audit_logs predates
-- Runtime Layer 1. Apply once after confirming both columns are absent.
ALTER TABLE `audit_logs`
  ADD COLUMN `missionId` int NULL,
  ADD COLUMN `checkpointId` int NULL;
