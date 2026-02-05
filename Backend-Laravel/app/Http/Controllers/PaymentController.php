<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class PaymentController extends Controller
{
    /**
     * Créer un nouveau paiement
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'firestore_id' => 'nullable|string|unique:payments,firestore_id',
            'waiting_slot_id' => 'nullable|string',
            'client_id' => 'required|string',
            'client_name' => 'required|string|max:255',
            'car_id' => 'required|string',
            'interventions' => 'required|array',
            'interventions.*.id' => 'required|string',
            'interventions.*.name' => 'required|string|max:255',
            'interventions.*.price' => 'required|numeric|min:0',
            'total_price' => 'required|numeric|min:0',
            'payment_method' => 'required|string|max:255',
            'payment_date' => 'required|date',
            'status' => 'required|string|in:paid,pending,failed,refunded',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $payment = Payment::create([
                'firestore_id' => $request->firestore_id,
                'waiting_slot_id' => $request->waiting_slot_id,
                'client_id' => $request->client_id,
                'client_name' => $request->client_name,
                'car_id' => $request->car_id,
                'interventions' => $request->interventions,
                'total_price' => $request->total_price,
                'payment_method' => $request->payment_method,
                'payment_date' => $request->payment_date,
                'status' => $request->status ?? 'paid',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Paiement enregistré avec succès',
                'data' => $payment
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'enregistrement du paiement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lister les paiements d'un client
     */
    public function index(Request $request): JsonResponse
    {
        $clientId = $request->query('client_id');
        
        if (!$clientId) {
            return response()->json([
                'success' => false,
                'message' => 'client_id est requis'
            ], 400);
        }

        $payments = Payment::forClient($clientId)
            ->with(['client', 'car'])
            ->orderBy('payment_date', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $payments
        ]);
    }

    /**
     * Afficher un paiement spécifique
     */
    public function show(string $id): JsonResponse
    {
        $payment = Payment::with(['client', 'car'])->find($id);

        if (!$payment) {
            return response()->json([
                'success' => false,
                'message' => 'Paiement non trouvé'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $payment
        ]);
    }

    /**
     * Mettre à jour le statut d'un paiement
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|string|in:paid,pending,failed,refunded',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Statut invalide',
                'errors' => $validator->errors()
            ], 422);
        }

        $payment = Payment::find($id);

        if (!$payment) {
            return response()->json([
                'success' => false,
                'message' => 'Paiement non trouvé'
            ], 404);
        }

        $payment->update(['status' => $request->status]);

        return response()->json([
            'success' => true,
            'message' => 'Statut du paiement mis à jour',
            'data' => $payment
        ]);
    }

    /**
     * Statistiques des paiements
     */
    public function stats(Request $request): JsonResponse
    {
        $clientId = $request->query('client_id');
        
        if (!$clientId) {
            return response()->json([
                'success' => false,
                'message' => 'client_id est requis'
            ], 400);
        }

        $stats = [
            'total_payments' => Payment::forClient($clientId)->count(),
            'total_amount' => Payment::forClient($clientId)->sum('total_price'),
            'recent_payments' => Payment::forClient($clientId)->recent(30)->count(),
            'recent_amount' => Payment::forClient($clientId)->recent(30)->sum('total_price'),
            'payments_by_method' => Payment::forClient($clientId)
                ->selectRaw('payment_method, COUNT(*) as count, SUM(total_price) as total')
                ->groupBy('payment_method')
                ->get(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}
