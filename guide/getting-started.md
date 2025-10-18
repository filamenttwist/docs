# Getting Started

Filament Twist is a powerful Laravel package that extends Filament with a modular addon architecture and multi-tenancy support. It allows you to build scalable, maintainable applications with reusable components.

## What is Filament Twist?

Filament Twist provides:

- **Modular Architecture**: Create self-contained addons with their own migrations, routes, and resources
- **Multi-Tenancy**: Built-in database isolation for SaaS applications
- **Filament Integration**: Seamless integration with Filament admin panels
- **Developer Tools**: Powerful Artisan commands for project management

## Requirements

- PHP 8.1+
- Laravel 11.0+ or 12.0+
- Filament 4.0+

## Installation

Install Filament Twist via Composer:

```bash
composer require twist/twist
```

### Publish Configuration

Publish the configuration files:

```bash
php artisan vendor:publish --tag=twist
```

This will publish:
- `config/twist.php` - Main configuration file
- `config/tenancy.php` - Multi-tenancy configuration (if using tenancy features)

### Run Migrations

Run the package migrations to create the necessary database tables:

```bash
php artisan migrate
```

This creates the `twist_addons` table for managing your addons.

## Basic Setup

### 1. Create a Panel Provider

Create a new panel provider that extends Twist's base provider:

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
            ->setColor('#0ea5e9')
            ->setDomain(null); // Use null for main domain
    }
}
```

### 2. Register the Provider

Add your panel provider to `config/app.php`:

```php
'providers' => [
    // ... other providers
    App\Providers\AdminPanelProvider::class,
],
```

### 3. Configure Addon Pools

Configure where your addons will be located. In your `AppServiceProvider`:

```php
use Twist\Addons\AddonsPool;

public function boot()
{
    // Set up addon pool paths
    AddonsPool::setPoolPath(app_path('Addons'));
    
    // Scan for addons
    AddonsPool::scan();
}
```

## Next Steps

- [Create your first addon](./creating-addons.md)
- [Learn about multi-tenancy](./multi-tenancy.md)
- [Explore console commands](./console-commands.md)
- [Configure your panels](./panel-configuration.md)