<?php
return [
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:3000'),
    'roles' => [
        'owner' => ['organization.manage','team.manage','customers.read','customers.write','devices.read','devices.write','repairs.read','repairs.write','repairs.assign','repairs.diagnose','repairs.transition','repairs.deliver','inventory.read','inventory.write','finance.read','finance.write','reports.read','warranty.manage'],
        'manager' => ['customers.read','customers.write','devices.read','devices.write','repairs.read','repairs.write','repairs.assign','repairs.diagnose','repairs.transition','repairs.deliver','inventory.read','inventory.write','finance.read','finance.write','reports.read','warranty.manage'],
        'receptionist' => ['customers.read','customers.write','devices.read','devices.write','repairs.read','repairs.write','repairs.deliver'],
        'technician' => ['repairs.read','repairs.diagnose','repairs.transition','inventory.read'],
        'inventory_manager' => ['inventory.read','inventory.write'],
        'accountant' => ['finance.read','finance.write','reports.read'],
    ],
];
