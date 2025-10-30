# BaseDTO

Data Transfer Object with serialization capabilities.

## Overview

`BaseDTO` provides a foundation for creating Data Transfer Objects with automatic serialization, deserialization, and type safety. It supports nested DTOs and flexible constructor patterns.

## Key Features

- **Automatic Serialization**: Convert to/from arrays
- **Type Safety**: Leverages PHP type hints
- **Nested DTO Support**: Handles complex object graphs
- **Flexible Constructor**: Supports optional parameters

## Basic Usage

### Simple DTO

```php
<?php

namespace App\Addons\UserManagement\DTOs;

use Twist\Base\BaseDTO;

class UserDTO extends BaseDTO
{
    public function __construct(
        public string $name,
        public string $email,
        public ?int $age = null,
        public array $roles = []
    ) {}
}
```

### DTO with Validation

```php
<?php

namespace App\Addons\UserManagement\DTOs;

use Twist\Base\BaseDTO;
use InvalidArgumentException;

class UserDTO extends BaseDTO
{
    public function __construct(
        public string $name,
        public string $email,
        public ?int $age = null,
        public array $roles = []
    ) {
        $this->validate();
    }

    protected function validate(): void
    {
        if (empty($this->name)) {
            throw new InvalidArgumentException('Name cannot be empty');
        }

        if (!filter_var($this->email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Invalid email format');
        }

        if ($this->age !== null && ($this->age < 0 || $this->age > 150)) {
            throw new InvalidArgumentException('Age must be between 0 and 150');
        }
    }
}
```

### Nested DTO

```php
<?php

namespace App\Addons\UserManagement\DTOs;

use Twist\Base\BaseDTO;

class AddressDTO extends BaseDTO
{
    public function __construct(
        public string $street,
        public string $city,
        public string $country,
        public ?string $zipCode = null
    ) {}
}

class UserDTO extends BaseDTO
{
    public function __construct(
        public string $name,
        public string $email,
        public ?AddressDTO $address = null,
        public array $roles = []
    ) {}
}
```

## Usage Examples

### Creating DTOs

```php
// Create from constructor
$userDTO = new UserDTO(
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
    roles: ['admin', 'user']
);

// Create from array
$userDTO = UserDTO::fromArray([
    'name' => 'Jane Doe',
    'email' => 'jane@example.com',
    'age' => 25,
]);
```

### Serialization

```php
// Convert to array
$array = $userDTO->toArray();
// [
//     'name' => 'John Doe',
//     'email' => 'john@example.com',
//     'age' => 30,
//     'roles' => ['admin', 'user']
// ]

// Create from array
$userDTO = UserDTO::fromArray($array);
```

### Nested DTO Usage

```php
// Create nested DTO
$addressDTO = new AddressDTO(
    street: '123 Main St',
    city: 'New York',
    country: 'USA',
    zipCode: '10001'
);

$userDTO = new UserDTO(
    name: 'John Doe',
    email: 'john@example.com',
    address: $addressDTO
);

// Serialize to array (includes nested data)
$array = $userDTO->toArray();
// [
//     'name' => 'John Doe',
//     'email' => 'john@example.com',
//     'address' => [
//         'street' => '123 Main St',
//         'city' => 'New York',
//         'country' => 'USA',
//         'zipCode' => '10001'
//     ]
// ]

// Deserialize from array (reconstructs nested DTOs)
$userDTO = UserDTO::fromArray($array);
```

## Advanced Usage

### DTO with Computed Properties

```php
<?php

namespace App\Addons\UserManagement\DTOs;

use Twist\Base\BaseDTO;

class UserDTO extends BaseDTO
{
    public function __construct(
        public string $firstName,
        public string $lastName,
        public string $email,
        public ?\DateTimeInterface $birthDate = null
    ) {}

    public function getFullName(): string
    {
        return trim($this->firstName . ' ' . $this->lastName);
    }

    public function getAge(): ?int
    {
        if (!$this->birthDate) {
            return null;
        }

        return $this->birthDate->diff(new \DateTime())->y;
    }

    public function toArray(): array
    {
        $array = parent::toArray();
        
        // Add computed properties
        $array['fullName'] = $this->getFullName();
        $array['age'] = $this->getAge();
        
        return $array;
    }
}
```

### DTO with Type Casting

```php
<?php

namespace App\Addons\UserManagement\DTOs;

use Twist\Base\BaseDTO;

class UserDTO extends BaseDTO
{
    public function __construct(
        public string $name,
        public string $email,
        public ?\DateTime $createdAt = null,
        public array $metadata = []
    ) {}

    public static function fromArray(array $data): static
    {
        // Handle date string conversion
        if (isset($data['createdAt']) && is_string($data['createdAt'])) {
            $data['createdAt'] = new \DateTime($data['createdAt']);
        }

        // Handle JSON string conversion
        if (isset($data['metadata']) && is_string($data['metadata'])) {
            $data['metadata'] = json_decode($data['metadata'], true) ?? [];
        }

        return parent::fromArray($data);
    }

    public function toArray(): array
    {
        $array = parent::toArray();

        // Convert DateTime to string
        if ($this->createdAt) {
            $array['createdAt'] = $this->createdAt->format('Y-m-d H:i:s');
        }

        return $array;
    }
}
```

### Collection DTO

```php
<?php

namespace App\Addons\UserManagement\DTOs;

use Twist\Base\BaseDTO;

class UserCollectionDTO extends BaseDTO
{
    public function __construct(
        public array $users = [],
        public int $total = 0,
        public int $page = 1,
        public int $perPage = 15
    ) {}

    public static function fromArray(array $data): static
    {
        // Convert user arrays to UserDTO objects
        $users = [];
        if (isset($data['users']) && is_array($data['users'])) {
            foreach ($data['users'] as $userData) {
                $users[] = UserDTO::fromArray($userData);
            }
        }

        return new static(
            users: $users,
            total: $data['total'] ?? 0,
            page: $data['page'] ?? 1,
            perPage: $data['perPage'] ?? 15
        );
    }

    public function toArray(): array
    {
        return [
            'users' => array_map(fn($user) => $user->toArray(), $this->users),
            'total' => $this->total,
            'page' => $this->page,
            'perPage' => $this->perPage,
            'hasMorePages' => $this->total > ($this->page * $this->perPage),
        ];
    }
}
```

## Integration Patterns

### Service Integration

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

    public function updateUser(User $user, UserDTO $userData): User
    {
        $user->update($userData->toArray());
        return $user->fresh();
    }
}
```

### Action Integration

```php
<?php

namespace App\Addons\UserManagement\Actions;

use Twist\Base\BaseAction;
use App\Addons\UserManagement\DTOs\UserDTO;
use App\Addons\UserManagement\Models\User;

class CreateUserAction extends BaseAction
{
    public function handle(UserDTO $userData): User
    {
        return User::create($userData->toArray());
    }
}

// Usage
$userDTO = new UserDTO(
    name: 'John Doe',
    email: 'john@example.com'
);

$user = CreateUserAction::make($userDTO);
```

### API Integration

```php
<?php

namespace App\Http\Controllers;

use App\Addons\UserManagement\DTOs\UserDTO;
use App\Addons\UserManagement\Services\UserService;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function __construct(
        protected UserService $userService
    ) {}

    public function store(Request $request)
    {
        $userDTO = UserDTO::fromArray($request->validated());
        $user = $this->userService->createUser($userDTO);
        
        return response()->json($user, 201);
    }

    public function show(int $id)
    {
        $userDTO = $this->userService->getUserDTO($id);
        
        if (!$userDTO) {
            return response()->json(['error' => 'User not found'], 404);
        }
        
        return response()->json($userDTO->toArray());
    }
}
```

## Testing DTOs

### Unit Testing

```php
<?php

namespace Tests\Unit;

use App\Addons\UserManagement\DTOs\UserDTO;
use Tests\TestCase;

class UserDTOTest extends TestCase
{
    public function test_creates_dto_from_constructor(): void
    {
        $dto = new UserDTO(
            name: 'John Doe',
            email: 'john@example.com',
            age: 30
        );

        $this->assertEquals('John Doe', $dto->name);
        $this->assertEquals('john@example.com', $dto->email);
        $this->assertEquals(30, $dto->age);
    }

    public function test_creates_dto_from_array(): void
    {
        $data = [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'age' => 25,
        ];

        $dto = UserDTO::fromArray($data);

        $this->assertEquals('Jane Doe', $dto->name);
        $this->assertEquals('jane@example.com', $dto->email);
        $this->assertEquals(25, $dto->age);
    }

    public function test_converts_to_array(): void
    {
        $dto = new UserDTO(
            name: 'John Doe',
            email: 'john@example.com',
            age: 30
        );

        $array = $dto->toArray();

        $this->assertEquals([
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'age' => 30,
            'roles' => [],
        ], $array);
    }

    public function test_handles_nested_dtos(): void
    {
        $addressData = [
            'street' => '123 Main St',
            'city' => 'New York',
            'country' => 'USA',
        ];

        $userData = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'address' => $addressData,
        ];

        $dto = UserDTO::fromArray($userData);

        $this->assertInstanceOf(AddressDTO::class, $dto->address);
        $this->assertEquals('123 Main St', $dto->address->street);
    }
}
```

### Validation Testing

```php
<?php

namespace Tests\Unit;

use App\Addons\UserManagement\DTOs\UserDTO;
use InvalidArgumentException;
use Tests\TestCase;

class UserDTOValidationTest extends TestCase
{
    public function test_throws_exception_for_empty_name(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Name cannot be empty');

        new UserDTO(
            name: '',
            email: 'john@example.com'
        );
    }

    public function test_throws_exception_for_invalid_email(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid email format');

        new UserDTO(
            name: 'John Doe',
            email: 'invalid-email'
        );
    }

    public function test_throws_exception_for_invalid_age(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Age must be between 0 and 150');

        new UserDTO(
            name: 'John Doe',
            email: 'john@example.com',
            age: 200
        );
    }
}
```

## Best Practices

### 1. Immutable Properties

```php
// Good: Use readonly properties for immutability
class UserDTO extends BaseDTO
{
    public function __construct(
        public readonly string $name,
        public readonly string $email,
        public readonly ?int $age = null
    ) {}
}
```

### 2. Type Safety

```php
// Good: Use specific types
class UserDTO extends BaseDTO
{
    public function __construct(
        public string $name,
        public string $email,
        public ?DateTime $createdAt = null,
        public array $roles = []
    ) {}
}

// Avoid: Using mixed types
class UserDTO extends BaseDTO
{
    public function __construct(
        public $name,
        public $email,
        public $createdAt = null
    ) {}
}
```

### 3. Validation in Constructor

```php
class UserDTO extends BaseDTO
{
    public function __construct(
        public string $name,
        public string $email
    ) {
        $this->validate();
    }

    protected function validate(): void
    {
        if (empty($this->name)) {
            throw new InvalidArgumentException('Name is required');
        }

        if (!filter_var($this->email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Invalid email');
        }
    }
}
```

### 4. Factory Methods

```php
class UserDTO extends BaseDTO
{
    public static function fromModel(User $user): static
    {
        return new static(
            name: $user->name,
            email: $user->email,
            createdAt: $user->created_at
        );
    }

    public static function fromRequest(Request $request): static
    {
        return static::fromArray($request->validated());
    }
}
```

## Common Patterns

### API Response DTOs

```php
class ApiResponseDTO extends BaseDTO
{
    public function __construct(
        public mixed $data,
        public bool $success = true,
        public ?string $message = null,
        public array $errors = []
    ) {}
}
```

### Form DTOs

```php
class CreateUserFormDTO extends BaseDTO
{
    public function __construct(
        public string $name,
        public string $email,
        public string $password,
        public string $passwordConfirmation,
        public array $roles = []
    ) {
        $this->validatePasswordConfirmation();
    }

    protected function validatePasswordConfirmation(): void
    {
        if ($this->password !== $this->passwordConfirmation) {
            throw new InvalidArgumentException('Password confirmation does not match');
        }
    }
}
```

### Search DTOs

```php
class UserSearchDTO extends BaseDTO
{
    public function __construct(
        public ?string $name = null,
        public ?string $email = null,
        public ?array $roles = null,
        public int $page = 1,
        public int $perPage = 15,
        public string $sortBy = 'created_at',
        public string $sortDirection = 'desc'
    ) {}
}
```

## Related Classes

- [BaseAction](./base-action) - For DTO operations
- [BaseService](./base-service) - For DTO processing
- [BaseModel](./base-model) - For DTO persistence
- [BaseAddon](./base-addon) - For DTO registration

## Next Steps

- [Learn about actions](./base-action)
- [Explore services](./base-service)
- [See complete examples](../../examples/)