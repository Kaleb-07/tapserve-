-- AlterTable
ALTER TABLE `settings` ADD COLUMN `faviconUrl` LONGTEXT NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `assignedTables` TEXT NULL;
