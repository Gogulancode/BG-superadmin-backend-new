CREATE TABLE "platform_settings" (
    "id" TEXT NOT NULL DEFAULT 'platform',
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "defaultPlan" TEXT NOT NULL DEFAULT 'STARTER',
    "maxTenantsPerPlan" JSONB NOT NULL,
    "features" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

ALTER TYPE "AuditEventType" ADD VALUE IF NOT EXISTS 'SETTINGS_CHANGED';
