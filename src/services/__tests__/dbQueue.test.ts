import { DbQueue } from '../dbQueue';
import { User } from '../../types/user';

// Mock the findUserById function
jest.mock('../../data/mockUsers', () => ({
  findUserById: jest.fn(),
}));

import { findUserById } from '../../data/mockUsers';

const mockFindUserById = findUserById as jest.MockedFunction<typeof findUserById>;


describe('DbQueue', () => {
  let queue: DbQueue;

  beforeEach(() => {
    queue = new DbQueue();
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should enqueue and process user fetch', async () => {
    const testUser: User = { id: 1, name: 'Test', email: 'test@test.com' };
    mockFindUserById.mockReturnValue(testUser);

    const promise = queue.enqueueFetchUser(1);
    
    // Fast-forward time to complete the 200ms delay
    jest.advanceTimersByTime(200);
    
    const result = await promise;
    
    expect(result).toEqual({ id: 1, name: 'Test', email: 'test@test.com' });
    expect(mockFindUserById).toHaveBeenCalledWith(1);
    expect(mockFindUserById).toHaveBeenCalledTimes(1);
  });

  it('should return null when user not found', async () => {
    mockFindUserById.mockReturnValue(null);

    const promise = queue.enqueueFetchUser(999);
    jest.advanceTimersByTime(200);
    
    const result = await promise;
    
    expect(result).toBeNull();
    expect(mockFindUserById).toHaveBeenCalledWith(999);
  });

  it('should process jobs sequentially', async () => {
    const user1: User = { id: 1, name: 'User1', email: 'user1@test.com' };
    const user2: User = { id: 2, name: 'User2', email: 'user2@test.com' };
    
    mockFindUserById
      .mockReturnValueOnce(user1)
      .mockReturnValueOnce(user2);

    const promise1 = queue.enqueueFetchUser(1);
    const promise2 = queue.enqueueFetchUser(2);
    
    // Process first job - run timers and wait for promise
    await jest.runAllTimersAsync();
    const result1 = await promise1;
    
    // Process second job - run timers and wait for promise
    await jest.runAllTimersAsync();
    const result2 = await promise2;
    
    expect(result1).toEqual({ id: 1, name: 'User1', email: 'user1@test.com' });
    expect(result2).toEqual({ id: 2, name: 'User2', email: 'user2@test.com' });
    expect(mockFindUserById).toHaveBeenCalledTimes(2);
  }, 15000);

  it('should handle errors in job processing', async () => {
    const error = new Error('Database error');
    // Mock to throw error
    mockFindUserById.mockImplementationOnce(() => {
      throw error;
    });

    const promise = queue.enqueueFetchUser(1);
    // Advance timers to trigger the async operation
    jest.advanceTimersByTime(200);
    // Wait for the promise to settle
    await Promise.resolve();
    await Promise.resolve();
    
    await expect(promise).rejects.toThrow(error);
  });

  it('should process multiple jobs in queue', async () => {
    const user1: User = { id: 1, name: 'User1', email: 'user1@test.com' };
    const user2: User = { id: 2, name: 'User2', email: 'user2@test.com' };
    const user3: User = { id: 3, name: 'User3', email: 'user3@test.com' };
    
    mockFindUserById
      .mockReturnValueOnce(user1)
      .mockReturnValueOnce(user2)
      .mockReturnValueOnce(user3);

    const promise1 = queue.enqueueFetchUser(1);
    const promise2 = queue.enqueueFetchUser(2);
    const promise3 = queue.enqueueFetchUser(3);
    
    // Process all jobs sequentially
    await jest.runAllTimersAsync();
    const result1 = await promise1;
    
    await jest.runAllTimersAsync();
    const result2 = await promise2;
    
    await jest.runAllTimersAsync();
    const result3 = await promise3;
    
    expect(result1?.id).toBe(1);
    expect(result2?.id).toBe(2);
    expect(result3?.id).toBe(3);
    expect(mockFindUserById).toHaveBeenCalledTimes(3);
  }, 15000);

  it('should handle empty queue', () => {
    // Creating queue should not throw
    expect(() => new DbQueue()).not.toThrow();
  });
});

