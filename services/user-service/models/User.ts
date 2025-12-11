import mongoose, { Schema, Document } from 'mongoose';
import { User } from '../../../shared/types/user';

export interface UserDocument extends Omit<User, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const UserSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
  },
  {
    timestamps: true,
  }
);

UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  return {
    id: obj._id.toString(),
    name: obj.name,
    email: obj.email,
  };
};

export const UserModel = mongoose.model<UserDocument>('User', UserSchema);

