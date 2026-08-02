CREATE TABLE `instagram_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dataType` varchar(32) NOT NULL,
	`data` json NOT NULL,
	`fetchedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `instagram_cache_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`defaultMode` varchar(32) NOT NULL DEFAULT 'standard',
	`weatherCity` varchar(128) DEFAULT 'Seattle',
	`weatherLat` varchar(20),
	`weatherLon` varchar(20),
	`personalityTuning` json,
	`discoverInterests` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_settings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `audit_logs` MODIFY COLUMN `category` enum('chat','network','code','engineering','analysis','memory','plugin','system','discover','news','weather','flights','files','settings','instagram') NOT NULL;