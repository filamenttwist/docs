# BaseModel

Enhanced Eloquent model with automatic Twist integration.

## Overview

`BaseModel` extends Laravel's Eloquent Model to provide automatic integration with Filament Twist's configuration system. It handles database connections, table prefixes, and naming conventions seamlessly.

## Key Features

- **Automatic Connection Management**: Uses Twist's configured database connection
- **Table Prefix Support**: Automatically applies configured table prefixes
- **Postfix Support**: Allows additional table naming customization
- **Configuration Integration**: Respects Twist configuration settings

## Table Naming

The final table name is constructed as:

```
{prefix}{postfix}{original_table_name}
```

**Example**:
- Prefix: `twist_`
- Postfix: `app_`
- Original table: `users`
- Final table: `twist_app_users`

## Basic Usage

### Simple Model

```php
<?php

namespace App\Addons\UserManagement\Models;

use Twist\Base\BaseModel;

class User extends BaseModel
{
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
    ];
}
```

### Model with Custom Postfix

```php
<?php

namespace App\Addons\UserManagement\Models;

use Twist\Base\BaseModel;

class AdminUser extends BaseModel
{
    protected string $postfix = 'admin_';
    
    protected $table = 'users';
    
    protected $fillable = [
        'name',
        'email',
        'password',
        'admin_level',
    ];
}
```

This will create a table named: `{prefix}admin_users`

### Model with Relationships

```php
<?php

namespace App\Addons\UserManagement\Models;

use Twist\Base\BaseModel;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class User extends BaseModel
{
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class);
    }
}
```

## Properties

### `$postfix`

Additional string to insert between the prefix and table name.

```php
protected string $postfix = '';
```

**Example**:
```php
protected string $postfix = 'module_';
```

## Advanced Usage

### Multi-Tenant Models

```php
<?php

namespace App\Addons\UserManagement\Models;

use Twist\Base\BaseModel;
use Illuminate\Database\Eloquent\Builder;

class TenantUser extends BaseModel
{
    protected $fillable = [
        'name',
        'email',
        'tenant_id',
    ];

    protected static function booted(): void
    {
        static::addGlobalScope('tenant', function (Builder $builder) {
            if ($tenantId = session('tenant_id')) {
                $builder->where('tenant_id', $tenantId);
            }
        });
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
```

### Soft Deletes

```php
<?php

namespace App\Addons\UserManagement\Models;

use Twist\Base\BaseModel;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends BaseModel
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    protected $dates = [
        'deleted_at',
    ];
}
```

### Model with Events

```php
<?php

namespace App\Addons\UserManagement\Models;

use Twist\Base\BaseModel;
use Illuminate\Support\Facades\Hash;

class User extends BaseModel
{
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    protected static function booted(): void
    {
        static::creating(function ($user) {
            if (isset($user->password)) {
                $user->password = Hash::make($user->password);
            }
        });

        static::updating(function ($user) {
            if ($user->isDirty('password')) {
                $user->password = Hash::make($user->password);
            }
        });
    }
}
```

### Custom Accessors and Mutators

```php
<?php

namespace App\Addons\UserManagement\Models;

use Twist\Base\BaseModel;
use Illuminate\Database\Eloquent\Casts\Attribute;

class User extends BaseModel
{
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    protected function name(): Attribute
    {
        return Attribute::make(
            get: fn (string $value) => ucwords($value),
            set: fn (string $value) => strtolower($value),
        );
    }

    protected function email(): Attribute
    {
        return Attribute::make(
            get: fn (string $value) => strtolower($value),
            set: fn (string $value) => strtolower($value),
        );
    }
}
```

## Configuration Integration

### Database Connection

The model automatically uses the connection configured in Twist:

```php
// config/twist.php
'database' => [
    'connection' => 'mysql_twist',
],
```

### Table Prefix

Respects both Obelaw and Twist prefix configurations:

```php
// Priority order:
// 1. config('obelaw.database.table_prefix')
// 2. Twist::getPrefixTable()
```

### Environment-Specific Prefixes

```php
// config/twist.php
'database' => [
    'table_prefix' => env('TWIST_TABLE_PREFIX', 'twist_'),
],

// .env
TWIST_TABLE_PREFIX=dev_twist_
```

## Testing

### Model Factories

```php
<?php

namespace Database\Factories;

use App\Addons\UserManagement\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->name(),
            'email' => $this->faker->unique()->safeEmail(),
            'password' => 'password',
        ];
    }
}
```

### Testing with BaseModel

```php
<?php

namespace Tests\Feature;

use App\Addons\UserManagement\Models\User;
use Tests\TestCase;

class UserModelTest extends TestCase
{
    public function test_user_creation(): void
    {
        $user = User::create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password',
        ]);

        $this->assertInstanceOf(User::class, $user);
        $this->assertEquals('John Doe', $user->name);
    }

    public function test_table_naming(): void
    {
        $user = new User();
        $expectedTable = config('twist.database.table_prefix', 'twist_') . 'users';
        
        $this->assertEquals($expectedTable, $user->getTable());
    }
}
```

## Best Practices

### 1. Consistent Naming

```php
// Use singular model names
class User extends BaseModel { }      // ✓ Good
class Users extends BaseModel { }     // ✗ Avoid

// Table names will be pluralized automatically
// User model -> users table (with prefixes)
```

### 2. Fillable vs Guarded

```php
// Prefer explicit fillable arrays
protected $fillable = [
    'name',
    'email',
    'password',
];

// Avoid mass-assignment vulnerabilities
protected $guarded = ['*']; // ✗ Too restrictive
protected $guarded = [];    // ✗ Too permissive
```

### 3. Relationship Definition

```php
// Use type hints for relationships
public function posts(): HasMany
{
    return $this->hasMany(Post::class);
}

// Be explicit about foreign keys when needed
public function profile(): HasOne
{
    return $this->hasOne(Profile::class, 'user_id');
}
```

### 4. Scopes for Reusability

```php
// Local scopes for common queries
public function scopeActive(Builder $query): void
{
    $query->where('active', true);
}

public function scopeByRole(Builder $query, string $role): void
{
    $query->whereHas('roles', fn($q) => $q->where('name', $role));
}

// Usage
$activeAdmins = User::active()->byRole('admin')->get();
```

## Common Patterns

### Repository Pattern

```php
<?php

namespace App\Addons\UserManagement\Repositories;

use App\Addons\UserManagement\Models\User;
use Illuminate\Database\Eloquent\Collection;

class UserRepository
{
    public function findByEmail(string $email): ?User
    {
        return User::where('email', $email)->first();
    }

    public function getActiveUsers(): Collection
    {
        return User::where('active', true)->get();
    }

    public function createUser(array $data): User
    {
        return User::create($data);
    }
}
```

### Service Layer Integration

```php
<?php

namespace App\Addons\UserManagement\Services;

use Twist\Base\BaseService;
use App\Addons\UserManagement\Models\User;
use App\Addons\UserManagement\Actions\CreateUserAction;

class UserService extends BaseService
{
    public function createUser(array $data): User
    {
        return CreateUserAction::make($data);
    }

    public function findUser(int $id): ?User
    {
        return User::find($id);
    }
}
```

## Related Classes

- [BaseMigration](./base-migration) - For creating model tables
- [BaseService](./base-service) - For model business logic
- [BaseAction](./base-action) - For model operations
- [BaseDTO](./base-dto) - For model data transfer

## Next Steps

- [Learn about migrations](./base-migration)
- [Explore services](./base-service)
- [See complete examples](../../examples/)