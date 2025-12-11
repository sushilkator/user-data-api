import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';
import mongoose from 'mongoose';
import { UserService } from './userService';
import { UserModel } from '../models/User';
import { connectDatabase, disconnectDatabase } from '../config/database';

describe('UserService', () => {
  let userService: UserService;

  before(async () => {
    await connectDatabase();
    userService = new UserService();
  });

  after(async () => {
    await UserModel.deleteMany({});
    await disconnectDatabase();
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const userData = { name: 'John Doe', email: 'john@example.com' };
      const user = await userService.createUser(userData);

      expect(user).to.have.property('id');
      expect(user.name).to.equal('John Doe');
      expect(user.email).to.equal('john@example.com');
    });

    it('should create users with unique emails', async () => {
      const user1 = await userService.createUser({ name: 'User 1', email: 'user1@example.com' });
      const user2 = await userService.createUser({ name: 'User 2', email: 'user2@example.com' });

      expect(user1.id).to.not.equal(user2.id);
      expect(user1.email).to.not.equal(user2.email);
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const created = await userService.createUser({ name: 'Test User', email: 'test@example.com' });
      const user = await userService.getUserById(created.id as string);

      expect(user).to.not.be.null;
      expect(user?.name).to.equal('Test User');
      expect(user?.email).to.equal('test@example.com');
    });

    it('should return null for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const user = await userService.getUserById(fakeId);
      expect(user).to.be.null;
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      await userService.createUser({ name: 'User A', email: 'usera@example.com' });
      await userService.createUser({ name: 'User B', email: 'userb@example.com' });

      const users = await userService.getAllUsers();
      expect(users.length).to.be.at.least(2);
    });
  });
});

