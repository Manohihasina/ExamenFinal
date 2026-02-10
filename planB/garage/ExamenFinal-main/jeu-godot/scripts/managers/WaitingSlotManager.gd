extends Area2D

const RepairSlotServiceGame = preload("res://scripts/services/RepairSlotServiceGame.gd")

@export var slot_number := 3  # Waiting slot ID

var repair_slot_service: RepairSlotServiceGame
var occupied := false
var current_car: Node2D
var payment_polling_timer: Timer

signal car_departed(car_id: String)

func _ready():
	repair_slot_service = RepairSlotServiceGame.new()
	add_child(repair_slot_service)
	
	# Configurer le timer de polling pour les paiements
	payment_polling_timer = Timer.new()
	add_child(payment_polling_timer)
	payment_polling_timer.wait_time = 3.0  # Polling toutes les 3 secondes
	payment_polling_timer.timeout.connect(_poll_payments)
	
	# Connecter le signal body_entered (éviter les doubles connexions)
	var call = Callable(self, "_on_body_entered")
	if not is_connected("body_entered", call):
		connect("body_entered", call)

func _on_body_entered(body):
	if occupied:
		return
	
	if body.is_in_group("cars"):
		lock_car(body)

func lock_car(car: Node2D):
	if occupied:
		return
	
	occupied = true
	current_car = car
	car.is_locked = true
	car.global_position = global_position
	
	print("🚗 Voiture verrouillée sur waiting slot, car_id: ", car.car_id)
	
	# Ajouter aux waiting slots dans Firebase
	var car_repairs = await repair_slot_service.get_car_repairs(str(car.car_id))
	var interventions := []
	var total_price := 0
	
	for repair in car_repairs:
		if repair.get("status") == "completed":
			interventions.append({
				"id": repair.id,
				"name": repair.get("interventionName", "Intervention"),
				"price": repair.get("interventionPrice", 0)
			})
			total_price += repair.get("interventionPrice", 0)
	
	var waiting_data := {
		"carId": str(car.car_id),
		"clientId": "current_user",  # À adapter selon ton système
		"interventions": interventions,
		"totalPrice": total_price,
		"createdAt": Time.get_datetime_string_from_system(),
		"status": "waiting_payment"
	}
	
	await repair_slot_service.add_to_waiting_slots(waiting_data)
	
	# Démarrer le polling des paiements
	payment_polling_timer.start()

# Polling pour vérifier si la voiture a été payée
func _poll_payments():
	if not occupied or not current_car:
		return
	
	var payment = await repair_slot_service.check_payment_for_car(str(current_car.car_id))
	
	if payment.has("id"):
		print("💰 Paiement détecté pour la voiture: ", current_car.car_id)
		_handle_payment_received(payment)

func _handle_payment_received(payment: Dictionary):
	# Arrêter le polling
	payment_polling_timer.stop()
	
	# Faire partir la voiture
	if current_car:
		print("🚗 La voiture quitte le garage...")
		car_departed.emit(str(current_car.car_id))
		
		# Animation de départ : faire rouler la voiture hors de l'écran
		_depart_car_animation()

func _depart_car_animation():
	if not current_car:
		return
	
	# Débloquer la voiture
	current_car.is_locked = false
	
	# La faire rouler vers la droite (hors de l'écran)
	var tween = create_tween()
	tween.tween_property(current_car, "global_position", Vector2(2000, current_car.global_position.y), 3.0)
	
	# Après l'animation, supprimer la voiture
	await tween.finished
	if current_car:
		current_car.queue_free()
	
	# Réinitialiser
	occupied = false
	current_car = null

func free_slot():
	if current_car:
		current_car.queue_free()
	occupied = false
	current_car = null
	payment_polling_timer.stop()
