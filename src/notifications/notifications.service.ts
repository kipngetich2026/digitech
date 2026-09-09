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
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';

import {
  User,
  UserDocument,
} from '../users/schemas/user.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(
    data: {
      title: string;
      message: string;
      type: string;
      category: string;
      userId: string;
      referenceType?: string;
      referenceId?: string;
    },
    creator: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<NotificationDocument> {
    if (!Types.ObjectId.isValid(data.userId)) {
      throw new BadRequestException(
        'Invalid user ID',
      );
    }

    if (!Types.ObjectId.isValid(creator.branchId)) {
      throw new BadRequestException(
        'Invalid branch ID',
      );
    }

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
      throw new BadRequestException(
        'Cannot create a notification for an inactive user',
      );
    }

    // Staff can only create notifications
    // for users within their own branch.
    if (
      creator.role !== 'SUPER_ADMIN' &&
      targetUser.branchId.toString() !==
        creator.branchId
    ) {
      throw new BadRequestException(
        'You cannot create a notification for another branch',
      );
    }

    let referenceObjectId:
      | Types.ObjectId
      | undefined;

    if (data.referenceId) {
      if (
        !Types.ObjectId.isValid(
          data.referenceId,
        )
      ) {
        throw new BadRequestException(
          'Invalid reference ID',
        );
      }

      referenceObjectId =
        new Types.ObjectId(
          data.referenceId,
        );
    }

    const notification =
      new this.notificationModel({
        title: data.title,
        message: data.message,
        type: data.type.toUpperCase(),
        category: data.category.toUpperCase(),

        userId: targetUser._id,

        branchId: targetUser.branchId,

        isRead: false,

        createdBy:
          new Types.ObjectId(creator.sub),

        referenceType:
          data.referenceType,

        referenceId:
          referenceObjectId,
      });

    return notification.save();
  }

  async findMyNotifications(
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<NotificationDocument[]> {
    if (!Types.ObjectId.isValid(user.sub)) {
      throw new BadRequestException(
        'Invalid user ID',
      );
    }

    return this.notificationModel
      .find({
        userId: new Types.ObjectId(user.sub),
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findUnread(
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<NotificationDocument[]> {
    if (!Types.ObjectId.isValid(user.sub)) {
      throw new BadRequestException(
        'Invalid user ID',
      );
    }

    return this.notificationModel
      .find({
        userId: new Types.ObjectId(user.sub),
        isRead: false,
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getUnreadCount(
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<{ count: number }> {
    if (!Types.ObjectId.isValid(user.sub)) {
      throw new BadRequestException(
        'Invalid user ID',
      );
    }

    const count =
      await this.notificationModel.countDocuments({
        userId: new Types.ObjectId(user.sub),
        isRead: false,
      });

    return { count };
  }

  async findById(
    id: string,
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<NotificationDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(
        'Invalid notification ID',
      );
    }

    const filter: any = {
      _id: id,
    };

    // Normal users can only see their own notifications.
    if (user.role !== 'SUPER_ADMIN') {
      filter.userId =
        new Types.ObjectId(user.sub);
      filter.branchId =
        new Types.ObjectId(user.branchId);
    }

    const notification =
      await this.notificationModel
        .findOne(filter)
        .populate(
          'userId',
          'firstName lastName email phone role',
        )
        .populate(
          'createdBy',
          'firstName lastName email',
        )
        .exec();

    if (!notification) {
      throw new NotFoundException(
        'Notification not found',
      );
    }

    return notification;
  }

  async markAsRead(
    id: string,
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<NotificationDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(
        'Invalid notification ID',
      );
    }

    const filter: any = {
      _id: id,
    };

    // Staff can only mark their own notification.
    if (user.role !== 'SUPER_ADMIN') {
      filter.userId =
        new Types.ObjectId(user.sub);

      filter.branchId =
        new Types.ObjectId(user.branchId);
    }

    const notification =
      await this.notificationModel
        .findOneAndUpdate(
          filter,
          {
            isRead: true,
          },
          {
            new: true,
          },
        )
        .exec();

    if (!notification) {
      throw new NotFoundException(
        'Notification not found',
      );
    }

    return notification;
  }

  async markAllAsRead(
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<{ message: string; modifiedCount: number }> {
    if (!Types.ObjectId.isValid(user.sub)) {
      throw new BadRequestException(
        'Invalid user ID',
      );
    }

    const result =
      await this.notificationModel.updateMany(
        {
          userId: new Types.ObjectId(user.sub),
          isRead: false,
        },
        {
          $set: {
            isRead: true,
          },
        },
      );

    return {
      message:
        'All notifications marked as read',
      modifiedCount:
        result.modifiedCount,
    };
  }

  async findAll(
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<NotificationDocument[]> {
    const filter =
      user.role === 'SUPER_ADMIN'
        ? {}
        : {
            branchId: new Types.ObjectId(
              user.branchId,
            ),
          };

    return this.notificationModel
      .find(filter)
      .populate(
        'userId',
        'firstName lastName email phone role',
      )
      .populate(
        'createdBy',
        'firstName lastName email',
      )
      .sort({ createdAt: -1 })
      .exec();
  }

  async remove(
    id: string,
    user: {
      sub: string;
      role: string;
      branchId: string;
    },
  ): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(
        'Invalid notification ID',
      );
    }

    const filter: any = {
      _id: id,
    };

    if (user.role !== 'SUPER_ADMIN') {
      filter.userId =
        new Types.ObjectId(user.sub);

      filter.branchId =
        new Types.ObjectId(user.branchId);
    }

    const notification =
      await this.notificationModel
        .findOneAndDelete(filter)
        .exec();

    if (!notification) {
      throw new NotFoundException(
        'Notification not found',
      );
    }

    return {
      message:
        'Notification deleted successfully',
    };
  }
}