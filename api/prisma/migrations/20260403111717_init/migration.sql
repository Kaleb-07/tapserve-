/*
  Warnings:

  - You are about to drop the `admin` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `orderitem` DROP FOREIGN KEY `OrderItem_orderId_fkey`;

-- DropIndex
DROP INDEX `OrderItem_orderId_fkey` ON `orderitem`;

-- AlterTable
ALTER TABLE `category` ADD COLUMN `mealType` VARCHAR(191) NOT NULL DEFAULT 'ALL';

-- AlterTable
ALTER TABLE `menuitem` ADD COLUMN `costPrice` DOUBLE NULL DEFAULT 0,
    ADD COLUMN `inStock` BOOLEAN NOT NULL DEFAULT true,
    MODIFY `description` TEXT NULL,
    MODIFY `image` LONGTEXT NULL,
    MODIFY `ingredients` TEXT NULL;

-- AlterTable
ALTER TABLE `order` ADD COLUMN `customerPhone` VARCHAR(191) NULL,
    ADD COLUMN `mealType` VARCHAR(191) NULL,
    ADD COLUMN `paymentMethod` VARCHAR(191) NULL,
    ADD COLUMN `paymentStatus` VARCHAR(191) NOT NULL DEFAULT 'UNPAID',
    MODIFY `notes` TEXT NULL;

-- AlterTable
ALTER TABLE `orderitem` ADD COLUMN `costPriceAtOrder` DOUBLE NULL DEFAULT 0,
    MODIFY `customizations` TEXT NULL;

-- DropTable
DROP TABLE `admin`;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'ADMIN',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Settings` (
    `id` VARCHAR(191) NOT NULL,
    `hotelName` VARCHAR(191) NOT NULL DEFAULT 'Nora Luxe',
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `supportEmail` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
