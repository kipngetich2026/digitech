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
  Expense,
  ExpenseDocument,
} from './schemas/expense.schema';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectModel(Expense.name)
    private readonly expenseModel: Model<ExpenseDocument>,
  ) {}

  async create(
    data: {
      title: string;
      category: string;
      description?: string;
      amount: number;
      paymentMethod: string;
      reference?: string;
      expenseDate: string;
      notes?: string;
    },
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<ExpenseDocument> {
    if (!Types.ObjectId.isValid(user.branchId)) {
      throw new BadRequestException(
        'Invalid branch ID',
      );
    }

    if (data.amount <= 0) {
      throw new BadRequestException(
        'Expense amount must be greater than zero',
      );
    }

    const count =
      await this.expenseModel.countDocuments();

    const expenseNumber =
      `EXP-${String(count + 1).padStart(6, '0')}`;

    const expense =
      new this.expenseModel({
        expenseNumber,
        title: data.title,
        category: data.category,
        description: data.description,
        amount: data.amount,
        paymentMethod:
          data.paymentMethod.toUpperCase(),
        reference: data.reference,
        expenseDate: new Date(data.expenseDate),
        branchId: new Types.ObjectId(
          user.branchId,
        ),
        status: 'PENDING',
        notes: data.notes,
        createdBy: new Types.ObjectId(
          user.sub,
        ),
      });

    return expense.save();
  }

  async findAll(
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<ExpenseDocument[]> {
    const filter =
      user.role === 'SUPER_ADMIN'
        ? {}
        : {
            branchId: new Types.ObjectId(
              user.branchId,
            ),
          };

    return this.expenseModel
      .find(filter)
      .populate(
        'createdBy',
        'firstName lastName email',
      )
      .populate(
        'approvedBy',
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
  ): Promise<ExpenseDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(
        'Invalid expense ID',
      );
    }

    const filter: any = {
      _id: id,
    };

    if (user.role !== 'SUPER_ADMIN') {
      filter.branchId =
        new Types.ObjectId(user.branchId);
    }

    const expense =
      await this.expenseModel
        .findOne(filter)
        .populate(
          'createdBy',
          'firstName lastName email',
        )
        .populate(
          'approvedBy',
          'firstName lastName email',
        )
        .exec();

    if (!expense) {
      throw new NotFoundException(
        'Expense not found',
      );
    }

    return expense;
  }

  async update(
    id: string,
    data: {
      title?: string;
      category?: string;
      description?: string;
      amount?: number;
      paymentMethod?: string;
      reference?: string;
      expenseDate?: string;
      notes?: string;
    },
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<ExpenseDocument> {
    const expense =
      await this.findById(id, user);

    if (
      expense.status === 'PAID' ||
      expense.status === 'REJECTED'
    ) {
      throw new ConflictException(
        'Paid or rejected expenses cannot be updated',
      );
    }

    if (
      data.amount !== undefined &&
      data.amount <= 0
    ) {
      throw new BadRequestException(
        'Expense amount must be greater than zero',
      );
    }

    if (data.title !== undefined) {
      expense.title = data.title;
    }

    if (data.category !== undefined) {
      expense.category = data.category;
    }

    if (data.description !== undefined) {
      expense.description = data.description;
    }

    if (data.amount !== undefined) {
      expense.amount = data.amount;
    }

    if (data.paymentMethod !== undefined) {
      expense.paymentMethod =
        data.paymentMethod.toUpperCase();
    }

    if (data.reference !== undefined) {
      expense.reference = data.reference;
    }

    if (data.expenseDate !== undefined) {
      expense.expenseDate =
        new Date(data.expenseDate);
    }

    if (data.notes !== undefined) {
      expense.notes = data.notes;
    }

    return expense.save();
  }

  async updateStatus(
    id: string,
    status: string,
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<ExpenseDocument> {
    const expense =
      await this.findById(id, user);

    if (expense.status === 'PAID') {
      throw new ConflictException(
        'A paid expense cannot change status',
      );
    }

    if (
      expense.status === 'REJECTED' &&
      status !== 'PENDING'
    ) {
      throw new ConflictException(
        'A rejected expense cannot change to this status',
      );
    }

    if (
      expense.status === 'PENDING' &&
      status === 'PAID'
    ) {
      throw new BadRequestException(
        'An expense must be approved before it can be marked as paid',
      );
    }

    if (
      expense.status === 'APPROVED' &&
      status === 'REJECTED'
    ) {
      throw new BadRequestException(
        'An approved expense cannot be rejected',
      );
    }

    if (
      status === 'APPROVED'
    ) {
      expense.approvedBy =
        new Types.ObjectId(user.sub);

      expense.approvedAt = new Date();
    }

    expense.status = status;

    return expense.save();
  }

  async remove(
    id: string,
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<{ message: string }> {
    const expense =
      await this.findById(id, user);

    if (
      expense.status === 'PAID'
    ) {
      throw new ConflictException(
        'Paid expenses cannot be deleted',
      );
    }

    await this.expenseModel
      .findByIdAndDelete(expense._id)
      .exec();

    return {
      message:
        'Expense deleted successfully',
    };
  }
}