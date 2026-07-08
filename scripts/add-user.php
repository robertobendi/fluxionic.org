<?php
/**
 * Create or update an admin-panel user.
 *
 * Usage:  php scripts/add-user.php <email> <name> <role> <password>
 *         php scripts/add-user.php megh@example.org "Megh Dutta" editor "s3cret"
 *
 * Roles: viewer | editor | admin  (see Auth::ROLE_RANK).
 * Idempotent: if the email already exists, the name, role and password are
 * updated in place. Passwords are hashed with password_hash(); nothing is
 * stored in plain text.
 */

declare(strict_types=1);

$root = dirname(__DIR__);
require $root . '/vendor/autoload.php';

use Pebblestack\Core\Auth;
use Pebblestack\Core\Database;
use Pebblestack\Services\Migrator;
use Pebblestack\Services\UserRepository;

if ($argc !== 5) {
    fwrite(STDERR, "Usage: php scripts/add-user.php <email> <name> <role> <password>\n");
    exit(1);
}

[, $email, $name, $role, $password] = $argv;

$email = strtolower(trim($email));
if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
    fwrite(STDERR, "Invalid email: {$email}\n");
    exit(1);
}
if (!isset(Auth::ROLE_RANK[$role])) {
    fwrite(STDERR, "Unknown role '{$role}'. Allowed: " . implode(', ', array_keys(Auth::ROLE_RANK)) . "\n");
    exit(1);
}
if (strlen($password) < 8) {
    fwrite(STDERR, "Password must be at least 8 characters.\n");
    exit(1);
}

$db = new Database($root . '/data/pebblestack.sqlite');
(new Migrator($db, $root . '/data/migrations'))->run();
$repo = new UserRepository($db);

$existing = $repo->findByEmail($email);
if ($existing !== null) {
    $repo->update($existing->id, $email, $name, $role);
    $repo->setPassword($existing->id, Auth::hash($password));
    echo "Updated user #{$existing->id} {$email} (role: {$role}, password reset).\n";
} else {
    $id = $repo->create($email, $name, Auth::hash($password), $role);
    echo "Created user #{$id} {$email} (role: {$role}).\n";
}
