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

import {
  InventoryService,
} from '../inventory/inventory.service';

import {
  AuditLogsService,
} from '../audit-logs/audit-logs.service';

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

    private readonly inventoryService: InventoryService,

    private readonly auditLogsService: AuditLogsService,
  ) {}

  // =========================================================
  // CREATE ORDER
  // =========================================================

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
      email: string;
      role: string;
      branchId: string;
    },
  ): Promise<OrderDocument> {
    // ---------------------------------------------------------
    // VALIDATE CUSTOMER ID
    // ---------------------------------------------------------

    if (
      !Types.ObjectId.isValid(
        data.customerId,
      )
    ) {
      throw new BadRequestException(
        'Invalid customer ID',
      );
    }

    // ---------------------------------------------------------
    // VALIDATE USER ID
    // ---------------------------------------------------------

    if (
      !Types.ObjectId.isValid(
        user.sub,
      )
    ) {
      throw new BadRequestException(
        'Invalid user ID',
      );
    }

    // ---------------------------------------------------------
    // VALIDATE BRANCH ID
    // ---------------------------------------------------------

    if (
      !Types.ObjectId.isValid(
        user.branchId,
      )
    ) {
      throw new BadRequestException(
        'Invalid branch ID',
      );
    }

    // ---------------------------------------------------------
    // VALIDATE ITEMS
    // ---------------------------------------------------------

    if (
      !data.items ||
      data.items.length === 0
    ) {
      throw new BadRequestException(
        'An order must contain at least one item',
      );
    }

    // ---------------------------------------------------------
    // VERIFY CUSTOMER
    // ---------------------------------------------------------

    const customerFilter: any = {
      _id: data.customerId,
      isActive: true,
    };

    // STAFF can only access customers
    // belonging to their branch.

    if (
      user.role !== 'SUPER_ADMIN'
    ) {
      customerFilter.branchId =
        new Types.ObjectId(
          user.branchId,
        );
    }

    const customer =
      await this.customerModel
        .findOne(customerFilter)
        .exec();

    if (!customer) {
      throw new NotFoundException(
        'Customer not found or inactive',
      );
    }

    // ---------------------------------------------------------
    // BUILD ORDER ITEMS
    // ---------------------------------------------------------

    const orderItems: any[] = [];

    for (
      const item of data.items
    ) {
      // -------------------------------------------------------
      // VALIDATE QUANTITY
      // -------------------------------------------------------

      if (
        !Number.isInteger(
          item.quantity,
        ) ||
        item.quantity <= 0
      ) {
        throw new BadRequestException(
          'Item quantity must be a positive whole number',
        );
      }

      // -------------------------------------------------------
      // PRODUCT + SERVICE VALIDATION
      // -------------------------------------------------------

      if (
        item.productId &&
        item.serviceId
      ) {
        throw new BadRequestException(
          'An order item cannot contain both productId and serviceId',
        );
      }

      if (
        !item.productId &&
        !item.serviceId
      ) {
        throw new BadRequestException(
          'Each order item must contain either productId or serviceId',
        );
      }

      // =======================================================
      // PRODUCT
      // =======================================================

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

        if (
          user.role !== 'SUPER_ADMIN'
        ) {
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

        // -----------------------------------------------------
        // STOCK VALIDATION
        // -----------------------------------------------------

        if (
          product.stockQuantity <
          item.quantity
        ) {
          throw new BadRequestException(
            `Insufficient stock for product: ${product.name}. Available stock: ${product.stockQuantity}`,
          );
        }

        const unitPrice =
          Number(
            product.sellingPrice,
          );

        if (
          !Number.isFinite(
            unitPrice,
          ) ||
          unitPrice < 0
        ) {
          throw new BadRequestException(
            `Invalid selling price for product: ${product.name}`,
          );
        }

        const subtotal =
          unitPrice *
          item.quantity;

        orderItems.push({
          productId:
            product._id,

          itemName:
            product.name,

          quantity:
            item.quantity,

          unitPrice,

          subtotal,
        });
      }

      // =======================================================
      // SERVICE
      // =======================================================

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

        if (
          user.role !== 'SUPER_ADMIN'
        ) {
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

        const unitPrice =
          Number(
            service.price,
          );

        if (
          !Number.isFinite(
            unitPrice,
          ) ||
          unitPrice < 0
        ) {
          throw new BadRequestException(
            `Invalid price for service: ${service.name}`,
          );
        }

        const subtotal =
          unitPrice *
          item.quantity;

        orderItems.push({
          serviceId:
            service._id,

          itemName:
            service.name,

          quantity:
            item.quantity,

          unitPrice,

          subtotal,
        });
      }
    }

    // ---------------------------------------------------------
    // CALCULATE SUBTOTAL
    // ---------------------------------------------------------

    const subtotal =
      orderItems.reduce(
        (
          sum,
          item,
        ) =>
          sum +
          Number(
            item.subtotal,
          ),
        0,
      );

    // ---------------------------------------------------------
    // DISCOUNT & TAX
    // ---------------------------------------------------------

    const discount =
      Number(
        data.discount ?? 0,
      );

    const tax =
      Number(
        data.tax ?? 0,
      );

    if (
      !Number.isFinite(
        discount,
      ) ||
      discount < 0
    ) {
      throw new BadRequestException(
        'Discount cannot be negative',
      );
    }

    if (
      !Number.isFinite(
        tax,
      ) ||
      tax < 0
    ) {
      throw new BadRequestException(
        'Tax cannot be negative',
      );
    }

    if (
      discount >
      subtotal
    ) {
      throw new BadRequestException(
        'Discount cannot be greater than subtotal',
      );
    }

    // ---------------------------------------------------------
    // CALCULATE TOTAL
    // ---------------------------------------------------------

    const total =
      subtotal -
      discount +
      tax;

    if (
      total < 0
    ) {
      throw new BadRequestException(
        'Order total cannot be negative',
      );
    }

    // ---------------------------------------------------------
    // GENERATE ORDER NUMBER
    // ---------------------------------------------------------

    const count =
      await this.orderModel
        .countDocuments();

    const orderNumber =
      `ORD-${String(
        count + 1,
      ).padStart(6, '0')}`;

    // ---------------------------------------------------------
    // CREATE ORDER
    // ---------------------------------------------------------

    const order =
      new this.orderModel({
        orderNumber,

        customerId:
          customer._id,

        branchId:
          new Types.ObjectId(
            user.branchId,
          ),

        items:
          orderItems,

        subtotal,

        discount,

        tax,

        total,

        status:
          'PENDING',

        paymentStatus:
          'UNPAID',

        notes:
          data.notes,

        createdBy:
          new Types.ObjectId(
            user.sub,
          ),
      });

    const savedOrder =
      await order.save();

    // ---------------------------------------------------------
    // AUDIT LOG
    // ---------------------------------------------------------

    await this.auditLogsService.create(
      {
        userName:
          user.email,

        action:
          'CREATE',

        module:
          'ORDERS',

        description:
          `Order ${savedOrder.orderNumber} was created`,

        recordId:
          savedOrder._id.toString(),

        metadata: {
          orderNumber:
            savedOrder.orderNumber,

          customerId:
            savedOrder.customerId.toString(),

          total:
            savedOrder.total,

          itemCount:
            savedOrder.items.length,

          status:
            savedOrder.status,
        },
      },

      user,
    );

    return savedOrder;
  }

  // =========================================================
  // FIND ALL
  // =========================================================

  async findAll(
    user: {
      sub: string;
      email: string;
      role: string;
      branchId: string;
    },
  ): Promise<OrderDocument[]> {
    const filter =
      user.role === 'SUPER_ADMIN'
        ? {}
        : {
            branchId:
              new Types.ObjectId(
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

      .sort({
        createdAt: -1,
      })

      .exec();
  }

  // =========================================================
  // FIND BY ID
  // =========================================================

  async findById(
    id: string,

    user: {
      sub: string;
      email: string;
      role: string;
      branchId: string;
    },
  ): Promise<OrderDocument> {
    if (
      !Types.ObjectId.isValid(
        id,
      )
    ) {
      throw new NotFoundException(
        'Invalid order ID',
      );
    }

    const filter: any = {
      _id: id,
    };

    if (
      user.role !== 'SUPER_ADMIN'
    ) {
      filter.branchId =
        new Types.ObjectId(
          user.branchId,
        );
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

  // =========================================================
  // UPDATE ORDER
  // =========================================================

  async update(
    id: string,

    data: {
      discount?: number;
      tax?: number;
      notes?: string;
    },

    user: {
      sub: string;
      email: string;
      role: string;
      branchId: string;
    },
  ): Promise<OrderDocument> {
    const order =
      await this.findById(
        id,
        user,
      );

    // ---------------------------------------------------------
    // FINAL ORDERS CANNOT BE UPDATED
    // ---------------------------------------------------------

    if (
      order.status ===
        'COMPLETED' ||
      order.status ===
        'CANCELLED'
    ) {
      throw new ConflictException(
        'Completed or cancelled orders cannot be updated',
      );
    }

    const discount =
      Number(
        data.discount ??
          order.discount,
      );

    const tax =
      Number(
        data.tax ??
          order.tax,
      );

    // ---------------------------------------------------------
    // VALIDATE DISCOUNT
    // ---------------------------------------------------------

    if (
      !Number.isFinite(
        discount,
      ) ||
      discount < 0
    ) {
      throw new BadRequestException(
        'Discount cannot be negative',
      );
    }

    // ---------------------------------------------------------
    // VALIDATE TAX
    // ---------------------------------------------------------

    if (
      !Number.isFinite(
        tax,
      ) ||
      tax < 0
    ) {
      throw new BadRequestException(
        'Tax cannot be negative',
      );
    }

    // ---------------------------------------------------------
    // VALIDATE DISCOUNT AGAINST SUBTOTAL
    // ---------------------------------------------------------

    if (
      discount >
      order.subtotal
    ) {
      throw new BadRequestException(
        'Discount cannot be greater than subtotal',
      );
    }

    // ---------------------------------------------------------
    // UPDATE TOTALS
    // ---------------------------------------------------------

    order.discount =
      discount;

    order.tax =
      tax;

    order.total =
      order.subtotal -
      discount +
      tax;

    // ---------------------------------------------------------
    // UPDATE NOTES
    // ---------------------------------------------------------

    if (
      data.notes !==
      undefined
    ) {
      order.notes =
        data.notes;
    }

    const savedOrder =
      await order.save();

    // ---------------------------------------------------------
    // AUDIT LOG
    // ---------------------------------------------------------

    await this.auditLogsService.create(
      {
        userName:
          user.email,

        action:
          'UPDATE',

        module:
          'ORDERS',

        description:
          `Order ${savedOrder.orderNumber} was updated`,

        recordId:
          savedOrder._id.toString(),

        metadata: {
          orderNumber:
            savedOrder.orderNumber,

          subtotal:
            savedOrder.subtotal,

          discount:
            savedOrder.discount,

          tax:
            savedOrder.tax,

          total:
            savedOrder.total,
        },
      },

      user,
    );

    return savedOrder;
  }

  // =========================================================
  // UPDATE ORDER STATUS
  // =========================================================

  async updateStatus(
    id: string,

    status: string,

    user: {
      sub: string;
      email: string;
      role: string;
      branchId: string;
    },
  ): Promise<OrderDocument> {
    const order =
      await this.findById(
        id,
        user,
      );

    // ---------------------------------------------------------
    // NORMALIZE STATUS
    // ---------------------------------------------------------

    const newStatus =
      status.toUpperCase();

    // ---------------------------------------------------------
    // ALLOWED STATUSES
    // ---------------------------------------------------------

    const allowedStatuses = [
      'PENDING',
      'PROCESSING',
      'COMPLETED',
      'CANCELLED',
    ];

    if (
      !allowedStatuses.includes(
        newStatus,
      )
    ) {
      throw new BadRequestException(
        'Invalid order status',
      );
    }

    // ---------------------------------------------------------
    // PREVENT CHANGING FINAL ORDERS
    // ---------------------------------------------------------

    if (
      order.status ===
        'COMPLETED' ||
      order.status ===
        'CANCELLED'
    ) {
      throw new ConflictException(
        'Completed or cancelled orders cannot change status',
      );
    }

    // ---------------------------------------------------------
    // SAVE PREVIOUS STATUS
    // ---------------------------------------------------------

    const previousStatus =
      order.status;

    // ---------------------------------------------------------
    // COMPLETE ORDER
    // ---------------------------------------------------------
    //
    // Product stock is deducted here through
    // InventoryService.processSale().
    //
    // DO NOT deduct stock in create().
    //
    // This prevents double stock deduction.
    //

    if (
      newStatus ===
        'COMPLETED'
    ) {
      for (
        const item of order.items
      ) {
        if (
          item.productId
        ) {
          await this.inventoryService.processSale(
            {
              productId:
                item.productId.toString(),

              quantity:
                item.quantity,

              orderId:
                order._id.toString(),
            },

            user,
          );
        }
      }
    }

    // ---------------------------------------------------------
    // UPDATE STATUS
    // ---------------------------------------------------------

    order.status =
      newStatus;

    const savedOrder =
      await order.save();

    // ---------------------------------------------------------
    // AUDIT LOG
    // ---------------------------------------------------------

    await this.auditLogsService.create(
      {
        userName:
          user.email,

        action:
          'STATUS_CHANGE',

        module:
          'ORDERS',

        description:
          `Order ${savedOrder.orderNumber} changed from ${previousStatus} to ${newStatus}`,

        recordId:
          savedOrder._id.toString(),

        metadata: {
          orderNumber:
            savedOrder.orderNumber,

          previousStatus,

          newStatus,

          total:
            savedOrder.total,

          stockProcessed:
            newStatus ===
            'COMPLETED',
        },
      },

      user,
    );

    return savedOrder;
  }

  // =========================================================
  // DELETE ORDER
  // =========================================================

  async remove(
    id: string,

    user: {
      sub: string;
      email: string;
      role: string;
      branchId: string;
    },
  ): Promise<{
    message: string;
  }> {
    const order =
      await this.findById(
        id,
        user,
      );

    // ---------------------------------------------------------
    // ONLY PENDING ORDERS CAN BE DELETED
    // ---------------------------------------------------------

    if (
      order.status !==
      'PENDING'
    ) {
      throw new ConflictException(
        'Only pending orders can be deleted',
      );
    }

    // ---------------------------------------------------------
    // DELETE
    // ---------------------------------------------------------

    await this.orderModel
      .findByIdAndDelete(
        order._id,
      )
      .exec();

    // ---------------------------------------------------------
    // AUDIT LOG
    // ---------------------------------------------------------

    await this.auditLogsService.create(
      {
        userName:
          user.email,

        action:
          'DELETE',

        module:
          'ORDERS',

        description:
          `Order ${order.orderNumber} was deleted`,

        recordId:
          order._id.toString(),

        metadata: {
          orderNumber:
            order.orderNumber,

          customerId:
            order.customerId.toString(),

          total:
            order.total,

          status:
            order.status,
        },
      },

      user,
    );

    return {
      message:
        'Order deleted successfully',
    };
  }
}