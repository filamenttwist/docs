# TwistClass API

The `TwistClass` is the core configuration class for Filament Twist. It provides methods to configure panels, addons, and system behavior.

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `$path` | `string` | `'obelaw'` | Panel URL path |
| `$color` | `string` | `'#FC4706'` | Primary panel color |
| `$domain` | `string\|null` | `null` | Panel domain |
| `$logo` | `mixed` | `null` | Panel logo configuration |
| `$connection` | `string\|null` | `null` | Database connection name |
| `$prefixTable` | `string` | `'obelaw_'` | Database table prefix |
| `$middlewares` | `array` | Standard Laravel middlewares | Panel middlewares |
| `$addons` | `array` | `[]` | Loaded addons |
| `$uploadDirectory` | `string\|null` | `null` | Upload directory path |

## Configuration Methods

### setPath(string $path)

Set the panel URL path.

```php
$twist->setPath('admin');
// Panel accessible at /admin
```

**Parameters:**
- `$path`: The URL path for the panel

**Returns:** `self`

### setColor(string $color)

Set the primary color for the panel.

```php
$twist->setColor('#0ea5e9');
```

**Parameters:**
- `$color`: Hex color code

**Returns:** `self`

### setDomain(string|null $domain)

Set a custom domain for the panel.

```php
$twist->setDomain('admin.example.com');
// or null for main domain
$twist->setDomain(null);
```

**Parameters:**
- `$domain`: Domain name or null for main domain

**Returns:** `self`

### setLogo(mixed $logo)

Set custom logo for the panel.

```php
$twist->setLogo(fn() => view('components.logo'));
```

**Parameters:**
- `$logo`: Closure returning a view or renderable content

**Returns:** `self`

### setConnection(string $connection)

Set custom database connection.

```php
$twist->setConnection('admin_db');
```

**Parameters:**
- `$connection`: Database connection name

**Returns:** `self`

### setPrefixTable(string $prefix)

Set database table prefix.

```php
$twist->setPrefixTable('admin_');
```

**Parameters:**
- `$prefix`: Table prefix string

**Returns:** `self`

### setMiddleware(string $middleware)

Add middleware to the panel.

```php
$twist->setMiddleware(\App\Http\Middleware\AdminOnly::class);
```

**Parameters:**
- `$middleware`: Middleware class name

**Returns:** `self`

### setUploadDirectory(string $directory)

Set upload directory for the panel.

```php
$twist->setUploadDirectory('uploads/admin');
```

**Parameters:**
- `$directory`: Upload directory path

**Returns:** `self`

### disloadSetupAddons()

Disable automatic addon loading.

```php
$twist->disloadSetupAddons();
```

**Returns:** `self`

## Getter Methods

### getPath()

Get the panel path.

```php
$path = $twist->getPath(); // 'admin'
```

**Returns:** `string`

### getColor()

Get the panel color.

```php
$color = $twist->getColor(); // '#0ea5e9'
```

**Returns:** `string`

### getDomain()

Get the panel domain.

```php
$domain = $twist->getDomain(); // 'admin.example.com' or null
```

**Returns:** `string|null`

### getLogo()

Get the panel logo configuration.

```php
$logo = $twist->getLogo();
```

**Returns:** `mixed`

### getConnection()

Get the database connection.

```php
$connection = $twist->getConnection(); // 'admin_db' or null
```

**Returns:** `string|null`

### getPrefixTable()

Get the table prefix.

```php
$prefix = $twist->getPrefixTable(); // 'admin_'
```

**Returns:** `string`

### getMiddlewares()

Get panel middlewares.

```php
$middlewares = $twist->getMiddlewares();
```

**Returns:** `array`

### getUploadDirectory()

Get upload directory.

```php
$directory = $twist->getUploadDirectory();
```

**Returns:** `string|null`

### getDisloadSetupAddons()

Check if addon loading is disabled.

```php
$disabled = $twist->getDisloadSetupAddons(); // boolean
```

**Returns:** `bool`

## Addon Management Methods

### loadSetupAddons(string|null $panel = null)

Load addons for a specific panel.

```php
$addons = $twist->loadSetupAddons('admin');
```

**Parameters:**
- `$panel`: Panel name (optional)

**Returns:** `array`

### getAddons()

Get all loaded addons.

```php
$addons = $twist->getAddons();
```

**Returns:** `array`

### appendAddon(BaseAddon $addon)

Add a single addon.

```php
$twist->appendAddon($myAddon);
```

**Parameters:**
- `$addon`: Instance of BaseAddon

**Returns:** `self`

### appendAddons(array $addons)

Add multiple addons.

```php
$twist->appendAddons([$addon1, $addon2]);
```

**Parameters:**
- `$addons`: Array of BaseAddon instances

**Returns:** `self`

### resetAddons()

Clear all loaded addons.

```php
$twist->resetAddons();
```

**Returns:** `self`

### hasAddon(mixed $id)

Check if an addon is available.

```php
$hasAddon = $twist->hasAddon('user-management'); // boolean
```

**Parameters:**
- `$id`: Addon identifier

**Returns:** `bool`

## Panel Management Methods

### getPanel()

Get the current panel instance.

```php
$panel = $twist->getPanel();
```

**Returns:** `Panel|null`

### setPanel(Panel $panel)

Set the panel instance.

```php
$twist->setPanel($panel);
```

**Parameters:**
- `$panel`: Filament Panel instance

**Returns:** `self`

### defaultPanel()

Get the default panel name.

```php
$default = $twist->defaultPanel(); // 'obelaw'
```

**Returns:** `string`

## Route and Dispatcher Methods

### getRoutesApi()

Get API routes from addons.

```php
$routes = $twist->getRoutesApi();
```

**Returns:** `array`

### loadDispatchers()

Load dispatchers from addons.

```php
$dispatchers = $twist->loadDispatchers();
```

**Returns:** `array`

### loadHooks()

Load hooks from addons.

```php
$twist->loadHooks();
```

**Returns:** `void`

## Static Methods

### make()

Create a new instance.

```php
$twist = TwistClass::make();
```

**Returns:** `static`

## Usage Examples

### Basic Configuration

```php
use Twist\Classes\TwistClass;

$twist = new TwistClass();
$twist
    ->setPath('admin')
    ->setColor('#dc2626')
    ->setDomain('admin.example.com')
    ->setPrefixTable('admin_')
    ->setUploadDirectory('uploads/admin');
```

### Conditional Configuration

```php
$twist = new TwistClass();

if (app()->environment('production')) {
    $twist->disloadSetupAddons();
}

if (config('app.admin_subdomain')) {
    $twist->setDomain('admin.example.com');
}

$twist
    ->setPath('admin')
    ->setColor('#0ea5e9');
```

### Working with Addons

```php
// Load addons for current panel
$addons = $twist->loadSetupAddons();

// Check specific addon
if ($twist->hasAddon('user-management')) {
    // Addon is available
}

// Get all loaded addons
$allAddons = $twist->getAddons();

// Add custom addon
$twist->appendAddon($customAddon);
```

### Route Integration

```php
// Get API routes from addons
$apiRoutes = $twist->getRoutesApi();

// Load all dispatchers
$dispatchers = $twist->loadDispatchers();

// Initialize hooks
$twist->loadHooks();
```