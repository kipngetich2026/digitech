import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  Service,
  ServiceDocument,
} from './schemas/service.schema';

@Injectable()
export class ServicesService {
  constructor(
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
  ) {}

  async create(
    data: Partial<Service>,
    branchId: string,
  ): Promise<ServiceDocument> {
    if (!Types.ObjectId.isValid(branchId)) {
      throw new NotFoundException('Invalid branch ID');
    }

    const serviceCode = data.serviceCode
      ?.toUpperCase()
      .trim();

    const existingService =
      await this.serviceModel
        .findOne({ serviceCode })
        .exec();

    if (existingService) {
      throw new ConflictException(
        'A service with this code already exists',
      );
    }

    const service = new this.serviceModel({
      ...data,
      serviceCode,
      branchId: new Types.ObjectId(branchId),
      isActive: true,
    });

    return service.save();
  }

  async findAll(
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<ServiceDocument[]> {
    const filter =
      user.role === 'SUPER_ADMIN'
        ? {}
        : {
            branchId: new Types.ObjectId(
              user.branchId,
            ),
          };

    return this.serviceModel
      .find(filter)
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(
    id: string,
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<ServiceDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(
        'Invalid service ID',
      );
    }

    const filter: any = {
      _id: id,
    };

    if (user.role !== 'SUPER_ADMIN') {
      filter.branchId = new Types.ObjectId(
        user.branchId,
      );
    }

    const service =
      await this.serviceModel
        .findOne(filter)
        .exec();

    if (!service) {
      throw new NotFoundException(
        'Service not found',
      );
    }

    return service;
  }

  async update(
    id: string,
    data: Partial<Service>,
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<ServiceDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(
        'Invalid service ID',
      );
    }

    const filter: any = {
      _id: id,
    };

    if (user.role !== 'SUPER_ADMIN') {
      filter.branchId = new Types.ObjectId(
        user.branchId,
      );
    }

    if (data.serviceCode) {
      data.serviceCode = data.serviceCode
        .toUpperCase()
        .trim();

      const existingService =
        await this.serviceModel
          .findOne({
            serviceCode: data.serviceCode,
            _id: { $ne: id },
          })
          .exec();

      if (existingService) {
        throw new ConflictException(
          'A service with this code already exists',
        );
      }
    }

    const service =
      await this.serviceModel
        .findOneAndUpdate(
          filter,
          data,
          {
            new: true,
            runValidators: true,
          },
        )
        .exec();

    if (!service) {
      throw new NotFoundException(
        'Service not found',
      );
    }

    return service;
  }

  async updateStatus(
    id: string,
    isActive: boolean,
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<ServiceDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(
        'Invalid service ID',
      );
    }

    const filter: any = {
      _id: id,
    };

    if (user.role !== 'SUPER_ADMIN') {
      filter.branchId = new Types.ObjectId(
        user.branchId,
      );
    }

    const service =
      await this.serviceModel
        .findOneAndUpdate(
          filter,
          { isActive },
          {
            new: true,
            runValidators: true,
          },
        )
        .exec();

    if (!service) {
      throw new NotFoundException(
        'Service not found',
      );
    }

    return service;
  }

  async remove(
    id: string,
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(
        'Invalid service ID',
      );
    }

    const filter: any = {
      _id: id,
    };

    if (user.role !== 'SUPER_ADMIN') {
      filter.branchId = new Types.ObjectId(
        user.branchId,
      );
    }

    const service =
      await this.serviceModel
        .findOneAndDelete(filter)
        .exec();

    if (!service) {
      throw new NotFoundException(
        'Service not found',
      );
    }

    return {
      message: 'Service deleted successfully',
    };
  }
}