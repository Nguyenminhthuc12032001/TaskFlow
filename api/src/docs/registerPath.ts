import { registry } from './openapi.js';
import z from './zod.js';

export const csrfTokenResponseSchema = z.object({
  csrfToken: z.string(),
});

registry.registerPath({
  method: 'get',
  path: '/csurf-token',
  tags: ['Security'],
  summary: 'Get CSRF token',
  responses: {
    200: {
      description: 'CSRF token issued',
      content: {
        'application/json': {
          schema: csrfTokenResponseSchema,
        },
      },
    },
  },
});

import '../modules/auth/auth.openApi.js';
import '../modules/workspace/workspace.openApi.js';
import '../modules/project/project.openApi.js';
import '../modules/column/column.openApi.js';
import '../modules/task/task.openApi.js';
import '../modules/comment/comment.openApi.js';
import '../modules/lead/lead.openApi.js';
