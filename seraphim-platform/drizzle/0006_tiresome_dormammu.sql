CREATE TABLE `mission_checkpoints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`missionId` int NOT NULL,
	`label` varchar(128) NOT NULL,
	`summary` text NOT NULL,
	`stateSnapshot` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mission_checkpoints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mission_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`missionId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`status` enum('pending','blocked','ready','in_progress','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`sequence` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mission_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `missions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`objective` text NOT NULL,
	`status` enum('draft','active','paused','completed','failed','cancelled') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `missions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `audit_logs` ADD `missionId` int;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD `checkpointId` int;