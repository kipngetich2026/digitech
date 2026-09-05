import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { BranchesService } from '../branches/branches.service';
import * as bcrypt from 'bcrypt';

async function seed() {
  console.log('Starting database seed...');

  const app = await NestFactory.createApplicationContext(
    AppModule,
  );

  try {
    const branchesService =
      app.get(BranchesService);

    const usersService =
      app.get(UsersService);

    // ---------------------------------------------
    // 1. Create or find MAIN branch
    // ---------------------------------------------

    let branch = await branchesService.findByCode(
      'MAIN',
    );

    if (!branch) {
      branch = await branchesService.create({
        name: 'Digitech Hub & Collection - Main Branch',
        code: 'MAIN',
        address: 'Nairobi, Kenya',
        isActive: true,
      });

      console.log('✓ Main branch created');
    } else {
      console.log('✓ Main branch already exists');
    }

    // ---------------------------------------------
    // 2. Create SUPER_ADMIN
    // ---------------------------------------------

    const adminEmail =
      'admin@digitechhub.co.ke';

    const existingAdmin =
      await usersService.findByEmail(
        adminEmail,
      );

    if (!existingAdmin) {
      const password = 'ChangeMe@12345';

      const hashedPassword =
        await bcrypt.hash(password, 12);

      const admin =
        await usersService.create({
          firstName: 'System',
          lastName: 'Administrator',
          email: adminEmail,
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          branchId: branch._id,
          isActive: true,
        });

      console.log('✓ SUPER_ADMIN created');
      console.log('');
      console.log('================================');
      console.log(' DIGITECH HUB ADMIN CREDENTIALS');
      console.log('================================');
      console.log(`Email: ${admin.email}`);
      console.log(`Password: ${password}`);
      console.log('================================');
      console.log('');
      console.log(
        'IMPORTANT: Change this password after first login.',
      );
    } else {
      console.log(
        '✓ SUPER_ADMIN already exists',
      );
    }

    console.log('');
    console.log(
      '✓ Database seeding completed successfully.',
    );
  } catch (error) {
    console.error(
      'Database seeding failed:',
      error,
    );

    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

seed();