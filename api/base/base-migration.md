# BaseMigration

Migration base class with automatic table prefixing.

## Overview

`BaseMigration` extends Laravel's Migration class to automatically handle table prefixes according to Twist configuration. This ensures consistent table naming across all addon migrations.

## Key Features

- **Automatic Prefix Application**: Uses configured table prefixes
- **Consistent Naming**: Ensures all addon tables follow naming conventions
- **Configuration Aware**: Respects Twist configuration settings
- **Postfix Support**: Additional naming flexibility

## Basic Usage

### Simple Migration

```php
<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Twist\Base\BaseMigration;

return new class extends BaseMigration
{
    public function up(): void
    {
        Schema::create($this->prefix . 'users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists($this->prefix . 'users');
    }
};
```

### Migration with Postfix

```php
<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Twist\Base\BaseMigration;

return new class extends BaseMigration
{
    protected string $postfix = 'admin_';

    public function up(): void
    {
        Schema::create($this->prefix . 'settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists($this->prefix . 'settings');
    }
};
```

### Migration with Foreign Keys

```php
<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Twist\Base\BaseMigration;

return new class extends BaseMigration
{
    public function up(): void
    {
        Schema::create($this->prefix . 'posts', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('content');
            $table->foreignId('user_id')->constrained($this->prefix . 'users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists($this->prefix . 'posts');
    }
};
```

## Properties

### `$prefix`

Automatically set table prefix based on configuration. Read-only after construction.

```php
protected string $prefix = '';
```

### `$postfix`

Additional string to insert between the configuration prefix and table name.

```php
protected string $postfix = '';
```

**Example**:
```php
protected string $postfix = 'module_';
// Results in: twist_module_tablename
```

## Advanced Usage

### Index Creation

```php
<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Twist\Base\BaseMigration;

return new class extends BaseMigration
{
    public function up(): void
    {
        Schema::create($this->prefix . 'users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email');
            $table->string('phone')->nullable();
            $table->timestamps();

            // Indexes
            $table->unique('email');
            $table->index(['name', 'email']);
            $table->index('phone');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists($this->prefix . 'users');
    }
};
```

### Complex Relationships

```php
<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Twist\Base\BaseMigration;

return new class extends BaseMigration
{
    public function up(): void
    {
        Schema::create($this->prefix . 'user_roles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                  ->constrained($this->prefix . 'users')
                  ->onDelete('cascade');
            $table->foreignId('role_id')
                  ->constrained($this->prefix . 'roles')
                  ->onDelete('cascade');
            $table->timestamps();

            $table->unique(['user_id', 'role_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists($this->prefix . 'user_roles');
    }
};
```

### JSON Columns

```php
<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Twist\Base\BaseMigration;

return new class extends BaseMigration
{
    public function up(): void
    {
        Schema::create($this->prefix . 'user_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained($this->prefix . 'users');
            $table->json('settings');
            $table->json('permissions')->nullable();
            $table->timestamps();

            // JSON indexes (MySQL 5.7+)
            $table->index('settings->theme');
            $table->index('settings->language');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists($this->prefix . 'user_preferences');
    }
};
```

### Conditional Schema Changes

```php
<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Twist\Base\BaseMigration;

return new class extends BaseMigration
{
    public function up(): void
    {
        Schema::create($this->prefix . 'analytics', function (Blueprint $table) {
            $table->id();
            $table->string('event');
            $table->json('data');
            $table->timestamp('occurred_at');

            // Add partition support for MySQL
            if (DB::connection()->getDriverName() === 'mysql') {
                $table->index('occurred_at');
            }

            // PostgreSQL specific features
            if (DB::connection()->getDriverName() === 'pgsql') {
                $table->uuid('uuid')->unique();
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists($this->prefix . 'analytics');
    }
};
```

## Migration Patterns

### Tenant-Aware Tables

```php
<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Twist\Base\BaseMigration;

return new class extends BaseMigration
{
    public function up(): void
    {
        Schema::create($this->prefix . 'tenant_users', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('name');
            $table->string('email');
            $table->timestamps();

            // Ensure email is unique per tenant
            $table->unique(['tenant_id', 'email']);
            $table->index('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists($this->prefix . 'tenant_users');
    }
};
```

### Versioned Data

```php
<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Twist\Base\BaseMigration;

return new class extends BaseMigration
{
    public function up(): void
    {
        Schema::create($this->prefix . 'document_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained($this->prefix . 'documents');
            $table->integer('version_number');
            $table->text('content');
            $table->foreignId('created_by')->constrained($this->prefix . 'users');
            $table->timestamps();

            $table->unique(['document_id', 'version_number']);
            $table->index(['document_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists($this->prefix . 'document_versions');
    }
};
```

### Soft Delete Support

```php
<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Twist\Base\BaseMigration;

return new class extends BaseMigration
{
    public function up(): void
    {
        Schema::create($this->prefix . 'products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description');
            $table->decimal('price', 10, 2);
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['active', 'deleted_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists($this->prefix . 'products');
    }
};
```

## Configuration Integration

### Prefix Resolution

The prefix is resolved in this order:

1. `config('obelaw.database.table_prefix')`
2. `Twist::getPrefixTable()`
3. Default empty string

### Environment-Specific Prefixes

```php
// .env
TWIST_TABLE_PREFIX=dev_twist_
OBELAW_DB_PREFIX=staging_
```

```php
// config/twist.php
'database' => [
    'table_prefix' => env('TWIST_TABLE_PREFIX', 'twist_'),
],
```

## Testing Migrations

### Migration Testing

```php
<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class UserMigrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_users_table_creation(): void
    {
        $prefix = config('twist.database.table_prefix', 'twist_');
        $tableName = $prefix . 'users';

        $this->assertTrue(Schema::hasTable($tableName));
        $this->assertTrue(Schema::hasColumn($tableName, 'id'));
        $this->assertTrue(Schema::hasColumn($tableName, 'name'));
        $this->assertTrue(Schema::hasColumn($tableName, 'email'));
    }

    public function test_users_table_indexes(): void
    {
        $prefix = config('twist.database.table_prefix', 'twist_');
        $tableName = $prefix . 'users';

        $indexes = Schema::getIndexes($tableName);
        $indexNames = array_column($indexes, 'name');

        $this->assertContains($tableName . '_email_unique', $indexNames);
    }
}
```

### Database Factories with Prefixed Tables

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
            'password' => bcrypt('password'),
        ];
    }
}
```

## Best Practices

### 1. Consistent Naming

```php
// Use snake_case for table names
Schema::create($this->prefix . 'user_profiles', function (Blueprint $table) {
    // Table structure
});

// Use descriptive names
Schema::create($this->prefix . 'user_login_attempts', function (Blueprint $table) {
    // Better than just 'attempts'
});
```

### 2. Foreign Key Constraints

```php
// Always use constrained() with prefixed tables
$table->foreignId('user_id')->constrained($this->prefix . 'users');

// Specify cascade behavior
$table->foreignId('user_id')
      ->constrained($this->prefix . 'users')
      ->onDelete('cascade');
```

### 3. Index Strategy

```php
// Index foreign keys
$table->foreignId('user_id')->constrained($this->prefix . 'users');
$table->index('user_id'); // Usually automatic, but explicit is better

// Composite indexes for common queries
$table->index(['user_id', 'created_at']);
$table->index(['status', 'priority']);
```

### 4. Down Method Implementation

```php
// Always implement proper down methods
public function down(): void
{
    // Drop foreign key constraints first if needed
    Schema::table($this->prefix . 'posts', function (Blueprint $table) {
        $table->dropForeign(['user_id']);
    });

    Schema::dropIfExists($this->prefix . 'posts');
}
```

## Common Patterns

### Addon Migration Structure

```
addon/
├── Database/
│   └── Migrations/
│       ├── 2024_01_01_000001_create_users_table.php
│       ├── 2024_01_01_000002_create_roles_table.php
│       └── 2024_01_01_000003_create_user_roles_table.php
```

### Migration Dependencies

```php
// When migrations depend on each other, use clear naming
// 2024_01_01_000001_create_users_table.php
// 2024_01_01_000002_create_roles_table.php  
// 2024_01_01_000003_create_user_roles_table.php (depends on both above)
```

## Related Classes

- [BaseModel](./base-model) - For using migrated tables
- [BaseAddon](./base-addon) - For addon migration paths
- [BaseService](./base-service) - For migration-related operations

## Next Steps

- [Learn about models](./base-model)
- [Explore addon structure](./base-addon)
- [See complete examples](../../examples/)