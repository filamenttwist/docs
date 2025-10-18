# Creating Addons

Addons are the building blocks of a Filament Twist application. Each addon is a self-contained module that can include resources, migrations, routes, and more.

## Addon Structure

A typical addon structure looks like this:

```
app/Addons/UserManagement/
├── twist.php              # Addon definition
├── Resources/
│   └── UserResource.php
├── Migrations/
│   └── 2024_01_01_create_users_table.php
├── Routes/
│   └── api.php
└── Services/
    └── UserService.php
```

## Creating Your First Addon

### 1. Generate Addon Structure

Use the Twist make command to create a new addon:

```bash
# Create a simple addon
php artisan twist:make UserManagement

# Create an addon in a specific group (for LEVELTWO pools)
php artisan twist:make UserManagement --group=Core

# Create addon in all configured pools
php artisan twist:make UserManagement --all
```

### 2. Define the Addon

Edit the generated `twist.php` file:

```php
<?php

use Twist\Addons\AddonRegistrar;
use App\Addons\UserManagement\UserManagementAddon;

AddonRegistrar::register(
    name: 'user-management',
    path: UserManagementAddon::class,
    panels: ['admin'] // Specify which panels this addon applies to
);
```

### 3. Create the Addon Class

Create your addon class extending `BaseAddon`:

```php
<?php

namespace App\Addons\UserManagement;

use Twist\Base\BaseAddon;
use Twist\Contracts\HasMigration;
use Twist\Contracts\HasRouteApi;
use Filament\Panel;

class UserManagementAddon extends BaseAddon implements HasMigration, HasRouteApi
{
    public function getId(): string
    {
        return 'user-management';
    }

    public function boot(Panel $panel): void
    {
        // Register resources
        $panel->resources([
            Resources\UserResource::class,
        ]);
    }

    public function pathMigrations(): string
    {
        return __DIR__ . '/Migrations';
    }

    public function pathRouteApi(): string
    {
        return __DIR__ . '/Routes/api.php';
    }
}
```

## Addon Interfaces

Twist provides several interfaces to extend addon functionality:

### HasMigration

Allows your addon to provide its own migrations:

```php
use Twist\Contracts\HasMigration;

class MyAddon extends BaseAddon implements HasMigration
{
    public function pathMigrations(): string
    {
        return __DIR__ . '/Migrations';
    }
}
```

### HasRouteApi

Enables API routes for your addon:

```php
use Twist\Contracts\HasRouteApi;

class MyAddon extends BaseAddon implements HasRouteApi
{
    public function pathRouteApi(): string
    {
        return __DIR__ . '/Routes/api.php';
    }
}
```

### HasDispatcher

Integrates with the Laravel Executor package for background processing:

```php
use Twist\Contracts\HasDispatcher;

class MyAddon extends BaseAddon implements HasDispatcher
{
    public function pathDispatchers(): string
    {
        return __DIR__ . '/Dispatchers';
    }
}
```

### HasHooks

Allows your addon to register hooks in the application lifecycle:

```php
use Twist\Contracts\HasHooks;

class MyAddon extends BaseAddon implements HasHooks
{
    public function hooks(): void
    {
        // Register your hooks here
        add_action('twist.user.created', [$this, 'onUserCreated']);
    }

    public function onUserCreated($user)
    {
        // Handle user creation
    }
}
```

## Addon Configuration

### Panel Specific Addons

You can configure addons to only load on specific panels:

```php
AddonRegistrar::register(
    name: 'admin-tools',
    path: AdminToolsAddon::class,
    panels: ['admin'] // Only load on admin panel
);

AddonRegistrar::register(
    name: 'public-api',
    path: PublicApiAddon::class,
    panels: ['api', 'admin'] // Load on multiple panels
);
```

### Conditional Loading

Use the addon system to conditionally load features:

```php
class AdvancedFeatureAddon extends BaseAddon
{
    public function boot(Panel $panel): void
    {
        if (config('app.features.advanced_mode')) {
            $panel->resources([
                AdvancedResource::class,
            ]);
        }
    }
}
```

## Managing Addons

### Setup Addons

Register all discovered addons:

```bash
php artisan twist:setup
```

### Enable/Disable Addons

```bash
# Disable an addon
php artisan twist:setup:disable user-management

# Enable an addon
php artisan twist:setup:enable user-management
```

### Clear Addon Cache

```bash
php artisan twist:setup:clear
```

## Best Practices

1. **Keep addons focused**: Each addon should have a single responsibility
2. **Use proper namespacing**: Organize your addon classes in logical namespaces
3. **Implement interfaces**: Use the provided interfaces to integrate with Twist features
4. **Version your migrations**: Always use proper migration naming conventions
5. **Document your addons**: Include README files for complex addons

## Next Steps

- [Learn about multi-tenancy](./multi-tenancy.md)
- [Explore console commands](./console-commands.md)
- [Configure panels](./panel-configuration.md)