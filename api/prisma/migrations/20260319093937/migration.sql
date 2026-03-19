/*
  Warnings:

  - A unique constraint covering the columns `[column_id,title]` on the table `tasks` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "tasks_column_id_title_key" ON "tasks"("column_id", "title");
