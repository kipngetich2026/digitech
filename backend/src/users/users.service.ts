import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  User,
  UserDocument,
} from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(data: Partial<User>): Promise<UserDocument> {
    const existingEmail = await this.userModel
      .findOne({
        email: data.email?.toLowerCase(),
      })
      .exec();

    if (existingEmail) {
      throw new ConflictException(
        'A user with this email already exists',
      );
    }

    const user = new this.userModel({
      ...data,
      email: data.email?.toLowerCase(),
    });

    return user.save();
  }

  async findById(
    id: string,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findById(id)
      .exec();
  }

  async findByEmail(
    email: string,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        email: email.toLowerCase(),
      })
      .select('+password')
      .exec();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel
      .find()
      .select('-password')
      .sort({ createdAt: -1 })
      .exec();
  }

  async update(
    id: string,
    data: Partial<User>,
  ): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(
        'Invalid user ID',
      );
    }

    const user = await this.userModel
      .findByIdAndUpdate(
        id,
        {
          ...data,
          ...(data.email && {
            email: data.email.toLowerCase(),
          }),
        },
        {
          new: true,
          runValidators: true,
        },
      )
      .select('-password')
      .exec();

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    return user;
  }

  async remove(
    id: string,
  ): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(
        'Invalid user ID',
      );
    }

    const user =
      await this.userModel
        .findByIdAndDelete(id)
        .exec();

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    return {
      message: 'User deleted successfully',
    };
  }
}
