/*
  Warnings:

  - A unique constraint covering the columns `[column_id,id]` on the table `tasks` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "tasks_column_id_id_key" ON "tasks"("column_id", "id");
