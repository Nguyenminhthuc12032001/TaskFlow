/*
  Warnings:

  - A unique constraint covering the columns `[column_id,position]` on the table `tasks` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "tasks_position_column_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "tasks_column_id_position_key" ON "tasks"("column_id", "position");
