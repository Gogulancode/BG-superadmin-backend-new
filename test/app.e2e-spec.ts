import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Role, SubscriptionStatus, SupportPriority, SupportStatus, TemplateType, TenantStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret';

type MockTenant = {
  id: string;
  name: string;
  email: string;
  status: TenantStatus;
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date | null;
  usageSummary: Record<string, number> | null;
  subscriptionStatus: SubscriptionStatus;
  planCode: string | null;
  renewalDate: Date | null;
  trialEndsAt: Date | null;
};

type MockUser = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: Role;
  isActive: boolean;
  isMfaEnabled: boolean;
  mfaSecret: string | null;
  lastMfaVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type MockSuperadminSession = {
  id: string;
  userId: string;
  userAgent: string;
  ipAddress: string;
  refreshTokenId: string | null;
  createdAt: Date;
  lastSeenAt: Date;
  revokedAt: Date | null;
};

type MockSupportTicket = {
  id: string;
  tenantId: string;
  subject: string;
  message: string;
  status: SupportStatus;
  priority: SupportPriority;
  assignedTo: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type MockTemplate = {
  id: string;
  name: string;
  description?: string | null;
  type: TemplateType;
  payload: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type MockAuditLog = {
  id: string;
  tenantId: string | null;
  actor: string;
  eventType: string;
  metadata: Record<string, any> | null;
  createdAt: Date;
};

class PrismaServiceMock {
  private tenantSeq = 1;
  private supportTicketSeq = 1;
  private templateSeq = 1;
  private auditSeq = 1;
  private sessionSeq = 1;
  private readonly tenants = new Map<string, MockTenant>();
  private readonly supportTickets = new Map<string, MockSupportTicket>();
  private readonly templates = new Map<string, MockTemplate>();
  private readonly sessions = new Map<string, MockSuperadminSession>();
  private auditLogs: MockAuditLog[] = [];
  private readonly users = new Map<string, MockUser>();
  private readonly adminCreds = { email: 'admin@superadmin.com', password: 'superadmin123!' };
  private readonly staffCreds = { email: 'staff@superadmin.com', password: 'staffpass123!' };

  constructor() {
    this.seedUsers();
  }

  getAdminCredentials() {
    return { ...this.adminCreds };
  }

  getStaffUser() {
    return Array.from(this.users.values()).find((user) => user.role === Role.STAFF)!;
  }

  reset() {
    this.tenants.clear();
    this.supportTickets.clear();
    this.templates.clear();
    this.sessions.clear();
    this.auditLogs = [];
    this.tenantSeq = 1;
    this.supportTicketSeq = 1;
    this.templateSeq = 1;
    this.auditSeq = 1;
    this.sessionSeq = 1;
  }

  private seedUsers() {
    const now = new Date();
    const adminUser: MockUser = {
      id: 'user_super_admin',
      email: this.adminCreds.email,
      name: 'Super Admin',
      passwordHash: bcrypt.hashSync(this.adminCreds.password, 10),
      role: Role.SUPER_ADMIN,
      isActive: true,
      isMfaEnabled: false,
      mfaSecret: null,
      lastMfaVerifiedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    const staffUser: MockUser = {
      id: 'user_staff',
      email: this.staffCreds.email,
      name: 'Staff User',
      passwordHash: bcrypt.hashSync(this.staffCreds.password, 10),
      role: Role.STAFF,
      isActive: true,
      isMfaEnabled: false,
      mfaSecret: null,
      lastMfaVerifiedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(adminUser.id, adminUser);
    this.users.set(staffUser.id, staffUser);
  }

  private cloneRecord<T extends Record<string, any>>(record: T) {
    const clone: Record<string, any> = { ...record };
    if ('usageSummary' in clone && clone.usageSummary) {
      clone.usageSummary = { ...clone.usageSummary };
    }
    if ('payload' in clone && clone.payload) {
      clone.payload = { ...clone.payload };
    }
    if ('metadata' in clone && clone.metadata) {
      clone.metadata = { ...clone.metadata };
    }
    return clone;
  }

  private applySelect<T extends Record<string, any>>(record: T, select?: Record<string, boolean>) {
    if (!select) {
      return this.cloneRecord(record);
    }
    return Object.entries(select).reduce<Record<string, any>>((acc, [key, include]) => {
      if (include && key in record) {
        const value = record[key as keyof T];
        if (value && (key === 'usageSummary' || key === 'payload' || key === 'metadata')) {
          acc[key] = { ...(value as Record<string, any>) };
        } else {
          acc[key] = value;
        }
      }
      return acc;
    }, {});
  }

  private findUser(where: { email?: string; id?: string }) {
    if (where?.email) {
      return Array.from(this.users.values()).find((user) => user.email === where.email);
    }
    if (where?.id) {
      return this.users.get(where.id);
    }
    return undefined;
  }

  user = {
    findUnique: async ({ where, select }: { where: { email?: string; id?: string }; select?: Record<string, boolean> }) => {
      const user = this.findUser(where);
      if (!user) {
        return null;
      }
      return this.applySelect(user, select);
    },
  };

  private findSession(where: { id?: string; refreshTokenId?: string | null }) {
    if (where?.id) {
      return this.sessions.get(where.id);
    }
    if (where?.refreshTokenId) {
      return Array.from(this.sessions.values()).find((session) => session.refreshTokenId === where.refreshTokenId);
    }
    return undefined;
  }

  superadminSession = {
    create: async ({ data }: { data: Partial<MockSuperadminSession> }) => {
      const now = new Date();
      const session: MockSuperadminSession = {
        id: `session_${this.sessionSeq++}`,
        userId: data.userId!,
        userAgent: data.userAgent ?? 'Unknown',
        ipAddress: data.ipAddress ?? 'Unknown',
        refreshTokenId: data.refreshTokenId ?? null,
        createdAt: now,
        lastSeenAt: now,
        revokedAt: null,
      };
      this.sessions.set(session.id, session);
      return this.cloneRecord(session);
    },
    findUnique: async ({ where }: { where: { id?: string; refreshTokenId?: string | null } }) => {
      const session = this.findSession(where);
      return session ? this.cloneRecord(session) : null;
    },
    findMany: async ({ where = {}, orderBy }: { where?: any; orderBy?: { lastSeenAt?: 'asc' | 'desc' } } = {}) => {
      let result = Array.from(this.sessions.values());
      if (where.userId) {
        result = result.filter((session) => session.userId === where.userId);
      }
      if (Object.prototype.hasOwnProperty.call(where, 'revokedAt')) {
        result = result.filter((session) => session.revokedAt === where.revokedAt);
      }
      if (orderBy?.lastSeenAt) {
        result = result.sort((a, b) =>
          orderBy.lastSeenAt === 'asc'
            ? a.lastSeenAt.getTime() - b.lastSeenAt.getTime()
            : b.lastSeenAt.getTime() - a.lastSeenAt.getTime(),
        );
      }
      return result.map((session) => this.cloneRecord(session));
    },
    findFirst: async ({ where = {}, orderBy }: { where?: any; orderBy?: { lastSeenAt?: 'asc' | 'desc' } } = {}) => {
      const [session] = await this.superadminSession.findMany({ where, orderBy });
      return session ?? null;
    },
    update: async ({ where, data }: { where: { id: string }; data: Partial<MockSuperadminSession> }) => {
      const session = this.sessions.get(where.id);
      if (!session) {
        throw new Error('Session not found');
      }
      if (Object.prototype.hasOwnProperty.call(data, 'lastSeenAt')) {
        session.lastSeenAt = data.lastSeenAt as Date;
      }
      if (Object.prototype.hasOwnProperty.call(data, 'revokedAt')) {
        session.revokedAt = (data.revokedAt as Date | null) ?? null;
      }
      return this.cloneRecord(session);
    },
    updateMany: async ({ where = {}, data }: { where?: any; data: Partial<MockSuperadminSession> }) => {
      const sessions = await this.superadminSession.findMany({ where });
      sessions.forEach((session) => {
        const existing = this.sessions.get(session.id);
        if (existing && Object.prototype.hasOwnProperty.call(data, 'revokedAt')) {
          existing.revokedAt = (data.revokedAt as Date | null) ?? null;
        }
      });
      return { count: sessions.length };
    },
    deleteMany: async ({ where = {} }: { where?: any } = {}) => {
      const sessions = await this.superadminSession.findMany({ where });
      sessions.forEach((session) => this.sessions.delete(session.id));
      return { count: sessions.length };
    },
  };

  tenant = {
    create: async ({ data }: { data: Partial<MockTenant> }) => {
      const now = new Date();
      const tenant: MockTenant = {
        id: `tenant_${this.tenantSeq++}`,
        name: data.name ?? 'Untitled Tenant',
        email: data.email ?? `tenant${this.tenantSeq}@example.com`,
        status: data.status ?? TenantStatus.ACTIVE,
        createdAt: now,
        updatedAt: now,
        lastActiveAt: data.lastActiveAt ?? null,
        usageSummary: data.usageSummary ?? null,
        subscriptionStatus: data.subscriptionStatus ?? SubscriptionStatus.TRIAL,
        planCode: (data.planCode as string | null) ?? null,
        renewalDate: (data.renewalDate as Date | null) ?? null,
        trialEndsAt: (data.trialEndsAt as Date | null) ?? null,
      };
      this.tenants.set(tenant.id, tenant);
      return this.cloneRecord(tenant);
    },
    findMany: async (args: any = {}) => {
      let result = Array.from(this.tenants.values());
      if (args.where?.createdAt?.gte) {
        result = result.filter((tenant) => tenant.createdAt >= args.where.createdAt.gte);
      }
      if (args.where?.lastActiveAt?.gte) {
        result = result.filter((tenant) => tenant.lastActiveAt && tenant.lastActiveAt >= args.where.lastActiveAt.gte);
      }
      if (args.where?.status) {
        result = result.filter((tenant) => tenant.status === args.where.status);
      }
      if (args.orderBy?.createdAt === 'desc') {
        result = result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
      if (args.orderBy?.lastActiveAt) {
        result = result.sort((a, b) => {
          const aTime = a.lastActiveAt ? a.lastActiveAt.getTime() : 0;
          const bTime = b.lastActiveAt ? b.lastActiveAt.getTime() : 0;
          return args.orderBy.lastActiveAt === 'asc' ? aTime - bTime : bTime - aTime;
        });
      }
      if (args.select) {
        return result.map((tenant) => this.applySelect(tenant, args.select));
      }
      return result.map((tenant) => this.cloneRecord(tenant));
    },
    findUnique: async ({ where, select }: { where: { id: string }; select?: Record<string, boolean> }) => {
      const tenant = this.tenants.get(where.id);
      if (!tenant) {
        return null;
      }
      return this.applySelect(tenant, select);
    },
    update: async ({ where, data }: { where: { id: string }; data: Partial<MockTenant> }) => {
      const tenant = this.tenants.get(where.id);
      if (!tenant) {
        throw new Error('Tenant not found');
      }
      if (data.name) {
        tenant.name = data.name;
      }
      if (data.email) {
        tenant.email = data.email;
      }
      if (data.status) {
        tenant.status = data.status;
      }
      if (data.subscriptionStatus) {
        tenant.subscriptionStatus = data.subscriptionStatus as SubscriptionStatus;
      }
      if (Object.prototype.hasOwnProperty.call(data, 'lastActiveAt')) {
        tenant.lastActiveAt = (data.lastActiveAt as Date | null) ?? null;
      }
      if (Object.prototype.hasOwnProperty.call(data, 'usageSummary')) {
        tenant.usageSummary = data.usageSummary ? { ...(data.usageSummary as Record<string, number>) } : null;
      }
      if (Object.prototype.hasOwnProperty.call(data, 'planCode')) {
        tenant.planCode = (data.planCode as string | null) ?? null;
      }
      if (Object.prototype.hasOwnProperty.call(data, 'renewalDate')) {
        tenant.renewalDate = (data.renewalDate as Date | null) ?? null;
      }
      if (Object.prototype.hasOwnProperty.call(data, 'trialEndsAt')) {
        tenant.trialEndsAt = (data.trialEndsAt as Date | null) ?? null;
      }
      tenant.updatedAt = new Date();
      return this.cloneRecord(tenant);
    },
    count: async ({ where }: { where?: { status?: TenantStatus } } = {}) => {
      if (!where?.status) {
        return this.tenants.size;
      }
      return Array.from(this.tenants.values()).filter((tenant) => tenant.status === where.status).length;
    },
    groupBy: async ({ by, _count, where }: { by: string[]; _count?: any; where?: any }) => {
      const tenants = Array.from(this.tenants.values());
      const groups = new Map<string | null, number>();
      
      for (const tenant of tenants) {
        if (where?.createdAt?.gte && tenant.createdAt < where.createdAt.gte) continue;
        
        const key = by.includes('planCode') ? tenant.planCode : 'other';
        groups.set(key, (groups.get(key) ?? 0) + 1);
      }
      
      if (by.includes('planCode')) {
        return Array.from(groups.entries()).map(([planCode, count]) => ({
          planCode,
          _count: { planCode: count },
        }));
      }
      
      return Array.from(groups.entries()).map(([createdAt, count]) => ({
        createdAt: new Date(),
        _count: { id: count },
      }));
    },
  };

  supportTicket = {
    create: async ({ data }: { data: Partial<MockSupportTicket> }) => {
      const now = new Date();
      const ticket: MockSupportTicket = {
        id: `support_${this.supportTicketSeq++}`,
        tenantId: data.tenantId!,
        subject: data.subject ?? 'Support Subject',
        message: data.message ?? 'Support message',
        status: (data.status as SupportStatus) ?? SupportStatus.OPEN,
        priority: (data.priority as SupportPriority) ?? SupportPriority.MEDIUM,
        assignedTo: data.assignedTo ?? null,
        createdAt: now,
        updatedAt: now,
      };
      this.supportTickets.set(ticket.id, ticket);
      return this.cloneRecord(ticket);
    },
    findMany: async ({ where = {}, orderBy }: { where?: any; orderBy?: { createdAt?: 'asc' | 'desc' } }) => {
      let result = Array.from(this.supportTickets.values());
      if (where.tenantId) {
        result = result.filter((ticket) => ticket.tenantId === where.tenantId);
      }
      if (where.status) {
        result = result.filter((ticket) => ticket.status === where.status);
      }
      if (Array.isArray(where.OR) && where.OR.length > 0) {
        result = result.filter((ticket) =>
          where.OR.some((condition: any) => {
            if (condition.subject?.contains) {
              const value = condition.subject.contains.toLowerCase();
              return ticket.subject.toLowerCase().includes(value);
            }
            if (condition.message?.contains) {
              const value = condition.message.contains.toLowerCase();
              return ticket.message.toLowerCase().includes(value);
            }
            return false;
          }),
        );
      }
      if (orderBy?.createdAt === 'desc') {
        result = result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
      return result.map((ticket) => this.cloneRecord(ticket));
    },
    findUnique: async ({ where: { id } }: { where: { id: string } }) => {
      const ticket = this.supportTickets.get(id);
      return ticket ? this.cloneRecord(ticket) : null;
    },
    update: async ({ where: { id }, data }: { where: { id: string }; data: Partial<MockSupportTicket> }) => {
      const ticket = this.supportTickets.get(id);
      if (!ticket) {
        throw new Error('Support ticket not found');
      }
      if (data.status) {
        ticket.status = data.status as SupportStatus;
      }
      if (data.priority) {
        ticket.priority = data.priority as SupportPriority;
      }
      if (data.subject) {
        ticket.subject = data.subject;
      }
      if (data.message) {
        ticket.message = data.message;
      }
      if (typeof data.assignedTo !== 'undefined') {
        ticket.assignedTo = data.assignedTo;
      }
      ticket.updatedAt = new Date();
      return this.cloneRecord(ticket);
    },
    count: async ({ where }: { where?: { tenantId?: string } } = {}) => {
      if (!where?.tenantId) {
        return this.supportTickets.size;
      }
      return Array.from(this.supportTickets.values()).filter((t) => t.tenantId === where.tenantId).length;
    },
  };

  globalTemplate = {
    create: async ({ data }: { data: Partial<MockTemplate> }) => {
      const now = new Date();
      const template: MockTemplate = {
        id: `template_${this.templateSeq++}`,
        name: data.name ?? 'Template',
        description: data.description ?? null,
        type: (data.type as TemplateType) ?? TemplateType.METRIC,
        payload: data.payload ? { ...(data.payload as Record<string, any>) } : {},
        isActive: data.isActive ?? true,
        createdAt: now,
        updatedAt: now,
      };
      this.templates.set(template.id, template);
      return this.cloneRecord(template);
    },
    findMany: async ({ where = {}, orderBy }: { where?: any; orderBy?: { createdAt?: 'asc' | 'desc' } }) => {
      let result = Array.from(this.templates.values());
      if (typeof where.type !== 'undefined' && where.type !== null) {
        result = result.filter((template) => template.type === where.type);
      }
      if (typeof where.isActive !== 'undefined') {
        result = result.filter((template) => template.isActive === where.isActive);
      }
      if (orderBy?.createdAt === 'desc') {
        result = result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
      return result.map((template) => this.cloneRecord(template));
    },
    findUnique: async ({ where: { id } }: { where: { id: string } }) => {
      const template = this.templates.get(id);
      return template ? this.cloneRecord(template) : null;
    },
    update: async ({ where: { id }, data }: { where: { id: string }; data: Partial<MockTemplate> }) => {
      const template = this.templates.get(id);
      if (!template) {
        throw new Error('Template not found');
      }
      if (typeof data.name !== 'undefined') {
        template.name = data.name ?? template.name;
      }
      if (typeof data.description !== 'undefined') {
        template.description = data.description ?? null;
      }
      if (typeof data.type !== 'undefined') {
        template.type = data.type as TemplateType;
      }
      if (typeof data.payload !== 'undefined') {
        template.payload = data.payload ? { ...(data.payload as Record<string, any>) } : {};
      }
      if (typeof data.isActive !== 'undefined') {
        template.isActive = !!data.isActive;
      }
      template.updatedAt = new Date();
      return this.cloneRecord(template);
    },
  };

  auditLog = {
    create: async ({ data }: { data: Partial<MockAuditLog> }) => {
      const now = new Date();
      const entry: MockAuditLog = {
        id: `audit_${this.auditSeq++}`,
        tenantId: typeof data.tenantId !== 'undefined' ? (data.tenantId as string | null) : null,
        actor: data.actor ?? 'SYSTEM',
        eventType: data.eventType ?? 'UNKNOWN',
        metadata: data.metadata ? { ...(data.metadata as Record<string, any>) } : null,
        createdAt: now,
      };
      this.auditLogs.unshift(entry);
      return this.cloneRecord(entry);
    },
    findMany: async ({ where = {}, orderBy, skip = 0, take, include }: { where?: any; orderBy?: { createdAt?: 'asc' | 'desc' }; skip?: number; take?: number; include?: any }) => {
      let result = [...this.auditLogs];
      if (where.tenantId) {
        result = result.filter((log) => log.tenantId === where.tenantId);
      }
      if (where.eventType) {
        result = result.filter((log) => log.eventType === where.eventType);
      }
      if (where.createdAt?.gte) {
        result = result.filter((log) => log.createdAt >= where.createdAt.gte);
      }
      if (where.createdAt?.lte) {
        result = result.filter((log) => log.createdAt <= where.createdAt.lte);
      }
      if (orderBy?.createdAt === 'asc') {
        result = result.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      }
      // Apply pagination
      if (skip) {
        result = result.slice(skip);
      }
      if (take) {
        result = result.slice(0, take);
      }
      // Include tenant name if requested
      return result.map((log) => {
        const clone = this.cloneRecord(log);
        if (include?.tenant?.select?.name) {
          const tenant = this.tenants.get(log.tenantId ?? '');
          (clone as any).tenant = tenant ? { name: tenant.name } : null;
        }
        return clone;
      });
    },
    count: async ({ where = {} }: { where?: any } = {}) => {
      let result = [...this.auditLogs];
      if (where.tenantId) {
        result = result.filter((log) => log.tenantId === where.tenantId);
      }
      if (where.eventType) {
        result = result.filter((log) => log.eventType === where.eventType);
      }
      if (where.createdAt?.gte) {
        result = result.filter((log) => log.createdAt >= where.createdAt.gte);
      }
      if (where.createdAt?.lte) {
        result = result.filter((log) => log.createdAt <= where.createdAt.lte);
      }
      return result.length;
    },
  };
}

describe('SuperAdmin Backend (e2e)', () => {
  let app: INestApplication;
  let httpServer: any;
  let prismaMock: PrismaServiceMock;
  let jwtService: JwtService;

  beforeAll(async () => {
    prismaMock = new PrismaServiceMock();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    httpServer = app.getHttpServer();
    jwtService = moduleFixture.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    prismaMock.reset();
  });

  const loginAsSuperAdmin = async () => {
    const response = await request(httpServer)
      .post('/api/v1/auth/login')
      .send(prismaMock.getAdminCredentials())
      .expect(200);
    return response.body as { access_token: string; refresh_token: string; user: { id: string } };
  };

  const createTenant = async (token: string, overrides?: { name?: string; email?: string }) => {
    const payload = {
      name: overrides?.name ?? 'Acme Corp',
      email: overrides?.email ?? `owner+${Date.now()}@acme.com`,
    };
    const response = await request(httpServer)
      .post('/api/v1/superadmin/tenants')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201);
    return response.body;
  };

  it('POST /auth/login authenticates SUPER_ADMIN users', async () => {
    const response = await request(httpServer)
      .post('/api/v1/auth/login')
      .send(prismaMock.getAdminCredentials())
      .expect(200);

    expect(response.body).toHaveProperty('access_token');
    expect(response.body.user.email).toBe(prismaMock.getAdminCredentials().email);
    expect(response.body.user.role).toBe(Role.SUPER_ADMIN);
  });

  it('rejects superadmin routes when the token is missing', async () => {
    await request(httpServer).get('/api/v1/superadmin/tenants').expect(401);
  });

  it('rejects users without the SUPER_ADMIN role', async () => {
    const staff = prismaMock.getStaffUser();
    const token = jwtService.sign({ sub: staff.id, email: staff.email, role: staff.role });

    await request(httpServer)
      .get('/api/v1/superadmin/tenants')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('creates and lists tenants through the superadmin API', async () => {
    const { access_token } = await loginAsSuperAdmin();
    const created = await createTenant(access_token, { name: 'Beta LLC', email: 'hello@beta.com' });

    expect(created.name).toBe('Beta LLC');
    expect(created.status).toBe(TenantStatus.ACTIVE);

    const listResponse = await request(httpServer)
      .get('/api/v1/superadmin/tenants')
      .set('Authorization', `Bearer ${access_token}`)
      .expect(200);

    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.data[0].id).toBe(created.id);
  });

  it('retrieves, deactivates, and reactivates a tenant', async () => {
    const { access_token } = await loginAsSuperAdmin();
    const created = await createTenant(access_token, { name: 'Gamma Inc', email: 'team@gamma.com' });

    const detailResponse = await request(httpServer)
      .get(`/api/v1/superadmin/tenants/${created.id}`)
      .set('Authorization', `Bearer ${access_token}`)
      .expect(200);
    expect(detailResponse.body.name).toBe('Gamma Inc');

    const deactivateResponse = await request(httpServer)
      .patch(`/api/v1/superadmin/tenants/${created.id}/deactivate`)
      .set('Authorization', `Bearer ${access_token}`)
      .expect(200);
    expect(deactivateResponse.body.status).toBe(TenantStatus.INACTIVE);

    const activateResponse = await request(httpServer)
      .patch(`/api/v1/superadmin/tenants/${created.id}/activate`)
      .set('Authorization', `Bearer ${access_token}`)
      .expect(200);
    expect(activateResponse.body.status).toBe(TenantStatus.ACTIVE);
    expect(activateResponse.body.lastActiveAt).toBeTruthy();
  });

  it('returns stored usage summaries for tenant stats', async () => {
    const { access_token } = await loginAsSuperAdmin();
    const created = await createTenant(access_token, { name: 'Delta Works', email: 'ops@delta.com' });

    await prismaMock.tenant.update({
      where: { id: created.id },
      data: {
        usageSummary: {
          metricsLogged: 50,
          outcomesCompleted: 8,
          activitiesLogged: 23,
          salesLogged: 4,
          momentumScore: 72,
          streak: 3,
        },
        lastActiveAt: new Date(),
      },
    });

    const statsResponse = await request(httpServer)
      .get(`/api/v1/superadmin/tenants/${created.id}/stats`)
      .set('Authorization', `Bearer ${access_token}`)
      .expect(200);

    expect(statsResponse.body.metricsLogged).toBe(50);
    expect(statsResponse.body.momentumScore).toBe(72);
    expect(statsResponse.body.tenantId).toBe(created.id);
  });

  it('summarizes dashboard metrics from tenant metadata', async () => {
    const { access_token } = await loginAsSuperAdmin();
    const alpha = await createTenant(access_token, { name: 'Alpha', email: 'alpha@corp.com' });
    const beta = await createTenant(access_token, { name: 'Beta', email: 'beta@corp.com' });

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await prismaMock.tenant.update({ where: { id: alpha.id }, data: { lastActiveAt: new Date() } });
    await prismaMock.tenant.update({ where: { id: beta.id }, data: { lastActiveAt: yesterday } });

    const response = await request(httpServer)
      .get('/api/v1/superadmin/dashboard/summary')
      .set('Authorization', `Bearer ${access_token}`)
      .expect(200);

    expect(response.body.totalTenants).toBe(2);
    expect(response.body.createdLast7Days).toBe(2);
    expect(response.body.activityTrend).toHaveLength(7);
  });

  it('manages support tickets end-to-end', async () => {
    const { access_token } = await loginAsSuperAdmin();
    const tenant = await createTenant(access_token, { name: 'Support Tenant', email: 'support@example.com' });

    const createResponse = await request(httpServer)
      .post('/api/v1/superadmin/support')
      .set('Authorization', `Bearer ${access_token}`)
      .send({
        tenantId: tenant.id,
        subject: 'Dashboard not loading',
        message: 'Screen remains blank after login',
        priority: SupportPriority.HIGH,
      })
      .expect(201);

    expect(createResponse.body.subject).toContain('Dashboard');
    expect(createResponse.body.status).toBe(SupportStatus.OPEN);

    const listResponse = await request(httpServer)
      .get('/api/v1/superadmin/support')
      .query({ search: 'dashboard' })
      .set('Authorization', `Bearer ${access_token}`)
      .expect(200);

    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0].tenantId).toBe(tenant.id);

    const updated = await request(httpServer)
      .patch(`/api/v1/superadmin/support/${createResponse.body.id}/status`)
      .set('Authorization', `Bearer ${access_token}`)
      .send({ status: SupportStatus.IN_PROGRESS })
      .expect(200);

    expect(updated.body.status).toBe(SupportStatus.IN_PROGRESS);

    const detail = await request(httpServer)
      .get(`/api/v1/superadmin/support/${createResponse.body.id}`)
      .set('Authorization', `Bearer ${access_token}`)
      .expect(200);

    expect(detail.body.priority).toBe(SupportPriority.HIGH);
    expect(detail.body.status).toBe(SupportStatus.IN_PROGRESS);
  });

  it('handles global template lifecycle actions', async () => {
    const { access_token } = await loginAsSuperAdmin();

    const createResponse = await request(httpServer)
      .post('/api/v1/superadmin/templates')
      .set('Authorization', `Bearer ${access_token}`)
      .send({
        name: 'Sales Template',
        description: 'Guides revenue reviews',
        type: TemplateType.METRIC,
        payload: { fields: ['revenue', 'pipeline'] },
      })
      .expect(201);

    expect(createResponse.body.isActive).toBe(true);
    expect(createResponse.body.type).toBe(TemplateType.METRIC);

    const listResponse = await request(httpServer)
      .get('/api/v1/superadmin/templates')
      .query({ type: TemplateType.METRIC })
      .set('Authorization', `Bearer ${access_token}`)
      .expect(200);

    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0].name).toBe('Sales Template');

    const updateResponse = await request(httpServer)
      .patch(`/api/v1/superadmin/templates/${createResponse.body.id}`)
      .set('Authorization', `Bearer ${access_token}`)
      .send({ name: 'Weekly Sales Template', payload: { fields: ['mrr'] } })
      .expect(200);

    expect(updateResponse.body.name).toBe('Weekly Sales Template');
    expect(updateResponse.body.payload.fields).toContain('mrr');

    const deleteResponse = await request(httpServer)
      .delete(`/api/v1/superadmin/templates/${createResponse.body.id}`)
      .set('Authorization', `Bearer ${access_token}`)
      .expect(200);

    expect(deleteResponse.body.isActive).toBe(false);

    const inactiveList = await request(httpServer)
      .get('/api/v1/superadmin/templates')
      .query({ isActive: 'false' })
      .set('Authorization', `Bearer ${access_token}`)
      .expect(200);

    expect(inactiveList.body).toHaveLength(1);
    expect(inactiveList.body[0].isActive).toBe(false);
  });

  it('exposes audit log entries for tenant actions', async () => {
    const { access_token } = await loginAsSuperAdmin();
    const tenant = await createTenant(access_token, { name: 'Audit Tenant', email: 'audit@example.com' });

    await request(httpServer)
      .patch(`/api/v1/superadmin/tenants/${tenant.id}/deactivate`)
      .set('Authorization', `Bearer ${access_token}`)
      .expect(200);

    const auditResponse = await request(httpServer)
      .get('/api/v1/superadmin/audit')
      .set('Authorization', `Bearer ${access_token}`)
      .expect(200);

    expect(auditResponse.body.data.length).toBeGreaterThanOrEqual(2);
    const eventTypes = auditResponse.body.data.map((entry: any) => entry.eventType);
    expect(eventTypes).toContain('TENANT_CREATED');
    expect(eventTypes).toContain('TENANT_DEACTIVATED');
  });

  it('updates subscriptions and returns tenant report summaries', async () => {
    const { access_token } = await loginAsSuperAdmin();
    const tenant = await createTenant(access_token, { name: 'Report Tenant', email: 'report@example.com' });

    const renewalDate = new Date('2025-02-01T00:00:00.000Z');
    const trialEnds = new Date('2024-12-31T00:00:00.000Z');

    const subscriptionResponse = await request(httpServer)
      .patch(`/api/v1/superadmin/tenants/${tenant.id}/subscription`)
      .set('Authorization', `Bearer ${access_token}`)
      .send({
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        planCode: 'GROWTH',
        renewalDate: renewalDate.toISOString(),
        trialEndsAt: trialEnds.toISOString(),
      })
      .expect(200);

    expect(subscriptionResponse.body.subscriptionStatus).toBe(SubscriptionStatus.ACTIVE);
    expect(subscriptionResponse.body.planCode).toBe('GROWTH');

    const lastActiveAt = new Date('2025-01-15T10:00:00.000Z');
    await prismaMock.tenant.update({
      where: { id: tenant.id },
      data: {
        usageSummary: {
          metricsLogged: 120,
          outcomesCompleted: 15,
          activitiesLogged: 60,
          salesLogged: 9,
          momentumScore: 80,
          streak: 5,
        },
        lastActiveAt,
      },
    });

    const reportResponse = await request(httpServer)
      .get(`/api/v1/superadmin/reports/tenant/${tenant.id}/summary`)
      .set('Authorization', `Bearer ${access_token}`)
      .expect(200);

    expect(reportResponse.body.tenant.subscriptionStatus).toBe(SubscriptionStatus.ACTIVE);
    expect(reportResponse.body.tenant.planCode).toBe('GROWTH');
    expect(reportResponse.body.usage.metricsLogged).toBe(120);
    expect(new Date(reportResponse.body.usage.lastActiveAt).toISOString()).toBe(lastActiveAt.toISOString());
  });

  // ============================================
  // NEW SUPERADMIN FEATURES TESTS
  // ============================================

  describe('Auth Refresh Token', () => {
    it('POST /auth/refresh accepts the refresh token body and issues a new access token', async () => {
      const { refresh_token } = await loginAsSuperAdmin();

      const response = await request(httpServer)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: refresh_token })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(typeof response.body.access_token).toBe('string');
    });

    it('POST /auth/refresh rejects missing refresh token body', async () => {
      await request(httpServer)
        .post('/api/v1/auth/refresh')
        .expect(400);
    });
  });

  describe('Tenant Edit Endpoint', () => {
    it('PATCH /tenants/:id updates tenant name and email', async () => {
      const { access_token } = await loginAsSuperAdmin();
      const tenant = await createTenant(access_token, { name: 'Original Name', email: 'original@test.com' });

      const response = await request(httpServer)
        .patch(`/api/v1/superadmin/tenants/${tenant.id}`)
        .set('Authorization', `Bearer ${access_token}`)
        .send({ name: 'Updated Name', email: 'updated@test.com' })
        .expect(200);

      expect(response.body.name).toBe('Updated Name');
      expect(response.body.email).toBe('updated@test.com');
    });

    it('PATCH /tenants/:id allows partial updates', async () => {
      const { access_token } = await loginAsSuperAdmin();
      const tenant = await createTenant(access_token, { name: 'Test Tenant', email: 'test@tenant.com' });

      const response = await request(httpServer)
        .patch(`/api/v1/superadmin/tenants/${tenant.id}`)
        .set('Authorization', `Bearer ${access_token}`)
        .send({ name: 'Only Name Updated' })
        .expect(200);

      expect(response.body.name).toBe('Only Name Updated');
    });
  });

  describe('Template Duplicate', () => {
    it('POST /templates/:id/duplicate creates a copy with (Copy) suffix', async () => {
      const { access_token } = await loginAsSuperAdmin();

      const original = await request(httpServer)
        .post('/api/v1/superadmin/templates')
        .set('Authorization', `Bearer ${access_token}`)
        .send({
          name: 'Original Template',
          description: 'Test template',
          type: TemplateType.METRIC,
          payload: { fields: ['revenue'] },
        })
        .expect(201);

      const duplicated = await request(httpServer)
        .post(`/api/v1/superadmin/templates/${original.body.id}/duplicate`)
        .set('Authorization', `Bearer ${access_token}`)
        .expect(201);

      expect(duplicated.body.name).toBe('Original Template (Copy)');
      expect(duplicated.body.type).toBe(TemplateType.METRIC);
      expect(duplicated.body.id).not.toBe(original.body.id);
    });
  });

  describe('Support Agent Assignment', () => {
    it('PATCH /support/:id/assign assigns an agent to ticket', async () => {
      const { access_token } = await loginAsSuperAdmin();
      const tenant = await createTenant(access_token, { name: 'Agent Test', email: 'agent@test.com' });

      const ticket = await request(httpServer)
        .post('/api/v1/superadmin/support')
        .set('Authorization', `Bearer ${access_token}`)
        .send({
          tenantId: tenant.id,
          subject: 'Need help',
          message: 'Test ticket',
          priority: SupportPriority.MEDIUM,
        })
        .expect(201);

      const response = await request(httpServer)
        .patch(`/api/v1/superadmin/support/${ticket.body.id}/assign`)
        .set('Authorization', `Bearer ${access_token}`)
        .send({ assignedTo: 'agent@company.com' })
        .expect(200);

      expect(response.body.assignedTo).toBe('agent@company.com');
    });
  });

  describe('Audit Pagination and Export', () => {
    it('GET /audit returns paginated results', async () => {
      const { access_token } = await loginAsSuperAdmin();
      
      // Create multiple tenants to generate audit logs
      for (let i = 0; i < 5; i++) {
        await createTenant(access_token, { name: `Tenant ${i}`, email: `tenant${i}@test.com` });
      }

      const response = await request(httpServer)
        .get('/api/v1/superadmin/audit')
        .query({ page: 1, pageSize: 3 })
        .set('Authorization', `Bearer ${access_token}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.pageSize).toBe(3);
      expect(response.body.data.length).toBeLessThanOrEqual(3);
    });

    it('GET /audit/export returns CSV content', async () => {
      const { access_token } = await loginAsSuperAdmin();
      await createTenant(access_token, { name: 'CSV Test', email: 'csv@test.com' });

      const response = await request(httpServer)
        .get('/api/v1/superadmin/audit/export')
        .set('Authorization', `Bearer ${access_token}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.text).toContain('ID,Tenant ID,Tenant Name,Actor,Event Type');
    });
  });

  describe('Reports with Date Range and Export', () => {
    it('GET /reports/platform/summary includes date range filters', async () => {
      const { access_token } = await loginAsSuperAdmin();
      await createTenant(access_token, { name: 'Report Tenant', email: 'report@test.com' });

      const response = await request(httpServer)
        .get('/api/v1/superadmin/reports/platform/summary')
        .query({ startDate: '2025-01-01', endDate: '2025-12-31' })
        .set('Authorization', `Bearer ${access_token}`)
        .expect(200);

      expect(response.body).toHaveProperty('kpis');
      expect(response.body).toHaveProperty('charts');
      expect(response.body).toHaveProperty('dateRange');
      expect(response.body.dateRange.startDate).toBe('2025-01-01');
      expect(response.body.dateRange.endDate).toBe('2025-12-31');
    });

    it('GET /reports/platform/export returns CSV content', async () => {
      const { access_token } = await loginAsSuperAdmin();
      await createTenant(access_token, { name: 'Platform CSV', email: 'platform@csv.com' });

      const response = await request(httpServer)
        .get('/api/v1/superadmin/reports/platform/export')
        .set('Authorization', `Bearer ${access_token}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.text).toContain('Platform Report');
      expect(response.text).toContain('Total Tenants');
    });

    it('GET /reports/tenant/:id/export returns tenant CSV', async () => {
      const { access_token } = await loginAsSuperAdmin();
      const tenant = await createTenant(access_token, { name: 'Tenant Export', email: 'export@tenant.com' });

      const response = await request(httpServer)
        .get(`/api/v1/superadmin/reports/tenant/${tenant.id}/export`)
        .set('Authorization', `Bearer ${access_token}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.text).toContain('Tenant Report');
      expect(response.text).toContain('Tenant Export');
    });
  });
});
