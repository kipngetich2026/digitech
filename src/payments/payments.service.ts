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
  Payment,
  PaymentDocument,
} from './schemas/payment.schema';

import {
  Invoice,
  InvoiceDocument,
} from '../invoices/schemas/invoice.schema';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,

    @InjectModel(Invoice.name)
    private readonly invoiceModel: Model<InvoiceDocument>,
  ) {}

  async create(
    data: {
      invoiceId: string;
      amount: number;
      method: string;
      reference?: string;
      notes?: string;
    },
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<PaymentDocument> {
    if (!Types.ObjectId.isValid(data.invoiceId)) {
      throw new BadRequestException(
        'Invalid invoice ID',
      );
    }

    if (!Types.ObjectId.isValid(user.branchId)) {
      throw new BadRequestException(
        'Invalid branch ID',
      );
    }

    if (data.amount <= 0) {
      throw new BadRequestException(
        'Payment amount must be greater than zero',
      );
    }

    const invoiceFilter: any = {
      _id: data.invoiceId,
    };

    if (user.role !== 'SUPER_ADMIN') {
      invoiceFilter.branchId =
        new Types.ObjectId(user.branchId);
    }

    const invoice =
      await this.invoiceModel
        .findOne(invoiceFilter)
        .exec();

    if (!invoice) {
      throw new NotFoundException(
        'Invoice not found',
      );
    }

    if (invoice.status === 'CANCELLED') {
      throw new ConflictException(
        'Cannot make payment on a cancelled invoice',
      );
    }

    if (invoice.paymentStatus === 'PAID') {
      throw new ConflictException(
        'Invoice is already fully paid',
      );
    }

    if (data.amount > invoice.balanceDue) {
      throw new BadRequestException(
        `Payment amount cannot exceed the outstanding balance of ${invoice.balanceDue}`,
      );
    }

    const payment =
      new this.paymentModel({
        paymentNumber: await this.generatePaymentNumber(),

        invoiceId: invoice._id,

        orderId: invoice.orderId,

        customerId: invoice.customerId,

        branchId: invoice.branchId,

        amount: data.amount,

        method: data.method.toUpperCase(),

        reference: data.reference,

        status: 'COMPLETED',

        notes: data.notes,

        createdBy: new Types.ObjectId(
          user.sub,
        ),
      });

    const savedPayment =
      await payment.save();

    invoice.amountPaid += data.amount;

    invoice.balanceDue =
      invoice.total -
      invoice.amountPaid;

    if (invoice.balanceDue <= 0) {
      invoice.balanceDue = 0;
      invoice.paymentStatus = 'PAID';
    } else {
      invoice.paymentStatus = 'PARTIAL';
    }

    await invoice.save();

    return savedPayment;
  }

  async findAll(
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<PaymentDocument[]> {
    const filter =
      user.role === 'SUPER_ADMIN'
        ? {}
        : {
            branchId: new Types.ObjectId(
              user.branchId,
            ),
          };

    return this.paymentModel
      .find(filter)
      .populate(
        'invoiceId',
        'invoiceNumber total amountPaid balanceDue paymentStatus',
      )
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
  ): Promise<PaymentDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(
        'Invalid payment ID',
      );
    }

    const filter: any = {
      _id: id,
    };

    if (user.role !== 'SUPER_ADMIN') {
      filter.branchId =
        new Types.ObjectId(user.branchId);
    }

    const payment =
      await this.paymentModel
        .findOne(filter)
        .populate(
          'invoiceId',
          'invoiceNumber total amountPaid balanceDue paymentStatus',
        )
        .populate(
          'customerId',
          'customerNumber firstName lastName phone email',
        )
        .populate(
          'createdBy',
          'firstName lastName email',
        )
        .exec();

    if (!payment) {
      throw new NotFoundException(
        'Payment not found',
      );
    }

    return payment;
  }

 async updateStatus(
  id: string,
  status: string,
  user: {
    sub: string;
    role: string;
    branchId: string;
  },
): Promise<PaymentDocument> {
  const payment =
    await this.findById(id, user);

  if (payment.status === status) {
    return payment;
  }

  if (payment.status === 'REVERSED') {
    throw new ConflictException(
      'A reversed payment cannot change status',
    );
  }

  if (status === 'PENDING') {
    throw new BadRequestException(
      'A payment cannot be changed to PENDING',
    );
  }

  const invoice =
    await this.invoiceModel
      .findById(payment.invoiceId)
      .exec();

  if (!invoice) {
    throw new NotFoundException(
      'Invoice associated with this payment was not found',
    );
  }

  if (status === 'REVERSED') {
    if (payment.status !== 'COMPLETED') {
      throw new ConflictException(
        'Only completed payments can be reversed',
      );
    }

    invoice.amountPaid =
      Math.max(
        0,
        invoice.amountPaid - payment.amount,
      );

    invoice.balanceDue =
      invoice.total -
      invoice.amountPaid;

    if (invoice.balanceDue <= 0) {
      invoice.balanceDue = 0;
      invoice.paymentStatus = 'PAID';
    } else if (invoice.amountPaid > 0) {
      invoice.paymentStatus = 'PARTIAL';
    } else {
      invoice.paymentStatus = 'UNPAID';
    }

    await invoice.save();
  }

  payment.status = status;

  return payment.save();
}

  async remove(
    id: string,
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<{ message: string }> {
    const payment =
      await this.findById(id, user);

    if (payment.status === 'COMPLETED') {
      throw new ConflictException(
        'Completed payments cannot be deleted. Reverse the payment instead.',
      );
    }

    await this.paymentModel
      .findByIdAndDelete(payment._id)
      .exec();

    return {
      message:
        'Payment deleted successfully',
    };
  }

  private async generatePaymentNumber(): Promise<string> {
    const count =
      await this.paymentModel.countDocuments();

    return `PAY-${String(count + 1).padStart(6, '0')}`;
  }
}