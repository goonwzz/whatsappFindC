CREATE TABLE `campaigns` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`country` text NOT NULL,
	`product` text NOT NULL,
	`exclusions` text DEFAULT '' NOT NULL,
	`target_count` integer DEFAULT 20 NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`message_id` integer NOT NULL,
	`type` text NOT NULL,
	`payload` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign_id` integer NOT NULL,
	`company` text NOT NULL,
	`website` text,
	`country` text NOT NULL,
	`email` text,
	`whatsapp` text,
	`fit_score` integer DEFAULT 0 NOT NULL,
	`evidence` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'discovered' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lead_id` integer NOT NULL,
	`channel` text DEFAULT 'email' NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`provider_message_id` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`scheduled_at` text,
	`sent_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE no action
);
