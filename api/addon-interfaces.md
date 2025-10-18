# Addon Interfaces

Filament Twist provides several interfaces that addons can implement to extend functionality and integrate with the system.

## HasMigration

Enable your addon to provide its own database migrations.

### Interface Definition

```php
<?php

namespace Twist\Contracts;

interface HasMigration
{
    public function pathMigrations(): string;
}
```

### Implementation

```php
<?php

namespace App\Addons\UserManagement;

use Twist\Base\BaseAddon;
use Twist\Contracts\HasMigration;

class UserManagementAddon extends BaseAddon implements HasMigration
{
    public function pathMigrations(): string
    {
        return __DIR__ . '/Migrations';
    }
}
```

### Usage

When you implement this interface:

- The `twist:migrate` command will discover and run your addon's migrations
- Migrations are automatically included in tenant migration processes
- Your migration path is added to Laravel's migration system

### Migration Structure

Organize your migrations in the specified directory:

```
app/Addons/UserManagement/
├── Migrations/
│   ├── 2024_01_01_000000_create_users_table.php
│   ├── 2024_01_02_000000_create_roles_table.php
│   └── 2024_01_03_000000_add_permissions_to_roles.php
└── UserManagementAddon.php
```

## HasRouteApi

Enable your addon to register API routes.

### Interface Definition

```php
<?php

namespace Twist\Contracts;

interface HasRouteApi
{
    public function pathRouteApi(): string;
}
```

### Implementation

```php
<?php

namespace App\Addons\UserManagement;

use Twist\Base\BaseAddon;
use Twist\Contracts\HasRouteApi;

class UserManagementAddon extends BaseAddon implements HasRouteApi
{
    public function pathRouteApi(): string
    {
        return __DIR__ . '/Routes/api.php';
    }
}
```

### Usage

When you implement this interface:

- Your API routes are automatically registered
- Routes are included in the panel's API routing system
- Routes respect panel-specific middleware and configuration

### Route File Structure

Create your API routes file:

```php
<?php
// app/Addons/UserManagement/Routes/api.php

use Illuminate\Support\Facades\Route;
use App\Addons\UserManagement\Controllers\UserApiController;

Route::prefix('users')->group(function () {
    Route::get('/', [UserApiController::class, 'index']);
    Route::post('/', [UserApiController::class, 'store']);
    Route::get('/{user}', [UserApiController::class, 'show']);
    Route::put('/{user}', [UserApiController::class, 'update']);
    Route::delete('/{user}', [UserApiController::class, 'destroy']);
});
```

## HasDispatcher

Integrate with the Laravel Executor package for background processing.

### Interface Definition

```php
<?php

namespace Twist\Contracts;

interface HasDispatcher
{
    public function pathDispatchers(): string;
}
```

### Implementation

```php
<?php

namespace App\Addons\UserManagement;

use Twist\Base\BaseAddon;
use Twist\Contracts\HasDispatcher;

class UserManagementAddon extends BaseAddon implements HasDispatcher
{
    public function pathDispatchers(): string
    {
        return __DIR__ . '/Dispatchers';
    }
}
```

### Usage

When you implement this interface:

- Your dispatchers are automatically registered with the Executor system
- Background processing capabilities are enabled for your addon
- Dispatchers can be triggered via commands or events

### Dispatcher Structure

Create dispatchers in the specified directory:

```
app/Addons/UserManagement/
├── Dispatchers/
│   ├── SendWelcomeEmailDispatcher.php
│   ├── ProcessUserImportDispatcher.php
│   └── CleanupInactiveUsersDispatcher.php
└── UserManagementAddon.php
```

Example dispatcher:

```php
<?php

namespace App\Addons\UserManagement\Dispatchers;

use Pharaonic\Laravel\Executor\Dispatcher;

class SendWelcomeEmailDispatcher extends Dispatcher
{
    public function handle($userId)
    {
        $user = User::find($userId);
        // Send welcome email logic
    }
}
```

## HasHooks

Register hooks in the application lifecycle.

### Interface Definition

```php
<?php

namespace Twist\Contracts;

interface HasHooks
{
    public function hooks(): void;
}
```

### Implementation

```php
<?php

namespace App\Addons\UserManagement;

use Twist\Base\BaseAddon;
use Twist\Contracts\HasHooks;

class UserManagementAddon extends BaseAddon implements HasHooks
{
    public function hooks(): void
    {
        // Register your hooks here
        add_action('user.created', [$this, 'onUserCreated']);
        add_action('user.updated', [$this, 'onUserUpdated']);
        add_filter('user.permissions', [$this, 'filterPermissions']);
    }

    public function onUserCreated($user)
    {
        // Handle user creation
        logger("User created: {$user->email}");
    }

    public function onUserUpdated($user)
    {
        // Handle user updates
        cache()->forget("user.{$user->id}");
    }

    public function filterPermissions($permissions, $user)
    {
        // Modify permissions based on addon logic
        return $permissions;
    }
}
```

### Usage

When you implement this interface:

- Your hooks are automatically registered during application boot
- You can respond to application events and modify behavior
- Hooks provide extensibility points for other addons

## Multiple Interface Implementation

You can implement multiple interfaces in a single addon:

```php
<?php

namespace App\Addons\UserManagement;

use Twist\Base\BaseAddon;
use Twist\Contracts\HasMigration;
use Twist\Contracts\HasRouteApi;
use Twist\Contracts\HasDispatcher;
use Twist\Contracts\HasHooks;
use Filament\Panel;

class UserManagementAddon extends BaseAddon implements 
    HasMigration, 
    HasRouteApi, 
    HasDispatcher, 
    HasHooks
{
    public function getId(): string
    {
        return 'user-management';
    }

    public function boot(Panel $panel): void
    {
        $panel->resources([
            Resources\UserResource::class,
            Resources\RoleResource::class,
        ]);

        $panel->pages([
            Pages\UserDashboard::class,
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

    public function pathDispatchers(): string
    {
        return __DIR__ . '/Dispatchers';
    }

    public function hooks(): void
    {
        add_action('user.created', [$this, 'onUserCreated']);
        add_action('user.deleted', [$this, 'onUserDeleted']);
    }

    public function onUserCreated($user)
    {
        // Trigger welcome email dispatcher
        execute('SendWelcomeEmailDispatcher', $user->id);
    }

    public function onUserDeleted($user)
    {
        // Cleanup user data
        execute('CleanupUserDataDispatcher', $user->id);
    }
}
```

## Interface Concerns (Traits)

Twist provides helper traits for common interface implementations:

### InteractsWithMigration

```php
<?php

namespace Twist\Concerns;

trait InteractsWithMigration
{
    public function pathMigrations(): string
    {
        return $this->pathMigrations;
    }
}
```

Usage:

```php
<?php

namespace App\Addons\UserManagement;

use Twist\Base\BaseAddon;
use Twist\Contracts\HasMigration;
use Twist\Concerns\InteractsWithMigration;

class UserManagementAddon extends BaseAddon implements HasMigration
{
    use InteractsWithMigration;

    protected string $pathMigrations = __DIR__ . '/Migrations';
}
```

### InteractsWithRouteApi

```php
<?php

namespace Twist\Concerns;

trait InteractsWithRouteApi
{
    public function pathRouteApi(): string
    {
        return $this->pathRouteApi;
    }
}
```

### InteractsWithDispatcher

```php
<?php

namespace Twist\Concerns;

trait InteractsWithDispatcher
{
    public function pathDispatchers(): string
    {
        return $this->pathDispatchers;
    }
}
```

## Best Practices

1. **Single Responsibility**: Implement only the interfaces your addon actually needs
2. **Error Handling**: Ensure your interface methods handle errors gracefully
3. **Documentation**: Document the purpose and behavior of your implementations
4. **Testing**: Test each interface implementation thoroughly
5. **Performance**: Consider the performance impact of hooks and dispatchers

## Example: Complete Addon

Here's a complete example of an addon implementing all interfaces:

```php
<?php

namespace App\Addons\BlogManagement;

use Twist\Base\BaseAddon;
use Twist\Contracts\{HasMigration, HasRouteApi, HasDispatcher, HasHooks};
use Filament\Panel;

class BlogManagementAddon extends BaseAddon implements 
    HasMigration, 
    HasRouteApi, 
    HasDispatcher, 
    HasHooks
{
    public function getId(): string
    {
        return 'blog-management';
    }

    public function boot(Panel $panel): void
    {
        $panel->resources([
            Resources\PostResource::class,
            Resources\CategoryResource::class,
        ]);
    }

    // HasMigration implementation
    public function pathMigrations(): string
    {
        return __DIR__ . '/Migrations';
    }

    // HasRouteApi implementation
    public function pathRouteApi(): string
    {
        return __DIR__ . '/Routes/api.php';
    }

    // HasDispatcher implementation
    public function pathDispatchers(): string
    {
        return __DIR__ . '/Dispatchers';
    }

    // HasHooks implementation
    public function hooks(): void
    {
        add_action('post.published', [$this, 'onPostPublished']);
        add_filter('post.content', [$this, 'filterPostContent']);
    }

    public function onPostPublished($post)
    {
        execute('NotifySubscribersDispatcher', $post->id);
    }

    public function filterPostContent($content, $post)
    {
        // Add reading time estimation
        $readingTime = ceil(str_word_count($content) / 200);
        return $content . "\n\n*Estimated reading time: {$readingTime} minutes*";
    }
}
```

## Next Steps

- [Learn about TwistClass](./twist-class.md)
- [View Console Commands](../guide/console-commands.md)