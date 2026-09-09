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
  Order,
  OrderDocument,
} from './schemas/order.schema';

import {
  Product,
  ProductDocument,
} from '../products/schemas/product.schema';

import {
  Service,
  ServiceDocument,
} from '../services/schemas/service.schema';

import {
  Customer,
  CustomerDocument,
} from '../customers/schemas/customer.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,

    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,

    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,

    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,
  ) {}

  async create(
    data: {
      customerId: string;
      items: Array<{
        productId?: string;
        serviceId?: string;
        quantity: number;
      }>;
      discount?: number;
      tax?: number;
      notes?: string;
    },
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<OrderDocument> {
    if (
      !Types.ObjectId.isValid(data.customerId)
    ) {
      throw new BadRequestException(
        'Invalid customer ID',
      );
    }

    if (!data.items || data.items.length === 0) {
      throw new BadRequestException(
        'An order must contain at least one item',
      );
    }

    if (
      !Types.ObjectId.isValid(user.branchId)
    ) {
      throw new BadRequestException(
        'Invalid branch ID',
      );
    }

    // Verify customer belongs to user's branch
    const customerFilter: any = {
      _id: data.customerId,
    };

    if (user.role !== 'SUPER_ADMIN') {
      customerFilter.branchId =
        new Types.ObjectId(user.branchId);
    }

    const customer =
      await this.customerModel
        .findOne(customerFilter)
        .exec();

    if (!customer) {
      throw new NotFoundException(
        'Customer not found',
      );
    }

    const orderItems: any[] = [];

    for (const item of data.items) {
      if (item.productId && item.serviceId) {
        throw new BadRequestException(
          'An order item cannot contain both productId and serviceId',
        );
      }

      if (!item.productId && !item.serviceId) {
        throw new BadRequestException(
          'Each order item must contain either productId or serviceId',
        );
      }

      if (item.quantity <= 0) {
        throw new BadRequestException(
          'Item quantity must be greater than zero',
        );
      }

      if (item.productId) {
        if (
          !Types.ObjectId.isValid(
            item.productId,
          )
        ) {
          throw new BadRequestException(
            'Invalid product ID',
          );
        }

        const productFilter: any = {
          _id: item.productId,
          isActive: true,
        };

        if (user.role !== 'SUPER_ADMIN') {
          productFilter.branchId =
            new Types.ObjectId(
              user.branchId,
            );
        }

        const product =
          await this.productModel
            .findOne(productFilter)
            .exec();

        if (!product) {
          throw new NotFoundException(
            'Product not found or inactive',
          );
        }

        if (
          product.stockQuantity <
          item.quantity
        ) {
          throw new BadRequestException(
            `Insufficient stock for product: ${product.name}`,
          );
        }

        const subtotal =
          product.sellingPrice *
          item.quantity;

        orderItems.push({
          productId: product._id,
          itemName: product.name,
          quantity: item.quantity,
          unitPrice: product.sellingPrice,
          subtotal,
        });
      }

      if (item.serviceId) {
        if (
          !Types.ObjectId.isValid(
            item.serviceId,
          )
        ) {
          throw new BadRequestException(
            'Invalid service ID',
          );
        }

        const serviceFilter: any = {
          _id: item.serviceId,
          isActive: true,
        };

        if (user.role !== 'SUPER_ADMIN') {
          serviceFilter.branchId =
            new Types.ObjectId(
              user.branchId,
            );
        }

        const service =
          await this.serviceModel
            .findOne(serviceFilter)
            .exec();

        if (!service) {
          throw new NotFoundException(
            'Service not found or inactive',
          );
        }

        const subtotal =
          service.price * item.quantity;

        orderItems.push({
          serviceId: service._id,
          itemName: service.name,
          quantity: item.quantity,
          unitPrice: service.price,
          subtotal,
        });
      }
    }

    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.subtotal,
      0,
    );

    const discount = data.discount ?? 0;
    const tax = data.tax ?? 0;

    if (discount > subtotal) {
      throw new BadRequestException(
        'Discount cannot be greater than subtotal',
      );
    }

    const total =
      subtotal - discount + tax;

    const count =
      await this.orderModel.countDocuments();

    const orderNumber =
      `ORD-${String(count + 1).padStart(6, '0')}`;

    const order =
      new this.orderModel({
        orderNumber,
        customerId: customer._id,
        branchId: new Types.ObjectId(
          user.branchId,
        ),
        items: orderItems,
        subtotal,
        discount,
        tax,
        total,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        notes: data.notes,
        createdBy: new Types.ObjectId(
          user.sub,
        ),
      });

    return order.save();
  }

  async findAll(
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<OrderDocument[]> {
    const filter =
      user.role === 'SUPER_ADMIN'
        ? {}
        : {
            branchId: new Types.ObjectId(
              user.branchId,
            ),
          };

    return this.orderModel
      .find(filter)
      .populate(
        'customerId',
        'customerNumber firstName lastName phone email',
      )
      .populate(
        'createdBy',
        'firstName lastName email',
      )
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
  ): Promise<OrderDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(
        'Invalid order ID',
      );
    }

    const filter: any = {
      _id: id,
    };

    if (user.role !== 'SUPER_ADMIN') {
      filter.branchId =
        new Types.ObjectId(user.branchId);
    }

    const order =
      await this.orderModel
        .findOne(filter)
        .populate(
          'customerId',
          'customerNumber firstName lastName phone email',
        )
        .populate(
          'createdBy',
          'firstName lastName email',
        )
        .exec();

    if (!order) {
      throw new NotFoundException(
        'Order not found',
      );
    }

    return order;
  }

  async update(
    id: string,
    data: {
      discount?: number;
      tax?: number;
      notes?: string;
    },
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<OrderDocument> {
    const order =
      await this.findById(id, user);

    if (
      order.status === 'COMPLETED' ||
      order.status === 'CANCELLED'
    ) {
      throw new ConflictException(
        'Completed or cancelled orders cannot be updated',
      );
    }

    const discount =
      data.discount ?? order.discount;

    const tax =
      data.tax ?? order.tax;

    if (discount > order.subtotal) {
      throw new BadRequestException(
        'Discount cannot be greater than subtotal',
      );
    }

    order.discount = discount;
    order.tax = tax;
    order.total =
      order.subtotal -
      discount +
      tax;

    if (data.notes !== undefined) {
      order.notes = data.notes;
    }

    return order.save();
  }

  async updateStatus(
    id: string,
    status: string,
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<OrderDocument> {
    const order =
      await this.findById(id, user);

    if (
      order.status === 'COMPLETED' ||
      order.status === 'CANCELLED'
    ) {
      throw new ConflictException(
        'Completed or cancelled orders cannot change status',
      );
    }

    order.status = status;

    return order.save();
  }

  async remove(
    id: string,
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<{ message: string }> {
    const order =
      await this.findById(id, user);

    if (
      order.status !== 'PENDING'
    ) {
      throw new ConflictException(
        'Only pending orders can be deleted',
      );
    }

    await this.orderModel
      .findByIdAndDelete(order._id)
      .exec();

    return {
      message:
        'Order deleted successfully',
    };
  }
}