# Panel Configuration

Learn how to configure and customize Filament panels using Filament Twist's powerful configuration system.

## Basic Panel Setup

### Creating a Panel Provider

Create a panel provider that extends `TwistPanelProvider`:

```php
<?php

namespace App\Providers;

use Twist\Support\TwistPanelProvider;
use Twist\Classes\TwistClass;
use Filament\Support\Enums\Width;

class AdminPanelProvider extends TwistPanelProvider
{
    public function twist(TwistClass $twist): void
    {
        $twist
            ->setPath('admin')
            ->setColor('#0ea5e9')
            ->setDomain(null)
            ->setPrefixTable('app_');
    }
}
```

### Configuration Options

The `TwistClass` provides numerous configuration methods:

#### Basic Settings

```php
$twist
    ->setPath('admin')           // Panel URL path
    ->setColor('#0ea5e9')        // Primary color
    ->setDomain('admin.example.com') // Custom domain (null for main domain)
    ->setPrefixTable('app_');    // Database table prefix
```

#### Branding

```php
$twist
    ->setLogo(fn() => view('components.logo'))  // Custom logo
    ->setUploadDirectory('uploads/admin');      // Upload directory
```

#### Database Configuration

```php
$twist
    ->setConnection('admin_db')  // Custom database connection
    ->setPrefixTable('admin_');  // Table prefix
```

## Multi-Panel Configuration

### Configure Multiple Panels

In `config/twist.php`:

```php
<?php

return [
    'panels' => [
        'admin',      // Admin panel
        'api',        // API panel
        'customer',   // Customer portal
    ],
];
```

### Panel-Specific Providers

Create separate providers for each panel:

```php
// App\Providers\AdminPanelProvider
class AdminPanelProvider extends TwistPanelProvider
{
    public function twist(TwistClass $twist): void
    {
        $twist
            ->setPath('admin')
            ->setColor('#dc2626');
    }
}

// App\Providers\CustomerPanelProvider  
class CustomerPanelProvider extends TwistPanelProvider
{
    public function twist(TwistClass $twist): void
    {
        $twist
            ->setPath('customer')
            ->setColor('#059669');
    }
}
```

Register both providers in `config/app.php`:

```php
'providers' => [
    // ... other providers
    App\Providers\AdminPanelProvider::class,
    App\Providers\CustomerPanelProvider::class,
],
```

## Advanced Panel Features

### Custom Middleware

Add custom middleware to your panels:

```php
public function twist(TwistClass $twist): void
{
    $twist
        ->setPath('admin')
        ->setMiddleware(\App\Http\Middleware\AdminOnly::class)
        ->setMiddleware(\App\Http\Middleware\AuditLog::class);
}
```

### Navigation Customization

#### Cross-Panel Navigation

When multiple panels are configured, users get automatic navigation between panels:

```php
// This automatically adds menu items for panel switching
// when count(config('twist.panels')) > 1
```

#### Custom Navigation Items

Add custom navigation via the Filament panel configuration:

```php
public function panel(Panel $panel): Panel
{
    return parent::panel($panel)
        ->navigationItems([
            NavigationItem::make('Analytics')
                ->url('https://analytics.example.com')
                ->icon('heroicon-o-chart-bar')
                ->openUrlInNewTab(),
        ]);
}
```

### Custom Logo Implementation

Create a custom logo component:

```php
// resources/views/components/admin-logo.blade.php
<div class="flex items-center">
    <img src="{{ asset('images/admin-logo.png') }}" alt="Admin" class="h-8">
    <span class="ml-2 text-lg font-bold">Admin Panel</span>
</div>
```

Use it in your panel provider:

```php
public function twist(TwistClass $twist): void
{
    $twist->setLogo(fn() => view('components.admin-logo'));
}
```

## Panel Hooks and Extensions

### Using Render Hooks

Register custom render hooks for panels:

```php
use Twist\View\TwistView;

// In a service provider
public function boot()
{
    TwistView::registerRenderHook('admin.header', function () {
        return view('admin.components.custom-header');
    });
}
```

### Panel-Specific Addons

Configure addons to load only on specific panels:

```php
// In your addon registration
AddonRegistrar::register(
    name: 'admin-tools',
    path: AdminToolsAddon::class,
    panels: ['admin'] // Only load on admin panel
);

AddonRegistrar::register(
    name: 'customer-portal',
    path: CustomerPortalAddon::class,
    panels: ['customer'] // Only load on customer panel
);
```

## Database and Connection Management

### Per-Panel Database Connections

Configure different database connections for different panels:

```php
// config/database.php
'connections' => [
    'admin' => [
        'driver' => 'mysql',
        'host' => env('ADMIN_DB_HOST', '127.0.0.1'),
        'database' => env('ADMIN_DB_DATABASE', 'admin'),
        // ... other config
    ],
    'customer' => [
        'driver' => 'mysql', 
        'host' => env('CUSTOMER_DB_HOST', '127.0.0.1'),
        'database' => env('CUSTOMER_DB_DATABASE', 'customer'),
        // ... other config
    ],
];
```

Use in panel providers:

```php
// Admin panel uses admin database
public function twist(TwistClass $twist): void
{
    $twist
        ->setPath('admin')
        ->setConnection('admin');
}

// Customer panel uses customer database  
public function twist(TwistClass $twist): void
{
    $twist
        ->setPath('customer')
        ->setConnection('customer');
}
```

### Table Prefixes

Use different table prefixes for logical separation:

```php
public function twist(TwistClass $twist): void
{
    $twist
        ->setPath('admin')
        ->setPrefixTable('admin_');
}
```

This affects:

- Twist internal tables (`admin_twist_addons`)
- BaseModel classes in your addons
- Migration table naming

## Panel Security

### Authentication Middleware

Panels automatically include authentication middleware, but you can customize:

```php
public function panel(Panel $panel): Panel
{
    return parent::panel($panel)
        ->authMiddleware([
            \Filament\Http\Middleware\Authenticate::class,
            \App\Http\Middleware\AdminOnly::class,
        ]);
}
```

### Domain-Based Security

Use different domains for different security contexts:

```php
// Admin on secure subdomain
public function twist(TwistClass $twist): void
{
    $twist
        ->setPath('admin')
        ->setDomain('secure.example.com');
}

// Customer portal on main domain
public function twist(TwistClass $twist): void
{
    $twist
        ->setPath('portal')
        ->setDomain(null); // Main domain
}
```

## Performance Optimization

### Conditional Addon Loading

Optimize performance by loading addons conditionally:

```php
public function twist(TwistClass $twist): void
{
    if (app()->environment('production')) {
        $twist->disloadSetupAddons(); // Skip addon scanning in production
    }
    
    $twist->setPath('admin');
}
```

### Upload Directory Configuration

Configure optimized upload handling:

```php
public function twist(TwistClass $twist): void
{
    $twist->setUploadDirectory(
        storage_path('app/uploads/' . $twist->getPath())
    );
}
```

## Debugging Panel Configuration

### Panel Information

Get current panel configuration:

```php
use Twist\Facades\Twist;

// In tinker or a controller
Twist::getPath();        // Current path
Twist::getColor();       // Current color
Twist::getDomain();      // Current domain
Twist::getAddons();      // Loaded addons
```

### Development Helpers

Create a debug route for development:

```php
// routes/web.php (development only)
if (app()->environment('local')) {
    Route::get('/debug/panel', function () {
        return [
            'path' => Twist::getPath(),
            'color' => Twist::getColor(),
            'domain' => Twist::getDomain(),
            'addons' => collect(Twist::getAddons())->map->getId(),
            'panels' => config('twist.panels'),
        ];
    });
}
```

## Best Practices

1. **Separate concerns**: Use different panels for different user types
2. **Consistent naming**: Use clear, descriptive panel paths
3. **Security first**: Configure appropriate authentication and middleware
4. **Performance**: Use conditional addon loading in production
5. **Documentation**: Document your panel configuration for team members

## Example: Complete Multi-Panel Setup

```php
// config/twist.php
return [
    'panels' => ['admin', 'manager', 'customer'],
];

// App\Providers\AdminPanelProvider
class AdminPanelProvider extends TwistPanelProvider
{
    public function twist(TwistClass $twist): void
    {
        $twist
            ->setPath('admin')
            ->setColor('#dc2626')
            ->setDomain('admin.example.com')
            ->setPrefixTable('admin_')
            ->setMiddleware(\App\Http\Middleware\SuperAdminOnly::class);
    }
}

// App\Providers\ManagerPanelProvider
class ManagerPanelProvider extends TwistPanelProvider
{
    public function twist(TwistClass $twist): void
    {
        $twist
            ->setPath('manager')
            ->setColor('#0ea5e9')
            ->setPrefixTable('mgr_')
            ->setMiddleware(\App\Http\Middleware\ManagerOnly::class);
    }
}

// App\Providers\CustomerPanelProvider
class CustomerPanelProvider extends TwistPanelProvider
{
    public function twist(TwistClass $twist): void
    {
        $twist
            ->setPath('customer')
            ->setColor('#059669')
            ->setPrefixTable('cust_')
            ->setMiddleware(\App\Http\Middleware\CustomerOnly::class);
    }
}
```

## Next Steps

- [API reference](../api/twist-class.md)
- [Configuration reference](./configuration.md)