extends Node

const ApiService = preload("res://scripts/services/ApiService.gd")
const ApiServiceFirebase = preload("res://scripts/services/ApiServiceFirebase.gd")

var api_service: ApiService
var firebase_service: ApiServiceFirebase

func _ready():
	api_service = ApiService.new()
	firebase_service = ApiServiceFirebase.new()
	add_child(api_service)
	add_child(firebase_service)

# Récupérer les slots depuis Firebase
func get_repair_slots() -> Array:
	var data = await firebase_service.firebase_get("repair_slots")
	if data == null:
		return []
	
	# Si data est un array, le parcourir directement
	var slots := []
	if typeof(data) == TYPE_ARRAY:
		for i in range(data.size()):
			var slot = data[i]
			if slot and slot.has("id"):
				slots.append(slot)
	else:
		# Si data est un dictionnaire, le parcourir
		for key in data.keys():
			var slot = data[key]
			slot.id = int(key)
			slots.append(slot)
	
	return slots

# Récupérer les voitures avec réparations (API Laravel)
func get_cars_with_repairs() -> Array:
	return await api_service.get_cars_with_repairs()

# Occuper un slot (API Laravel qui synchronise Firebase)
func occupy_slot(slot_id: int, car_id: String) -> Dictionary:
	return await api_service.occupy_slot(slot_id, car_id)

# Libérer un slot
func free_slot(slot_id: int) -> Dictionary:
	return await api_service.free_slot(slot_id)

# Récupérer les réparations d'une voiture depuis Firebase
func get_car_repairs(car_id: String) -> Array:
	var all_repairs = await firebase_service.firebase_get("repairs")
	if all_repairs == null:
		return []
	
	var car_repairs := []
	# Gérer les deux cas : array ou dictionnaire
	if typeof(all_repairs) == TYPE_ARRAY:
		for i in range(all_repairs.size()):
			var repair = all_repairs[i]
			if repair.has("carId") and repair.carId == car_id:
				repair.id = str(i)  # Utiliser l'index comme ID
				car_repairs.append(repair)
	else:
		# Cas dictionnaire
		for repair_id in all_repairs.keys():
			var repair = all_repairs[repair_id]
			if repair.has("carId") and repair.carId == car_id:
				repair.id = repair_id
				car_repairs.append(repair)
	
	return car_repairs

# Démarrer une réparation (Firebase)
func start_repair(repair_id: String, intervention_id: int, duration: int) -> bool:
	var update_data := {
		"status": "in_progress",
		"startedAt": Time.get_unix_time_from_system(),
		"halfwayNotified": false,
		"completedNotified": false,
		"updatedAt": Time.get_datetime_string_from_system(),
		"interventionDuration": duration,
		"interventionId": intervention_id
	}
	return await firebase_service.firebase_update("repairs/" + repair_id, update_data)

# Mettre à jour le statut d'une réparation
func update_repair_status(repair_id: String, update_data: Dictionary) -> bool:
	update_data["updatedAt"] = Time.get_datetime_string_from_system()
	return await firebase_service.firebase_update("repairs/" + repair_id, update_data)

# Ajouter une voiture aux waiting slots (Firebase)
func add_to_waiting_slots(data: Dictionary) -> bool:
	var push_id = await firebase_service.firebase_post("waiting_slots", data)
	return push_id != ""

# Mettre à jour le statut d'un slot
func update_slot_status(slot_id: int, status: String) -> bool:
	var update_data := {
		"status": status,
		"updatedAt": Time.get_datetime_string_from_system()
	}
	if status == "available":
		update_data["car_id"] = null
	return await firebase_service.firebase_update("repair_slots/" + str(slot_id), update_data)

# Écouter les paiements (polling simple)
func check_payment_for_car(car_id: String) -> Dictionary:
	var payments = await firebase_service.firebase_get("payments")
	if payments == null:
		return {}
	
	for payment_id in payments.keys():
		var payment = payments[payment_id]
		if payment.has("car_id") and payment.car_id == car_id and payment.get("status") == "paid":
			payment.id = payment_id
			return payment
	return {}

# Récupérer les interventions
func get_interventions() -> Array:
	return await api_service.get_interventions()

# Récupérer les voitures avec réparations groupées (nouvelle fonction)
func get_cars_with_grouped_repairs() -> Array:
	# Récupérer toutes les réparations depuis Firebase
	var all_repairs = await firebase_service.firebase_get("repairs")
	if all_repairs == null:
		return []
	
	# Récupérer toutes les voitures depuis Firebase
	var all_cars = await firebase_service.firebase_get("cars")
	if all_cars == null:
		all_cars = {}
	
	# Filtrer et regrouper les réparations par voiture
	var repairs_by_car = {}
	var car_ids = []
	
	# Gérer les deux cas : array ou dictionnaire
	if typeof(all_repairs) == TYPE_ARRAY:
		for i in range(all_repairs.size()):
			var repair = all_repairs[i]
			if not repair:
				continue
			
			var car_id = repair.get("carId")
			var status = repair.get("status", "pending")
			
			# Garder seulement pending ou in_progress
			if car_id and (status == "pending" or status == "in_progress"):
				if not repairs_by_car.has(car_id):
					repairs_by_car[car_id] = []
				if not car_id in car_ids:
					car_ids.append(car_id)
				
				# Ajouter l'ID de la réparation
				repair.id = str(i)
				repairs_by_car[car_id].append(repair)
	else:
		# Cas dictionnaire
		for repair_id in all_repairs.keys():
			var repair = all_repairs[repair_id]
			if not repair:
				continue
				
			var car_id = repair.get("carId")
			var status = repair.get("status", "pending")
			
			# Garder seulement pending ou in_progress
			if car_id and (status == "pending" or status == "in_progress"):
				if not repairs_by_car.has(car_id):
					repairs_by_car[car_id] = []
				if not car_id in car_ids:
					car_ids.append(car_id)
				
				# Ajouter l'ID de la réparation
				repair.id = repair_id
				repairs_by_car[car_id].append(repair)
	
	# Trier les réparations par date pour chaque voiture (plus récente d'abord)
	for car_id in repairs_by_car.keys():
		var repairs = repairs_by_car[car_id]
		repairs.sort_custom(func(a, b):
			var date_a = a.get("startedAt", a.get("created_at", 0))
			var date_b = b.get("startedAt", b.get("created_at", 0))
			return date_b - date_a  # Ordre inverse (plus récente d'abord)
		)
		repairs_by_car[car_id] = repairs
	
	# Construire le résultat final
	var result = []
	for car_id in car_ids:
		var car_info = all_cars.get(car_id, {})
		var repairs = repairs_by_car.get(car_id, [])
		
		# Créer l'objet voiture avec ses réparations
		var car_data = {
			"id": car_id,
			"make": car_info.get("make", "Voiture inconnue"),
			"model": car_info.get("model", "Modèle inconnu"),
			"year": car_info.get("year", 2020),
			"license_plate": car_info.get("license_plate", "Inconnue"),
			"status": car_info.get("status", "active"),
			"created_at": car_info.get("created_at", ""),
			"updated_at": car_info.get("updated_at", ""),
			"repairs": repairs
		}
		
		# Ajouter seulement si la voiture a des réparations
		if not repairs.is_empty():
			result.append(car_data)
	
	print("🚗 get_cars_with_grouped_repairs: ", result.size(), " voitures avec réparations")
	return result

# Récupérer les waiting slots depuis Firebase
func get_waiting_slots() -> Array:
	var data = await firebase_service.firebase_get("waiting_slots")
	if data == null:
		return []
	
	var waiting_slots := []
	# Gérer les deux cas : array ou dictionnaire
	if typeof(data) == TYPE_ARRAY:
		for i in range(data.size()):
			var slot = data[i]
			if slot:
				waiting_slots.append(slot)
	else:
		# Cas dictionnaire
		for key in data.keys():
			var slot = data[key]
			slot.id = key
			waiting_slots.append(slot)
	
	return waiting_slots
