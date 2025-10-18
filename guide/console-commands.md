# Console Commands

Filament Twist provides a comprehensive set of Artisan commands to manage your application's addons, tenants, and overall system.

## Addon Management Commands

### twist:setup

Scans for and registers all discovered addons:

```bash
php artisan twist:setup
```

This command:

- Scans all configured addon pool paths
- Registers addons found in the database
- Updates addon metadata

### twist:setup:addon

Manually register a specific addon:

```bash
php artisan twist:setup:addon {id} {pointer}
```

**Parameters:**
- `id`: Unique identifier for the addon
- `pointer`: Class path to the addon

**Example:**
```bash
php artisan twist:setup:addon user-management "App\\Addons\\UserManagement\\UserManagementAddon"
```

### twist:setup:enable

Enable a disabled addon:

```bash
php artisan twist:setup:enable {addon}
```

**Example:**
```bash
php artisan twist:setup:enable user-management
```

### twist:setup:disable

Disable an active addon:

```bash
php artisan twist:setup:disable {addon}
```

**Example:**
```bash
php artisan twist:setup:disable user-management
```

### twist:setup:clear

Clear all addon registrations (with confirmation):

```bash
php artisan twist:setup:clear
```

This command will prompt for confirmation before clearing all addon data.

## Addon Creation Commands

### twist:make

Generate a new addon structure:

```bash
php artisan twist:make {folder} [options]
```

**Parameters:**
- `folder`: Name of the addon folder to create

**Options:**
- `--all`: Create the addon in all configured pool paths
- `--group=`: Specify parent folder for LEVELTWO pools

**Examples:**
```bash
# Create a simple addon
php artisan twist:make UserManagement

# Create addon in a specific group
php artisan twist:make UserManagement --group=Core

# Create addon in all pools
php artisan twist:make UserManagement --all
```

The command creates:
- Addon folder structure
- Base `twist.php` configuration file
- Skeleton addon class

## Migration Commands

### twist:migrate

Run migrations for all registered addons:

```bash
php artisan twist:migrate [options]
```

**Options:**
- `--rollback` or `-r`: Rollback migrations instead of running them

**Examples:**
```bash
# Run all addon migrations
php artisan twist:migrate

# Rollback addon migrations
php artisan twist:migrate --rollback
```

This command:

- Loads all registered addons
- Discovers migration paths from addons implementing `HasMigration`
- Runs Laravel migrations for all discovered paths

## Tenancy Commands

### twist:tenancy:migrate

Migrate all tenants in the system:

```bash
php artisan twist:tenancy:migrate
```

This command:

- Retrieves all tenants from the database
- Creates tenant databases if they don't exist
- Runs all addon migrations for each tenant
- Provides progress feedback

## Command Examples

### Setting Up a New Environment

```bash
# 1. Set up addon pools and scan for addons
php artisan twist:setup

# 2. Run main application migrations
php artisan migrate

# 3. Run addon-specific migrations
php artisan twist:migrate

# 4. If using tenancy, migrate all tenants
php artisan twist:tenancy:migrate
```

### Developing New Addons

```bash
# 1. Create addon structure
php artisan twist:make MyNewAddon --group=Features

# 2. Register the addon after creating the class
php artisan twist:setup

# 3. Run migrations if the addon has any
php artisan twist:migrate
```

### Managing Addon States

```bash
# Check current addon status (via database)
php artisan tinker
> \Twist\Models\Addon::all(['id', 'is_active']);

# Disable problematic addon
php artisan twist:setup:disable problematic-addon

# Re-enable when fixed
php artisan twist:setup:enable problematic-addon
```

### Debugging Addon Issues

```bash
# Clear addon cache and re-scan
php artisan twist:setup:clear
php artisan twist:setup

# Check if migrations are needed
php artisan twist:migrate --dry-run

# Rollback if something went wrong
php artisan twist:migrate --rollback
```

## Command Workflows

### Production Deployment

```bash
#!/bin/bash
# deployment-script.sh

# Update composer dependencies
composer install --no-dev --optimize-autoloader

# Run main migrations
php artisan migrate --force

# Setup addons
php artisan twist:setup

# Run addon migrations
php artisan twist:migrate

# Migrate tenants (if applicable)
php artisan twist:tenancy:migrate

# Clear caches
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Development Environment Setup

```bash
#!/bin/bash
# setup-dev.sh

# Install dependencies
composer install

# Setup environment
cp .env.example .env
php artisan key:generate

# Run basic migrations
php artisan migrate

# Setup Twist addons
php artisan twist:setup
php artisan twist:migrate

# Setup test tenants (if applicable)
php artisan db:seed --class=TenantSeeder
php artisan twist:tenancy:migrate
```

## Creating Custom Commands

You can create custom commands that integrate with Twist:

```php
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Twist\Facades\Twist;
use Twist\Models\Addon;

class AddonStatusCommand extends Command
{
    protected $signature = 'twist:status {--addon= : Check specific addon}';
    protected $description = 'Show addon status information';

    public function handle()
    {
        $addonId = $this->option('addon');
        
        if ($addonId) {
            $this->showAddonStatus($addonId);
        } else {
            $this->showAllAddonsStatus();
        }
    }
    
    private function showAddonStatus($addonId)
    {
        $addon = Addon::find($addonId);
        
        if (!$addon) {
            $this->error("Addon '{$addonId}' not found");
            return;
        }
        
        $this->info("Addon: {$addon->id}");
        $this->line("Status: " . ($addon->is_active ? 'Active' : 'Disabled'));
        $this->line("Class: {$addon->pointer}");
        $this->line("Panels: " . implode(', ', $addon->panels ?? []));
    }
    
    private function showAllAddonsStatus()
    {
        $addons = Addon::all();
        
        $headers = ['ID', 'Status', 'Panels'];
        $rows = $addons->map(function ($addon) {
            return [
                $addon->id,
                $addon->is_active ? '✅ Active' : '❌ Disabled',
                implode(', ', $addon->panels ?? [])
            ];
        });
        
        $this->table($headers, $rows);
    }
}
```

## Best Practices

1. **Use setup commands in deployment**: Always run `twist:setup` after deploying new code
2. **Test migrations locally**: Use development environments to test addon migrations
3. **Monitor command output**: Commands provide detailed feedback - review for errors
4. **Backup before rollbacks**: Always backup before running migration rollbacks
5. **Use confirmation prompts**: The clear command includes confirmation for safety

## Troubleshooting

### Common Issues

**Addon not loading:**
```bash
# Re-scan for addons
php artisan twist:setup
```

**Migration errors:**
```bash
# Check migration status
php artisan migrate:status

# Rollback and retry
php artisan twist:migrate --rollback
php artisan twist:migrate
```

**Tenancy issues:**
```bash
# Check tenant database connections
php artisan tinker
> DB::connection('tenant_1')->getPdo();
```

## Next Steps

- [Configure panels](./panel-configuration)
- [API reference](../api/commands)
- [Deployment guide](./deployment)