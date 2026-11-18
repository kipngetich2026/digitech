import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import {
  Model,
  Types,
} from 'mongoose';

import {
  StockMovement,
  StockMovementDocument,
} from './schemas/stock-movement.schema';

import {
  Product,
  ProductDocument,
} from '../products/schemas/product.schema';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(StockMovement.name)
    private readonly stockMovementModel: Model<StockMovementDocument>,

    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  // =========================================================
  // CREATE STOCK MOVEMENT
  // =========================================================

  async createMovement(
    data: {
      productId: string;
      movementType: string;
      quantity: number;
      reason?: string;
      reference?: string;
    },
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<StockMovementDocument> {
    if (!Types.ObjectId.isValid(data.productId)) {
      throw new BadRequestException(
        'Invalid product ID',
      );
    }

    if (!Types.ObjectId.isValid(user.branchId)) {
      throw new BadRequestException(
        'Invalid branch ID',
      );
    }

    if (!Types.ObjectId.isValid(user.sub)) {
      throw new BadRequestException(
        'Invalid user ID',
      );
    }

    if (data.quantity <= 0) {
      throw new BadRequestException(
        'Quantity must be greater than zero',
      );
    }

    const movementType =
      data.movementType.toUpperCase();

    const allowedTypes = [
      'STOCK_IN',
      'STOCK_OUT',
      'ADJUSTMENT',
      'RETURN',
    ];

    if (!allowedTypes.includes(movementType)) {
      throw new BadRequestException(
        'Invalid stock movement type',
      );
    }

    const product =
      await this.productModel
        .findById(data.productId)
        .exec();

    if (!product) {
      throw new NotFoundException(
        'Product not found',
      );
    }

    // Branch isolation
    if (
      user.role !== 'SUPER_ADMIN' &&
      product.branchId.toString() !==
        user.branchId
    ) {
      throw new ConflictException(
        'You cannot manage inventory for another branch',
      );
    }

    const previousQuantity =
      product.stockQuantity;

    let newQuantity: number;

    // STOCK IN
    if (movementType === 'STOCK_IN') {
      newQuantity =
        previousQuantity + data.quantity;
    }

    // STOCK OUT
    else if (movementType === 'STOCK_OUT') {
      if (
        data.quantity >
        previousQuantity
      ) {
        throw new ConflictException(
          `Insufficient stock. Available stock: ${previousQuantity}`,
        );
      }

      newQuantity =
        previousQuantity - data.quantity;
    }

    // RETURN
    else if (movementType === 'RETURN') {
      newQuantity =
        previousQuantity + data.quantity;
    }

    // ADJUSTMENT
    else {
      newQuantity = data.quantity;
    }

    if (newQuantity < 0) {
      throw new ConflictException(
        'Stock quantity cannot be negative',
      );
    }

    // Update product stock
    product.stockQuantity =
      newQuantity;

    await product.save();

    // Generate movement number
    const count =
      await this.stockMovementModel.countDocuments();

    const movementNumber =
      `MOV-${String(count + 1).padStart(6, '0')}`;

    const movement =
      new this.stockMovementModel({
        movementNumber,

        productId:
          product._id,

        branchId:
          product.branchId,

        movementType,

        quantity:
          data.quantity,

        previousQuantity,

        newQuantity,

        reason:
          data.reason,

        reference:
          data.reference,

        createdBy:
          new Types.ObjectId(
            user.sub,
          ),
      });

    return movement.save();
  }

  // =========================================================
  // GET CURRENT STOCK
  // =========================================================

  async getCurrentStock(
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
            branchId:
              new Types.ObjectId(
                user.branchId,
              ),
          };

    return this.productModel
      .find(filter)
      .select(
        'sku name category sellingPrice costPrice stockQuantity reorderLevel branchId isActive',
      )
      .sort({
        stockQuantity: 1,
      })
      .exec();
  }

  // =========================================================
  // GET LOW STOCK PRODUCTS
  // =========================================================

  async getLowStock(
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<ProductDocument[]> {
    const branchFilter =
      user.role === 'SUPER_ADMIN'
        ? {}
        : {
            branchId:
              new Types.ObjectId(
                user.branchId,
              ),
          };

    return this.productModel
      .find({
        ...branchFilter,

        isActive: true,

        $expr: {
          $lte: [
            '$stockQuantity',
            '$reorderLevel',
          ],
        },
      })
      .select(
        'sku name category stockQuantity reorderLevel branchId',
      )
      .sort({
        stockQuantity: 1,
      })
      .exec();
  }

  // =========================================================
  // GET OUT OF STOCK PRODUCTS
  // =========================================================

  async getOutOfStock(
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<ProductDocument[]> {
    const branchFilter =
      user.role === 'SUPER_ADMIN'
        ? {}
        : {
            branchId:
              new Types.ObjectId(
                user.branchId,
              ),
          };

    return this.productModel
      .find({
        ...branchFilter,

        isActive: true,

        stockQuantity: 0,
      })
      .select(
        'sku name category stockQuantity reorderLevel branchId',
      )
      .sort({
        name: 1,
      })
      .exec();
  }

  // =========================================================
  // GET STOCK MOVEMENTS
  // =========================================================

  async findAllMovements(
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<StockMovementDocument[]> {
    const filter =
      user.role === 'SUPER_ADMIN'
        ? {}
        : {
            branchId:
              new Types.ObjectId(
                user.branchId,
              ),
          };

    return this.stockMovementModel
      .find(filter)
      .populate(
        'productId',
        'sku name category stockQuantity',
      )
      .populate(
        'createdBy',
        'firstName lastName email',
      )
      .sort({
        createdAt: -1,
      })
      .exec();
  }

  // =========================================================
  // GET MOVEMENTS FOR ONE PRODUCT
  // =========================================================

  async findProductMovements(
    productId: string,
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<StockMovementDocument[]> {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException(
        'Invalid product ID',
      );
    }

    const product =
      await this.productModel
        .findById(productId)
        .exec();

    if (!product) {
      throw new NotFoundException(
        'Product not found',
      );
    }

    if (
      user.role !== 'SUPER_ADMIN' &&
      product.branchId.toString() !==
        user.branchId
    ) {
      throw new ConflictException(
        'You cannot view inventory for another branch',
      );
    }

    return this.stockMovementModel
      .find({
        productId:
          new Types.ObjectId(productId),

        branchId:
          product.branchId,
      })
      .populate(
        'createdBy',
        'firstName lastName email',
      )
      .sort({
        createdAt: -1,
      })
      .exec();
  }

  // =========================================================
  // GET ONE MOVEMENT
  // =========================================================

  async findMovementById(
    id: string,
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<StockMovementDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(
        'Invalid movement ID',
      );
    }

    const filter: any = {
      _id: id,
    };

    if (user.role !== 'SUPER_ADMIN') {
      filter.branchId =
        new Types.ObjectId(
          user.branchId,
        );
    }

    const movement =
      await this.stockMovementModel
        .findOne(filter)
        .populate(
          'productId',
          'sku name category stockQuantity',
        )
        .populate(
          'createdBy',
          'firstName lastName email',
        )
        .exec();

    if (!movement) {
      throw new NotFoundException(
        'Stock movement not found',
      );
    }

    return movement;
  }
    // =========================================================
  // PROCESS SALE FROM ORDER
  // =========================================================

  async processSale(
    data: {
      productId: string;
      quantity: number;
      orderId: string;
    },
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<StockMovementDocument> {
    if (!Types.ObjectId.isValid(data.productId)) {
      throw new BadRequestException(
        'Invalid product ID',
      );
    }

    if (!Types.ObjectId.isValid(data.orderId)) {
      throw new BadRequestException(
        'Invalid order ID',
      );
    }

    if (!Types.ObjectId.isValid(user.sub)) {
      throw new BadRequestException(
        'Invalid user ID',
      );
    }

    if (!Types.ObjectId.isValid(user.branchId)) {
      throw new BadRequestException(
        'Invalid branch ID',
      );
    }

    if (data.quantity <= 0) {
      throw new BadRequestException(
        'Sale quantity must be greater than zero',
      );
    }

    const product =
      await this.productModel
        .findById(data.productId)
        .exec();

    if (!product) {
      throw new NotFoundException(
        'Product not found',
      );
    }

    // Branch isolation
    if (
      user.role !== 'SUPER_ADMIN' &&
      product.branchId.toString() !==
        user.branchId
    ) {
      throw new ConflictException(
        'You cannot manage inventory for another branch',
      );
    }

    const previousQuantity =
      product.stockQuantity;

    if (
      previousQuantity <
      data.quantity
    ) {
      throw new ConflictException(
        `Insufficient stock for product: ${product.name}. Available stock: ${previousQuantity}`,
      );
    }

    const newQuantity =
      previousQuantity - data.quantity;

    // Update product stock
    product.stockQuantity =
      newQuantity;

    await product.save();

    // Generate movement number
    const count =
      await this.stockMovementModel.countDocuments();

    const movementNumber =
      `MOV-${String(count + 1).padStart(6, '0')}`;

    // Create SALE movement
    const movement =
      new this.stockMovementModel({
        movementNumber,

        productId:
          product._id,

        branchId:
          product.branchId,

        movementType:
          'SALE',

        quantity:
          data.quantity,

        previousQuantity,

        newQuantity,

        reason:
          'Stock deducted from completed order',

        orderId:
          new Types.ObjectId(
            data.orderId,
          ),

        reference:
          `ORDER-${data.orderId}`,

        createdBy:
          new Types.ObjectId(
            user.sub,
          ),
      });

    return movement.save();
  }

  // =========================================================
  // INVENTORY SUMMARY
  // =========================================================

  async getInventorySummary(
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ) {
    const filter =
      user.role === 'SUPER_ADMIN'
        ? {}
        : {
            branchId:
              new Types.ObjectId(
                user.branchId,
              ),
          };

    const [
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      stockValue,
      costValue,
    ] = await Promise.all([
      this.productModel.countDocuments(
        filter,
      ),

      this.productModel.countDocuments({
        ...filter,
        isActive: true,
      }),

      this.productModel.countDocuments({
        ...filter,

        isActive: true,

        $expr: {
          $lte: [
            '$stockQuantity',
            '$reorderLevel',
          ],
        },
      }),

      this.productModel.countDocuments({
        ...filter,

        isActive: true,

        stockQuantity: 0,
      }),

      this.productModel.aggregate([
        {
          $match: {
            ...filter,
            isActive: true,
          },
        },

        {
          $group: {
            _id: null,

            total: {
              $sum: {
                $multiply: [
                  '$sellingPrice',
                  '$stockQuantity',
                ],
              },
            },
          },
        },
      ]),

      this.productModel.aggregate([
        {
          $match: {
            ...filter,
            isActive: true,
          },
        },

        {
          $group: {
            _id: null,

            total: {
              $sum: {
                $multiply: [
                  '$costPrice',
                  '$stockQuantity',
                ],
              },
            },
          },
        },
      ]),
    ]);

    return {
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,

      stockValue:
        stockValue[0]?.total ?? 0,

      costValue:
        costValue[0]?.total ?? 0,
    };
  }
}