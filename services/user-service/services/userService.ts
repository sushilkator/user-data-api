import { User, CreateUserRequest } from '../../../shared/types/user';
import { UserModel } from '../models/User';

export class UserService {
  async getUserById(id: string): Promise<User | null> {
    try {
      const user = await UserModel.findById(id);
      if (!user) {
        return null;
      }
      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      } as unknown as User;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  async createUser(data: CreateUserRequest): Promise<User> {
    const user = new UserModel({
      name: data.name,
      email: data.email,
    });
    
    const savedUser = await user.save();
    return {
      id: savedUser._id.toString(),
      name: savedUser.name,
      email: savedUser.email,
    } as unknown as User;
  }

  async getAllUsers(): Promise<User[]> {
    const users = await UserModel.find();
    return users.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    })) as unknown as User[];
  }
}

