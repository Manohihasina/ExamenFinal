<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Services\FirebaseService;

echo "Testing Firebase synchronization...\n";

try {
    $firebaseService = new FirebaseService();
    
    echo "Firestore available: " . ($firebaseService->isFirestoreAvailable() ? 'YES' : 'NO') . "\n";
    
    if ($firebaseService->isFirestoreAvailable()) {
        $testData = [
            'id' => 999,
            'name' => 'Test Intervention',
            'price' => 100.50,
            'duration_seconds' => 3600,
            'description' => 'Test description',
            'is_active' => true,
            'created_at' => now()->toISOString(),
            'updated_at' => now()->toISOString()
        ];
        
        $result = $firebaseService->storeDocument('interventions', 'test_999', $testData);
        echo "Store result: " . ($result ? 'SUCCESS' : 'FAILED') . "\n";
        
        // Try to read it back
        $documents = $firebaseService->getFirestoreCollection('interventions');
        echo "Documents in interventions collection: " . count($documents) . "\n";
        
        foreach ($documents as $doc) {
            if ($doc['id'] == 999 || $doc['id'] == 'test_999') {
                echo "Found test document: " . json_encode($doc, JSON_PRETTY_PRINT) . "\n";
            }
        }
    } else {
        echo "Firestore is not available - check Firebase configuration\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
