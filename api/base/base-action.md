# BaseAction

Command pattern implementation with automatic event tracking.

## Overview

`BaseAction` implements the command pattern with built-in audit trail integration. It provides a consistent structure for executing operations while automatically tracking events using the Obelaw Trail package.

## Key Features

- **Automatic Event Tracking**: Uses Obelaw Trail for audit logging
- **Command Pattern**: Single responsibility actions
- **Configurable Tracking**: Can disable or customize event names
- **Reflection-Based Naming**: Automatically generates event names

## Basic Usage

### Simple Action

```php
<?php

namespace App\Addons\UserManagement\Actions;

use Twist\Base\BaseAction;
use App\Addons\UserManagement\Models\User;

class CreateUserAction extends BaseAction
{
    public function handle(array $userData): User
    {
        return User::create([
            'name' => $userData['name'],
            'email' => $userData['email'],
            'password' => bcrypt($userData['password']),
        ]);
    }
}
```

### Action with Validation

```php
<?php

namespace App\Addons\UserManagement\Actions;

use Twist\Base\BaseAction;
use App\Addons\UserManagement\Models\User;
use App\Addons\UserManagement\Exceptions\UserValidationException;

class CreateUserAction extends BaseAction
{
    public function handle(array $userData): User
    {
        $this->validate($userData);
        
        return User::create([
            'name' => $userData['name'],
            'email' => $userData['email'],
            'password' => bcrypt($userData['password']),
        ]);
    }

    protected function validate(array $data): void
    {
        if (empty($data['name']) || empty($data['email'])) {
            throw new UserValidationException('Name and email are required');
        }

        if (User::where('email', $data['email'])->exists()) {
            throw new UserValidationException('Email already exists');
        }
    }
}
```

### Action with Complex Logic

```php
<?php

namespace App\Addons\UserManagement\Actions;

use Twist\Base\BaseAction;
use App\Addons\UserManagement\Models\{User, Role};
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class CreateUserWithRoleAction extends BaseAction
{
    public function handle(array $userData, string $roleName): User
    {
        return DB::transaction(function () use ($userData, $roleName) {
            // Create user
            $user = User::create([
                'name' => $userData['name'],
                'email' => $userData['email'],
                'password' => bcrypt($userData['password']),
            ]);

            // Assign role
            $role = Role::where('name', $roleName)->first();
            if ($role) {
                $user->roles()->attach($role);
            }

            // Send welcome email
            Mail::to($user->email)->send(new WelcomeEmail($user));

            return $user->load('roles');
        });
    }
}
```

## Usage Examples

### Basic Execution

```php
// Execute the action
use App\Addons\UserManagement\Actions\CreateUserAction;

$user = CreateUserAction::make([
    'name' => 'John Doe',
    'email' => 'john@example.com',
    'password' => 'secret123',
]);

// This automatically:
// 1. Creates the user
// 2. Tracks the event as "create.user" in the audit trail
```

### Multiple Parameters

```php
use App\Addons\UserManagement\Actions\CreateUserWithRoleAction;

$user = CreateUserWithRoleAction::make(
    [
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'password' => 'secret123',
    ],
    'admin'
);
```

## Configuration

### Disable Tracking

```php
class CreateUserAction extends BaseAction
{
    protected bool $trackable = false;

    public function handle(array $userData): User
    {
        return User::create($userData);
    }
}
```

### Custom Event Name

```php
class CreateUserAction extends BaseAction
{
    protected string $trackableEvent = 'custom.user.created';

    public function handle(array $userData): User
    {
        return User::create($userData);
    }
}
```

### Custom Event Suffix

```php
class CreateUserCommand extends BaseAction
{
    protected string $eventSuffix = 'Command';
    
    // Event name will be "create.user" instead of "create.user.command"
    
    public function handle(array $userData): User
    {
        return User::create($userData);
    }
}
```

## Advanced Usage

### Action with Dependencies

```php
<?php

namespace App\Addons\UserManagement\Actions;

use Twist\Base\BaseAction;
use App\Addons\UserManagement\Services\UserValidationService;
use App\Addons\UserManagement\Models\User;

class CreateUserAction extends BaseAction
{
    public function __construct(
        protected UserValidationService $validator
    ) {}

    public function handle(array $userData): User
    {
        $this->validator->validate($userData);
        
        return User::create($userData);
    }
}
```

### Action with Return Value Tracking

```php
<?php

namespace App\Addons\UserManagement\Actions;

use Twist\Base\BaseAction;
use App\Addons\UserManagement\Models\User;

class CreateUserAction extends BaseAction
{
    public function handle(array $userData): User
    {
        $user = User::create($userData);
        
        // Additional tracking with result
        $this->trackResult($user);
        
        return $user;
    }

    protected function trackResult(User $user): void
    {
        Trail::for()
            ->by(auth()->user())
            ->event('user.created.success')
            ->changes(['user_id' => $user->id])
            ->save();
    }
}
```

### Conditional Execution

```php
<?php

namespace App\Addons\UserManagement\Actions;

use Twist\Base\BaseAction;
use App\Addons\UserManagement\Models\User;

class UpdateUserAction extends BaseAction
{
    protected bool $trackable = true;

    public function handle(User $user, array $userData): User
    {
        $originalData = $user->toArray();
        
        $user->update($userData);
        
        // Only track if significant changes
        if ($this->hasSignificantChanges($originalData, $userData)) {
            $this->trackCustom('user.significant.update', [
                'user_id' => $user->id,
                'changes' => array_keys($userData),
            ]);
        }
        
        return $user->fresh();
    }

    protected function hasSignificantChanges(array $original, array $new): bool
    {
        $significantFields = ['email', 'password', 'role'];
        
        return !empty(array_intersect(array_keys($new), $significantFields));
    }

    protected function trackCustom(string $event, array $data): void
    {
        Trail::for()
            ->by(auth()->user())
            ->event($event)
            ->changes($data)
            ->save();
    }
}
```

## Properties

### `$trackable`

Controls whether the action should be tracked in the audit trail.

```php
protected bool $trackable = true;
```

### `$trackableEvent`

Custom event name for tracking. If not set, generates name from class name.

```php
protected ?string $trackableEvent = null;
```

### `$eventSuffix`

Suffix to remove from class name when generating event names.

```php
protected string $eventSuffix = 'Action';
```

## Methods

### `make()`

Static factory method that creates an instance, tracks the action, and executes it.

```php
public static function make(mixed ...$arguments): mixed
```

### `handle()`

Abstract method that must be implemented to define the action's logic.

```php
abstract public function handle(mixed ...$arguments): mixed
```

## Event Naming

Event names are automatically generated using this pattern:

1. Get class short name (e.g., `CreateUserAction`)
2. Remove the event suffix (e.g., `CreateUser`)
3. Convert to snake_case with dots (e.g., `create.user`)

### Examples

```php
CreateUserAction      → create.user
UpdateUserAction      → update.user
DeleteUserAction      → delete.user
SendEmailAction       → send.email
ProcessPaymentAction  → process.payment
```

## Testing Actions

### Unit Testing

```php
<?php

namespace Tests\Unit;

use App\Addons\UserManagement\Actions\CreateUserAction;
use App\Addons\UserManagement\Models\User;
use Tests\TestCase;

class CreateUserActionTest extends TestCase
{
    public function test_creates_user_successfully(): void
    {
        $userData = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password',
        ];

        $user = CreateUserAction::make($userData);

        $this->assertInstanceOf(User::class, $user);
        $this->assertEquals('John Doe', $user->name);
        $this->assertEquals('john@example.com', $user->email);
    }
}
```

### Testing with Tracking Disabled

```php
<?php

namespace Tests\Unit;

use App\Addons\UserManagement\Actions\CreateUserAction;
use Obelaw\Trail\Facades\Trail;
use Tests\TestCase;

class CreateUserActionTest extends TestCase
{
    public function test_creates_user_without_tracking(): void
    {
        // Create action with tracking disabled
        $action = new class extends CreateUserAction {
            protected bool $trackable = false;
        };

        Trail::shouldReceive('for')->never();

        $user = $action::make([
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password',
        ]);

        $this->assertInstanceOf(User::class, $user);
    }
}
```

### Mocking Actions

```php
<?php

namespace Tests\Feature;

use App\Addons\UserManagement\Actions\CreateUserAction;
use App\Addons\UserManagement\Models\User;
use Tests\TestCase;

class UserControllerTest extends TestCase
{
    public function test_store_user(): void
    {
        $mockUser = User::factory()->make();

        $this->mock(CreateUserAction::class, function ($mock) use ($mockUser) {
            $mock->shouldReceive('make')
                 ->once()
                 ->andReturn($mockUser);
        });

        $response = $this->post('/users', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
        ]);

        $response->assertStatus(201);
    }
}
```

## Best Practices

### 1. Single Responsibility

```php
// Good: One clear responsibility
class CreateUserAction extends BaseAction
{
    public function handle(array $userData): User
    {
        return User::create($userData);
    }
}

// Avoid: Multiple responsibilities
class UserAction extends BaseAction
{
    public function handle(string $operation, ...$args): mixed
    {
        match($operation) {
            'create' => $this->createUser($args),
            'update' => $this->updateUser($args),
            'delete' => $this->deleteUser($args),
        };
    }
}
```

### 2. Clear Naming

```php
// Good: Descriptive action names
class CreateUserAction extends BaseAction { }
class UpdateUserPasswordAction extends BaseAction { }
class SendPasswordResetEmailAction extends BaseAction { }

// Avoid: Vague names
class UserAction extends BaseAction { }
class DoSomethingAction extends BaseAction { }
```

### 3. Type Hints

```php
// Good: Clear parameter and return types
class CreateUserAction extends BaseAction
{
    public function handle(array $userData): User
    {
        return User::create($userData);
    }
}

// Good: Multiple typed parameters
class AssignRoleAction extends BaseAction
{
    public function handle(User $user, Role $role): User
    {
        $user->roles()->attach($role);
        return $user->load('roles');
    }
}
```

### 4. Error Handling

```php
class CreateUserAction extends BaseAction
{
    public function handle(array $userData): User
    {
        try {
            return User::create($userData);
        } catch (\Exception $e) {
            $this->trackError($e);
            throw new UserCreationException(
                'Failed to create user: ' . $e->getMessage(),
                previous: $e
            );
        }
    }

    protected function trackError(\Exception $e): void
    {
        Trail::for()
            ->by(auth()->user())
            ->event('user.creation.failed')
            ->changes(['error' => $e->getMessage()])
            ->save();
    }
}
```

## Action Patterns

### Service Integration

```php
class CreateUserAction extends BaseAction
{
    public function handle(array $userData): User
    {
        return UserService::make()->createUser($userData);
    }
}
```

### Repository Integration

```php
class CreateUserAction extends BaseAction
{
    public function __construct(
        protected UserRepositoryInterface $userRepository
    ) {}

    public function handle(array $userData): User
    {
        return $this->userRepository->create($userData);
    }
}
```

### DTO Integration

```php
class CreateUserAction extends BaseAction
{
    public function handle(UserDTO $userData): User
    {
        return User::create($userData->toArray());
    }
}
```

## Related Classes

- [BaseService](./base-service) - For service integration
- [BaseModel](./base-model) - For data operations
- [BaseDTO](./base-dto) - For data validation
- [BaseAddon](./base-addon) - For action registration

## Next Steps

- [Learn about services](./base-service)
- [Explore DTOs](./base-dto)
- [See complete examples](../../examples/)