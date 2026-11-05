<?php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['GET','POST','PATCH','DELETE','OPTIONS'],
    'allowed_origins' => array_filter(explode(',', env('FRONTEND_URL', 'http://localhost:3000'))),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['Accept','Content-Type','X-XSRF-TOKEN','X-Requested-With','Accept-Language','Idempotency-Key'],
    'exposed_headers' => [], 'max_age' => 600, 'supports_credentials' => true,
];
