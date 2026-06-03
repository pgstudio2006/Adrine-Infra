/**
 * Idempotent Navayu tenant provisioning (kernel-api + domain-api).
 *
 * Usage:
 *   DATABASE_URL=postgresql://... pnpm provision:navayu
 *   pnpm provision:navayu -- --dry-run
 *
 * Prerequisite: pnpm prisma generate in kernel-api and domain-api; migrations applied.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { WorkflowDefinitionDraft } from '@adrine/hospital-operations';
import { OPERATIONAL_TEMPLATE_PACKS } from '@adrine/hospital-operations';
import { Prisma as KernelPrisma } from '../services/kernel-api/src/generated/prisma/index.js';
import { PrismaClient as KernelPrismaClient } from '../services/kernel-api/src/generated/prisma/index.js';
import { Prisma as DomainPrisma } from '../services/domain-api/src/generated/prisma/index.js';
import { PrismaClient as DomainPrismaClient } from '../services/domain-api/src/generated/prisma/index.js';
import { hashPassword } from '../services/kernel-api/src/auth/password.util.js';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const CLIENT_DIR = join(ROOT, 'clients', 'navayu');

const dryRun = process.argv.includes('--dry-run');

type TenantSeed = {
  tenantId: string;
  orgName: string;
  legalName?: string;
  templatePack: string;
  adminEmail: string;
  adminName?: string;
  legacySubscriptionPlan?: string;
  tenantSubscriptionPlan?: string;
};

type BranchSeed = {
  code: string;
  name: string;
  timezone?: string;
  modules: string[];
  workflowPack?: string;
  applyTenantSettings?: boolean;
  applyTenantForms?: boolean;
  policies?: Record<string, unknown>;
};

type UserSeed = {
  email: string;
  fullName: string;
  role: string;
  branchCode: string;
  department?: string;
  password?: string;
};

function readJson<T>(relativePath: string): T {
  const raw = readFileSync(join(CLIENT_DIR, relativePath), 'utf8');
  return JSON.parse(raw) as T;
}

type BranchPack = {
  roles?: Record<string, unknown>;
  navigation?: Record<string, unknown>;
  featureFlags?: Record<string, unknown>;
  navProfiles?: Record<string, unknown>;
};

function deepMergeRecords(
  base: Record<string, unknown> | undefined,
  patch: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...(base ?? {}) };
  if (!patch) {
    return result;
  }
  for (const [key, value] of Object.entries(patch)) {
    const existing = result[key];
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      existing &&
      typeof existing === 'object' &&
      !Array.isArray(existing)
    ) {
      result[key] = deepMergeRecords(existing as Record<string, unknown>, value as Record<string, unknown>);
      continue;
    }
    result[key] = value;
  }
  return result;
}

function mergeTenantSettings(base: Record<string, unknown>, pack: BranchPack): Record<string, unknown> {
  return {
    ...base,
    roles: deepMergeRecords(base.roles as Record<string, unknown> | undefined, pack.roles),
    navigation: deepMergeRecords(
      base.navigation as Record<string, unknown> | undefined,
      pack.navigation,
    ),
    featureFlags: {
      ...((base.featureFlags as Record<string, unknown> | undefined) ?? {}),
      ...(pack.featureFlags ?? {}),
    },
    navProfiles: pack.navProfiles ?? base.navProfiles,
  };
}

function loadBranchPack(branchCode: string): BranchPack {
  return readJson<BranchPack>(`packs/${branchCode}-pack.json`);
}

function moduleFlagsJson(modules: string[]): KernelPrisma.InputJsonValue {
  return Object.fromEntries(modules.map((m) => [m, true])) as KernelPrisma.InputJsonValue;
}

function log(message: string) {
  console.log(dryRun ? `[dry-run] ${message}` : message);
}

async function main() {
  const databaseUrl =
    process.env.DATABASE_URL ??
    process.env.KERNEL_DATABASE_URL ??
    (dryRun ? 'postgresql://dry-run@127.0.0.1:5432/dry' : undefined);
  if (!databaseUrl) {
    console.error('Set DATABASE_URL (or KERNEL_DATABASE_URL) to your Postgres connection string.');
    process.exit(1);
  }

  const domainUrl = process.env.DOMAIN_DATABASE_URL ?? databaseUrl;
  const defaultPassword =
    process.env.NAVAYU_DEFAULT_PASSWORD ?? 'Navayu@2026';

  const tenant = readJson<TenantSeed>('tenant.json');
  const { branches } = readJson<{ branches: BranchSeed[] }>('branches.json');
  const { users } = readJson<{ users: UserSeed[] }>('users.json');
  const tenantSettings = readJson<Record<string, unknown>>('tenant-settings.json');
  const workflowDraft = readJson<WorkflowDefinitionDraft>('workflow/navayu_msk_visit.json');
  const protocolLibrary = readJson<Record<string, unknown>>('protocols.json');

  const formsDir = join(CLIENT_DIR, 'forms');
  const formFiles = readdirSync(formsDir).filter((f) => f.endsWith('.json'));
  const tenantForms = Object.fromEntries(
    formFiles.map((file) => {
      const form = JSON.parse(readFileSync(join(formsDir, file), 'utf8')) as Record<string, unknown>;
      const key = file.replace(/\.json$/, '').replace(/-/g, '_');
      return [key, form];
    }),
  );

  const kernel = dryRun ? null : new KernelPrismaClient({ datasources: { db: { url: databaseUrl } } });
  const domain = dryRun ? null : new DomainPrismaClient({ datasources: { db: { url: domainUrl } } });

  try {
    const packDef =
      OPERATIONAL_TEMPLATE_PACKS.find((p) => p.code === tenant.templatePack) ??
      OPERATIONAL_TEMPLATE_PACKS.find((p) => p.code === 'navayu_msk')!;

    log(`Provisioning tenant ${tenant.tenantId} (pack ${tenant.templatePack})`);

    if (!dryRun && kernel) {
      await kernel.operationalTemplatePack.upsert({
        where: { code: packDef.code },
        create: {
          code: packDef.code,
          label: packDef.label,
          description: packDef.description,
          packJson: packDef,
        },
        update: { label: packDef.label, packJson: packDef },
      });
    }

    const orgData = {
      tenantId: tenant.tenantId,
      name: tenant.orgName,
      legalName: tenant.legalName ?? tenant.orgName,
    };

    if (dryRun) {
      log(`Upsert organization: ${JSON.stringify(orgData)}`);
    } else if (kernel) {
      await kernel.organization.upsert({
        where: { tenantId: tenant.tenantId },
        create: orgData,
        update: { name: orgData.name, legalName: orgData.legalName },
      });
    }

    const org = dryRun || !kernel
      ? { id: 'dry-org-id', tenantId: tenant.tenantId }
      : await kernel.organization.findUniqueOrThrow({ where: { tenantId: tenant.tenantId } });

    const branchIdByCode = new Map<string, string>();

    for (const branch of branches) {
      const branchPayload = {
        tenantId: tenant.tenantId,
        organizationId: org.id,
        code: branch.code,
        name: branch.name,
        timezone: branch.timezone ?? 'Asia/Kolkata',
        moduleFlags: moduleFlagsJson(branch.modules),
        isActive: true,
      };

      if (dryRun) {
        log(`Upsert branch ${branch.code}: ${branch.name} [${branch.modules.join(', ')}] pack=${branch.workflowPack ?? 'none'}`);
        branchIdByCode.set(branch.code, `dry-branch-${branch.code}`);
      } else if (kernel) {
        const row = await kernel.branch.upsert({
          where: { tenantId_code: { tenantId: tenant.tenantId, code: branch.code } },
          create: branchPayload,
          update: {
            name: branch.name,
            timezone: branchPayload.timezone,
            moduleFlags: branchPayload.moduleFlags,
            isActive: true,
          },
        });
        branchIdByCode.set(branch.code, row.id);
        log(`Branch ${branch.code} → ${row.id}`);
      }

      const branchId = branchIdByCode.get(branch.code)!;
      const policies = branch.policies ?? {};

      for (const [key, value] of Object.entries(policies)) {
        if (dryRun) {
          log(`  policy ${branch.code}/${key}`);
        } else if (kernel) {
          await kernel.branchConfig.upsert({
            where: { branchId_key: { branchId, key } },
            create: { tenantId: tenant.tenantId, branchId, key, value: value as KernelPrisma.InputJsonValue },
            update: { value: value as KernelPrisma.InputJsonValue },
          });
        }
      }

      if (branch.applyTenantSettings) {
        const branchPack = loadBranchPack(branch.code);
        const mergedSettings = mergeTenantSettings(tenantSettings, branchPack);
        if (dryRun) {
          log(`  tenant.settings on ${branch.code} (merged ${branch.code}-pack.json)`);
        } else if (kernel) {
          await kernel.branchConfig.upsert({
            where: { branchId_key: { branchId, key: 'tenant.settings' } },
            create: {
              tenantId: tenant.tenantId,
              branchId,
              key: 'tenant.settings',
              value: mergedSettings as KernelPrisma.InputJsonValue,
            },
            update: { value: mergedSettings as KernelPrisma.InputJsonValue },
          });
        }
      }

      if (branch.applyTenantForms) {
        if (dryRun) {
          log(`  tenant.forms on ${branch.code} (${formFiles.length} files)`);
        } else if (kernel) {
          await kernel.branchConfig.upsert({
            where: { branchId_key: { branchId, key: 'tenant.forms' } },
            create: {
              tenantId: tenant.tenantId,
              branchId,
              key: 'tenant.forms',
              value: tenantForms as KernelPrisma.InputJsonValue,
            },
            update: { value: tenantForms as KernelPrisma.InputJsonValue },
          });
        }
      }

      if (branch.applyTenantSettings && branch.code === 'gurgaon') {
        if (dryRun) {
          log(`  tenant.protocols on ${branch.code}`);
        } else if (kernel) {
          await kernel.branchConfig.upsert({
            where: { branchId_key: { branchId, key: 'tenant.protocols' } },
            create: {
              tenantId: tenant.tenantId,
              branchId,
              key: 'tenant.protocols',
              value: protocolLibrary as KernelPrisma.InputJsonValue,
            },
            update: { value: protocolLibrary as KernelPrisma.InputJsonValue },
          });
        }
      }

      if (!dryRun && kernel && branch.workflowPack) {
        const packCode =
          branch.workflowPack === 'opd_standard' ? 'opd_clinic' : branch.workflowPack;
        const packDefForBranch = OPERATIONAL_TEMPLATE_PACKS.find((p) => p.code === packCode);
        if (packDefForBranch) {
          await kernel.operationalTemplatePack.upsert({
            where: { code: packDefForBranch.code },
            create: {
              code: packDefForBranch.code,
              label: packDefForBranch.label,
              description: packDefForBranch.description,
              packJson: packDefForBranch,
            },
            update: { label: packDefForBranch.label, packJson: packDefForBranch },
          });
        }
        const pack = await kernel.operationalTemplatePack.findUnique({ where: { code: packCode } });
        if (pack) {
          const existing = await kernel.templateInstantiation.findFirst({
            where: { tenantId: tenant.tenantId, branchId, packId: pack.id },
          });
          if (!existing) {
            await kernel.templateInstantiation.create({
              data: {
                tenantId: tenant.tenantId,
                branchId,
                packId: pack.id,
                status: 'completed',
              },
            });
          }
        }
      } else if (dryRun && branch.workflowPack) {
        const packCode =
          branch.workflowPack === 'opd_standard' ? 'opd_clinic' : branch.workflowPack;
        log(`  workflow pack ${branch.code} → ${packCode}`);
      }
    }

    for (const user of users) {
      const branchId = branchIdByCode.get(user.branchCode);
      if (!branchId) {
        throw new Error(`Unknown branchCode ${user.branchCode} for user ${user.email}`);
      }
      if (dryRun) {
        log(`User ${user.email} (${user.role}) @ ${user.branchCode}`);
      } else if (kernel) {
        const passwordHash = hashPassword(user.password ?? defaultPassword);
        await kernel.platformUser.upsert({
          where: { tenantId_email: { tenantId: tenant.tenantId, email: user.email } },
          create: {
            tenantId: tenant.tenantId,
            branchId,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            passwordHash,
            isActive: true,
          },
          update: {
            branchId,
            fullName: user.fullName,
            role: user.role,
            passwordHash,
            isActive: true,
          },
        });
      }
    }

    const signupPayload = {
      tenantId: tenant.tenantId,
      orgName: tenant.orgName,
      adminEmail: tenant.adminEmail,
      adminName: tenant.adminName ?? 'Navayu Admin',
      status: 'active',
    };

    if (dryRun) {
      log(`TenantSignup + completed onboarding (pack ${tenant.templatePack})`);
    } else if (kernel) {
      const signup = await kernel.tenantSignup.upsert({
        where: { tenantId: tenant.tenantId },
        create: signupPayload,
        update: { status: 'active', orgName: tenant.orgName },
      });

      const session = await kernel.onboardingSession.findFirst({
        where: { tenantId: tenant.tenantId, signupId: signup.id },
        orderBy: { createdAt: 'desc' },
      });

      const sessionId =
        session?.id ??
        (
          await kernel.onboardingSession.create({
            data: {
              tenantId: tenant.tenantId,
              signupId: signup.id,
              templatePack: tenant.templatePack,
              progressJson: { template_pack: tenant.templatePack, completed: true },
              status: 'completed',
              completedAt: new Date(),
            },
          })
        ).id;

      await kernel.onboardingSession.update({
        where: { id: sessionId },
        data: {
          templatePack: tenant.templatePack,
          status: 'completed',
          completedAt: new Date(),
          progressJson: { template_pack: tenant.templatePack, completed: true },
        },
      });

      await kernel.onboardingStep.upsert({
        where: { sessionId_stepKey: { sessionId, stepKey: 'activate' } },
        create: {
          sessionId,
          stepKey: 'activate',
          payload: { template_pack: tenant.templatePack },
        },
        update: { payload: { template_pack: tenant.templatePack } },
      });
    }

    const legacyPlan = tenant.legacySubscriptionPlan ?? 'design_partner';
    if (dryRun) {
      log(`Subscription (legacy): plan=${legacyPlan}`);
    } else if (kernel) {
      await kernel.subscription.upsert({
        where: { tenantId: tenant.tenantId },
        create: { tenantId: tenant.tenantId, plan: legacyPlan, status: 'active' },
        update: { plan: legacyPlan, status: 'active' },
      });
    }

    const subPlanCode = tenant.tenantSubscriptionPlan ?? 'free_trial';
    if (dryRun) {
      log(`TenantSubscription: plan=${subPlanCode}`);
    } else if (kernel) {
      let plan = await kernel.subscriptionPlan.findUnique({ where: { code: subPlanCode } });
      if (!plan) {
        plan = await kernel.subscriptionPlan.create({
          data: {
            code: subPlanCode,
            label: subPlanCode.replace(/_/g, ' '),
            isMetered: false,
            taxRateBps: 1800,
          },
        });
      }
      await kernel.tenantSubscription.upsert({
        where: { tenantId: tenant.tenantId },
        create: { tenantId: tenant.tenantId, planId: plan.id, status: 'active' },
        update: { planId: plan.id, status: 'active' },
      });
    }

    const workflowBody = {
      lifecycleId: workflowDraft.lifecycleId,
      name: workflowDraft.name,
      description: workflowDraft.description,
      draft: workflowDraft,
    };

    if (dryRun) {
      log(`WorkflowDefinition ${workflowDraft.lifecycleId} + publish v1`);
    } else if (domain) {
      let def = await domain.workflowDefinition.findUnique({
        where: {
          tenantId_lifecycleId: {
            tenantId: tenant.tenantId,
            lifecycleId: workflowDraft.lifecycleId,
          },
        },
      });

      if (!def) {
        def = await domain.workflowDefinition.create({
          data: {
            tenantId: tenant.tenantId,
            lifecycleId: workflowDraft.lifecycleId,
            name: workflowDraft.name,
            description: workflowDraft.description,
          },
        });
      } else {
        await domain.workflowDefinition.update({
          where: { id: def.id },
          data: {
            name: workflowDraft.name,
            description: workflowDraft.description,
          },
        });
      }

      const existingPublished = await domain.workflowVersion.findFirst({
        where: { definitionId: def.id, state: 'published' },
        orderBy: { version: 'desc' },
      });

      if (!existingPublished) {
        const maxVersion = await domain.workflowVersion.aggregate({
          where: { definitionId: def.id },
          _max: { version: true },
        });
        const nextVersion = (maxVersion._max.version ?? 0) + 1;

        const version = await domain.workflowVersion.create({
          data: {
            tenantId: tenant.tenantId,
            definitionId: def.id,
            version: nextVersion,
            state: 'published',
            draftJson: workflowDraft as unknown as DomainPrisma.InputJsonValue,
            publishedAt: new Date(),
            publishedBy: 'provision-navayu',
            expectedVersion: 1,
          },
        });

        await domain.workflowPublishLog.create({
          data: {
            tenantId: tenant.tenantId,
            definitionId: def.id,
            versionId: version.id,
            fromVersion: nextVersion,
            toVersion: nextVersion,
            action: 'publish',
            actorId: 'provision-navayu',
          },
        });
        log(`Published workflow ${workflowDraft.lifecycleId} v${nextVersion}`);
      } else {
        log(`Workflow ${workflowDraft.lifecycleId} already published (v${existingPublished.version})`);
      }
    }

    console.log('\n--- Navayu provision summary ---');
    console.log(`Tenant:     ${tenant.tenantId}`);
    console.log(`Org:        ${tenant.orgName}`);
    console.log(`Pack:       ${tenant.templatePack}`);
    for (const branch of branches) {
      const mods = branch.modules.join(', ');
      console.log(`Branch:     ${branch.code} (${branch.name}) → ${branchIdByCode.get(branch.code)} [${mods}]`);
    }
    console.log('\nDev-login test accounts (Hospital OS dev login):');
    for (const user of users) {
      console.log(`  ${user.email}  role=${user.role}  branch=${user.branchCode}`);
    }
    console.log('\nGurgaon: tenant.settings + tenant.forms + tenant.protocols in BranchConfig (gurgaon-pack.json merged).');
    console.log('Pataudi: tenant.settings + multi_specialty modules (pataudi-pack.json merged).');
    if (dryRun) {
      console.log('\n(dry-run: no database writes performed)');
    }
  } finally {
    if (kernel) await kernel.$disconnect();
    if (domain) await domain.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
