import { handlers } from '@/auth';

// Delegate all /api/auth/* requests to Auth.js v5
export const { GET, POST } = handlers;
