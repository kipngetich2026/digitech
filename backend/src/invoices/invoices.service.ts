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
  Invoice,
  InvoiceDocument,
} from './schemas/invoice.schema';

import {
  Order,
  OrderDocument,
} from '../orders/schemas/order.schema';

import {
  Customer,
  CustomerDocument,
} from '../customers/schemas/customer.schema';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectModel(Invoice.name)
    private readonly invoiceModel: Model<InvoiceDocument>,

    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,

    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,
  ) {}

  async create(
    data: {
      orderId: string;
      amountPaid?: number;
      dueDate?: string;
      notes?: string;
    },
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<InvoiceDocument> {
    if (!Types.ObjectId.isValid(data.orderId)) {
      throw new BadRequestException(
        'Invalid order ID',
      );
    }

    if (!Types.ObjectId.isValid(user.branchId)) {
      throw new BadRequestException(
        'Invalid branch ID',
      );
    }

    const orderFilter: any = {
      _id: data.orderId,
    };

    if (user.role !== 'SUPER_ADMIN') {
      orderFilter.branchId =
        new Types.ObjectId(user.branchId);
    }

    const order =
      await this.orderModel
        .findOne(orderFilter)
        .exec();

    if (!order) {
      throw new NotFoundException(
        'Order not found',
      );
    }

    if (order.status === 'CANCELLED') {
      throw new ConflictException(
        'Cannot create an invoice for a cancelled order',
      );
    }

    const existingInvoice =
      await this.invoiceModel
        .findOne({
          orderId: order._id,
        })
        .exec();

    if (existingInvoice) {
      throw new ConflictException(
        'An invoice already exists for this order',
      );
    }

    const customer =
      await this.customerModel
        .findById(order.customerId)
        .exec();

    if (!customer) {
      throw new NotFoundException(
        'Customer associated with this order was not found',
      );
    }

    const amountPaid =
      data.amountPaid ?? 0;

    if (amountPaid < 0) {
      throw new BadRequestException(
        'Amount paid cannot be negative',
      );
    }

    if (amountPaid > order.total) {
      throw new BadRequestException(
        'Amount paid cannot be greater than invoice total',
      );
    }

    const balanceDue =
      order.total - amountPaid;

    let paymentStatus = 'UNPAID';

    if (amountPaid > 0 && balanceDue > 0) {
      paymentStatus = 'PARTIAL';
    }

    if (balanceDue === 0) {
      paymentStatus = 'PAID';
    }

    const count =
      await this.invoiceModel.countDocuments();

    const invoiceNumber =
      `INV-${String(count + 1).padStart(6, '0')}`;

    const invoiceItems =
      order.items.map((item) => ({
        productId: item.productId,
        serviceId: item.serviceId,
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      }));

    const invoice =
      new this.invoiceModel({
        invoiceNumber,

        orderId: order._id,

        customerId: customer._id,

        branchId: order.branchId,

        items: invoiceItems,

        subtotal: order.subtotal,

        discount: order.discount,

        tax: order.tax,

        total: order.total,

        amountPaid,

        balanceDue,

        paymentStatus,

        status: 'ISSUED',

        issueDate: new Date(),

        dueDate: data.dueDate
          ? new Date(data.dueDate)
          : undefined,

        notes: data.notes,

        createdBy: new Types.ObjectId(
          user.sub,
        ),
      });

    return invoice.save();
  }

  async findAll(
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<InvoiceDocument[]> {
    const filter =
      user.role === 'SUPER_ADMIN'
        ? {}
        : {
            branchId: new Types.ObjectId(
              user.branchId,
            ),
          };

    return this.invoiceModel
      .find(filter)
      .populate(
        'customerId',
        'customerNumber firstName lastName phone email',
      )
      .populate(
        'orderId',
        'orderNumber status paymentStatus total',
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
  ): Promise<InvoiceDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(
        'Invalid invoice ID',
      );
    }

    const filter: any = {
      _id: id,
    };

    if (user.role !== 'SUPER_ADMIN') {
      filter.branchId =
        new Types.ObjectId(user.branchId);
    }

    const invoice =
      await this.invoiceModel
        .findOne(filter)
        .populate(
          'customerId',
          'customerNumber firstName lastName phone email',
        )
        .populate(
          'orderId',
          'orderNumber status paymentStatus total',
        )
        .populate(
          'createdBy',
          'firstName lastName email',
        )
        .exec();

    if (!invoice) {
      throw new NotFoundException(
        'Invoice not found',
      );
    }

    return invoice;
  }

  async update(
    id: string,
    data: {
      dueDate?: string;
      notes?: string;
    },
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<InvoiceDocument> {
    const invoice =
      await this.findById(id, user);

    if (invoice.status === 'CANCELLED') {
      throw new ConflictException(
        'Cancelled invoices cannot be updated',
      );
    }

    if (data.dueDate !== undefined) {
      invoice.dueDate =
        new Date(data.dueDate);
    }

    if (data.notes !== undefined) {
      invoice.notes = data.notes;
    }

    return invoice.save();
  }

  async updateStatus(
    id: string,
    status: string,
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<InvoiceDocument> {
    const invoice =
      await this.findById(id, user);

    if (invoice.status === 'CANCELLED') {
      throw new ConflictException(
        'Cancelled invoices cannot change status',
      );
    }

    invoice.status = status;

    return invoice.save();
  }

  async remove(
    id: string,
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<{ message: string }> {
    const invoice =
      await this.findById(id, user);

    if (invoice.paymentStatus === 'PAID') {
      throw new ConflictException(
        'Paid invoices cannot be deleted',
      );
    }

    await this.invoiceModel
      .findByIdAndDelete(invoice._id)
      .exec();

    return {
      message:
        'Invoice deleted successfully',
    };
  }
}