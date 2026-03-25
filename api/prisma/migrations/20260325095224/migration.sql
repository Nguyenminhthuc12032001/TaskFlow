/*
  Warnings:

  - A unique constraint covering the columns `[workspace_id,email]` on the table `leads` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[workspace_id,phone]` on the table `leads` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "leads_workspace_id_email_key" ON "leads"("workspace_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "leads_workspace_id_phone_key" ON "leads"("workspace_id", "phone");
