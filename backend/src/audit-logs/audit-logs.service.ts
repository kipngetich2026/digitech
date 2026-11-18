import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import {
  Model,
  Types,
} from 'mongoose';

import {
  AuditLog,
  AuditLogDocument,
} from './schemas/audit-log.schema';

import {
  User,
  UserDocument,
} from '../users/schemas/user.schema';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  // =========================================================
  // CREATE AUDIT LOG
  // =========================================================

  async create(
    data: {
      userName: string;
      action: string;
      module: string;
      description: string;
      recordId?: string;
      ipAddress?: string;
      metadata?: Record<string, any>;
    },
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<AuditLogDocument> {
    if (
      !Types.ObjectId.isValid(user.sub)
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

    if (
      data.recordId &&
      !Types.ObjectId.isValid(
        data.recordId,
      )
    ) {
      throw new BadRequestException(
        'Invalid record ID',
      );
    }

    const targetUser =
      await this.userModel
        .findById(user.sub)
        .exec();

    if (!targetUser) {
      throw new NotFoundException(
        'User not found',
      );
    }

    const auditLog =
      new this.auditLogModel({
        userId:
          targetUser._id,

        userName:
          data.userName,

        action:
          data.action.toUpperCase(),

        module:
          data.module.toUpperCase(),

        description:
          data.description,

        recordId:
          data.recordId
            ? new Types.ObjectId(
                data.recordId,
              )
            : undefined,

        branchId:
          new Types.ObjectId(
            user.branchId,
          ),

        ipAddress:
          data.ipAddress,

        metadata:
          data.metadata,
      });

    return auditLog.save();
  }

  // =========================================================
  // GET ALL AUDIT LOGS
  // =========================================================

  async findAll(
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<AuditLogDocument[]> {
    const filter =
      user.role === 'SUPER_ADMIN'
        ? {}
        : {
            branchId:
              new Types.ObjectId(
                user.branchId,
              ),
          };

    return this.auditLogModel
      .find(filter)
      .populate(
        'userId',
        'firstName lastName email role',
      )
      .sort({
        createdAt: -1,
      })
      .exec();
  }

  // =========================================================
  // GET ONE AUDIT LOG
  // =========================================================

  async findById(
    id: string,
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<AuditLogDocument> {
    if (
      !Types.ObjectId.isValid(id)
    ) {
      throw new BadRequestException(
        'Invalid audit log ID',
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

    const auditLog =
      await this.auditLogModel
        .findOne(filter)
        .populate(
          'userId',
          'firstName lastName email role',
        )
        .exec();

    if (!auditLog) {
      throw new NotFoundException(
        'Audit log not found',
      );
    }

    return auditLog;
  }

  // =========================================================
  // FILTER BY ACTION
  // =========================================================

  async findByAction(
    action: string,
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<AuditLogDocument[]> {
    const filter: any = {
      action:
        action.toUpperCase(),
    };

    if (
      user.role !== 'SUPER_ADMIN'
    ) {
      filter.branchId =
        new Types.ObjectId(
          user.branchId,
        );
    }

    return this.auditLogModel
      .find(filter)
      .populate(
        'userId',
        'firstName lastName email role',
      )
      .sort({
        createdAt: -1,
      })
      .exec();
  }

  // =========================================================
  // FILTER BY MODULE
  // =========================================================

  async findByModule(
    module: string,
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<AuditLogDocument[]> {
    const filter: any = {
      module:
        module.toUpperCase(),
    };

    if (
      user.role !== 'SUPER_ADMIN'
    ) {
      filter.branchId =
        new Types.ObjectId(
          user.branchId,
        );
    }

    return this.auditLogModel
      .find(filter)
      .populate(
        'userId',
        'firstName lastName email role',
      )
      .sort({
        createdAt: -1,
      })
      .exec();
  }

  // =========================================================
  // FILTER BY USER
  // =========================================================

  async findByUser(
    userId: string,
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<AuditLogDocument[]> {
    if (
      !Types.ObjectId.isValid(
        userId,
      )
    ) {
      throw new BadRequestException(
        'Invalid user ID',
      );
    }

    const filter: any = {
      userId:
        new Types.ObjectId(userId),
    };

    if (
      user.role !== 'SUPER_ADMIN'
    ) {
      filter.branchId =
        new Types.ObjectId(
          user.branchId,
        );
    }

    return this.auditLogModel
      .find(filter)
      .populate(
        'userId',
        'firstName lastName email role',
      )
      .sort({
        createdAt: -1,
      })
      .exec();
  }

  // =========================================================
  // FILTER BY RECORD
  // =========================================================

  async findByRecord(
    recordId: string,
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<AuditLogDocument[]> {
    if (
      !Types.ObjectId.isValid(
        recordId,
      )
    ) {
      throw new BadRequestException(
        'Invalid record ID',
      );
    }

    const filter: any = {
      recordId:
        new Types.ObjectId(
          recordId,
        ),
    };

    if (
      user.role !== 'SUPER_ADMIN'
    ) {
      filter.branchId =
        new Types.ObjectId(
          user.branchId,
        );
    }

    return this.auditLogModel
      .find(filter)
      .populate(
        'userId',
        'firstName lastName email role',
      )
      .sort({
        createdAt: -1,
      })
      .exec();
  }
}