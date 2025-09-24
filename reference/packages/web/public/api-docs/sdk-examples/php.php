<?php
// FlexPay PHP SDK Example

// Require the FlexPay PHP SDK
require_once 'vendor/autoload.php';

use FlexPay\FlexPayClient;
use FlexPay\Exception\FlexPayException;

// Initialize the FlexPay client
$flexpay = new FlexPayClient([
    'api_key' => 'your_api_key',
    'environment' => 'production', // or 'sandbox' for testing
]);

// Create a new transaction
function createTransaction() {
    global $flexpay;
    
    try {
        $transaction = $flexpay->transactions->create([
            'amount' => 1000,
            'currency' => 'ETB',
            'customer' => [
                'phoneNumber' => '+251912345678',
                'email' => 'customer@example.com',
            ],
            'items' => [
                [
                    'name' => 'Product Name',
                    'price' => 1000,
                    'quantity' => 1,
                    'description' => 'Product description',
                    'imageUrl' => 'https://example.com/product.jpg',
                ],
            ],
            'redirectUrl' => 'https://your-store.com/checkout/complete',
            'metadata' => [
                'orderId' => '12345',
            ],
        ]);
        
        echo "Transaction created: " . json_encode($transaction) . "\n";
        
        // Redirect the customer to the payment URL
        header('Location: ' . $transaction->paymentUrl);
        exit;
    } catch (FlexPayException $e) {
        echo "Error creating transaction: " . $e->getMessage() . "\n";
    }
}

// Get transaction details
function getTransaction($transactionId) {
    global $flexpay;
    
    try {
        $transaction = $flexpay->transactions->get($transactionId);
        echo "Transaction details: " . json_encode($transaction) . "\n";
        return $transaction;
    } catch (FlexPayException $e) {
        echo "Error getting transaction: " . $e->getMessage() . "\n";
    }
}

// List transactions
function listTransactions($options = []) {
    global $flexpay;
    
    try {
        $transactions = $flexpay->transactions->list([
            'page' => $options['page'] ?? 1,
            'limit' => $options['limit'] ?? 10,
            'status' => $options['status'] ?? null,
            'startDate' => $options['startDate'] ?? null,
            'endDate' => $options['endDate'] ?? null,
        ]);
        
        echo "Transactions: " . json_encode($transactions) . "\n";
        return $transactions;
    } catch (FlexPayException $e) {
        echo "Error listing transactions: " . $e->getMessage() . "\n";
    }
}

// Example: Create a transaction
// createTransaction();

// Example: Get transaction details
// getTransaction('tx_123456789');

// Example: List transactions
// listTransactions(['status' => 'COMPLETED']);

// Example: Handling a webhook
function handleWebhook() {
    global $flexpay;
    
    // Get the raw POST data
    $payload = file_get_contents('php://input');
    
    // Get the signature from the headers
    $signature = $_SERVER['HTTP_X_FLEXPAY_SIGNATURE'] ?? '';
    
    try {
        // Verify the webhook signature
        $event = $flexpay->webhooks->constructEvent($payload, $signature);
        
        // Handle different event types
        switch ($event['event']) {
            case 'transaction.created':
                echo "Transaction created: " . json_encode($event['data']) . "\n";
                // Update order status in your database
                break;
            case 'transaction.approved':
                echo "Transaction approved: " . json_encode($event['data']) . "\n";
                // Update order status in your database
                break;
            case 'transaction.completed':
                echo "Transaction completed: " . json_encode($event['data']) . "\n";
                // Fulfill the order
                break;
            case 'transaction.rejected':
                echo "Transaction rejected: " . json_encode($event['data']) . "\n";
                // Handle rejection
                break;
            case 'transaction.cancelled':
                echo "Transaction cancelled: " . json_encode($event['data']) . "\n";
                // Handle cancellation
                break;
            default:
                echo "Unknown event type: " . $event['event'] . "\n";
        }
        
        // Return a 200 response to acknowledge receipt of the webhook
        http_response_code(200);
        echo json_encode(['status' => 'success']);
    } catch (FlexPayException $e) {
        // Invalid signature
        http_response_code(400);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

// Example: Process webhook if this script is called as a webhook endpoint
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $_SERVER['REQUEST_URI'] === '/webhooks/flexpay') {
    handleWebhook();
}
?>
