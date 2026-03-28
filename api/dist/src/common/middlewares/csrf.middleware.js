import csurf from 'csurf';
import { env } from '../../config/env.js';
export const csrfProtection = csurf({
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: env.NODE_ENV === 'production',
    },
});
