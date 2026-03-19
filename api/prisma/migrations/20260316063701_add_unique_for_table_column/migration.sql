/*
  Warnings:

  - A unique constraint covering the columns `[project_id,id]` on the table `columns` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "columns_project_id_id_key" ON "columns"("project_id", "id");
