import { User } from '../types/user';

export const mockUsers: Record<number, User> = {
  1: { id: 1, name: 'John Doe', email: 'john@example.com' },
  2: { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
  3: { id: 3, name: 'Alice Johnson', email: 'alice@example.com' },
};

let nextId = 4;

export function findUserById(id: number): User | null {
  return mockUsers[id] ?? null;
}

export function createUser(name: string, email: string): User {
  const user: User = { id: nextId++, name, email };
  mockUsers[user.id] = user;
  return user;
}
