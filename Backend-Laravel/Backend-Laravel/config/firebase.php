<?php

return [
    'project_id' => env('FIREBASE_PROJECT_ID'),
    'key_file' => env('FIREBASE_KEY_FILE', 'storage/app/firebase_credentials.json'),
    'database_url' => env('FIREBASE_DATABASE_URL'),
    'messaging_sender_id' => env('FIREBASE_MESSAGING_SENDER_ID'),
    'app_id' => env('FIREBASE_APP_ID'),
];
