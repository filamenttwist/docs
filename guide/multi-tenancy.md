# Multi-Tenancy

Filament Twist provides built-in multi-tenancy support with database isolation drivers, making it easy to build SaaS applications where each tenant has their own isolated data.

## Overview

The multi-tenancy system in Twist provides:

- **Database Isolation**: Each tenant gets their own database or database connection
- **Automatic Migration**: Tenant databases are automatically migrated
- **Driver Architecture**: Pluggable isolation drivers for different tenancy strategies
- **Tenant Management**: Easy tenant creation, migration, and management

## Configuration

### Tenancy Configuration

Configure tenancy in `config/tenancy.php`:

```php
<?php

return [
    // Isolation drivers mapping (name => class)
    'drivers' => [
        'multi' => \Twist\Tenancy\Drivers\MultiTenantDriver::class,
    ],

    // Default driver name
    'default_driver' => env('OBELAW_TENANCY_DRIVER', 'multi'),

    // Tenant resolver callback (optional)
    'tenant_resolver' => null,
];
```

### Environment Variables

Add these environment variables to your `.env` file:

```env
OBELAW_TENANCY_DRIVER=multi
```

## Tenant Model

Create a Tenant model in your application:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    protected $fillable = [
        'name',
        'database',
        'domain',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
```

## Using the Tenancy System

### Basic Tenant Operations

```php
use Twist\Facades\Tenancy;
use Twist\Tenancy\DTO\TenantDTO;

// Create a tenant DTO
$tenant = new TenantDTO(
    id: 1,
    database: 'tenant_1',
    attributes: ['name' => 'Acme Corp']
);

// Initialize tenant context
Tenancy::initialize($tenant);

// Your code here runs in tenant context
// All database operations will use the tenant's database

// End tenant context
Tenancy::end();
```

### Tenant Migration

Migrate a specific tenant:

```php
use Twist\Facades\Tenancy;
use Twist\Tenancy\DTO\TenantDTO;

$tenant = new TenantDTO(id: 1, database: 'tenant_1');

// Migrate with specific paths
Tenancy::migrate($tenant, [
    database_path('migrations'),
    app_path('Addons/UserManagement/Migrations'),
]);
```

### Using the Service

Use the migration service for more complex operations:

```php
use App\Models\Tenant;
use Twist\Services\Tenancy\MigrateTenancyService;

$tenant = Tenant::find(1);
MigrateTenancyService::make()->migrateAddons($tenant);
```

## Console Commands

### Migrate All Tenants

Migrate all tenants at once:

```bash
php artisan twist:tenancy:migrate
```

This command will:
1. Find all tenants in your application
2. Create their databases if they don't exist
3. Run all addon migrations for each tenant

### Custom Tenant Migration

Create a custom command for tenant-specific operations:

```php
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Tenant;
use Twist\Services\Tenancy\MigrateTenancyService;

class MigrateTenantCommand extends Command
{
    protected $signature = 'tenant:migrate {tenant}';
    protected $description = 'Migrate a specific tenant';

    public function handle()
    {
        $tenantId = $this->argument('tenant');
        $tenant = Tenant::find($tenantId);
        
        if (!$tenant) {
            $this->error("Tenant {$tenantId} not found");
            return;
        }
        
        $this->info("Migrating tenant: {$tenant->name}");
        MigrateTenancyService::make()->migrateAddons($tenant);
        $this->info("Migration completed");
    }
}
```

## Addon Integration

### Making Addons Tenant-Aware

Addons can provide their own migrations for tenants:

```php
<?php

namespace App\Addons\TenantSpecific;

use Twist\Base\BaseAddon;
use Twist\Contracts\HasMigration;

class TenantSpecificAddon extends BaseAddon implements HasMigration
{
    public function pathMigrations(): string
    {
        return __DIR__ . '/Migrations';
    }
}
```

### Tenant-Specific Resources

Create Filament resources that are tenant-aware:

```php
<?php

namespace App\Addons\TenantSpecific\Resources;

use Filament\Resources\Resource;
use Twist\Tenancy\Concerns\HasDBTenancy;

class TenantUserResource extends Resource
{
    use HasDBTenancy;
    
    protected static ?string $model = TenantUser::class;
    
    // Resource definition...
}
```

## Database Isolation Drivers

### MultiTenantDriver

The default driver creates separate databases for each tenant:

```php
<?php

namespace Twist\Tenancy\Drivers;

use Twist\Tenancy\Contracts\IsolationDriver;
use Twist\Tenancy\DTO\TenantDTO;

class MultiTenantDriver implements IsolationDriver
{
    public function boot(TenantDTO $tenant): void
    {
        // Switch to tenant database connection
    }
    
    public function end(): void
    {
        // Restore default connection
    }
    
    public function migrate(TenantDTO $tenant, array $paths = []): void
    {
        // Run migrations for tenant
    }
    
    public function seed(TenantDTO $tenant, array $seeders = []): void
    {
        // Run seeders for tenant
    }
}
```

### Custom Drivers

Create custom isolation drivers for different tenancy strategies:

```php
<?php

namespace App\Tenancy\Drivers;

use Twist\Tenancy\Contracts\IsolationDriver;
use Twist\Tenancy\DTO\TenantDTO;

class SchemaDriver implements IsolationDriver
{
    public function boot(TenantDTO $tenant): void
    {
        // Switch to tenant schema
        DB::statement("SET search_path TO tenant_{$tenant->id}");
    }
    
    // Implement other methods...
}
```

Register your custom driver:

```php
// In config/tenancy.php
'drivers' => [
    'multi' => \Twist\Tenancy\Drivers\MultiTenantDriver::class,
    'schema' => \App\Tenancy\Drivers\SchemaDriver::class,
],
```

## Best Practices

1. **Always use TenantDTO**: Use the provided DTO for consistent tenant representation
2. **Clean up contexts**: Always call `Tenancy::end()` to avoid connection leaks
3. **Test tenant isolation**: Ensure your application properly isolates tenant data
4. **Migration rollback strategy**: Plan for migration rollbacks in multi-tenant environments
5. **Performance considerations**: Monitor database connection usage with many tenants

## Advanced Usage

### Tenant Context Middleware

Create middleware to automatically set tenant context:

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Twist\Facades\Tenancy;
use Twist\Tenancy\DTO\TenantDTO;

class SetTenantContext
{
    public function handle($request, Closure $next)
    {
        $subdomain = explode('.', $request->getHost())[0];
        $tenant = Tenant::where('subdomain', $subdomain)->first();
        
        if ($tenant) {
            $tenantDTO = new TenantDTO(
                id: $tenant->id,
                database: $tenant->database
            );
            
            Tenancy::initialize($tenantDTO);
        }
        
        $response = $next($request);
        
        Tenancy::end();
        
        return $response;
    }
}
```

## Next Steps

- [Explore console commands](./console-commands)
- [Configure panels](./panel-configuration)
- [API reference](../api/tenancy)