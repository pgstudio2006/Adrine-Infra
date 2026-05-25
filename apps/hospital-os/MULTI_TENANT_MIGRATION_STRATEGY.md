# **Adrine Multi-Tenant Migration Strategy**
**Transforming from Single Hospital Demo to Modular Healthcare Operating System**

---

## **🎯 Executive Vision**

**From:** Custom hospital software (one giant app)  
**To:** Healthcare Infrastructure Platform (modular, multi-tenant, configurable)

This is the **most critical architectural transformation** for Adrine's scalability and enterprise success.

---

## **🏗️ Target Architecture Overview**

```
Core Platform (Universal)
├── Identity & Access Management
├── Patient Engine
├── Workflow Engine  
├── Billing Core
├── Infrastructure Services
└── Event Bus

+ Feature Modules (Pluggable)
├── OPD Module
├── IPD Module
├── Pharmacy Module
├── Lab Module
├── Radiology Module
├── Emergency Module
├── OT Module
├── Inventory Module
├── HR Module
├── CRM Module
├── AI Module
└── Telehealth Module

+ Config Engine
├── Tenant Configuration
├── Feature Flags
├── Workflow Builder
├── Form Builder
└── Branding Engine

+ Multi-Tenant Layer
├── Tenant Isolation
├── White-Labeling
├── Pricing Engine
└── Analytics
```

---

## **📋 Migration Strategy: Phase by Phase**

### **Phase 1: Core Platform Extraction (Weeks 1-4)**

#### **1.1 Identify Core vs Module Logic**
```typescript
// Core Platform (Never Changes Per Tenant)
interface AdrineCore {
  identity: IdentityService;      // Users, RBAC, ABAC
  patient: PatientEngine;        // UHID, demographics, encounters
  workflow: WorkflowEngine;      // Events, automations, notifications
  billing: BillingCore;          // Invoices, payments, ledgers
  infrastructure: InfraService;  // Audit, storage, APIs, analytics
}

// Feature Modules (Pluggable)
interface FeatureModule {
  id: string;
  name: string;
  version: string;
  dependencies: string[];
  routes: RouteConfig[];
  permissions: Permission[];
  schemas: DatabaseSchema[];
  workflows: WorkflowDefinition[];
  uiComponents: ComponentRegistry[];
}
```

#### **1.2 Extract Core Services**
```bash
# New folder structure
src/
├── core/                    # Universal platform services
│   ├── identity/           # User management, auth, RBAC
│   ├── patient/            # Patient master data engine
│   ├── workflow/           # Event-driven workflow engine
│   ├── billing/            # Core billing & payments
│   └── infrastructure/     # Audit, storage, APIs
├── modules/                # Pluggable feature modules
│   ├── opd/
│   ├── ipd/
│   ├── pharmacy/
│   └── lab/
├── config/                 # Configuration engine
├── tenants/               # Multi-tenant management
└── shared/               # Shared utilities
```

#### **1.3 Define Module Interfaces**
```typescript
interface IAdrineModule {
  // Lifecycle hooks
  init(tenantConfig: TenantConfig): Promise<void>;
  destroy(): Promise<void>;
  
  // Module capabilities
  getRoutes(): RouteConfig[];
  getPermissions(): Permission[];
  getDatabaseSchemas(): Schema[];
  getWorkflows(): WorkflowDefinition[];
  getUIComponents(): ComponentRegistry[];
  
  // Event handlers
  registerEventHandlers(eventBus: EventBus): void;
  
  // Configuration
  getDefaultConfig(): ModuleConfig;
  validateConfig(config: ModuleConfig): boolean;
}
```

---

### **Phase 2: Multi-Tenant Architecture (Weeks 5-8)**

#### **2.1 Database Strategy**
```sql
-- Option A: Schema-per-Tenant (Recommended)
CREATE SCHEMA tenant_hospital_1;
CREATE SCHEMA tenant_hospital_2;
-- Each tenant gets isolated schema

-- Option B: Row-Level Security
ALTER TABLE patients ADD COLUMN tenant_id UUID;
CREATE POLICY tenant_isolation ON patients 
  FOR ALL TO authenticated_user 
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

#### **2.2 Tenant Context Middleware**
```typescript
// NestJS Example
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] || req.session?.tenantId;
    
    if (!tenantId) {
      throw new UnauthorizedException('Tenant ID required');
    }
    
    // Set tenant context
    req['tenantId'] = tenantId;
    AppRequestContext.setTenant(tenantId);
    
    // Load tenant configuration
    const tenantConfig = await this.tenantService.getConfig(tenantId);
    req['tenantConfig'] = tenantConfig;
    
    next();
  }
}
```

#### **2.3 Multi-Tenant Configuration**
```typescript
interface TenantConfig {
  id: string;
  name: string;
  type: 'clinic' | 'hospital' | 'chain' | 'diagnostic';
  
  // Branding
  branding: {
    logo: string;
    theme: ThemeConfig;
    domain: string;
    colors: ColorPalette;
  };
  
  // Modules
  modules: {
    enabled: string[];
    disabled: string[];
    custom: ModuleConfig[];
  };
  
  // Feature Flags
  features: {
    [key: string]: boolean;
  };
  
  // Workflows
  workflows: {
    custom: WorkflowDefinition[];
    overrides: WorkflowOverride[];
  };
  
  // Pricing
  pricing: {
    plan: string;
    modules: ModulePricing[];
    users: UserPricing[];
    branches: BranchPricing[];
  };
}
```

---

### **Phase 3: Module Registry & Dynamic Loading (Weeks 9-12)**

#### **3.1 Module Registry System**
```typescript
@Injectable()
export class ModuleRegistryService {
  private modules = new Map<string, IAdrineModule>();
  private tenantModules = new Map<string, Set<string>>();
  
  async registerModule(module: IAdrineModule): Promise<void> {
    this.modules.set(module.id, module);
  }
  
  async enableModuleForTenant(tenantId: string, moduleId: string): Promise<void> {
    if (!this.tenantModules.has(tenantId)) {
      this.tenantModules.set(tenantId, new Set());
    }
    
    const module = this.modules.get(moduleId);
    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }
    
    // Check dependencies
    await this.checkDependencies(tenantId, module);
    
    // Initialize module for tenant
    const tenantConfig = await this.tenantService.getConfig(tenantId);
    await module.init(tenantConfig);
    
    // Register routes and event handlers
    this.registerModuleRoutes(module, tenantId);
    module.registerEventHandlers(this.eventBus);
    
    // Track enabled modules
    this.tenantModules.get(tenantId)!.add(moduleId);
  }
  
  async getTenantModules(tenantId: string): Promise<IAdrineModule[]> {
    const enabledIds = this.tenantModules.get(tenantId) || new Set();
    return Array.from(enabledIds)
      .map(id => this.modules.get(id))
      .filter(Boolean) as IAdrineModule[];
  }
}
```

#### **3.2 Dynamic Route Loading**
```typescript
// Next.js Dynamic Routes
export default async function ModuleRoutes({ params }: { params: { tenant: string } }) {
  const tenantId = params.tenant;
  const modules = await moduleRegistry.getTenantModules(tenantId);
  
  const routes = modules.flatMap(module => module.getRoutes());
  
  return (
    <>
      {routes.map(route => (
        <Route key={route.path} path={route.path} component={route.component} />
      ))}
    </>
  );
}
```

---

### **Phase 4: Feature Flag System (Weeks 13-14)**

#### **4.1 Feature Flag Engine**
```typescript
interface FeatureFlag {
  tenantId: string;
  key: string;
  enabled: boolean;
  conditions?: FlagCondition[];
  rolloutPercentage?: number;
}

@Injectable()
export class FeatureFlagService {
  async isEnabled(tenantId: string, featureKey: string, context?: any): Promise<boolean> {
    const flag = await this.getFlag(tenantId, featureKey);
    
    if (!flag) return false;
    
    // Check conditions
    if (flag.conditions) {
      return this.evaluateConditions(flag.conditions, context);
    }
    
    // Check rollout percentage
    if (flag.rolloutPercentage) {
      return this.isInRollout(tenantId, flag.rolloutPercentage);
    }
    
    return flag.enabled;
  }
}
```

#### **4.2 Feature Flag Usage**
```typescript
// In module code
if (await this.featureFlagService.isEnabled(tenantId, 'feature.ipd')) {
  // Enable IPD functionality
  return this.ipdService.getAdmissions(tenantId);
} else {
  throw new ForbiddenException('IPD module not enabled');
}
```

---

### **Phase 5: Configuration Engine (Weeks 15-16)**

#### **5.1 Dynamic Form Builder**
```typescript
interface DynamicForm {
  id: string;
  title: string;
  fields: FormField[];
  validations: ValidationRule[];
  workflows: WorkflowTrigger[];
}

@Injectable()
export class FormBuilderService {
  async createForm(tenantId: string, formConfig: DynamicForm): Promise<DynamicForm> {
    // Validate form configuration
    this.validateFormConfig(formConfig);
    
    // Store form configuration
    return this.configService.saveForm(tenantId, formConfig);
  }
  
  async renderForm(formId: string, tenantId: string): Promise<React.ComponentType> {
    const form = await this.getForm(formId, tenantId);
    return this.generateFormComponent(form);
  }
}
```

#### **5.2 Workflow Builder**
```typescript
interface WorkflowBuilder {
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  escalations: EscalationRule[];
}

@Injectable()
export class WorkflowBuilderService {
  async createWorkflow(tenantId: string, workflow: WorkflowBuilder): Promise<void> {
    // Compile workflow into executable state machine
    const stateMachine = this.compileWorkflow(workflow);
    
    // Register with workflow engine
    await this.workflowEngine.register(tenantId, stateMachine);
  }
}
```

---

### **Phase 6: White-Label System (Weeks 17-18)**

#### **6.1 Theme Engine**
```typescript
interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  logo: string;
  favicon: string;
  customCSS?: string;
}

@Injectable()
export class ThemeService {
  async getTenantTheme(tenantId: string): Promise<ThemeConfig> {
    const config = await this.tenantService.getConfig(tenantId);
    return config.branding.theme;
  }
  
  applyTheme(theme: ThemeConfig): void {
    // Apply CSS variables
    document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
    document.documentElement.style.setProperty('--secondary-color', theme.secondaryColor);
    
    // Update logo and favicon
    this.updateLogo(theme.logo);
    this.updateFavicon(theme.favicon);
    
    // Apply custom CSS
    if (theme.customCSS) {
      this.injectCustomCSS(theme.customCSS);
    }
  }
}
```

#### **6.2 Dynamic Branding**
```typescript
// Middleware to apply tenant branding
export async function applyTenantBranding(req: Request, res: Response, next: NextFunction) {
  const tenantId = req['tenantId'];
  const theme = await themeService.getTenantTheme(tenantId);
  
  // Add theme to response locals
  res.locals.theme = theme;
  
  next();
}
```

---

### **Phase 7: Pricing Architecture (Weeks 19-20)**

#### **7.1 Pricing Engine**
```typescript
interface PricingPlan {
  id: string;
  name: string;
  basePrice: number;
  modules: ModulePricing[];
  userTiers: UserTier[];
  branchPricing: BranchPricing;
  usagePricing?: UsagePricing[];
}

interface ModulePricing {
  moduleId: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  included: boolean;
}

@Injectable()
export class PricingService {
  async calculateTenantPricing(tenantId: string): Promise<PricingCalculation> {
    const config = await this.tenantService.getConfig(tenantId);
    const plan = await this.getPlan(config.pricing.plan);
    
    let totalPrice = plan.basePrice;
    
    // Add module pricing
    for (const modulePricing of plan.modules) {
      if (config.modules.enabled.includes(modulePricing.moduleId)) {
        totalPrice += modulePricing.price;
      }
    }
    
    // Add user pricing
    const userCount = await this.getUserCount(tenantId);
    totalPrice += this.calculateUserPricing(plan.userTiers, userCount);
    
    // Add branch pricing
    const branchCount = await this.getBranchCount(tenantId);
    totalPrice += branchCount * plan.branchPricing.price;
    
    return {
      basePrice: plan.basePrice,
      modulePrice: totalPrice - plan.basePrice,
      totalPrice,
      currency: 'USD'
    };
  }
}
```

---

## **🔧 Implementation Details**

### **Database Schema for Multi-Tenancy**
```sql
-- Tenant Management
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tenant Configurations
CREATE TABLE tenant_configurations (
  tenant_id UUID REFERENCES tenants(id),
  config_key VARCHAR(255) NOT NULL,
  config_value JSONB NOT NULL,
  PRIMARY KEY (tenant_id, config_key)
);

-- Module Registry
CREATE TABLE modules (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  version VARCHAR(20) NOT NULL,
  dependencies TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tenant Modules
CREATE TABLE tenant_modules (
  tenant_id UUID REFERENCES tenants(id),
  module_id VARCHAR(100) REFERENCES modules(id),
  enabled BOOLEAN DEFAULT true,
  config JSONB,
  PRIMARY KEY (tenant_id, module_id)
);

-- Feature Flags
CREATE TABLE feature_flags (
  tenant_id UUID REFERENCES tenants(id),
  feature_key VARCHAR(255) NOT NULL,
  enabled BOOLEAN DEFAULT false,
  conditions JSONB,
  rollout_percentage INTEGER,
  PRIMARY KEY (tenant_id, feature_key)
);
```

### **Frontend Module Loading**
```typescript
// Dynamic module loading in React
const ModuleLoader = ({ tenantId, moduleId }: { tenantId: string; moduleId: string }) => {
  const [ModuleComponent, setModuleComponent] = useState<React.ComponentType | null>(null);
  
  useEffect(() => {
    const loadModule = async () => {
      try {
        const module = await import(`../modules/${moduleId}/${moduleId}Component`);
        setModuleComponent(() => module.default);
      } catch (error) {
        console.error(`Failed to load module ${moduleId}:`, error);
      }
    };
    
    loadModule();
  }, [moduleId]);
  
  if (!ModuleComponent) return <div>Loading module...</div>;
  
  return <ModuleComponent tenantId={tenantId} />;
};
```

---

## **📊 Migration Timeline**

| Week | Phase | Key Deliverables |
|------|-------|------------------|
| 1-4 | Core Extraction | Core platform services, module interfaces |
| 5-8 | Multi-Tenant | Database schema, tenant middleware, isolation |
| 9-12 | Module Registry | Dynamic loading, route registration |
| 13-14 | Feature Flags | Flag engine, conditional features |
| 15-16 | Config Engine | Form builder, workflow builder |
| 17-18 | White-Label | Theme engine, branding system |
| 19-20 | Pricing | Flexible pricing architecture |
| 21-24 | Testing & Migration | Comprehensive testing, pilot migration |

---

## **🎯 Success Metrics**

### **Technical Metrics**
- **Module Loading Time**: <200ms
- **Tenant Isolation**: 100% data separation
- **Configuration Flexibility**: 95% customizable without code
- **White-Label Deployment**: <5 minutes per tenant

### **Business Metrics**
- **Onboarding Speed**: 80% reduction (weeks → hours)
- **Engineering Efficiency**: 60% reduction in custom work
- **Market Expansion**: Support 10x more hospital types
- **Revenue Growth**: 3x pricing flexibility

---

## **🚀 Immediate Next Steps**

### **Week 1 Actions**
1. **Audit current codebase** for core vs module separation
2. **Set up new folder structure** for modular architecture
3. **Define module interfaces** and lifecycle hooks
4. **Create tenant management** database schema

### **Week 2 Actions**
1. **Extract identity service** into core platform
2. **Implement tenant context middleware**
3. **Build module registry** foundation
4. **Create feature flag** basic implementation

### **Week 3 Actions**
1. **Migrate one module** (e.g., OPD) to new architecture
2. **Test multi-tenant isolation**
3. **Implement dynamic route loading**
4. **Create tenant configuration** system

---

## **⚠️ Critical Success Factors**

1. **Clean Separation**: Core platform must never have tenant-specific logic
2. **Module Independence**: Modules must communicate via events only
3. **Configuration-Driven**: No hardcoded business logic
4. **Tenant Isolation**: 100% data and security separation
5. **Backward Compatibility**: Smooth migration from current demo

---

## **🎉 Expected Outcome**

After this migration, Adrine will be:

✅ **Truly Multi-Tenant**: One platform, infinite hospitals  
✅ **Modular**: Enable/disable features per tenant  
✅ **Configurable**: Admins customize without engineering  
✅ **White-Label**: Complete branding control  
✅ **Scalable**: From 20-bed clinic to 2000-bed chain  
✅ **Enterprise-Ready**: Security, compliance, performance  

**This transforms Adrine from a hospital software into a healthcare infrastructure platform!** 🚀

---

*The key is to think like AWS or Shopify - build infrastructure that others can build upon, not just a single application.*
