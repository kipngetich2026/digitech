import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Branch, BranchDocument } from './schemas/branch.schema';

@Injectable()
export class BranchesService {
  constructor(
    @InjectModel(Branch.name)
    private readonly branchModel: Model<BranchDocument>,
  ) {}

  async create(data: Partial<Branch>): Promise<BranchDocument> {
    const code = data.code?.toUpperCase().trim();

    const existingBranch = await this.branchModel
      .findOne({ code })
      .exec();

    if (existingBranch) {
      throw new ConflictException(
        'A branch with this code already exists',
      );
    }

    const branch = new this.branchModel({
      ...data,
      code,
    });

    return branch.save();
  }

  async findById(id: string): Promise<BranchDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid branch ID');
    }

    const branch = await this.branchModel
      .findById(id)
      .exec();

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return branch;
  }

  async findByCode(
    code: string,
  ): Promise<BranchDocument | null> {
    return this.branchModel
      .findOne({
        code: code.toUpperCase().trim(),
      })
      .exec();
  }

  async findAll(): Promise<BranchDocument[]> {
    return this.branchModel
      .find()
      .sort({ name: 1 })
      .exec();
  }

  async update(
    id: string,
    data: Partial<Branch>,
  ): Promise<BranchDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid branch ID');
    }

    if (data.code) {
      data.code = data.code.toUpperCase().trim();

      const existingBranch = await this.branchModel
        .findOne({
          code: data.code,
          _id: { $ne: id },
        })
        .exec();

      if (existingBranch) {
        throw new ConflictException(
          'A branch with this code already exists',
        );
      }
    }

    const branch = await this.branchModel
      .findByIdAndUpdate(
        id,
        data,
        {
          new: true,
          runValidators: true,
        },
      )
      .exec();

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return branch;
  }

  async updateStatus(
    id: string,
    isActive: boolean,
  ): Promise<BranchDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid branch ID');
    }

    const branch = await this.branchModel
      .findByIdAndUpdate(
        id,
        { isActive },
        {
          new: true,
          runValidators: true,
        },
      )
      .exec();

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return branch;
  }

  async remove(id: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid branch ID');
    }

    const branch = await this.branchModel
      .findByIdAndDelete(id)
      .exec();

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return {
      message: 'Branch deleted successfully',
    };
  }
}