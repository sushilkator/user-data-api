import { findUserById, createUser, mockUsers } from '../mockUsers';

describe('mockUsers', () => {
  beforeEach(() => {
    // Reset mockUsers to initial state by removing all except 1, 2, 3
    const keysToDelete = Object.keys(mockUsers)
      .map(Number)
      .filter((id) => id > 3);
    keysToDelete.forEach((id) => {
      delete mockUsers[id];
    });
    // Note: We can't easily reset nextUserId without exposing it, so tests account for this
  });

  describe('findUserById', () => {
    it('should return user for existing ID', () => {
      const user = findUserById(1);
      expect(user).toEqual({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      });
    });

    it('should return null for non-existent ID', () => {
      const user = findUserById(999);
      expect(user).toBeNull();
    });

    it('should return null for negative ID', () => {
      const user = findUserById(-1);
      expect(user).toBeNull();
    });

    it('should return null for zero ID', () => {
      const user = findUserById(0);
      expect(user).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create new user with auto-incrementing ID', () => {
      const initialMaxId = Math.max(...Object.keys(mockUsers).map(Number));
      
      const user = createUser('Test User', 'test@example.com');
      
      expect(user.id).toBeGreaterThan(initialMaxId);
      expect(user.name).toBe('Test User');
      expect(user.email).toBe('test@example.com');
    });

    it('should add user to mockUsers', () => {
      const user = createUser('New User', 'new@example.com');
      
      expect(mockUsers[user.id]).toEqual(user);
    });

    it('should create multiple users with unique IDs', () => {
      const user1 = createUser('User 1', 'user1@example.com');
      const user2 = createUser('User 2', 'user2@example.com');
      
      expect(user1.id).not.toBe(user2.id);
      expect(user1.id).toBeLessThan(user2.id);
    });

    it('should handle special characters in name and email', () => {
      const user = createUser("O'Brien", "test+tag@example.co.uk");
      
      expect(user.name).toBe("O'Brien");
      expect(user.email).toBe("test+tag@example.co.uk");
    });
  });
});

