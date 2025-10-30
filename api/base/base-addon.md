# BaseAddon

The foundation class for all Filament Twist addons.

## Overview

`BaseAddon` provides the core structure for creating addons in Filament Twist. It implements the Filament Plugin interface and provides convenient methods for addon registration and management.

## Key Features

- **Service Container Integration**: Uses Laravel's service container for instantiation
- **Automatic ID Generation**: Generates addon ID from class name
- **Filament Plugin Interface**: Implements Filament's Plugin contract
- **Panel Boot Hook**: Override to register resources, pages, and widgets

## Basic Usage

### Simple Addon

```php
<?php

namespace App\Addons\UserManagement;

use Twist\Base\BaseAddon;
use Filament\Panel;

class UserManagementAddon extends BaseAddon
{
    public function getId(): string
    {
        return 'user-management';
    }

    public function boot(Panel $panel): void
    {
        $panel->resources([
            Resources\UserResource::class,
        ]);
    }
}
```

### Addon with Migrations

```php
<?php

namespace App\Addons\UserManagement;

use Twist\Base\BaseAddon;
use Twist\Contracts\HasMigration;
use Filament\Panel;

class UserManagementAddon extends BaseAddon implements HasMigration
{
    public function getId(): string
    {
        return 'user-management';
    }

    public function boot(Panel $panel): void
    {
        $panel->resources([
            Resources\UserResource::class,
        ])->pages([
            Pages\UserSettings::class,
        ])->widgets([
            Widgets\UserStatsWidget::class,
        ]);
    }

    public function pathMigrations(): string
    {
        return __DIR__ . '/Database/Migrations';
    }
}
```

### Addon with API Routes

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
        $panel->resources([
            Resources\UserResource::class,
        ]);
    }

    public function pathMigrations(): string
    {
        return __DIR__ . '/Database/Migrations';
    }

    public function pathRouteApi(): string
    {
        return __DIR__ . '/Routes/api.php';
    }
}
```

## Methods

### `make()`

Static factory method that creates an instance using Laravel's service container.

```php
public static function make(): static
```

**Returns**: `static` - Instance of the addon

**Example**:
```php
$addon = UserManagementAddon::make();
```

### `getId()`

Returns the unique identifier for the addon. By default, uses the class basename.

```php
public function getId(): string
```

**Returns**: `string` - Unique addon identifier

**Example**:
```php
public function getId(): string
{
    return 'user-management'; // Custom ID
}
```

### `boot()`

Called when the addon is being registered with a Filament panel. Override to register resources, pages, widgets, and middleware.

```php
public function boot(Panel $panel): void
```

**Parameters**:
- `$panel` - The Filament panel instance

**Example**:
```php
public function boot(Panel $panel): void
{
    $panel
        ->resources([
            Resources\UserResource::class,
            Resources\RoleResource::class,
        ])
        ->pages([
            Pages\UserSettings::class,
        ])
        ->widgets([
            Widgets\UserStatsWidget::class,
        ])
        ->middleware([
            Middleware\CheckUserPermissions::class,
        ]);
}
```

## Interfaces

### Common Interfaces

Addons commonly implement these interfaces to provide additional functionality:

#### HasMigration

```php
use Twist\Contracts\HasMigration;

class MyAddon extends BaseAddon implements HasMigration
{
    public function pathMigrations(): string
    {
        return __DIR__ . '/Database/Migrations';
    }
}
```

#### HasRouteApi

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

#### HasSeed

```php
use Twist\Contracts\HasSeed;

class MyAddon extends BaseAddon implements HasSeed
{
    public function pathSeed(): string
    {
        return __DIR__ . '/Database/Seeders';
    }
}
```

## Registration

### Manual Registration

```php
// In a service provider
use App\Addons\UserManagement\UserManagementAddon;

$panel->plugin(UserManagementAddon::make());
```

### Automatic Discovery

Addons can be automatically discovered when placed in the configured addon paths:

```php
// config/twist.php
'addons' => [
    'paths' => [
        app_path('Addons'),
        base_path('packages/*/src/Addons'),
    ],
],
```

## Advanced Usage

### Conditional Registration

```php
public function boot(Panel $panel): void
{
    if (config('user-management.enabled')) {
        $panel->resources([
            Resources\UserResource::class,
        ]);
    }

    if (auth()->user()?->hasRole('admin')) {
        $panel->pages([
            Pages\AdminSettings::class,
        ]);
    }
}
```

### Environment-Specific Configuration

```php
public function boot(Panel $panel): void
{
    $resources = [Resources\UserResource::class];
    
    if (app()->environment('local', 'testing')) {
        $resources[] = Resources\TestUserResource::class;
    }
    
    $panel->resources($resources);
}
```

### Service Registration

```php
public function boot(Panel $panel): void
{
    // Register services
    $this->app->singleton(UserService::class);
    $this->app->bind(UserRepositoryInterface::class, UserRepository::class);
    
    // Register Filament components
    $panel->resources([
        Resources\UserResource::class,
    ]);
}
```

## Best Practices

### 1. Unique IDs

Always provide a unique ID for your addon:

```php
public function getId(): string
{
    return 'vendor-addon-name';
}
```

### 2. Interface Implementation

Implement relevant interfaces to declare addon capabilities:

```php
class MyAddon extends BaseAddon implements 
    HasMigration, 
    HasRouteApi, 
    HasSeed
{
    // Implementation
}
```

### 3. Resource Organization

Organize resources logically within the boot method:

```php
public function boot(Panel $panel): void
{
    // Core resources
    $panel->resources([
        Resources\UserResource::class,
        Resources\RoleResource::class,
    ]);
    
    // Admin-only resources
    if (auth()->user()?->hasRole('admin')) {
        $panel->resources([
            Resources\AdminResource::class,
        ]);
    }
    
    // Settings and configuration
    $panel->pages([
        Pages\SettingsPage::class,
    ]);
}
```

### 4. Dependency Management

Handle dependencies gracefully:

```php
public function boot(Panel $panel): void
{
    // Check if required services are available
    if (!class_exists(SomeRequiredClass::class)) {
        throw new Exception('Required dependency not found');
    }
    
    $panel->resources([
        Resources\UserResource::class,
    ]);
}
```

## Related Classes

- [BaseModel](./base-model) - For addon models
- [BaseService](./base-service) - For addon services
- [BaseAction](./base-action) - For addon actions
- [BaseMigration](./base-migration) - For addon migrations

## Next Steps

- [Learn about creating addons](../../guide/creating-addons)
- [Explore addon interfaces](../addon-interfaces)
- [See complete examples](../../examples/)