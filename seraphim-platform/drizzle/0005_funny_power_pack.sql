CREATE TABLE `sentinel_checks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`category` enum('system_health','security','performance','inventory','logs') NOT NULL,
	`checkName` varchar(128) NOT NULL,
	`scriptName` varchar(128) NOT NULL,
	`status` enum('pass','warning','fail','pending') NOT NULL DEFAULT 'pending',
	`output` text,
	`exitCode` int,
	`executedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sentinel_checks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `audit_logs` MODIFY COLUMN `category` enum('chat','network','code','engineering','analysis','memory','plugin','system','discover','news','weather','flights','files','settings','instagram','sentinel') NOT NULL;