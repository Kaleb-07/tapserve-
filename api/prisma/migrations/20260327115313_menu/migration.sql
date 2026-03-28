/*
  Warnings:

  - You are about to drop the `_customizationgrouptomenuitem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `customizationgroup` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `customizationoption` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `_customizationgrouptomenuitem` DROP FOREIGN KEY `_CustomizationGroupToMenuItem_A_fkey`;

-- DropForeignKey
ALTER TABLE `_customizationgrouptomenuitem` DROP FOREIGN KEY `_CustomizationGroupToMenuItem_B_fkey`;

-- DropForeignKey
ALTER TABLE `customizationoption` DROP FOREIGN KEY `CustomizationOption_groupId_fkey`;

-- AlterTable
ALTER TABLE `menuitem` ADD COLUMN `ingredients` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `_customizationgrouptomenuitem`;

-- DropTable
DROP TABLE `customizationgroup`;

-- DropTable
DROP TABLE `customizationoption`;
