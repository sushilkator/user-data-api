/**
 * Queue-related type definitions
 */

import { User } from './user';

/**
 * Job in the database queue
 */
export interface FetchJob {
  userId: number;
  resolve: (user: User | null) => void;
  reject: (error: Error) => void;
}

