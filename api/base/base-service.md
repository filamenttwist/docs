# BaseService

Service pattern implementation with container integration.

## Overview

`BaseService` provides a foundation for implementing the service layer pattern in Filament Twist addons. It includes Laravel's service container integration and the Macroable trait for extensibility.

## Key Features

- **Service Container Integration**: Automatic dependency injection
- **Macroable Trait**: Allows runtime method additions
- **Static Factory Method**: Convenient instantiation pattern
- **Testable**: Easy to mock and test

## Basic Usage

### Simple Service

```php
<?php

namespace App\Addons\UserManagement\Services;

use Twist\Base\BaseService;
use App\Addons\UserManagement\Models\User;

class UserService extends BaseService
{
    public function createUser(array $data): User
    {
        return User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => bcrypt($data['password']),
        ]);
    }

    public function updateUser(User $user, array $data): User
    {
        $user->update($data);
        return $user->fresh();
    }

    public function deleteUser(User $user): bool
    {
        return $user->delete();
    }
}
```

### Service with Dependencies

```php
<?php

namespace App\Addons\UserManagement\Services;

use Twist\Base\BaseService;
use App\Addons\UserManagement\Models\User;
use App\Addons\UserManagement\Repositories\UserRepository;
use Illuminate\Support\Facades\Mail;

class UserService extends BaseService
{
    public function __construct(
        protected UserRepository $userRepository
    ) {}

    public function createUser(array $data): User
    {
        $user = $this->userRepository->create($data);
        
        Mail::to($user->email)->send(new WelcomeEmail($user));
        
        return $user;
    }

    public function getUsersByRole(string $role): Collection
    {
        return $this->userRepository->findByRole($role);
    }
}
```

### Service with Business Logic

```php
<?php

namespace App\Addons\UserManagement\Services;

use Twist\Base\BaseService;
use App\Addons\UserManagement\Models\User;
use App\Addons\UserManagement\Events\UserCreated;
use App\Addons\UserManagement\Exceptions\UserCreationException;

class UserService extends BaseService
{
    public function createUser(array $data): User
    {
        $this->validateUserData($data);
        
        if ($this->emailExists($data['email'])) {
            throw new UserCreationException('Email already exists');
        }

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => bcrypt($data['password']),
            'email_verified_at' => $data['auto_verify'] ?? false ? now() : null,
        ]);

        event(new UserCreated($user));

        return $user;
    }

    protected function validateUserData(array $data): void
    {
        if (empty($data['name']) || empty($data['email'])) {
            throw new UserCreationException('Name and email are required');
        }

        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            throw new UserCreationException('Invalid email format');
        }
    }

    protected function emailExists(string $email): bool
    {
        return User::where('email', $email)->exists();
    }
}
```

## Usage Examples

### Basic Service Usage

```php
// In a controller or command
use App\Addons\UserManagement\Services\UserService;

$user = UserService::make()->createUser([
    'name' => 'John Doe',
    'email' => 'john@example.com',
    'password' => 'secret123',
]);
```

### Service with Dependency Injection

```php
// In a controller
<?php

namespace App\Http\Controllers;

use App\Addons\UserManagement\Services\UserService;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function __construct(
        protected UserService $userService
    ) {}

    public function store(Request $request)
    {
        $user = $this->userService->createUser($request->validated());
        
        return response()->json($user, 201);
    }
}
```

## Advanced Usage

### Service with Caching

```php
<?php

namespace App\Addons\UserManagement\Services;

use Twist\Base\BaseService;
use App\Addons\UserManagement\Models\User;
use Illuminate\Support\Facades\Cache;

class UserService extends BaseService
{
    protected int $cacheTimeout = 3600; // 1 hour

    public function getUser(int $id): ?User
    {
        return Cache::remember(
            "user.{$id}",
            $this->cacheTimeout,
            fn() => User::find($id)
        );
    }

    public function updateUser(User $user, array $data): User
    {
        $user->update($data);
        
        // Clear cache
        Cache::forget("user.{$user->id}");
        
        return $user->fresh();
    }

    public function getUserStats(): array
    {
        return Cache::remember('user.stats', $this->cacheTimeout, function () {
            return [
                'total' => User::count(),
                'active' => User::where('active', true)->count(),
                'verified' => User::whereNotNull('email_verified_at')->count(),
            ];
        });
    }
}
```

### Service with Events

```php
<?php

namespace App\Addons\UserManagement\Services;

use Twist\Base\BaseService;
use App\Addons\UserManagement\Models\User;
use App\Addons\UserManagement\Events\{UserCreated, UserUpdated, UserDeleted};

class UserService extends BaseService
{
    public function createUser(array $data): User
    {
        $user = User::create($data);
        
        event(new UserCreated($user));
        
        return $user;
    }

    public function updateUser(User $user, array $data): User
    {
        $originalData = $user->toArray();
        $user->update($data);
        
        event(new UserUpdated($user, $originalData));
        
        return $user->fresh();
    }

    public function deleteUser(User $user): bool
    {
        $deleted = $user->delete();
        
        if ($deleted) {
            event(new UserDeleted($user));
        }
        
        return $deleted;
    }
}
```

### Service with Transactions

```php
<?php

namespace App\Addons\UserManagement\Services;

use Twist\Base\BaseService;
use App\Addons\UserManagement\Models\{User, Role, Profile};
use Illuminate\Support\Facades\DB;

class UserService extends BaseService
{
    public function createUserWithProfile(array $userData, array $profileData): User
    {
        return DB::transaction(function () use ($userData, $profileData) {
            // Create user
            $user = User::create($userData);
            
            // Create profile
            $user->profile()->create($profileData);
            
            // Assign default role
            $defaultRole = Role::where('name', 'user')->first();
            if ($defaultRole) {
                $user->roles()->attach($defaultRole);
            }
            
            return $user->load('profile', 'roles');
        });
    }

    public function updateUserAndProfile(User $user, array $userData, array $profileData): User
    {
        return DB::transaction(function () use ($user, $userData, $profileData) {
            $user->update($userData);
            $user->profile->update($profileData);
            
            return $user->fresh(['profile']);
        });
    }
}
```

## Macroable Usage

### Adding Runtime Methods

```php
// In a service provider
use App\Addons\UserManagement\Services\UserService;

UserService::macro('findByUsername', function (string $username) {
    return User::where('username', $username)->first();
});

// Usage
$user = UserService::make()->findByUsername('johndoe');
```

### Conditional Macros

```php
// In a service provider
use App\Addons\UserManagement\Services\UserService;

if (app()->environment('local')) {
    UserService::macro('createTestUser', function () {
        return User::factory()->create();
    });
}
```

## Testing Services

### Unit Testing

```php
<?php

namespace Tests\Unit;

use App\Addons\UserManagement\Services\UserService;
use App\Addons\UserManagement\Models\User;
use Tests\TestCase;

class UserServiceTest extends TestCase
{
    public function test_create_user(): void
    {
        $service = UserService::make();
        
        $userData = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password',
        ];
        
        $user = $service->createUser($userData);
        
        $this->assertInstanceOf(User::class, $user);
        $this->assertEquals('John Doe', $user->name);
        $this->assertEquals('john@example.com', $user->email);
    }
}
```

### Mocking Services

```php
<?php

namespace Tests\Feature;

use App\Addons\UserManagement\Services\UserService;
use App\Addons\UserManagement\Models\User;
use Tests\TestCase;

class UserControllerTest extends TestCase
{
    public function test_store_user(): void
    {
        $mockUser = User::factory()->make();
        
        $this->mock(UserService::class, function ($mock) use ($mockUser) {
            $mock->shouldReceive('createUser')
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

## Service Patterns

### Repository Pattern Integration

```php
<?php

namespace App\Addons\UserManagement\Services;

use Twist\Base\BaseService;
use App\Addons\UserManagement\Repositories\UserRepositoryInterface;

class UserService extends BaseService
{
    public function __construct(
        protected UserRepositoryInterface $userRepository
    ) {}

    public function createUser(array $data): User
    {
        return $this->userRepository->create($data);
    }

    public function getUsersPaginated(int $perPage = 15): LengthAwarePaginator
    {
        return $this->userRepository->paginate($perPage);
    }
}
```

### Action Pattern Integration

```php
<?php

namespace App\Addons\UserManagement\Services;

use Twist\Base\BaseService;
use App\Addons\UserManagement\Actions\{CreateUserAction, UpdateUserAction};

class UserService extends BaseService
{
    public function createUser(array $data): User
    {
        return CreateUserAction::make($data);
    }

    public function updateUser(User $user, array $data): User
    {
        return UpdateUserAction::make($user, $data);
    }
}
```

### DTO Integration

```php
<?php

namespace App\Addons\UserManagement\Services;

use Twist\Base\BaseService;
use App\Addons\UserManagement\DTOs\UserDTO;
use App\Addons\UserManagement\Models\User;

class UserService extends BaseService
{
    public function createUser(UserDTO $userData): User
    {
        return User::create($userData->toArray());
    }

    public function getUserDTO(int $id): ?UserDTO
    {
        $user = User::find($id);
        
        return $user ? UserDTO::fromArray($user->toArray()) : null;
    }
}
```

## Best Practices

### 1. Single Responsibility

```php
// Good: Focused on user operations
class UserService extends BaseService
{
    public function createUser(array $data): User { }
    public function updateUser(User $user, array $data): User { }
    public function deleteUser(User $user): bool { }
}

// Avoid: Too many responsibilities
class UserService extends BaseService
{
    public function createUser(array $data): User { }
    public function sendEmail(User $user): void { }
    public function generateReport(): array { }
    public function processPayment(User $user): bool { }
}
```

### 2. Dependency Injection

```php
// Good: Inject dependencies
class UserService extends BaseService
{
    public function __construct(
        protected UserRepository $userRepository,
        protected EmailService $emailService
    ) {}
}

// Avoid: Direct instantiation
class UserService extends BaseService
{
    public function createUser(array $data): User
    {
        $repository = new UserRepository(); // ✗ Avoid
        return $repository->create($data);
    }
}
```

### 3. Exception Handling

```php
class UserService extends BaseService
{
    public function createUser(array $data): User
    {
        try {
            return User::create($data);
        } catch (\Exception $e) {
            throw new UserCreationException(
                'Failed to create user: ' . $e->getMessage(),
                previous: $e
            );
        }
    }
}
```

### 4. Return Type Consistency

```php
// Good: Consistent return types
class UserService extends BaseService
{
    public function getUser(int $id): ?User
    {
        return User::find($id);
    }

    public function getUsers(): Collection
    {
        return User::all();
    }
}
```

## Related Classes

- [BaseAction](./base-action) - For command operations
- [BaseModel](./base-model) - For data operations
- [BaseDTO](./base-dto) - For data transfer
- [BaseAddon](./base-addon) - For service registration

## Next Steps

- [Learn about actions](./base-action)
- [Explore DTOs](./base-dto)
- [See complete examples](../../examples/)