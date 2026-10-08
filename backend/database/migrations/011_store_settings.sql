-- Store-wide settings the admin can change without a redeploy (Admin → Settings).
-- whatsapp_number: digits with country code; WhatsApp checkout messages, the "chat with us" links and
-- the paid-order invoice all go to it. Safe to re-run; an existing value is kept.

CREATE TABLE IF NOT EXISTS `store_settings` (
  `setting_key` varchar(64) NOT NULL,
  `setting_value` varchar(512) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `store_settings` (`setting_key`, `setting_value`) VALUES ('whatsapp_number', '916353684881');
