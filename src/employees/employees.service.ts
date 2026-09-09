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
  Employee,
  EmployeeDocument,
} from './schemas/employee.schema';

import {
  User,
  UserDocument,
} from '../users/schemas/user.schema';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<EmployeeDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(
    data: {
      userId: string;
      department: string;
      jobTitle: string;
      employmentType: string;
      basicSalary: number;
      hireDate: string;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
      notes?: string;
    },
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<EmployeeDocument> {
    if (!Types.ObjectId.isValid(data.userId)) {
      throw new BadRequestException(
        'Invalid user ID',
      );
    }

    if (!Types.ObjectId.isValid(user.branchId)) {
      throw new BadRequestException(
        'Invalid branch ID',
      );
    }

    if (data.basicSalary < 0) {
      throw new BadRequestException(
        'Basic salary cannot be negative',
      );
    }

    // Find the user being converted into an employee
    const targetUser =
      await this.userModel
        .findById(data.userId)
        .exec();

    if (!targetUser) {
      throw new NotFoundException(
        'User not found',
      );
    }

    if (!targetUser.isActive) {
      throw new ConflictException(
        'Cannot create an employee record for an inactive user',
      );
    }

    // STAFF can only create employees within their own branch.
    // SUPER_ADMIN can manage employees across all branches.
    if (
      user.role !== 'SUPER_ADMIN' &&
      targetUser.branchId.toString() !==
        user.branchId
    ) {
      throw new ConflictException(
        'You cannot create an employee for another branch',
      );
    }

    // Prevent one user from having multiple employee records.
    const existingEmployee =
      await this.employeeModel
        .findOne({
          userId: targetUser._id,
        })
        .exec();

    if (existingEmployee) {
      throw new ConflictException(
        'This user already has an employee record',
      );
    }

    const count =
      await this.employeeModel.countDocuments();

    const employeeNumber =
      `EMP-${String(count + 1).padStart(6, '0')}`;

    const employee =
      new this.employeeModel({
        employeeNumber,

        userId: targetUser._id,

        department: data.department,

        jobTitle: data.jobTitle,

        employmentType:
          data.employmentType.toUpperCase(),

        basicSalary: data.basicSalary,

        hireDate: new Date(data.hireDate),

        branchId: targetUser.branchId,

        emergencyContactName:
          data.emergencyContactName,

        emergencyContactPhone:
          data.emergencyContactPhone,

        isActive: true,

        notes: data.notes,
      });

    return employee.save();
  }

  async findAll(
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<EmployeeDocument[]> {
    const filter =
      user.role === 'SUPER_ADMIN'
        ? {}
        : {
            branchId: new Types.ObjectId(
              user.branchId,
            ),
          };

    return this.employeeModel
      .find(filter)
      .populate(
        'userId',
        'firstName lastName email phone role isActive',
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
  ): Promise<EmployeeDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(
        'Invalid employee ID',
      );
    }

    const filter: any = {
      _id: id,
    };

    if (user.role !== 'SUPER_ADMIN') {
      filter.branchId =
        new Types.ObjectId(user.branchId);
    }

    const employee =
      await this.employeeModel
        .findOne(filter)
        .populate(
          'userId',
          'firstName lastName email phone role isActive',
        )
        .exec();

    if (!employee) {
      throw new NotFoundException(
        'Employee not found',
      );
    }

    return employee;
  }

  async update(
    id: string,
    data: {
      department?: string;
      jobTitle?: string;
      employmentType?: string;
      basicSalary?: number;
      hireDate?: string;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
      notes?: string;
    },
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<EmployeeDocument> {
    const employee =
      await this.findById(id, user);

    if (!employee.isActive) {
      throw new ConflictException(
        'Inactive employees cannot be updated',
      );
    }

    if (
      data.basicSalary !== undefined &&
      data.basicSalary < 0
    ) {
      throw new BadRequestException(
        'Basic salary cannot be negative',
      );
    }

    if (data.department !== undefined) {
      employee.department =
        data.department;
    }

    if (data.jobTitle !== undefined) {
      employee.jobTitle =
        data.jobTitle;
    }

    if (
      data.employmentType !== undefined
    ) {
      employee.employmentType =
        data.employmentType.toUpperCase();
    }

    if (data.basicSalary !== undefined) {
      employee.basicSalary =
        data.basicSalary;
    }

    if (data.hireDate !== undefined) {
      employee.hireDate =
        new Date(data.hireDate);
    }

    if (
      data.emergencyContactName !==
      undefined
    ) {
      employee.emergencyContactName =
        data.emergencyContactName;
    }

    if (
      data.emergencyContactPhone !==
      undefined
    ) {
      employee.emergencyContactPhone =
        data.emergencyContactPhone;
    }

    if (data.notes !== undefined) {
      employee.notes = data.notes;
    }

    return employee.save();
  }

  async updateStatus(
    id: string,
    isActive: boolean,
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<EmployeeDocument> {
    const employee =
      await this.findById(id, user);

    employee.isActive = isActive;

    return employee.save();
  }

  async remove(
    id: string,
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<{ message: string }> {
    const employee =
      await this.findById(id, user);

    await this.employeeModel
      .findByIdAndDelete(employee._id)
      .exec();

    return {
      message:
        'Employee deleted successfully',
    };
  }
}