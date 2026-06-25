import { describe } from "node:test";
import type { ListLeadByActorQueryType } from "../../../../modules/lead/lead.schemas.js";
import { LeadStage } from "../../../../../prisma/generated/enums.js";
import { randomUUID } from "node:crypto";

const validPayload: ListLeadByActorQueryType = {
    startDate: new Date(),
    endDate: new Date(),
    stage: LeadStage.new,
    workspaceId: randomUUID(),
    
}

void describe('listLeadByActorQuerySchema', () => { });