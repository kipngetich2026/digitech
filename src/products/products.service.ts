import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  Product,
  ProductDocument,
} from './schemas/product.schema';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async create(
    data: Partial<Product>,
    branchId: string,
  ): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(branchId)) {
      throw new NotFoundException('Invalid branch ID');
    }

    const sku = data.sku?.toUpperCase().trim();

    const existingProduct =
      await this.productModel.findOne({ sku }).exec();

    if (existingProduct) {
      throw new ConflictException(
        'A product with this SKU already exists',
      );
    }

    const product = new this.productModel({
      ...data,
      sku,
      branchId: new Types.ObjectId(branchId),
      stockQuantity: data.stockQuantity ?? 0,
      reorderLevel: data.reorderLevel ?? 5,
      isActive: true,
    });

    return product.save();
  }

  async findAll(
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<ProductDocument[]> {
    const filter =
      user.role === 'SUPER_ADMIN'
        ? {}
        : {
            branchId: new Types.ObjectId(user.branchId),
          };

    return this.productModel
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
  ): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid product ID');
    }

    const filter: any = {
      _id: id,
    };

    if (user.role !== 'SUPER_ADMIN') {
      filter.branchId = new Types.ObjectId(
        user.branchId,
      );
    }

    const product =
      await this.productModel.findOne(filter).exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(
    id: string,
    data: Partial<Product>,
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid product ID');
    }

    const filter: any = {
      _id: id,
    };

    if (user.role !== 'SUPER_ADMIN') {
      filter.branchId = new Types.ObjectId(
        user.branchId,
      );
    }

    if (data.sku) {
      data.sku = data.sku.toUpperCase().trim();

      const existingProduct =
        await this.productModel.findOne({
          sku: data.sku,
          _id: { $ne: id },
        }).exec();

      if (existingProduct) {
        throw new ConflictException(
          'A product with this SKU already exists',
        );
      }
    }

    const product =
      await this.productModel.findOneAndUpdate(
        filter,
        data,
        {
          new: true,
          runValidators: true,
        },
      ).exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async updateStatus(
    id: string,
    isActive: boolean,
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid product ID');
    }

    const filter: any = {
      _id: id,
    };

    if (user.role !== 'SUPER_ADMIN') {
      filter.branchId = new Types.ObjectId(
        user.branchId,
      );
    }

    const product =
      await this.productModel.findOneAndUpdate(
        filter,
        { isActive },
        {
          new: true,
          runValidators: true,
        },
      ).exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
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
      throw new NotFoundException('Invalid product ID');
    }

    const filter: any = {
      _id: id,
    };

    if (user.role !== 'SUPER_ADMIN') {
      filter.branchId = new Types.ObjectId(
        user.branchId,
      );
    }

    const product =
      await this.productModel.findOneAndDelete(
        filter,
      ).exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return {
      message: 'Product deleted successfully',
    };
  }
}