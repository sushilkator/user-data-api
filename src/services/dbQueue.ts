import { User } from '../types/user';
import { findUserById } from '../data/mockUsers';
import { FetchJob } from '../types/queue';

export class DbQueue {
  private queue: FetchJob[] = [];
  private processing = false;

  enqueueFetchUser(userId: number): Promise<User | null> {
    return new Promise<User | null>((resolve, reject) => {
      this.queue.push({ userId, resolve, reject });
      this.processNext();
    });
  }

  private processNext(): void {
    // Process one at a time
    if (this.processing) return;

    const job = this.queue.shift();
    if (!job) return;

    this.processing = true;

    this.simulateDbFetch(job.userId)
      .then(job.resolve)
      .catch((error: Error) => job.reject(error))
      .finally(() => {
        this.processing = false;
        // Process next job if any
        this.processNext();
      });
  }

  private async simulateDbFetch(userId: number): Promise<User | null> {
    // Simulate 200ms DB latency
    await new Promise<void>((resolve) => setTimeout(resolve, 200));
    return findUserById(userId);
  }
}
