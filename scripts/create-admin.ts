#!/usr/bin/env tsx

/**
 * Create Admin User Script
 *
 * Usage:
 *   npm run create-admin
 *   or
 *   npx tsx scripts/create-admin.ts
 *
 * This script creates a new admin user in the database.
 * You will be prompted for email and password.
 */

import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function createAdmin() {
  try {
    console.log('\n=== Create Admin User ===\n');

    // Get email
    const email = await question('Email: ');

    if (!email || !email.includes('@')) {
      console.error('Error: Invalid email address');
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.error(`Error: User with email "${email}" already exists`);
      process.exit(1);
    }

    // Get password
    const password = await question('Password (min 8 characters): ');

    if (!password || password.length < 8) {
      console.error('Error: Password must be at least 8 characters');
      process.exit(1);
    }

    // Confirm password
    const confirmPassword = await question('Confirm password: ');

    if (password !== confirmPassword) {
      console.error('Error: Passwords do not match');
      process.exit(1);
    }

    // Hash password
    console.log('\nHashing password...');
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    console.log('Creating admin user...');
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'admin',
        createdBy: null,
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    console.log('\n✅ Admin user created successfully!\n');
    console.log('Details:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Created: ${user.createdAt.toISOString()}\n`);

    console.log('The user can now log in at:');
    console.log(`  ${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/auth/login\n`);

  } catch (error) {
    console.error('\n❌ Error creating admin user:');
    console.error(error);
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

// Run the script
createAdmin();
