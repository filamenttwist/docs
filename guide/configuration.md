# Configuration Reference

Complete reference for configuring Filament Twist in your Laravel application.

## Configuration Files

### config/twist.php

Main configuration file for Filament Twist:

```php
<?php

return [
    /**
     * Twist Panels
     * 
     * Define the panels that should be available in your application.
     * Each panel can have its own configuration and addons.
     */
    'panels' => [
        'admin',      // Admin panel at /admin
        'manager',    // Manager panel at /manager
        'customer',   // Customer panel at /customer
    ],

    /**
     * Addon Pool Paths
     * 
     * Define where addons are located. These paths will be scanned
     * for addon definitions during the setup process.
     */
    'addon_pools' => [
        [
            'path' => app_path('Addons'),
            'level' => \Twist\Addons\AddonsPool::LEVELTWO,
        ],
        [
            'path' => base_path('packages'),
            'level' => \Twist\Addons\AddonsPool::LEVELONE,
        ],
    ],

    /**
     * Default Settings
     */
    'defaults' => [
        'color' => '#FC4706',
        'table_prefix' => 'twist_',
        'upload_directory' => 'uploads',
    ],
];
```

### config/tenancy.php

Multi-tenancy configuration:

```php
<?php

return [
    /**
     * Isolation Drivers
     * 
     * Map of available isolation drivers for multi-tenancy.
     * You can add custom drivers here.
     */
    'drivers' => [
        'multi' => \Twist\Tenancy\Drivers\MultiTenantDriver::class,
        'schema' => \App\Tenancy\Drivers\SchemaDriver::class,
    ],

    /**
     * Default Driver
     * 
     * The default isolation driver to use when none is specified.
     */
    'default_driver' => env('TWIST_TENANCY_DRIVER', 'multi'),

    /**
     * Tenant Resolver
     * 
     * Callback to resolve the current tenant. Should return a tenant
     * model instance or null if no tenant is active.
     */
    'tenant_resolver' => null,

    /**
     * Database Settings
     */
    'database' => [
        'prefix' => env('TWIST_DB_PREFIX', 'tenant_'),
        'auto_create' => env('TWIST_AUTO_CREATE_DB', true),
    ],
];
```

## Environment Variables

### Core Settings

```env
# Application Environment
APP_ENV=local
APP_DEBUG=true

# Twist Configuration
TWIST_TENANCY_DRIVER=multi
TWIST_DB_PREFIX=tenant_
TWIST_AUTO_CREATE_DB=true

# Panel Domains (optional)
TWIST_ADMIN_DOMAIN=admin.example.com
TWIST_CUSTOMER_DOMAIN=portal.example.com
```

### Database Configuration

```env
# Main Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=twist_main
DB_USERNAME=root
DB_PASSWORD=

# Admin Panel Database (optional)
ADMIN_DB_HOST=127.0.0.1
ADMIN_DB_DATABASE=twist_admin
ADMIN_DB_USERNAME=root
ADMIN_DB_PASSWORD=

# Customer Panel Database (optional)
CUSTOMER_DB_HOST=127.0.0.1
CUSTOMER_DB_DATABASE=twist_customer
CUSTOMER_DB_USERNAME=root
CUSTOMER_DB_PASSWORD=
```

## Service Provider Configuration

### AppServiceProvider

Configure addon pools and basic settings:

```php
<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Twist\Addons\AddonsPool;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Configure addon pools
        AddonsPool::setPoolPath(app_path('Addons'));
        AddonsPool::setPoolPath(base_path('packages'), AddonsPool::LEVELONE);
        
        // Scan for addons
        if (!app()->runningInConsole() || app()->runningUnitTests()) {
            AddonsPool::scan();
        }
    }
}
```

### DatabaseServiceProvider

Configure multiple database connections:

```php
<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Config;

class DatabaseServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Admin database connection
        if (env('ADMIN_DB_DATABASE')) {
            Config::set('database.connections.admin', [
                'driver' => 'mysql',
                'host' => env('ADMIN_DB_HOST', '127.0.0.1'),
                'port' => env('ADMIN_DB_PORT', '3306'),
                'database' => env('ADMIN_DB_DATABASE'),
                'username' => env('ADMIN_DB_USERNAME'),
                'password' => env('ADMIN_DB_PASSWORD'),
                'charset' => 'utf8mb4',
                'collation' => 'utf8mb4_unicode_ci',
                'prefix' => '',
                'strict' => true,
                'engine' => null,
            ]);
        }

        // Customer database connection
        if (env('CUSTOMER_DB_DATABASE')) {
            Config::set('database.connections.customer', [
                'driver' => 'mysql',
                'host' => env('CUSTOMER_DB_HOST', '127.0.0.1'),
                'port' => env('CUSTOMER_DB_PORT', '3306'),
                'database' => env('CUSTOMER_DB_DATABASE'),
                'username' => env('CUSTOMER_DB_USERNAME'),
                'password' => env('CUSTOMER_DB_PASSWORD'),
                'charset' => 'utf8mb4',
                'collation' => 'utf8mb4_unicode_ci',
                'prefix' => '',
                'strict' => true,
                'engine' => null,
            ]);
        }
    }
}
```

## Panel Providers

### Basic Panel Provider

```php
<?php

namespace App\Providers;

use Twist\Support\TwistPanelProvider;
use Twist\Classes\TwistClass;

class AdminPanelProvider extends TwistPanelProvider
{
    public function twist(TwistClass $twist): void
    {
        $twist
            ->setPath('admin')
            ->setColor('#dc2626')
            ->setDomain(env('TWIST_ADMIN_DOMAIN'))
            ->setPrefixTable('admin_')
            ->setConnection('admin');
    }
}
```

### Advanced Panel Provider

```php
<?php

namespace App\Providers;

use Twist\Support\TwistPanelProvider;
use Twist\Classes\TwistClass;
use Filament\Panel;
use Filament\Navigation\NavigationItem;

class AdminPanelProvider extends TwistPanelProvider
{
    public function twist(TwistClass $twist): void
    {
        $twist
            ->setPath('admin')
            ->setColor('#dc2626')
            ->setDomain(env('TWIST_ADMIN_DOMAIN'))
            ->setPrefixTable('admin_')
            ->setConnection('admin')
            ->setUploadDirectory('uploads/admin')
            ->setLogo(fn() => view('components.admin-logo'));

        // Add custom middleware
        $twist->setMiddleware(\App\Http\Middleware\AdminOnly::class);
        $twist->setMiddleware(\App\Http\Middleware\AuditLog::class);

        // Disable addon loading in production for performance
        if (app()->environment('production')) {
            $twist->disloadSetupAddons();
        }
    }

    public function panel(Panel $panel): Panel
    {
        return parent::panel($panel)
            ->navigationItems([
                NavigationItem::make('System Health')
                    ->url('/admin/health')
                    ->icon('heroicon-o-heart')
                    ->group('System'),
                    
                NavigationItem::make('Logs')
                    ->url('/admin/logs')
                    ->icon('heroicon-o-document-text')
                    ->group('System'),
            ])
            ->globalSearchKeyBindings(['command+k', 'ctrl+k'])
            ->spa();
    }
}
```

## Middleware Configuration

### Custom Authentication Middleware

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AdminOnly
{
    public function handle(Request $request, Closure $next)
    {
        if (!auth()->check() || !auth()->user()->isAdmin()) {
            abort(403, 'Admin access required');
        }

        return $next($request);
    }
}
```

### Tenant Context Middleware

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Twist\Facades\Tenancy;
use Twist\Tenancy\DTO\TenantDTO;
use App\Models\Tenant;

class SetTenantContext
{
    public function handle(Request $request, Closure $next)
    {
        $subdomain = $this->getSubdomain($request);
        
        if ($subdomain && $subdomain !== 'www') {
            $tenant = Tenant::where('subdomain', $subdomain)->first();
            
            if ($tenant) {
                $tenantDTO = new TenantDTO(
                    id: $tenant->id,
                    database: $tenant->database,
                    attributes: $tenant->toArray()
                );
                
                Tenancy::initialize($tenantDTO);
            }
        }

        $response = $next($request);

        Tenancy::end();

        return $response;
    }

    private function getSubdomain(Request $request): ?string
    {
        $host = $request->getHost();
        $parts = explode('.', $host);
        
        return count($parts) > 2 ? $parts[0] : null;
    }
}
```

## Routing Configuration

### API Routes for Addons

Configure how addon API routes are loaded:

```php
<?php

// In RouteServiceProvider or a dedicated provider

use Twist\Facades\Twist;

public function boot(): void
{
    $this->configureRateLimiting();

    $this->routes(function () {
        // Standard Laravel routes
        Route::middleware('api')
            ->prefix('api')
            ->group(base_path('routes/api.php'));

        Route::middleware('web')
            ->group(base_path('routes/web.php'));

        // Load addon API routes
        $this->loadAddonApiRoutes();
    });
}

protected function loadAddonApiRoutes(): void
{
    $apiRoutes = Twist::getRoutesApi();
    
    foreach ($apiRoutes as $routeFile) {
        if (file_exists($routeFile)) {
            Route::middleware('api')
                ->prefix('api')
                ->group($routeFile);
        }
    }
}
```

## Addon Pool Configuration

### Multiple Pool Levels

```php
<?php

use Twist\Addons\AddonsPool;

// Level one: Direct addon folders
// packages/UserManagement/twist.php
AddonsPool::setPoolPath(
    base_path('packages'), 
    AddonsPool::LEVELONE
);

// Level two: Grouped addon folders  
// app/Addons/Core/UserManagement/twist.php
AddonsPool::setPoolPath(
    app_path('Addons'),
    AddonsPool::LEVELTWO
);

// Custom level pattern
AddonsPool::setPoolPath(
    base_path('custom/addons'),
    '/*/addon.php'  // Custom file pattern
);
```

### Dynamic Addon Loading

```php
<?php

use Twist\Addons\AddonRegistrar;

// Register addons dynamically
if (app()->environment('development')) {
    AddonRegistrar::register(
        name: 'debug-toolbar',
        path: \App\Addons\Debug\DebugAddon::class,
        panels: ['admin']
    );
}

// Conditional addon registration
if (config('features.user_management')) {
    AddonRegistrar::register(
        name: 'user-management',
        path: \App\Addons\UserManagement\UserManagementAddon::class,
        panels: ['admin', 'manager']
    );
}
```

## Performance Configuration

### Production Optimizations

```php
<?php

// In production environment
public function twist(TwistClass $twist): void
{
    // Disable addon scanning for performance
    $twist->disloadSetupAddons();
    
    // Use optimized settings
    $twist
        ->setPath('admin')
        ->setColor('#dc2626');
}
```

### Caching Configuration

```php
<?php

// Cache addon configurations
Cache::remember('twist.addons', 3600, function () {
    return Twist::getAddons();
});

// Cache panel configurations
Cache::remember('twist.panels', 3600, function () {
    return config('twist.panels');
});
```

## Testing Configuration

### Test Environment Settings

```php
<?php

// In TestCase.php or specific test
protected function setUp(): void
{
    parent::setUp();
    
    // Use in-memory database for tests
    Config::set('database.default', 'testing');
    
    // Disable addon loading for faster tests
    Config::set('twist.panels', ['test']);
    
    // Mock tenancy for tests
    $this->mockTenancy();
}

protected function mockTenancy(): void
{
    $mock = Mockery::mock(TenancyManager::class);
    $this->app->instance(TenancyManager::class, $mock);
}
```

## Security Configuration

### CORS for API Routes

```php
<?php

// config/cors.php - for addon API routes
return [
    'paths' => [
        'api/*', 
        'addon-api/*'  // Include addon API paths
    ],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['*'],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
```

### Rate Limiting

```php
<?php

// In RouteServiceProvider
protected function configureRateLimiting(): void
{
    RateLimiter::for('api', function (Request $request) {
        return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
    });

    // Specific rate limiting for addon APIs
    RateLimiter::for('addon-api', function (Request $request) {
        return Limit::perMinute(30)->by($request->user()?->id ?: $request->ip());
    });
}
```

## Next Steps

- [Panel Configuration](./panel-configuration.md)
- [Examples](../examples/index.md)