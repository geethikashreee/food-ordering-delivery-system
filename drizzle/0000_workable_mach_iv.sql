CREATE TABLE `auth_attempts` (
	`id` varchar(64) NOT NULL,
	`attempts` int NOT NULL,
	`reset_at` bigint NOT NULL,
	CONSTRAINT `auth_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`request_key` varchar(80) NOT NULL,
	`restaurant_id` varchar(80) NOT NULL,
	`restaurant_name` varchar(120) NOT NULL,
	`items` text NOT NULL,
	`subtotal` int NOT NULL,
	`discount` int NOT NULL,
	`delivery` int NOT NULL,
	`tax` int NOT NULL,
	`total` int NOT NULL,
	`coupon` varchar(30),
	`address` varchar(500) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`note` varchar(300) NOT NULL DEFAULT '',
	`schedule` varchar(40) NOT NULL DEFAULT 'ASAP',
	`payment` varchar(40) NOT NULL DEFAULT 'Cash on delivery',
	`status` varchar(30) NOT NULL DEFAULT 'Placed',
	`events` text NOT NULL,
	`preparation_minutes` int NOT NULL DEFAULT 0,
	`queue_minutes` int NOT NULL DEFAULT 0,
	`rescue_deal_id` varchar(80),
	`rescue_key` varchar(120),
	`squad_id` varchar(36),
	`created_at` bigint NOT NULL,
	`updated_at` bigint NOT NULL,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_request_key` UNIQUE(`user_id`,`request_key`),
	CONSTRAINT `orders_squad_unique` UNIQUE(`squad_id`)
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`user_id` varchar(36) NOT NULL,
	`name` varchar(80) NOT NULL DEFAULT '',
	`address` varchar(500) NOT NULL DEFAULT '',
	`phone` varchar(20) NOT NULL DEFAULT '',
	`favourites` text NOT NULL,
	CONSTRAINT `profiles_user_id` PRIMARY KEY(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `rescue_inventory` (
	`id` varchar(120) NOT NULL,
	`deal_id` varchar(80) NOT NULL,
	`remaining` int NOT NULL,
	`expires_at` bigint NOT NULL,
	CONSTRAINT `rescue_inventory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` varchar(64) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`expires_at` bigint NOT NULL,
	`created_at` bigint NOT NULL,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `squad_members` (
	`id` varchar(36) NOT NULL,
	`squad_id` varchar(36) NOT NULL,
	`user_id` varchar(36),
	`name` varchar(50) NOT NULL,
	`picks` text NOT NULL,
	`ready` int NOT NULL DEFAULT 0,
	CONSTRAINT `squad_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `squad_user_unique` UNIQUE(`squad_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `squads` (
	`id` varchar(36) NOT NULL,
	`code` varchar(8) NOT NULL,
	`owner_id` varchar(36) NOT NULL,
	`title` varchar(70) NOT NULL,
	`restaurant_id` varchar(80) NOT NULL,
	`budget` int NOT NULL,
	`state` varchar(20) NOT NULL DEFAULT 'open',
	`order_id` varchar(36),
	`revision` int NOT NULL DEFAULT 0,
	`created_at` bigint NOT NULL,
	`updated_at` bigint NOT NULL,
	CONSTRAINT `squads_id` PRIMARY KEY(`id`),
	CONSTRAINT `squads_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`email` varchar(254) NOT NULL,
	`name` varchar(80) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`created_at` bigint NOT NULL,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `squad_members` ADD CONSTRAINT `squad_members_squad_id_squads_id_fk` FOREIGN KEY (`squad_id`) REFERENCES `squads`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `orders_user_created` ON `orders` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `orders_workload` ON `orders` (`restaurant_id`,`status`);--> statement-breakpoint
CREATE INDEX `sessions_expiry` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE INDEX `squads_owner_created` ON `squads` (`owner_id`,`created_at`);