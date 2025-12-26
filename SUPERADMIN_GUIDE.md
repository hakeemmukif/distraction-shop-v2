# Superadmin Features Guide

Complete guide to all superadmin features in Distraction Shop v2.0.

---

## Table of Contents

1. [Overview](#overview)
2. [User Management](#user-management)
3. [Order Management](#order-management)
4. [Shop Settings](#shop-settings)
5. [CLI Tools](#cli-tools)
6. [Security & Permissions](#security--permissions)
7. [API Reference](#api-reference)

---

## Overview

The superadmin panel provides complete control over the e-commerce platform, including:

- **User Management**: Create and manage admin users
- **Order Management**: View, search, filter, and export orders
- **Shop Settings**: Configure shop schedule and contact information
- **Product Management**: Same as admin panel (inherited)

**Access:** `https://yourdomain.com/superadmin` (requires superadmin role)

---

## User Management

### Features

**Location:** `/superadmin/users`

Create and manage admin users who can manage products but cannot access superadmin features.

### Creating Admin Users

**Method 1: Via Web UI (Recommended)**

1. Login as superadmin
2. Navigate to `/superadmin/users`
3. Click "+ Create Admin" button
4. Enter email and password (min 8 characters)
5. Click "Create Admin"

**Method 2: Via CLI Script**

```bash
npm run create-admin
```

Follow the interactive prompts:
- Enter email address
- Enter password (min 8 characters)
- Confirm password

The script will:
- Validate email format
- Check for duplicate users
- Hash password with bcrypt (cost: 12)
- Create user with admin role
- Display user details

### User List

The user list shows:

| Column | Description |
|--------|-------------|
| Email | User's email address |
| Role | admin or superadmin (color-coded badge) |
| Created | Account creation date |
| Last Login | Last successful login (or "Never") |
| Actions | Delete button (protected for superadmins and self) |

### Security Rules

- Cannot delete yourself
- Cannot delete other superadmins
- Can only create admin role (not superadmin)
- Duplicate emails are prevented
- Passwords are bcrypt hashed (cost factor: 12)

---

## Order Management

### Features

**Location:** `/superadmin/orders`

View and manage all orders from the database with powerful filtering and export capabilities.

### Order List

Each order displays:
- Order number (unique identifier)
- Customer email
- Total amount (currency + value)
- Order date and time
- Status badge (completed, pending, failed, refunded)

### Expandable Order Details

Click any order to expand and view:

**Order Items:**
- Product image thumbnail
- Product name
- Size selected
- Quantity ordered
- Item total

**Shipping Address:**
- Recipient name
- Phone number
- Full address (line 1, line 2, city, state, postal code)
- Country

**Customer Information:**
- Customer name (if provided)
- Email address

### Filtering & Search

**Search Bar:**
- Search by order number, customer email, or customer name
- Real-time filtering as you type

**Status Filter:**
- All Statuses (default)
- Pending
- Completed
- Failed
- Refunded

**Date Range:**
- Start Date: Filter orders from this date forward
- End Date: Filter orders up to this date

### Pagination

- 50 orders per page
- Previous/Next buttons
- Shows current range (e.g., "Showing 1-50 of 150 orders")

### Export to CSV

Click "Export to CSV" to download current filtered results:

**CSV Columns:**
- Order Number
- Date
- Customer Email
- Customer Name
- Total
- Status
- Items (all items with sizes)
- Shipping Address

**Filename:** `orders-YYYY-MM-DD.csv`

---

## Shop Settings

### Features

**Location:** `/superadmin/settings`

Configure shop-wide settings including operating hours and contact information.

### Shop Schedule

Set weekly operating hours:

**For Each Day:**
- Closed checkbox (mark day as closed)
- Open time (HH:MM format)
- Close time (HH:MM format)

**Default Schedule:**
```
Monday-Friday: 10:00 - 18:00
Saturday: 11:00 - 17:00
Sunday: Closed
```

**Timezone:** Asia/Kuala_Lumpur (Malaysia)

### Contact Information

- **Contact Email**: Email for customer inquiries
- **Timezone**: Used for shop schedule calculations

### Important Notes

- Settings are stored in-memory and reset on server restart
- In production, consider migrating to database for persistence
- Changes take effect immediately after saving

---

## CLI Tools

### Create Admin Script

**Command:** `npm run create-admin`

Interactive CLI tool to create admin users without accessing the web UI.

**Usage Example:**

```bash
$ npm run create-admin

=== Create Admin User ===

Email: customer@distractionshop.com
Password (min 8 characters): ********
Confirm password: ********

Hashing password...
Creating admin user...

Admin user created successfully!

Details:
  ID: abc123-def456-ghi789
  Email: customer@distractionshop.com
  Role: admin
  Created: 2025-11-23T21:30:00.000Z

The user can now log in at:
  http://localhost:3000/auth/login
```

**When to Use:**
- Quick admin creation during development
- Creating admins before web UI is accessible
- Automating admin creation in scripts
- Emergency admin creation when locked out

---

## Security & Permissions

### Role Hierarchy

```
superadmin (highest)
    |
    ├─ Full access to all features
    ├─ User management (create/delete admins)
    ├─ Order management
    ├─ Shop settings
    └─ Product management

admin (limited)
    |
    ├─ Product management (create/edit/delete)
    ├─ No user management
    ├─ No order viewing
    └─ No settings access
```

### Protected Routes

| Route | Required Role |
|-------|---------------|
| `/admin` | admin or superadmin |
| `/superadmin` | superadmin only |
| `/superadmin/users` | superadmin only |
| `/superadmin/orders` | superadmin only |
| `/superadmin/settings` | superadmin only |

### Authentication

- JWT tokens stored in httpOnly cookies
- 7-day token expiration
- Automatic redirect to login if unauthorized
- Role verified on every request via middleware

### Authorization Checks

**API Level:**
- `requireAuth(request, ['superadmin'])` middleware
- JWT verification from cookies
- Role validation before executing operations

**UI Level:**
- Layout component checks user role
- Redirects to `/admin` if not superadmin
- Shows/hides actions based on permissions

---

## API Reference

### User Management

**GET /api/admin/users**
- **Auth:** Superadmin only
- **Response:** Array of users with email, role, dates
- **Use:** Fetch all users for display

**POST /api/admin/users**
- **Auth:** Superadmin only
- **Body:** `{ email, password, role: "admin" }`
- **Response:** Created user object
- **Use:** Create new admin user

**DELETE /api/admin/users/:id**
- **Auth:** Superadmin only
- **Params:** User ID to delete
- **Response:** Success message
- **Restrictions:** Cannot delete self or superadmins

### Order Management

**GET /api/admin/orders**
- **Auth:** Superadmin only
- **Query Params:**
  - `limit` (default: 50)
  - `offset` (default: 0)
  - `search` (order number, email, name)
  - `status` (pending, completed, failed, refunded)
  - `startDate` (ISO date string)
  - `endDate` (ISO date string)
- **Response:** Orders array with items and customer data
- **Use:** Fetch orders with filtering

### Shop Settings

**GET /api/admin/settings/schedule**
- **Auth:** Superadmin only
- **Response:** Shop schedule and settings object
- **Use:** Load current settings

**PUT /api/admin/settings/schedule**
- **Auth:** Superadmin only
- **Body:** Complete settings object with schedule
- **Response:** Success message and updated settings
- **Use:** Update shop settings

---

## Troubleshooting

### Cannot Access Superadmin Panel

**Symptoms:** Redirected to `/admin` when trying to access `/superadmin`

**Solution:**
1. Check your user role: Visit `/api/auth/me`
2. Verify response shows `"role": "superadmin"`
3. If role is `admin`, you don't have superadmin access
4. Only the seeded superadmin can access this panel

### Cannot Create Users

**Symptoms:** "Forbidden" error when creating users

**Solution:**
1. Verify you're logged in as superadmin
2. Check JWT token is valid (login again)
3. Ensure email is unique (not already used)
4. Password must be 8+ characters

### Orders Not Appearing

**Symptoms:** Order list is empty despite having orders

**Solution:**
1. Check database has orders: Run `npm run db:studio`
2. Verify orders table has data
3. Try clearing filters (reset search, status, dates)
4. Check browser console for API errors

### Settings Not Persisting

**Expected Behavior:** Settings reset on server restart

**Reason:** Settings stored in-memory (not database)

**Solution:** This is by design. For production persistence:
1. Create settings table in database
2. Update API routes to use Prisma
3. Migrate in-memory logic to database queries

---

## Best Practices

### User Management
- Use strong passwords (12+ characters recommended)
- Delete unused admin accounts regularly
- Review user list monthly
- Track who created which users (createdBy field)

### Order Management
- Export orders regularly for backup
- Use filters to find specific orders quickly
- Check order status after customer complaints
- Review failed orders to identify issues

### Shop Settings
- Set realistic operating hours
- Update timezone if relocating
- Keep contact email current
- Test schedule logic before major changes

### Security
- Never share superadmin credentials
- Use unique passwords for each admin
- Review access logs periodically
- Rotate passwords quarterly

---

## Future Enhancements

Planned features for future releases:

### User Management
- [ ] Email notifications for new admin creation
- [ ] Password reset functionality
- [ ] Force password change on first login
- [ ] User activity logging
- [ ] Two-factor authentication (2FA)

### Order Management
- [ ] Order status update functionality
- [ ] Fulfillment tracking integration
- [ ] Customer communication tools
- [ ] Refund processing
- [ ] Analytics dashboard

### Shop Settings
- [ ] Database persistence for settings
- [ ] Multiple timezone support
- [ ] Holiday schedule configuration
- [ ] Custom policies editor
- [ ] Email template customization

---

## Support

For issues or questions:

1. Check this guide first
2. Review DEVELOPMENT_LOG.md for implementation details
3. Check REQUIREMENTS.md for system specifications
4. Open an issue on GitHub with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser console errors
   - Server logs if applicable

---

**Last Updated:** 2025-11-23
**Version:** 2.0.0
