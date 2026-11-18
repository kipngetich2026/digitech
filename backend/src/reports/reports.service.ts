import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import {
  Model,
  Types,
} from 'mongoose';

import {
  Customer,
  CustomerDocument,
} from '../customers/schemas/customer.schema';

import {
  Product,
  ProductDocument,
} from '../products/schemas/product.schema';

import {
  Service,
  ServiceDocument,
} from '../services/schemas/service.schema';

import {
  Order,
  OrderDocument,
} from '../orders/schemas/order.schema';

import {
  Invoice,
  InvoiceDocument,
} from '../invoices/schemas/invoice.schema';

import {
  Payment,
  PaymentDocument,
} from '../payments/schemas/payment.schema';

import {
  Expense,
  ExpenseDocument,
} from '../expenses/schemas/expense.schema';

import {
  Employee,
  EmployeeDocument,
} from '../employees/schemas/employee.schema';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,

    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,

    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,

    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,

    @InjectModel(Invoice.name)
    private readonly invoiceModel: Model<InvoiceDocument>,

    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,

    @InjectModel(Expense.name)
    private readonly expenseModel: Model<ExpenseDocument>,

    @InjectModel(Employee.name)
    private readonly employeeModel: Model<EmployeeDocument>,
  ) {}

  /**
   * Main dashboard overview.
   */
  async getOverview(
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ) {
    const filter = this.getBranchFilter(user);

    const [
      totalCustomers,
      activeCustomers,
      totalProducts,
      activeProducts,
      lowStockProducts,
      totalServices,
      activeServices,
      totalEmployees,
      activeEmployees,
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      totalInvoices,
      paidInvoices,
      unpaidInvoices,
      partialInvoices,
      totalPayments,
      totalExpenses,
    ] = await Promise.all([
      this.customerModel.countDocuments(filter),

      this.customerModel.countDocuments({
        ...filter,
        isActive: true,
      }),

      this.productModel.countDocuments(filter),

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

      this.serviceModel.countDocuments(filter),

      this.serviceModel.countDocuments({
        ...filter,
        isActive: true,
      }),

      this.employeeModel.countDocuments(filter),

      this.employeeModel.countDocuments({
        ...filter,
        isActive: true,
      }),

      this.orderModel.countDocuments(filter),

      this.orderModel.countDocuments({
        ...filter,
        status: 'PENDING',
      }),

      this.orderModel.countDocuments({
        ...filter,
        status: 'COMPLETED',
      }),

      this.orderModel.countDocuments({
        ...filter,
        status: 'CANCELLED',
      }),

      this.invoiceModel.countDocuments(filter),

      this.invoiceModel.countDocuments({
        ...filter,
        paymentStatus: 'PAID',
      }),

      this.invoiceModel.countDocuments({
        ...filter,
        paymentStatus: 'UNPAID',
      }),

      this.invoiceModel.countDocuments({
        ...filter,
        paymentStatus: 'PARTIAL',
      }),

      this.paymentModel.countDocuments({
        ...filter,
        status: 'COMPLETED',
      }),

      this.expenseModel.countDocuments({
        ...filter,
        status: 'PAID',
      }),
    ]);

    const [
      revenueResult,
      outstandingResult,
      expenseResult,
      stockValueResult,
    ] = await Promise.all([
      this.paymentModel.aggregate([
        {
          $match: {
            ...filter,
            status: 'COMPLETED',
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: '$amount',
            },
          },
        },
      ]),

      this.invoiceModel.aggregate([
        {
          $match: {
            ...filter,
            paymentStatus: {
              $in: ['UNPAID', 'PARTIAL'],
            },
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: '$balanceDue',
            },
          },
        },
      ]),

      this.expenseModel.aggregate([
        {
          $match: {
            ...filter,
            status: 'PAID',
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: '$amount',
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

    const totalRevenue =
      revenueResult[0]?.total ?? 0;

    const outstandingAmount =
      outstandingResult[0]?.total ?? 0;

    const totalExpenseAmount =
      expenseResult[0]?.total ?? 0;

    const stockValue =
      stockValueResult[0]?.total ?? 0;

    const netIncome =
      totalRevenue - totalExpenseAmount;

    return {
      customers: {
        total: totalCustomers,
        active: activeCustomers,
      },

      products: {
        total: totalProducts,
        active: activeProducts,
        lowStock: lowStockProducts,
      },

      services: {
        total: totalServices,
        active: activeServices,
      },

      employees: {
        total: totalEmployees,
        active: activeEmployees,
      },

      orders: {
        total: totalOrders,
        pending: pendingOrders,
        completed: completedOrders,
        cancelled: cancelledOrders,
      },

      invoices: {
        total: totalInvoices,
        paid: paidInvoices,
        unpaid: unpaidInvoices,
        partial: partialInvoices,
        outstandingAmount,
      },

      finance: {
        totalRevenue,
        totalExpenses: totalExpenseAmount,
        netIncome,
      },

      payments: {
        total: totalPayments,
      },

      inventory: {
        stockValue,
        lowStockProducts,
      },
    };
  }

  /**
   * Sales report.
   */
  async getSalesReport(
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ) {
    const filter = this.getBranchFilter(user);

    const [
      orderSummary,
      revenueSummary,
      monthlySales,
    ] = await Promise.all([
      this.orderModel.aggregate([
        {
          $match: filter,
        },
        {
          $group: {
            _id: '$status',
            count: {
              $sum: 1,
            },
          },
        },
      ]),

      this.orderModel.aggregate([
        {
          $match: {
            ...filter,
            status: {
              $ne: 'CANCELLED',
            },
          },
        },
        {
          $group: {
            _id: null,
            subtotal: {
              $sum: '$subtotal',
            },
            discount: {
              $sum: '$discount',
            },
            tax: {
              $sum: '$tax',
            },
            total: {
              $sum: '$total',
            },
          },
        },
      ]),

      this.orderModel.aggregate([
        {
          $match: {
            ...filter,
            status: {
              $ne: 'CANCELLED',
            },
          },
        },
        {
          $group: {
            _id: {
              year: {
                $year: '$createdAt',
              },
              month: {
                $month: '$createdAt',
              },
            },
            orders: {
              $sum: 1,
            },
            sales: {
              $sum: '$total',
            },
          },
        },
        {
          $sort: {
            '_id.year': 1,
            '_id.month': 1,
          },
        },
      ]),
    ]);

    return {
      orderSummary,
      revenue: {
        subtotal:
          revenueSummary[0]?.subtotal ?? 0,
        discount:
          revenueSummary[0]?.discount ?? 0,
        tax:
          revenueSummary[0]?.tax ?? 0,
        total:
          revenueSummary[0]?.total ?? 0,
      },
      monthlySales,
    };
  }

  /**
   * Finance report.
   */
  async getFinanceReport(
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ) {
    const filter = this.getBranchFilter(user);

    const [
      paymentSummary,
      expenseSummary,
      invoiceSummary,
    ] = await Promise.all([
      this.paymentModel.aggregate([
        {
          $match: filter,
        },
        {
          $group: {
            _id: '$status',
            count: {
              $sum: 1,
            },
            amount: {
              $sum: '$amount',
            },
          },
        },
      ]),

      this.expenseModel.aggregate([
        {
          $match: filter,
        },
        {
          $group: {
            _id: '$status',
            count: {
              $sum: 1,
            },
            amount: {
              $sum: '$amount',
            },
          },
        },
      ]),

      this.invoiceModel.aggregate([
        {
          $match: filter,
        },
        {
          $group: {
            _id: '$paymentStatus',
            count: {
              $sum: 1,
            },
            total: {
              $sum: '$total',
            },
            amountPaid: {
              $sum: '$amountPaid',
            },
            balanceDue: {
              $sum: '$balanceDue',
            },
          },
        },
      ]),
    ]);

    const completedPayments =
      paymentSummary.find(
        (item) =>
          item._id === 'COMPLETED',
      );

    const paidExpenses =
      expenseSummary.find(
        (item) =>
          item._id === 'PAID',
      );

    const totalRevenue =
      completedPayments?.amount ?? 0;

    const totalExpenses =
      paidExpenses?.amount ?? 0;

    return {
      payments: paymentSummary,
      expenses: expenseSummary,
      invoices: invoiceSummary,

      totals: {
        revenue: totalRevenue,
        expenses: totalExpenses,
        netIncome:
          totalRevenue - totalExpenses,
      },
    };
  }

  /**
   * Inventory report.
   */
  async getInventoryReport(
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ) {
    const filter = this.getBranchFilter(user);

    const [
      totalProducts,
      activeProducts,
      lowStock,
      outOfStock,
      stockValue,
      stockCostValue,
      products,
    ] = await Promise.all([
      this.productModel.countDocuments(filter),

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
            value: {
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
            value: {
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

      this.productModel
        .find({
          ...filter,
          isActive: true,
        })
        .select(
          'sku name category sellingPrice costPrice stockQuantity reorderLevel',
        )
        .sort({
          stockQuantity: 1,
        })
        .exec(),
    ]);

    return {
      summary: {
        totalProducts,
        activeProducts,
        lowStock,
        outOfStock,
        sellingValue:
          stockValue[0]?.value ?? 0,
        costValue:
          stockCostValue[0]?.value ?? 0,
      },

      products,
    };
  }

  /**
   * Recent business activity.
   */
  async getRecentActivity(
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ) {
    const filter = this.getBranchFilter(user);

    const [
      orders,
      payments,
      expenses,
      invoices,
    ] = await Promise.all([
      this.orderModel
        .find(filter)
        .select(
          'orderNumber customerId total status paymentStatus createdAt',
        )
        .populate(
          'customerId',
          'firstName lastName customerNumber',
        )
        .sort({
          createdAt: -1,
        })
        .limit(10)
        .exec(),

      this.paymentModel
        .find({
          ...filter,
          status: 'COMPLETED',
        })
        .select(
          'paymentNumber invoiceId amount method status createdAt',
        )
        .populate(
          'invoiceId',
          'invoiceNumber',
        )
        .sort({
          createdAt: -1,
        })
        .limit(10)
        .exec(),

      this.expenseModel
        .find(filter)
        .select(
          'expenseNumber title amount status expenseDate createdAt',
        )
        .sort({
          createdAt: -1,
        })
        .limit(10)
        .exec(),

      this.invoiceModel
        .find(filter)
        .select(
          'invoiceNumber customerId total amountPaid balanceDue paymentStatus issueDate',
        )
        .populate(
          'customerId',
          'firstName lastName customerNumber',
        )
        .sort({
          createdAt: -1,
        })
        .limit(10)
        .exec(),
    ]);

    return {
      orders,
      payments,
      expenses,
      invoices,
    };
  }

  /**
   * Apply branch isolation.
   */
  private getBranchFilter(user: {
    sub: string;
    role: string;
    branchId: string;
  }): Record<string, any> {
    if (user.role === 'SUPER_ADMIN') {
      return {};
    }

    if (!Types.ObjectId.isValid(user.branchId)) {
      throw new BadRequestException(
        'Invalid branch ID',
      );
    }

    return {
      branchId: new Types.ObjectId(
        user.branchId,
      ),
    };
  }
}