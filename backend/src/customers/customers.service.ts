import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  Customer,
  CustomerDocument,
} from './schemas/customer.schema';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,
  ) {}

  async create(
    data: Partial<Customer>,
    branchId: string,
  ): Promise<CustomerDocument> {
    if (!Types.ObjectId.isValid(branchId)) {
      throw new NotFoundException('Invalid branch ID');
    }

    const existingEmail = data.email
      ? await this.customerModel.findOne({
          email: data.email.toLowerCase(),
        }).exec()
      : null;

    if (existingEmail) {
      throw new ConflictException(
        'A customer with this email already exists',
      );
    }

    if (data.phone) {
      const existingPhone =
        await this.customerModel.findOne({
          phone: data.phone,
        }).exec();

      if (existingPhone) {
        throw new ConflictException(
          'A customer with this phone number already exists',
        );
      }
    }

    const count = await this.customerModel.countDocuments();

    const customerNumber = `CUS-${String(count + 1).padStart(6, '0')}`;

    const customer = new this.customerModel({
      ...data,
      customerNumber,
      branchId: new Types.ObjectId(branchId),
      email: data.email?.toLowerCase(),
      isActive: true,
    });

    return customer.save();
  }

  async findAll(
    user: { sub: string; role: string; branchId: string },
  ): Promise<CustomerDocument[]> {
    const filter =
      user.role === 'SUPER_ADMIN'
        ? {}
        : {
            branchId: new Types.ObjectId(user.branchId),
          };

    return this.customerModel
      .find(filter)
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(
    id: string,
    user: { sub: string; role: string; branchId: string },
  ): Promise<CustomerDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid customer ID');
    }

    const filter: any = {
      _id: id,
    };

    if (user.role !== 'SUPER_ADMIN') {
      filter.branchId = new Types.ObjectId(
        user.branchId,
      );
    }

    const customer = await this.customerModel
      .findOne(filter)
      .exec();

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async update(
    id: string,
    data: Partial<Customer>,
    user: { sub: string; role: string; branchId: string },
  ): Promise<CustomerDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid customer ID');
    }

    const filter: any = {
      _id: id,
    };

    if (user.role !== 'SUPER_ADMIN') {
      filter.branchId = new Types.ObjectId(
        user.branchId,
      );
    }

    if (data.email) {
      data.email = data.email.toLowerCase();

      const existingEmail =
        await this.customerModel.findOne({
          email: data.email,
          _id: { $ne: id },
        }).exec();

      if (existingEmail) {
        throw new ConflictException(
          'A customer with this email already exists',
        );
      }
    }

    if (data.phone) {
      const existingPhone =
        await this.customerModel.findOne({
          phone: data.phone,
          _id: { $ne: id },
        }).exec();

      if (existingPhone) {
        throw new ConflictException(
          'A customer with this phone number already exists',
        );
      }
    }

    const customer =
      await this.customerModel.findOneAndUpdate(
        filter,
        data,
        {
          new: true,
          runValidators: true,
        },
      ).exec();

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async updateStatus(
    id: string,
    isActive: boolean,
    user: { sub: string; role: string; branchId: string },
  ): Promise<CustomerDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid customer ID');
    }

    const filter: any = {
      _id: id,
    };

    if (user.role !== 'SUPER_ADMIN') {
      filter.branchId = new Types.ObjectId(
        user.branchId,
      );
    }

    const customer =
      await this.customerModel.findOneAndUpdate(
        filter,
        { isActive },
        {
          new: true,
          runValidators: true,
        },
      ).exec();

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async remove(
    id: string,
    user: { sub: string; role: string; branchId: string },
  ): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid customer ID');
    }

    const filter: any = {
      _id: id,
    };

    if (user.role !== 'SUPER_ADMIN') {
      filter.branchId = new Types.ObjectId(
        user.branchId,
      );
    }

    const customer =
      await this.customerModel.findOneAndDelete(filter).exec();

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return {
      message: 'Customer deleted successfully',
    };
  }
}