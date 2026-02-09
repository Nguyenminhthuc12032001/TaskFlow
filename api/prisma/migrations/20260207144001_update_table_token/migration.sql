/*
  Warnings:

  - A unique constraint covering the columns `[jti]` on the table `password_reset_token` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[jti]` on the table `refresh_token` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `jti` to the `password_reset_token` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jti` to the `refresh_token` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "password_reset_token" ADD COLUMN     "jti" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "refresh_token" ADD COLUMN     "jti" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_token_jti_key" ON "password_reset_token"("jti");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_token_jti_key" ON "refresh_token"("jti");
