# Examples

Practical examples of using Filament Twist to build real-world applications.

## Basic Blog Addon

Here's a complete example of creating a blog management addon.

### 1. Create the Addon Structure

```bash
php artisan twist:make BlogManagement --group=Content
```

### 2. Define the Addon

```php
<?php
// app/Addons/Content/BlogManagement/twist.php

use Twist\Addons\AddonRegistrar;
use App\Addons\Content\BlogManagement\BlogManagementAddon;

AddonRegistrar::register(
    name: 'blog-management',
    path: BlogManagementAddon::class,
    panels: ['admin', 'editor']
);
```

### 3. Create the Addon Class

```php
<?php
// app/Addons/Content/BlogManagement/BlogManagementAddon.php

namespace App\Addons\Content\BlogManagement;

use Twist\Base\BaseAddon;
use Twist\Contracts\HasMigration;
use Twist\Contracts\HasRouteApi;
use Filament\Panel;

class BlogManagementAddon extends BaseAddon implements HasMigration, HasRouteApi
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
            Resources\TagResource::class,
        ]);

        $panel->pages([
            Pages\BlogDashboard::class,
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

### 4. Create Models

```php
<?php
// app/Addons/Content/BlogManagement/Models/Post.php

namespace App\Addons\Content\BlogManagement\Models;

use Twist\Base\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Post extends BaseModel
{
    protected $fillable = [
        'title',
        'slug',
        'content',
        'excerpt',
        'featured_image',
        'status',
        'published_at',
        'category_id',
        'author_id',
    ];

    protected $casts = [
        'published_at' => 'datetime',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'author_id');
    }
}
```

### 5. Create Filament Resources

```php
<?php
// app/Addons/Content/BlogManagement/Resources/PostResource.php

namespace App\Addons\Content\BlogManagement\Resources;

use Filament\Forms;
use Filament\Tables;
use Filament\Resources\Resource;
use App\Addons\Content\BlogManagement\Models\Post;

class PostResource extends Resource
{
    protected static ?string $model = Post::class;

    protected static ?string $navigationIcon = 'heroicon-o-document-text';

    protected static ?string $navigationGroup = 'Blog';

    public static function form(Forms\Form $form): Forms\Form
    {
        return $form
            ->schema([
                Forms\Components\TextInput::make('title')
                    ->required()
                    ->live(onBlur: true)
                    ->afterStateUpdated(fn ($state, callable $set) => 
                        $set('slug', \Illuminate\Support\Str::slug($state))
                    ),

                Forms\Components\TextInput::make('slug')
                    ->required()
                    ->unique(Post::class, 'slug', ignoreRecord: true),

                Forms\Components\Select::make('category_id')
                    ->relationship('category', 'name')
                    ->required(),

                Forms\Components\Select::make('tags')
                    ->relationship('tags', 'name')
                    ->multiple()
                    ->preload(),

                Forms\Components\Textarea::make('excerpt')
                    ->rows(3),

                Forms\Components\RichEditor::make('content')
                    ->required()
                    ->columnSpanFull(),

                Forms\Components\FileUpload::make('featured_image')
                    ->image()
                    ->directory('blog'),

                Forms\Components\Select::make('status')
                    ->options([
                        'draft' => 'Draft',
                        'published' => 'Published',
                        'archived' => 'Archived',
                    ])
                    ->default('draft'),

                Forms\Components\DateTimePicker::make('published_at'),
            ]);
    }

    public static function table(Tables\Table $table): Tables\Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('title')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\TextColumn::make('category.name')
                    ->sortable(),

                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'draft' => 'gray',
                        'published' => 'success',
                        'archived' => 'warning',
                    }),

                Tables\Columns\TextColumn::make('published_at')
                    ->dateTime()
                    ->sortable(),

                Tables\Columns\TextColumn::make('author.name')
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->options([
                        'draft' => 'Draft',
                        'published' => 'Published',
                        'archived' => 'Archived',
                    ]),
                
                Tables\Filters\SelectFilter::make('category')
                    ->relationship('category', 'name'),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListPosts::route('/'),
            'create' => Pages\CreatePost::route('/create'),
            'edit' => Pages\EditPost::route('/{record}/edit'),
        ];
    }
}
```

### 6. Create API Routes

```php
<?php
// app/Addons/Content/BlogManagement/Routes/api.php

use Illuminate\Support\Facades\Route;
use App\Addons\Content\BlogManagement\Controllers\Api\PostController;

Route::prefix('blog')->group(function () {
    Route::get('posts', [PostController::class, 'index']);
    Route::get('posts/{post}', [PostController::class, 'show']);
    Route::get('categories', [PostController::class, 'categories']);
    Route::get('tags', [PostController::class, 'tags']);
});
```

### 7. Setup and Run

```bash
# Register the addon
php artisan twist:setup

# Run migrations
php artisan twist:migrate

# Access your blog management at /admin
```

## Multi-Tenant SaaS Application

Example of building a multi-tenant SaaS application with customer portals.

### 1. Tenant Model

```php
<?php
// app/Models/Tenant.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'domain',
        'database',
        'plan',
        'is_active',
        'settings',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'settings' => 'json',
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }
}
```

### 2. Tenant Service

```php
<?php
// app/Services/TenantService.php

namespace App\Services;

use App\Models\Tenant;
use Twist\Services\Tenancy\MigrateTenancyService;
use Illuminate\Support\Facades\DB;

class TenantService
{
    public function createTenant(array $data): Tenant
    {
        $tenant = Tenant::create([
            'name' => $data['name'],
            'slug' => \Illuminate\Support\Str::slug($data['name']),
            'domain' => $data['domain'] ?? null,
            'plan' => $data['plan'] ?? 'basic',
            'is_active' => true,
        ]);

        // Create tenant database
        $this->createTenantDatabase($tenant);

        // Run tenant migrations
        MigrateTenancyService::make()->migrateAddons($tenant);

        return $tenant;
    }

    protected function createTenantDatabase(Tenant $tenant): void
    {
        $dbName = 'tenant_' . $tenant->id;
        
        DB::statement("CREATE DATABASE IF NOT EXISTS {$dbName}");
        
        $tenant->update(['database' => $dbName]);
    }
}
```

### 3. Tenant Middleware

```php
<?php
// app/Http/Middleware/IdentifyTenant.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Tenant;
use Twist\Facades\Tenancy;
use Twist\Tenancy\DTO\TenantDTO;

class IdentifyTenant
{
    public function handle(Request $request, Closure $next)
    {
        $tenant = $this->resolveTenant($request);

        if ($tenant) {
            $tenantDTO = new TenantDTO(
                id: $tenant->id,
                database: $tenant->database,
                attributes: $tenant->toArray()
            );

            Tenancy::initialize($tenantDTO);
        }

        $response = $next($request);

        Tenancy::end();

        return $response;
    }

    protected function resolveTenant(Request $request): ?Tenant
    {
        // Resolve by subdomain
        $host = $request->getHost();
        $subdomain = explode('.', $host)[0];

        if ($subdomain !== 'www' && $subdomain !== config('app.domain')) {
            return Tenant::where('slug', $subdomain)
                ->where('is_active', true)
                ->first();
        }

        // Resolve by custom domain
        return Tenant::where('domain', $host)
            ->where('is_active', true)
            ->first();
    }
}
```

### 4. Customer Panel Provider

```php
<?php
// app/Providers/CustomerPanelProvider.php

namespace App\Providers;

use Twist\Support\TwistPanelProvider;
use Twist\Classes\TwistClass;
use Filament\Panel;

class CustomerPanelProvider extends TwistPanelProvider
{
    public function twist(TwistClass $twist): void
    {
        $twist
            ->setPath('dashboard')
            ->setColor('#059669')
            ->setPrefixTable('customer_')
            ->setMiddleware(\App\Http\Middleware\IdentifyTenant::class)
            ->setMiddleware(\App\Http\Middleware\CustomerAuth::class);
    }

    public function panel(Panel $panel): Panel
    {
        return parent::panel($panel)
            ->authGuard('customer')
            ->login(\App\Filament\Customer\Pages\Login::class)
            ->registration(\App\Filament\Customer\Pages\Register::class)
            ->brandName(fn () => auth('customer')->user()?->tenant?->name ?? 'Customer Portal');
    }
}
```

## E-commerce Platform

Example of building an e-commerce platform with multiple addons.

### 1. Product Management Addon

```php
<?php
// app/Addons/Ecommerce/ProductManagement/ProductManagementAddon.php

namespace App\Addons\Ecommerce\ProductManagement;

use Twist\Base\BaseAddon;
use Twist\Contracts\HasMigration;
use Twist\Contracts\HasRouteApi;
use Twist\Contracts\HasHooks;
use Filament\Panel;

class ProductManagementAddon extends BaseAddon implements 
    HasMigration, 
    HasRouteApi, 
    HasHooks
{
    public function boot(Panel $panel): void
    {
        $panel->resources([
            Resources\ProductResource::class,
            Resources\CategoryResource::class,
            Resources\BrandResource::class,
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

    public function hooks(): void
    {
        add_action('product.created', [$this, 'onProductCreated']);
        add_action('product.updated', [$this, 'onProductUpdated']);
    }

    public function onProductCreated($product)
    {
        // Index in search engine
        \App\Jobs\IndexProductJob::dispatch($product);
    }

    public function onProductUpdated($product)
    {
        // Clear cache
        cache()->forget("product.{$product->id}");
    }
}
```

### 2. Order Management Addon

```php
<?php
// app/Addons/Ecommerce/OrderManagement/OrderManagementAddon.php

namespace App\Addons\Ecommerce\OrderManagement;

use Twist\Base\BaseAddon;
use Twist\Contracts\HasMigration;
use Twist\Contracts\HasDispatcher;
use Filament\Panel;

class OrderManagementAddon extends BaseAddon implements 
    HasMigration, 
    HasDispatcher
{
    public function boot(Panel $panel): void
    {
        $panel->resources([
            Resources\OrderResource::class,
            Resources\OrderItemResource::class,
        ]);

        $panel->widgets([
            Widgets\OrderStatsWidget::class,
            Widgets\RecentOrdersWidget::class,
        ]);
    }

    public function pathMigrations(): string
    {
        return __DIR__ . '/Database/Migrations';
    }

    public function pathDispatchers(): string
    {
        return __DIR__ . '/Dispatchers';
    }
}
```

### 3. Setup Multiple Addons

```bash
# Create addons
php artisan twist:make ProductManagement --group=Ecommerce
php artisan twist:make OrderManagement --group=Ecommerce  
php artisan twist:make PaymentGateway --group=Ecommerce
php artisan twist:make InventoryManagement --group=Ecommerce

# Register all addons
php artisan twist:setup

# Run migrations
php artisan twist:migrate
```

## Advanced Multi-Panel Setup

Example of a complex application with multiple panels and roles.

### 1. Panel Configuration

```php
<?php
// config/twist.php

return [
    'panels' => [
        'super-admin',  // Super admin panel
        'admin',        // Regular admin panel
        'manager',      // Manager panel
        'customer',     // Customer portal
        'api',          // API-only panel
    ],
];
```

### 2. Super Admin Panel

```php
<?php
// app/Providers/SuperAdminPanelProvider.php

class SuperAdminPanelProvider extends TwistPanelProvider
{
    public function twist(TwistClass $twist): void
    {
        $twist
            ->setPath('super-admin')
            ->setColor('#dc2626')
            ->setDomain('secure.example.com')
            ->setPrefixTable('sa_')
            ->setMiddleware(\App\Http\Middleware\SuperAdminOnly::class);
    }
}
```

### 3. Manager Panel

```php
<?php
// app/Providers/ManagerPanelProvider.php

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

    public function panel(Panel $panel): Panel
    {
        return parent::panel($panel)
            ->authGuard('manager')
            ->navigationGroups([
                'Sales' => NavigationGroup::make()->icon('heroicon-o-chart-bar'),
                'Reports' => NavigationGroup::make()->icon('heroicon-o-document-chart-bar'),
            ]);
    }
}
```

### 4. API-Only Panel

```php
<?php
// app/Providers/ApiPanelProvider.php

class ApiPanelProvider extends TwistPanelProvider
{
    public function twist(TwistClass $twist): void
    {
        $twist
            ->setPath('api')
            ->disloadSetupAddons() // API doesn't need UI addons
            ->setMiddleware(\App\Http\Middleware\ApiAuthentication::class);
    }

    public function panel(Panel $panel): Panel
    {
        // API panel doesn't need UI components
        return $panel
            ->id('api')
            ->path('api');
    }
}
```

## Development Workflow

### 1. Local Development Setup

```bash
#!/bin/bash
# scripts/dev-setup.sh

# Install dependencies
composer install
npm install

# Setup environment
cp .env.example .env
php artisan key:generate

# Setup database
php artisan migrate

# Setup Twist
php artisan twist:setup
php artisan twist:migrate

# Create test tenant
php artisan tinker --execute="
\App\Services\TenantService::make()->createTenant([
    'name' => 'Test Company',
    'domain' => 'test.localhost',
    'plan' => 'premium'
]);
"

# Start development servers
php artisan serve &
npm run dev
```

### 2. Testing Addons

```php
<?php
// tests/Feature/AddonTest.php

namespace Tests\Feature;

use Tests\TestCase;
use Twist\Facades\Twist;

class AddonTest extends TestCase
{
    public function test_addon_loads_correctly()
    {
        $this->artisan('twist:setup');
        
        $addons = Twist::getAddons();
        
        $this->assertGreaterThan(0, count($addons));
        $this->assertTrue(Twist::hasAddon('blog-management'));
    }

    public function test_addon_migrations_run()
    {
        $this->artisan('twist:migrate');
        
        $this->assertDatabaseHasTable('posts');
        $this->assertDatabaseHasTable('categories');
    }
}
```

## Next Steps

- [Learn about Configuration](../guide/configuration.md)
- [View API Reference](../api/twist-class.md)