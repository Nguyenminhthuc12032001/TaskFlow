/*
  Warnings:

  - A unique constraint covering the columns `[task_id,id]` on the table `comments` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "comments_task_id_id_key" ON "comments"("task_id", "id");
