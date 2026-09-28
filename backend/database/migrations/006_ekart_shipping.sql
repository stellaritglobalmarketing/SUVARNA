-- Ekart integration: courier-side details on shipments, and a log of incoming courier webhooks.
-- Only adds columns/tables (no data changes). Every step is safe to re-run.

ALTER TABLE `shipments`
  ADD COLUMN IF NOT EXISTS `provider_status` varchar(64) DEFAULT NULL COMMENT 'Courier''s own status text, e.g. "In Transit"' AFTER `shipment_status`,
  ADD COLUMN IF NOT EXISTS `ndr_status` varchar(64) DEFAULT NULL COMMENT 'Why the last delivery attempt failed' AFTER `provider_status`,
  ADD COLUMN IF NOT EXISTS `ndr_actions` varchar(64) DEFAULT NULL COMMENT 'Comma-separated actions the courier allows, e.g. Re-Attempt,RTO' AFTER `ndr_status`,
  ADD COLUMN IF NOT EXISTS `expected_delivery_at` datetime DEFAULT NULL AFTER `ndr_actions`,
  ADD COLUMN IF NOT EXISTS `manifest_number` varchar(64) DEFAULT NULL AFTER `expected_delivery_at`,
  ADD COLUMN IF NOT EXISTS `manifest_url` varchar(512) DEFAULT NULL AFTER `manifest_number`,
  ADD COLUMN IF NOT EXISTS `last_synced_at` datetime DEFAULT NULL AFTER `manifest_url`,
  ADD COLUMN IF NOT EXISTS `cancelled_at` datetime DEFAULT NULL AFTER `delivered_at`;

ALTER TABLE `shipments` ADD INDEX IF NOT EXISTS `idx_shipments_sync` (`provider`, `shipment_status`, `last_synced_at`);
ALTER TABLE `shipments` ADD INDEX IF NOT EXISTS `idx_shipments_courier_id` (`shipment_id`);

CREATE TABLE IF NOT EXISTS `shipping_webhook_events` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `provider` varchar(32) NOT NULL,
  `topic` varchar(64) DEFAULT NULL,
  `reference` varchar(128) DEFAULT NULL COMMENT 'Courier tracking id the event is about',
  `payload` text NOT NULL,
  `processed` tinyint(1) NOT NULL DEFAULT 0,
  `error` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_webhook_events_reference` (`provider`, `reference`, `created_at`),
  KEY `idx_webhook_events_processed` (`processed`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
