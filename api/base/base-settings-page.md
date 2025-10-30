# BaseSettingsPage

Foundation for Filament settings pages.

## Overview

`BaseSettingsPage` provides a foundation for creating settings pages in Filament Twist addons. It includes form handling, automatic save actions, and integration with the Filament panel system.

## Key Features

- **Form Integration**: Built-in form handling
- **Automatic Save Action**: Pre-configured save button
- **Settings Contract**: Implements iSettings interface
- **Customizable View**: Override default settings layout

## Basic Usage

### Simple Settings Page

```php
<?php

namespace App\Addons\UserManagement\Pages;

use Twist\Support\BaseSettingsPage;
use Twist\Contracts\iSettings;
use Filament\Forms\Form;
use Filament\Forms\Components\{TextInput, Toggle, Select};

class UserSettingsPage extends BaseSettingsPage implements iSettings
{
    protected static ?string $navigationIcon = 'heroicon-o-cog-6-tooth';
    protected static ?string $navigationLabel = 'User Settings';
    protected static ?string $title = 'User Management Settings';

    public function mount(): void
    {
        $this->form->fill([
            'default_role' => config('user-management.default_role', 'user'),
            'require_email_verification' => config('user-management.require_email_verification', false),
            'max_login_attempts' => config('user-management.max_login_attempts', 5),
        ]);
    }

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                TextInput::make('default_role')
                    ->label('Default User Role')
                    ->required()
                    ->placeholder('user'),
                
                Toggle::make('require_email_verification')
                    ->label('Require Email Verification')
                    ->helperText('New users must verify their email before accessing the system'),
                
                TextInput::make('max_login_attempts')
                    ->label('Maximum Login Attempts')
                    ->numeric()
                    ->required()
                    ->minValue(1)
                    ->maxValue(10),
            ]);
    }

    public function save(array $data): void
    {
        // Save to configuration
        config([
            'user-management.default_role' => $data['default_role'],
            'user-management.require_email_verification' => $data['require_email_verification'],
            'user-management.max_login_attempts' => $data['max_login_attempts'],
        ]);

        $this->notify('success', 'Settings saved successfully');
    }
}
```

### Settings Page with Sections

```php
<?php

namespace App\Addons\UserManagement\Pages;

use Twist\Support\BaseSettingsPage;
use Twist\Contracts\iSettings;
use Filament\Forms\Form;
use Filament\Forms\Components\{Section, TextInput, Toggle, Select, Textarea};

class UserSettingsPage extends BaseSettingsPage implements iSettings
{
    protected static ?string $navigationIcon = 'heroicon-o-cog-6-tooth';
    protected static ?string $title = 'User Management Settings';

    public function mount(): void
    {
        $this->form->fill([
            // Authentication settings
            'require_email_verification' => config('user-management.auth.require_email_verification'),
            'max_login_attempts' => config('user-management.auth.max_login_attempts'),
            'lockout_duration' => config('user-management.auth.lockout_duration'),
            
            // User settings
            'default_role' => config('user-management.users.default_role'),
            'allow_registration' => config('user-management.users.allow_registration'),
            
            // Notification settings
            'welcome_email' => config('user-management.notifications.welcome_email'),
            'admin_notifications' => config('user-management.notifications.admin_notifications'),
        ]);
    }

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                Section::make('Authentication')
                    ->description('Configure authentication and security settings')
                    ->schema([
                        Toggle::make('require_email_verification')
                            ->label('Require Email Verification'),
                        
                        TextInput::make('max_login_attempts')
                            ->label('Maximum Login Attempts')
                            ->numeric()
                            ->required()
                            ->minValue(1)
                            ->maxValue(10),
                        
                        TextInput::make('lockout_duration')
                            ->label('Lockout Duration (minutes)')
                            ->numeric()
                            ->required()
                            ->minValue(1),
                    ]),

                Section::make('User Management')
                    ->description('Configure default user settings')
                    ->schema([
                        Select::make('default_role')
                            ->label('Default Role')
                            ->options([
                                'user' => 'User',
                                'moderator' => 'Moderator',
                                'admin' => 'Administrator',
                            ])
                            ->required(),
                        
                        Toggle::make('allow_registration')
                            ->label('Allow Public Registration'),
                    ]),

                Section::make('Notifications')
                    ->description('Configure email notifications')
                    ->schema([
                        Toggle::make('welcome_email')
                            ->label('Send Welcome Email'),
                        
                        Toggle::make('admin_notifications')
                            ->label('Admin Notifications'),
                    ]),
            ]);
    }

    public function save(array $data): void
    {
        // Update configuration files or database
        $this->updateAuthSettings($data);
        $this->updateUserSettings($data);
        $this->updateNotificationSettings($data);

        $this->notify('success', 'Settings saved successfully');
    }

    protected function updateAuthSettings(array $data): void
    {
        config([
            'user-management.auth.require_email_verification' => $data['require_email_verification'],
            'user-management.auth.max_login_attempts' => $data['max_login_attempts'],
            'user-management.auth.lockout_duration' => $data['lockout_duration'],
        ]);
    }

    protected function updateUserSettings(array $data): void
    {
        config([
            'user-management.users.default_role' => $data['default_role'],
            'user-management.users.allow_registration' => $data['allow_registration'],
        ]);
    }

    protected function updateNotificationSettings(array $data): void
    {
        config([
            'user-management.notifications.welcome_email' => $data['welcome_email'],
            'user-management.notifications.admin_notifications' => $data['admin_notifications'],
        ]);
    }
}
```

### Settings Page with Database Storage

```php
<?php

namespace App\Addons\UserManagement\Pages;

use Twist\Support\BaseSettingsPage;
use Twist\Contracts\iSettings;
use App\Addons\UserManagement\Models\Setting;
use Filament\Forms\Form;
use Filament\Forms\Components\{TextInput, Toggle, Textarea};

class UserSettingsPage extends BaseSettingsPage implements iSettings
{
    protected static ?string $navigationIcon = 'heroicon-o-cog-6-tooth';
    protected static ?string $title = 'User Management Settings';

    public function mount(): void
    {
        $settings = Setting::pluck('value', 'key')->toArray();
        
        $this->form->fill([
            'site_name' => $settings['site_name'] ?? 'My Application',
            'registration_enabled' => (bool) ($settings['registration_enabled'] ?? true),
            'welcome_message' => $settings['welcome_message'] ?? 'Welcome to our platform!',
        ]);
    }

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                TextInput::make('site_name')
                    ->label('Site Name')
                    ->required(),
                
                Toggle::make('registration_enabled')
                    ->label('Enable Registration'),
                
                Textarea::make('welcome_message')
                    ->label('Welcome Message')
                    ->rows(3),
            ]);
    }

    public function save(array $data): void
    {
        foreach ($data as $key => $value) {
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }

        $this->notify('success', 'Settings saved successfully');
    }
}
```

## Advanced Usage

### Settings Page with Validation

```php
<?php

namespace App\Addons\UserManagement\Pages;

use Twist\Support\BaseSettingsPage;
use Twist\Contracts\iSettings;
use Filament\Forms\Form;
use Filament\Forms\Components\{TextInput, Toggle};
use Illuminate\Validation\ValidationException;

class UserSettingsPage extends BaseSettingsPage implements iSettings
{
    protected static ?string $navigationIcon = 'heroicon-o-cog-6-tooth';

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                TextInput::make('api_key')
                    ->label('API Key')
                    ->required()
                    ->rules(['regex:/^[a-zA-Z0-9]{32}$/']),
                
                TextInput::make('max_users')
                    ->label('Maximum Users')
                    ->numeric()
                    ->required()
                    ->minValue(1)
                    ->maxValue(10000),
            ]);
    }

    public function save(array $data): void
    {
        // Additional validation
        $this->validateApiKey($data['api_key']);
        $this->validateUserLimit($data['max_users']);

        // Save settings
        config([
            'user-management.api_key' => $data['api_key'],
            'user-management.max_users' => $data['max_users'],
        ]);

        $this->notify('success', 'Settings saved successfully');
    }

    protected function validateApiKey(string $apiKey): void
    {
        // Check if API key is already in use
        if (Setting::where('key', 'api_key')
                  ->where('value', $apiKey)
                  ->exists()) {
            throw ValidationException::withMessages([
                'api_key' => 'This API key is already in use.',
            ]);
        }
    }

    protected function validateUserLimit(int $maxUsers): void
    {
        $currentUsers = User::count();
        
        if ($currentUsers > $maxUsers) {
            throw ValidationException::withMessages([
                'max_users' => "Cannot set limit below current user count ({$currentUsers}).",
            ]);
        }
    }
}
```

### Settings Page with File Uploads

```php
<?php

namespace App\Addons\UserManagement\Pages;

use Twist\Support\BaseSettingsPage;
use Twist\Contracts\iSettings;
use Filament\Forms\Form;
use Filament\Forms\Components\{FileUpload, TextInput};
use Illuminate\Support\Facades\Storage;

class UserSettingsPage extends BaseSettingsPage implements iSettings
{
    protected static ?string $navigationIcon = 'heroicon-o-cog-6-tooth';

    public function mount(): void
    {
        $this->form->fill([
            'logo' => config('user-management.logo'),
            'company_name' => config('user-management.company_name'),
        ]);
    }

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                FileUpload::make('logo')
                    ->label('Company Logo')
                    ->image()
                    ->disk('public')
                    ->directory('logos')
                    ->maxSize(2048),
                
                TextInput::make('company_name')
                    ->label('Company Name')
                    ->required(),
            ]);
    }

    public function save(array $data): void
    {
        // Handle file upload
        if (isset($data['logo'])) {
            $oldLogo = config('user-management.logo');
            if ($oldLogo && Storage::disk('public')->exists($oldLogo)) {
                Storage::disk('public')->delete($oldLogo);
            }
        }

        config([
            'user-management.logo' => $data['logo'],
            'user-management.company_name' => $data['company_name'],
        ]);

        $this->notify('success', 'Settings saved successfully');
    }
}
```

## Properties

### Navigation Properties

```php
protected static ?string $navigationIcon = 'heroicon-o-cog-6-tooth';
protected static ?string $navigationLabel = 'Settings';
protected static ?string $navigationGroup = 'Administration';
protected static ?int $navigationSort = 100;
```

### Page Properties

```php
protected static ?string $title = 'Settings';
protected static ?string $navigationLabel = 'Settings';
protected string $view = 'custom-settings-view';
```

## Methods

### `mount()`

Initialize the form with current settings values.

```php
public function mount(): void
{
    $this->form->fill([
        'setting_key' => $settingValue,
    ]);
}
```

### `form()`

Define the form schema with input components.

```php
public function form(Form $form): Form
{
    return $form->schema([
        // Form components
    ]);
}
```

### `save()`

Handle saving the form data. Must be implemented when using iSettings interface.

```php
public function save(array $data): void
{
    // Save logic
}
```

### `getHeaderActions()`

Override to customize header actions.

```php
protected function getHeaderActions(): array
{
    return [
        Action::make('Reset')
            ->icon('heroicon-o-arrow-path')
            ->action(fn() => $this->reset()),
        parent::getHeaderActions(),
    ];
}
```

## Custom Views

### Custom Settings Layout

```php
// resources/views/custom-settings.blade.php
<x-filament-panels::page>
    <div class="space-y-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6">
            {{ $this->form }}
        </div>
        
        <div class="flex justify-end">
            {{ $this->getHeaderActions() }}
        </div>
    </div>
</x-filament-panels::page>
```

### Settings with Tabs

```php
// In the settings page class
protected string $view = 'user-management::settings-with-tabs';

// In the view file
<x-filament-panels::page>
    <x-filament::tabs>
        <x-filament::tabs.item tab="general">General</x-filament::tabs.item>
        <x-filament::tabs.item tab="security">Security</x-filament::tabs.item>
        <x-filament::tabs.item tab="notifications">Notifications</x-filament::tabs.item>
    </x-filament::tabs>
    
    <div class="mt-6">
        {{ $this->form }}
    </div>
</x-filament-panels::page>
```

## Testing Settings Pages

### Feature Testing

```php
<?php

namespace Tests\Feature;

use App\Addons\UserManagement\Pages\UserSettingsPage;
use Filament\Testing\TestCase;
use Livewire\Livewire;

class UserSettingsPageTest extends TestCase
{
    public function test_can_render_settings_page(): void
    {
        $this->actingAs($this->createAdminUser());

        Livewire::test(UserSettingsPage::class)
            ->assertSuccessful();
    }

    public function test_can_save_settings(): void
    {
        $this->actingAs($this->createAdminUser());

        Livewire::test(UserSettingsPage::class)
            ->fillForm([
                'default_role' => 'moderator',
                'require_email_verification' => true,
            ])
            ->call('save')
            ->assertHasNoFormErrors();

        $this->assertEquals('moderator', config('user-management.default_role'));
        $this->assertTrue(config('user-management.require_email_verification'));
    }

    public function test_validates_required_fields(): void
    {
        $this->actingAs($this->createAdminUser());

        Livewire::test(UserSettingsPage::class)
            ->fillForm([
                'default_role' => '',
            ])
            ->call('save')
            ->assertHasFormErrors(['default_role']);
    }
}
```

## Best Practices

### 1. Organize Settings Logically

```php
// Good: Group related settings
Section::make('Authentication')
    ->schema([
        // Auth-related settings
    ]),

Section::make('Email Settings')
    ->schema([
        // Email-related settings
    ]),
```

### 2. Provide Clear Labels and Help Text

```php
TextInput::make('max_login_attempts')
    ->label('Maximum Login Attempts')
    ->helperText('Users will be locked out after this many failed attempts')
    ->required()
    ->minValue(1)
    ->maxValue(10),
```

### 3. Use Appropriate Input Types

```php
// Use Toggle for boolean settings
Toggle::make('feature_enabled')
    ->label('Enable Feature'),

// Use Select for predefined options
Select::make('theme')
    ->options([
        'light' => 'Light',
        'dark' => 'Dark',
        'auto' => 'Auto',
    ]),

// Use TextInput with validation for text
TextInput::make('api_endpoint')
    ->url()
    ->required(),
```

### 4. Handle Errors Gracefully

```php
public function save(array $data): void
{
    try {
        $this->saveSettings($data);
        $this->notify('success', 'Settings saved successfully');
    } catch (\Exception $e) {
        $this->notify('danger', 'Failed to save settings: ' . $e->getMessage());
    }
}
```

## Integration Patterns

### Service Integration

```php
public function save(array $data): void
{
    SettingsService::make()->updateSettings($data);
    $this->notify('success', 'Settings saved successfully');
}
```

### Action Integration

```php
public function save(array $data): void
{
    UpdateSettingsAction::make($data);
    $this->notify('success', 'Settings saved successfully');
}
```

### Event Integration

```php
public function save(array $data): void
{
    $oldSettings = $this->getCurrentSettings();
    $this->saveSettings($data);
    
    event(new SettingsUpdated($oldSettings, $data));
    
    $this->notify('success', 'Settings saved successfully');
}
```

## Related Classes

- [BaseAddon](./base-addon) - For settings page registration
- [BaseService](./base-service) - For settings business logic
- [BaseAction](./base-action) - For settings operations
- [BaseModel](./base-model) - For settings persistence

## Next Steps

- [Learn about addon structure](./base-addon)
- [Explore services](./base-service)
- [See complete examples](../../examples/)