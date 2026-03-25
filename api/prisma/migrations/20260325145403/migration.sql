/*
  Warnings:

  - A unique constraint covering the columns `[workspace_id,id]` on the table `leads` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "leads_workspace_id_id_key" ON "leads"("workspace_id", "id");
