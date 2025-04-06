import { prisma } from '../client';
import { Prisma, Role, UserStatus, User } from '../client';
import { createLogger } from '@databuddy/logger';
// import { cacheable } from '@databuddy/redis';

const logger = createLogger('user-service');

type UserWithRelations = User & {
  organizations: any[];
  memberships: any[];
  projectAccess: any[];
  websites: any[];
  preferences?: any;
};

export class UserService {
  static async create(data: Omit<Prisma.UserCreateInput, 'emailVerified'> & { emailVerified: boolean }) {
    try {
      return await prisma.user.create({ 
        data: {
          ...data,
          emailVerified: data.emailVerified || false
        } 
      });
    } catch (error) {
      logger.error('Failed to create user', { error });
      throw error;
    }
  }

  static findById = async (id: string): Promise<UserWithRelations | null> => {
    try {
      return await prisma.user.findUnique({
        where: { id },
        include: {
          organizations: true,
          memberships: true,
          projectAccess: true,
          websites: true,
          preferences: true,
        },
      });
    } catch (error) {
      logger.error('Failed to find user', { error, id });
      throw error;
    }
  };

  static findByEmail = async (email: string): Promise<UserWithRelations | null> => {
    try {
      return await prisma.user.findUnique({
        where: { email },
        include: {
          organizations: true,
          memberships: true,
          projectAccess: true,
          websites: true,
          preferences: true,
        },
      });
    } catch (error) {
      logger.error('Failed to find user by email', { error, email });
      throw error;
    }
  };

  static async update(id: string, data: Omit<Prisma.UserUpdateInput, 'emailVerified'> & { emailVerified?: boolean }) {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: {
          ...data,
          emailVerified: data.emailVerified === undefined ? undefined : data.emailVerified
        },
      });
      // Invalidate cache
      // await UserService.findById.invalidate(id);
      // await UserService.findByEmail.invalidate(user.email);
      return user;
    } catch (error) {
      logger.error('Failed to update user', { error, id });
      throw error;
    }
  }

  static async updateStatus(id: string, status: UserStatus) {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: { status },
      });
      // await UserService.findById.invalidate(id);
      // await UserService.findByEmail.invalidate(user.email);
      return user;
    } catch (error) {
      logger.error('Failed to update user status', { error, id });
      throw error;
    }
  }

  static async updateRole(id: string, role: Role) {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: { role },
      });
      // await UserService.findById.invalidate(id);
      // await UserService.findByEmail.invalidate(user.email);
      return user;
    } catch (error) {
      logger.error('Failed to update user role', { error, id });
      throw error;
    }
  }

  static async delete(id: string) {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: { 
          deletedAt: new Date(),
          status: UserStatus.INACTIVE
        },
      });
      // await UserService.findById.invalidate(id);
      // await UserService.findByEmail.invalidate(user.email);
      return user;
    } catch (error) {
      logger.error('Failed to delete user', { error, id });
      throw error;
    }
  }

  static async verifyEmail(id: string) {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: { emailVerified: true },
      });
      // await UserService.findById.invalidate(id);
      // await UserService.findByEmail.invalidate(user.email);
      return user;
    } catch (error) {
      logger.error('Failed to verify user email', { error, id });
      throw error;
    }
  }

  /**
   * Get user preferences or create default preferences if none exist
   */
  static async getUserPreferences(userId: string) {
    try {
      // Try to find existing preferences
      let preferences = await prisma.userPreference.findUnique({
        where: { userId },
      });
      
      // Create default preferences if none exist
      if (!preferences) {
        preferences = await prisma.userPreference.create({
          data: {
            userId,
            timezone: "auto",
            dateFormat: "MMM D, YYYY",
            timeFormat: "h:mm a"
          }
        });
      }
      
      return preferences;
    } catch (error) {
      logger.error('Failed to get user preferences', { error, userId });
      throw error;
    }
  }

  /**
   * Update user preferences
   */
  static async updateUserPreferences(userId: string, data: {
    timezone?: string;
    dateFormat?: string;
    timeFormat?: string;
  }) {
    try {
      // Ensure preferences exist
      await this.getUserPreferences(userId);
      
      // Update preferences
      return await prisma.userPreference.update({
        where: { userId },
        data
      });
    } catch (error) {
      logger.error('Failed to update user preferences', { error, userId });
      throw error;
    }
  }
} 