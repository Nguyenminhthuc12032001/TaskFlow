/*
  Warnings:

  - A unique constraint covering the columns `[position,column_id]` on the table `tasks` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "tasks_position_column_id_key" ON "tasks"("position", "column_id");
