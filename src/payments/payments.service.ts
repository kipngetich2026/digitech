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

import {
  AuditLogsService,
} from '../audit-logs/audit-logs.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,

    @InjectModel(Invoice.name)
    private readonly invoiceModel: Model<InvoiceDocument>,

    private readonly auditLogsService: AuditLogsService,
  ) {}

  // =========================================================
  // CREATE PAYMENT
  // =========================================================

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
      email: string;
      role: string;
      branchId: string;
    },
  ): Promise<PaymentDocument> {
    // ---------------------------------------------------------
    // VALIDATE IDS
    // ---------------------------------------------------------

    if (
      !Types.ObjectId.isValid(
        data.invoiceId,
      )
    ) {
      throw new BadRequestException(
        'Invalid invoice ID',
      );
    }

    if (
      !Types.ObjectId.isValid(
        user.sub,
      )
    ) {
      throw new BadRequestException(
        'Invalid user ID',
      );
    }

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
    // VALIDATE AMOUNT
    // ---------------------------------------------------------

    if (
      !Number.isFinite(
        data.amount,
      ) ||
      data.amount <= 0
    ) {
      throw new BadRequestException(
        'Payment amount must be greater than zero',
      );
    }

    // ---------------------------------------------------------
    // VALIDATE PAYMENT METHOD
    // ---------------------------------------------------------

    const method =
      data.method.toUpperCase();

    const allowedMethods = [
      'CASH',
      'MPESA',
      'BANK_TRANSFER',
      'CARD',
      'CHEQUE',
    ];

    if (
      !allowedMethods.includes(
        method,
      )
    ) {
      throw new BadRequestException(
        'Invalid payment method',
      );
    }

    // ---------------------------------------------------------
    // FIND INVOICE
    // ---------------------------------------------------------

    const invoiceFilter: any = {
      _id: data.invoiceId,
    };

    if (
      user.role !== 'SUPER_ADMIN'
    ) {
      invoiceFilter.branchId =
        new Types.ObjectId(
          user.branchId,
        );
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

    // ---------------------------------------------------------
    // CHECK INVOICE STATUS
    // ---------------------------------------------------------

    if (
      invoice.status ===
      'CANCELLED'
    ) {
      throw new ConflictException(
        'Cannot make payment on a cancelled invoice',
      );
    }

    if (
      invoice.paymentStatus ===
      'PAID'
    ) {
      throw new ConflictException(
        'Invoice is already fully paid',
      );
    }

    // ---------------------------------------------------------
    // CHECK OUTSTANDING BALANCE
    // ---------------------------------------------------------

    if (
      data.amount >
      invoice.balanceDue
    ) {
      throw new BadRequestException(
        `Payment amount cannot exceed the outstanding balance of ${invoice.balanceDue}`,
      );
    }

    // ---------------------------------------------------------
    // CREATE PAYMENT
    // ---------------------------------------------------------

    const payment =
      new this.paymentModel({
        paymentNumber:
          await this.generatePaymentNumber(),

        invoiceId:
          invoice._id,

        orderId:
          invoice.orderId,

        customerId:
          invoice.customerId,

        branchId:
          invoice.branchId,

        amount:
          data.amount,

        method,

        reference:
          data.reference,

        status:
          'COMPLETED',

        notes:
          data.notes,

        createdBy:
          new Types.ObjectId(
            user.sub,
          ),
      });

    const savedPayment =
      await payment.save();

    // ---------------------------------------------------------
    // UPDATE INVOICE
    // ---------------------------------------------------------

    invoice.amountPaid +=
      data.amount;

    invoice.balanceDue =
      invoice.total -
      invoice.amountPaid;

    if (
      invoice.balanceDue <= 0
    ) {
      invoice.balanceDue = 0;

      invoice.paymentStatus =
        'PAID';
    } else {
      invoice.paymentStatus =
        'PARTIAL';
    }

    await invoice.save();

    // ---------------------------------------------------------
    // AUDIT LOG
    // ---------------------------------------------------------

    await this.auditLogsService.create(
      {
        userName:
          user.email,

        action:
          'PAYMENT',

        module:
          'PAYMENTS',

        description:
          `Payment ${savedPayment.paymentNumber} of ${savedPayment.amount} was recorded for invoice ${invoice.invoiceNumber}`,

        recordId:
          savedPayment._id.toString(),

        metadata: {
          paymentNumber:
            savedPayment.paymentNumber,

          invoiceId:
            invoice._id.toString(),

          invoiceNumber:
            invoice.invoiceNumber,

          amount:
            savedPayment.amount,

          method:
            savedPayment.method,

          status:
            savedPayment.status,

          previousAmountPaid:
            invoice.amountPaid -
            data.amount,

          newAmountPaid:
            invoice.amountPaid,

          remainingBalance:
            invoice.balanceDue,
        },
      },

      user,
    );

    return savedPayment;
  }

  // =========================================================
  // FIND ALL PAYMENTS
  // =========================================================

  async findAll(
    user: {
      sub: string;
      email: string;
      role: string;
      branchId: string;
    },
  ): Promise<PaymentDocument[]> {
    const filter =
      user.role === 'SUPER_ADMIN'
        ? {}
        : {
            branchId:
              new Types.ObjectId(
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

      .sort({
        createdAt: -1,
      })

      .exec();
  }

  // =========================================================
  // FIND PAYMENT BY ID
  // =========================================================

  async findById(
    id: string,

    user: {
      sub: string;
      email: string;
      role: string;
      branchId: string;
    },
  ): Promise<PaymentDocument> {
    if (
      !Types.ObjectId.isValid(
        id,
      )
    ) {
      throw new NotFoundException(
        'Invalid payment ID',
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

  // =========================================================
  // UPDATE PAYMENT STATUS
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
  ): Promise<PaymentDocument> {
    const payment =
      await this.findById(
        id,
        user,
      );

    // ---------------------------------------------------------
    // NORMALIZE STATUS
    // ---------------------------------------------------------

    const newStatus =
      status.toUpperCase();

    const allowedStatuses = [
      'PENDING',
      'COMPLETED',
      'FAILED',
      'REVERSED',
    ];

    if (
      !allowedStatuses.includes(
        newStatus,
      )
    ) {
      throw new BadRequestException(
        'Invalid payment status',
      );
    }

    // ---------------------------------------------------------
    // NO CHANGE
    // ---------------------------------------------------------

    if (
      payment.status ===
      newStatus
    ) {
      return payment;
    }

    // ---------------------------------------------------------
    // REVERSED IS FINAL
    // ---------------------------------------------------------

    if (
      payment.status ===
      'REVERSED'
    ) {
      throw new ConflictException(
        'A reversed payment cannot change status',
      );
    }

    // ---------------------------------------------------------
    // COMPLETED PAYMENTS
    // ---------------------------------------------------------
    //
    // A completed payment has already affected
    // invoice accounting.
    //
    // Therefore it can ONLY become REVERSED.
    //

    if (
      payment.status ===
      'COMPLETED'
    ) {
      if (
        newStatus !==
        'REVERSED'
      ) {
        throw new ConflictException(
          'A completed payment can only be reversed',
        );
      }
    }

    // ---------------------------------------------------------
    // PENDING PAYMENTS
    // ---------------------------------------------------------

    if (
      payment.status ===
      'PENDING'
    ) {
      if (
        newStatus ===
        'REVERSED'
      ) {
        throw new ConflictException(
          'A pending payment cannot be reversed',
        );
      }
    }

    // ---------------------------------------------------------
    // FAILED PAYMENTS
    // ---------------------------------------------------------

    if (
      payment.status ===
      'FAILED'
    ) {
      throw new ConflictException(
        'A failed payment cannot change status',
      );
    }

    // ---------------------------------------------------------
    // REVERSE COMPLETED PAYMENT
    // ---------------------------------------------------------

    if (
      newStatus ===
      'REVERSED'
    ) {
      if (
        payment.status !==
        'COMPLETED'
      ) {
        throw new ConflictException(
          'Only completed payments can be reversed',
        );
      }

      // -------------------------------------------------------
      // GET RAW INVOICE ID
      // -------------------------------------------------------
      //
      // invoiceId may be populated by findById(),
      // so safely extract its _id when necessary.
      //

      const invoiceId =
        (payment.invoiceId as any)?._id ??
        payment.invoiceId;

      if (
        !invoiceId ||
        !Types.ObjectId.isValid(
          invoiceId.toString(),
        )
      ) {
        throw new BadRequestException(
          'Invalid invoice reference on payment',
        );
      }

      const invoice =
        await this.invoiceModel
          .findById(
            invoiceId,
          )
          .exec();

      if (!invoice) {
        throw new NotFoundException(
          'Invoice associated with this payment was not found',
        );
      }

      // -------------------------------------------------------
      // VERIFY PAYMENT DOES NOT EXCEED ACCOUNTING
      // -------------------------------------------------------

      if (
        payment.amount >
        invoice.amountPaid
      ) {
        throw new ConflictException(
          'Payment amount exceeds the amount currently recorded on the invoice',
        );
      }

      const previousAmountPaid =
        invoice.amountPaid;

      // -------------------------------------------------------
      // REMOVE PAYMENT FROM INVOICE
      // -------------------------------------------------------

      invoice.amountPaid =
        Math.max(
          0,
          invoice.amountPaid -
            payment.amount,
        );

      invoice.balanceDue =
        invoice.total -
        invoice.amountPaid;

      if (
        invoice.balanceDue <= 0
      ) {
        invoice.balanceDue = 0;

        invoice.paymentStatus =
          'PAID';
      } else if (
        invoice.amountPaid > 0
      ) {
        invoice.paymentStatus =
          'PARTIAL';
      } else {
        invoice.paymentStatus =
          'UNPAID';
      }

      await invoice.save();

      // -------------------------------------------------------
      // UPDATE PAYMENT STATUS
      // -------------------------------------------------------

      payment.status =
        'REVERSED';

      const savedPayment =
        await payment.save();

      // -------------------------------------------------------
      // AUDIT LOG
      // -------------------------------------------------------

      await this.auditLogsService.create(
        {
          userName:
            user.email,

          action:
            'STATUS_CHANGE',

          module:
            'PAYMENTS',

          description:
            `Payment ${savedPayment.paymentNumber} was reversed`,

          recordId:
            savedPayment._id.toString(),

          metadata: {
            paymentNumber:
              savedPayment.paymentNumber,

            invoiceId:
              invoice._id.toString(),

            invoiceNumber:
              invoice.invoiceNumber,

            amount:
              savedPayment.amount,

            previousStatus:
              'COMPLETED',

            newStatus:
              'REVERSED',

            previousAmountPaid,

            newAmountPaid:
              invoice.amountPaid,

            remainingBalance:
              invoice.balanceDue,
          },
        },

        user,
      );

      return savedPayment;
    }

    // ---------------------------------------------------------
    // UPDATE NON-FINANCIAL STATUS
    // ---------------------------------------------------------

    const previousStatus =
      payment.status;

    payment.status =
      newStatus;

    const savedPayment =
      await payment.save();

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
          'PAYMENTS',

        description:
          `Payment ${savedPayment.paymentNumber} changed from ${previousStatus} to ${newStatus}`,

        recordId:
          savedPayment._id.toString(),

        metadata: {
          paymentNumber:
            savedPayment.paymentNumber,

          previousStatus,

          newStatus,

          amount:
            savedPayment.amount,

          method:
            savedPayment.method,
        },
      },

      user,
    );

    return savedPayment;
  }

  // =========================================================
  // DELETE PAYMENT
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
    const payment =
      await this.findById(
        id,
        user,
      );

    // ---------------------------------------------------------
    // COMPLETED PAYMENTS CANNOT BE DELETED
    // ---------------------------------------------------------

    if (
      payment.status ===
      'COMPLETED'
    ) {
      throw new ConflictException(
        'Completed payments cannot be deleted. Reverse the payment instead.',
      );
    }

    // ---------------------------------------------------------
    // REVERSED PAYMENTS
    // ---------------------------------------------------------

    if (
      payment.status ===
      'REVERSED'
    ) {
      throw new ConflictException(
        'Reversed payments cannot be deleted because they are part of the financial audit history',
      );
    }

    // ---------------------------------------------------------
    // DELETE
    // ---------------------------------------------------------

    await this.paymentModel
      .findByIdAndDelete(
        payment._id,
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
          'PAYMENTS',

        description:
          `Payment ${payment.paymentNumber} was deleted`,

        recordId:
          payment._id.toString(),

        metadata: {
          paymentNumber:
            payment.paymentNumber,

          amount:
            payment.amount,

          method:
            payment.method,

          status:
            payment.status,

          invoiceId:
            (payment.invoiceId as any)?._id?.toString() ??
            payment.invoiceId.toString(),
        },
      },

      user,
    );

    return {
      message:
        'Payment deleted successfully',
    };
  }

  // =========================================================
  // GENERATE PAYMENT NUMBER
  // =========================================================

  private async generatePaymentNumber(): Promise<string> {
    const count =
      await this.paymentModel
        .countDocuments();

    return `PAY-${String(
      count + 1,
    ).padStart(6, '0')}`;
  }
}