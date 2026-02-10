extends Node

const RepairSlotService = preload("res://scripts/services/RepairSlotService.gd")
const RepairSlotServiceGame = preload("res://scripts/services/RepairSlotServiceGame.gd")

var repair_slot_service: RepairSlotService
var repair_slot_service_game: RepairSlotServiceGame
var slots: Dictionary = {}
var notification_manager: Control
var slot_to_car: Dictionary = {}

# Références aux UI et managers - avec vérification de null
@onready var computer_ui: Control = get_node_or_null("UI/GarageComputerUI")
@onready var repair_ui: Control = get_node_or_null("UI/RepairInteractionUI")
@onready var progress_manager: Node = get_node_or_null("Managers/RepairProgressManager")
@onready var waiting_slot_manager: Area2D = get_node_or_null("WaitingSlot")

# Référence à la scène de voiture
@export var car_scene: PackedScene = preload("res://scenes/car/car.tscn")
@export var spawn_point: Vector2 = Vector2(300, 200)

func _ready():
	repair_slot_service = RepairSlotService.new()
	repair_slot_service_game = RepairSlotServiceGame.new()
	add_child(repair_slot_service)
	add_child(repair_slot_service_game)
	
	await load_slots()
	# Instancier le NotificationManager si l'UI existe
	var ui_node = get_node_or_null("UI")
	if ui_node:
		var Notification = preload("res://scripts/ui/NotificationManager.gd")
		notification_manager = Notification.new()
		ui_node.add_child(notification_manager)

		# Ajouter automatiquement le menu des voitures en attente (bottom-left)
		var WaitingMenuScene = ResourceLoader.load("res://scenes/ui/waiting_cars_menu_clean.tscn")
		if WaitingMenuScene == null:
			push_warning("WaitingCarsMenu scene not found or failed to load; creating UI dynamically")
			# Fallback: create the UI nodes dynamically and attach the script
			var wm = Control.new()
			wm.name = "WaitingCarsMenu"
			# Panel -> VBoxContainer -> Labels, OptionButton, Button
			var panel = Panel.new()
			wm.add_child(panel)
			var vbox = VBoxContainer.new()
			panel.add_child(vbox)
			var slots_label = Label.new()
			slots_label.name = "SlotsLabel"
			slots_label.text = "Slots disponibles : 0 / 2"
			vbox.add_child(slots_label)
			var waiting_label = Label.new()
			waiting_label.name = "WaitingLabel"
			waiting_label.text = "Voitures en attente : 0"
			vbox.add_child(waiting_label)
			var option_button = OptionButton.new()
			option_button.name = "CarSelect"
			vbox.add_child(option_button)
			var spawn_button = Button.new()
			spawn_button.name = "SpawnButton"
			spawn_button.text = "Spawner la voiture"
			vbox.add_child(spawn_button)
			var timer = Timer.new()
			timer.name = "RefreshTimer"
			wm.add_child(timer)
			# Attach the script so the existing logic runs
			var script = load("res://scripts/ui/WaitingCarsMenu.gd")
			if script:
				wm.set_script(script)
			ui_node.add_child(wm)
		elif not ui_node.has_node("WaitingCarsMenu"):
			var wm = WaitingMenuScene.instantiate()
			wm.name = "WaitingCarsMenu"
			ui_node.add_child(wm)

	# Ensure input actions exist for opening in-game menus
	if not InputMap.has_action("open_computer"):
		InputMap.add_action("open_computer")
		var ev = InputEventKey.new()
		ev.keycode = KEY_E
		InputMap.action_add_event("open_computer", ev)

	if not InputMap.has_action("open_repair"):
		InputMap.add_action("open_repair")
		var ev2 = InputEventKey.new()
		ev2.keycode = KEY_R
		InputMap.action_add_event("open_repair", ev2)
	
	# Connecter les signaux avec vérification
	if computer_ui != null:
		computer_ui.car_assigned_to_slot.connect(_on_car_assigned_to_slot)
	else:
		push_error("❌ GarageComputerUI introuvable dans la scène")
	
	if progress_manager != null:
		progress_manager.repair_completed.connect(_on_repair_completed)
		progress_manager.all_repairs_completed.connect(_on_all_repairs_completed)
	else:
		push_warning("⚠️ RepairProgressManager introuvable")
	
	if waiting_slot_manager != null:
		waiting_slot_manager.car_departed.connect(_on_car_departed)
	else:
		push_warning("⚠️ WaitingSlot introuvable")

# Appelé quand une voiture est assignée à un slot depuis l'ordinateur
func _on_car_assigned_to_slot(slot_id: int, car_data: Dictionary):
	print("🚗 Assignation voiture au slot: ", slot_id, " car_data: ", car_data)
	
	if car_scene == null:
		push_error("❌ car_scene n'est pas défini")
		return
	
	# Spawner la voiture au spawn point
	var car = car_scene.instantiate()
	car.car_id = str(car_data.id)
	if car_data.has("brand"):
		car.brand = car_data.brand
	if car_data.has("model"):
		car.model = car_data.model
	car.global_position = spawn_point
	add_child(car)
	
	print("🚗 Voiture spawn avec car_id: ", car.car_id)

# Synchronise l'état visuel des slots et spawn/supprime les voitures automatiquement
func _sync_spawned_cars_with_slots() -> void:
	# Ensure slots dict is populated
	for slot_id in slots.keys():
		var slot = slots[slot_id]
		var status = slot.get("status")
		var car_id = null
		if slot.has("car_id"):
			car_id = str(slot.car_id)

		if status == "occupied" and car_id != null and car_id != "":
			# If mapping already has a car for this slot, ensure it's correct
			if slot_to_car.has(slot_id):
				var existing_car = slot_to_car[slot_id]
				if existing_car == null or not is_instance_valid(existing_car) or str(existing_car.car_id) != car_id:
					# remove invalid or mismatched car
					if existing_car and is_instance_valid(existing_car):
						existing_car.queue_free()
					slot_to_car.erase(slot_id)
				else:
					continue

			# Check if a car with same car_id already exists elsewhere
			var found := false
			for c in get_tree().get_nodes_in_group("cars"):
				if str(c.car_id) == car_id:
					# assign to slot mapping and move to slot position
					slot_to_car[slot_id] = c
					var slot_node = _find_slot_node_by_id(slot_id)
					if slot_node:
						c.global_position = slot_node.global_position
						c.is_locked = true
					found = true
					break

			if found:
				continue

			# Otherwise spawn a new car on this slot
			_spawn_car_on_slot(slot)
		else:
			# Slot is available -> remove any existing spawned car for this slot
			if slot_to_car.has(slot_id):
				var car_obj = slot_to_car[slot_id]
				if car_obj and is_instance_valid(car_obj):
					car_obj.queue_free()
				slot_to_car.erase(slot_id)


func _find_slot_node_by_id(slot_id: int) -> Node:
	# look for nodes in group 'repair_slots' and match exported slot_number
	for node in get_tree().get_nodes_in_group("repair_slots"):
		var v = null
		# safe property access — Object.get returns null if property missing
		v = node.get("slot_number")
		if v != null and int(v) == int(slot_id):
			return node
	return null

func _spawn_car_on_slot(slot: Dictionary) -> void:
	if car_scene == null:
		push_error("car_scene not set, cannot spawn car for slot")
		return

	var car_id = ""
	if slot.has("car_id"):
		car_id = str(slot.car_id)

	# Prevent double spawn
	for c in get_tree().get_nodes_in_group("cars"):
		if str(c.car_id) == car_id:
			# already spawned, map it and ensure locked and positioned
			slot_to_car[slot.id] = c
			var sn = _find_slot_node_by_id(slot.id)
			if sn:
				c.global_position = sn.global_position
				c.is_locked = true
			return

	var car = car_scene.instantiate()
	car.car_id = car_id
	car.is_locked = true

	# try to set brand/model if available in slot (not guaranteed)
	if slot.has("brand"):
		car.brand = slot.brand
	if slot.has("model"):
		car.model = slot.model

	var slot_node = _find_slot_node_by_id(slot.id)
	if slot_node:
		car.global_position = slot_node.global_position

	add_child(car)
	slot_to_car[slot.id] = car
	print("🔁 Auto-spawned car", car.car_id, "on slot", slot.id)

# Spawner une voiture sans l'assigner à un slot (utilisé par le menu bottom-left)
func spawn_car_from_menu(car_data: Dictionary) -> Node:
	if car_scene == null:
		push_error("❌ car_scene n'est pas défini")
		return null

	# Empêcher le double-spawn: vérifier le groupe 'cars'
	var existing = get_tree().get_nodes_in_group("cars")
	for c in existing:
		if str(c.car_id) == str(car_data.id):
			print("⚠️ Voiture déjà spawnée: ", car_data.id)
			return c

	var car = car_scene.instantiate()
	car.car_id = str(car_data.id)
	if car_data.has("brand"):
		car.brand = car_data.brand
	if car_data.has("model"):
		car.model = car_data.model
	if car_data.has("license_plate"):
		car.license_plate = car_data.license_plate
	# initial state: unlocked/free
	car.is_locked = false
	car.global_position = spawn_point
	add_child(car)

	if notification_manager:
		notification_manager.show_message("Voiture " + str(car.car_id) + " spawnée", 2.0)

	return car

# Appelé quand une réparation est terminée
func _on_repair_completed(repair_id: String, car_id: String):
	print("🔧 Réparation terminée: ", repair_id)

# Appelé quand toutes les réparations d'une voiture sont terminées
func _on_all_repairs_completed(car_id: String):
	print("✅ Toutes les réparations terminées pour: ", car_id)
	
	# Trouver la voiture et la débloquer
	var target_car = null
	var cars = get_tree().get_nodes_in_group("cars")
	for car in cars:
		if str(car.car_id) == car_id:
			car.is_locked = false
			target_car = car
			print("🚗 Voiture débloquée, peut aller au waiting slot")
			break
	
	# Construire les données à envoyer vers waiting_slots et déplacer la voiture
	var car_repairs = await repair_slot_service_game.get_car_repairs(car_id)
	if car_repairs.size() == 0:
		print("⚠️ Aucune réparation trouvée pour car_id:", car_id)
		return

	# Calculer le prix total et préparer la liste d'interventions
	var interventions := []
	for r in car_repairs:
		interventions.append({
			"id": r.get("id", ""),
			"name": r.get("interventionName", ""),
			"price": r.get("interventionPrice", 0)
		})
	var total_price = 0
	for it in interventions:
		total_price += it.price

	# Récupérer clientId depuis la première réparation si disponible
	var client_id = "current_user"
	if car_repairs.size() > 0 and car_repairs[0].has("userId"):
		client_id = str(car_repairs[0].userId)

	var waiting_data := {
		"carId": car_id,
		"clientId": client_id,
		"interventions": interventions,
		"totalPrice": total_price,
		"createdAt": Time.get_datetime_string_from_system(),
		"status": "waiting_payment"
	}

	var push_id = await repair_slot_service_game.add_to_waiting_slots(waiting_data)
	if push_id:
		print("✅ Voiture ajoutée aux waiting_slots:", car_id)
		
		# Déplacer automatiquement la voiture vers le waiting slot
		if target_car:
			_move_car_to_waiting_slot(target_car)
		
		# Libérer le slot associé
		await _free_slot_for_car(car_id)
		if notification_manager:
			notification_manager.show_message("Voiture " + str(car_id) + " déplacée vers attente paiement", 3.0)
		# Recharger les slots en mémoire
		await load_slots()
	else:
		print("❌ Échec ajout waiting_slots pour:", car_id)

# Déplacer une voiture vers le waiting slot
func _move_car_to_waiting_slot(car):
	print("🚗 Déplacement de la voiture vers le waiting slot...")
	
	# Trouver le waiting slot
	var waiting_slots = get_tree().get_nodes_in_group("waiting_slots")
	if waiting_slots.is_empty():
		print("❌ Aucun waiting slot trouvé")
		return
	
	var waiting_slot = waiting_slots[0]
	
	# Créer une animation de déplacement vers le waiting slot
	var target_position = waiting_slot.global_position
	var start_position = car.global_position
	var duration = 2.0  # 2 secondes pour le déplacement
	
	var tween = create_tween()
	tween.set_parallel(false)
	
	# Déplacer la voiture
	tween.tween_property(car, "global_position", target_position, duration)
	
	# Quand le déplacement est terminé, verrouiller la voiture dans le waiting slot
	tween.tween_callback(func():
		car.global_position = target_position
		if waiting_slot.has_method("lock_car"):
			waiting_slot.lock_car(car)
		print("✅ Voiture arrivée au waiting slot")
	)

# Appelé quand une voiture quitte le waiting slot après paiement
func _on_car_departed(car_id: String):
	print("🚗 Voiture partie après paiement: ", car_id)
	await _free_slot_for_car(car_id)
	if notification_manager:
		notification_manager.show_message("Voiture " + str(car_id) + " partie après paiement", 2.0)

func _process(delta: float) -> void:
	# Global keyboard shortcuts to open menus (E = computer, R = repair UI)
	if InputMap.has_action("open_computer") and Input.is_action_just_pressed("open_computer"):
		if computer_ui != null:
			computer_ui.show_ui()
		elif notification_manager:
			notification_manager.show_message("UI d'ordinateur introuvable", 2.0)

	if InputMap.has_action("open_repair") and Input.is_action_just_pressed("open_repair"):
		if repair_ui != null:
			repair_ui.show_ui()
		elif notification_manager:
			notification_manager.show_message("UI de réparation introuvable", 2.0)

# Libérer le slot d'une voiture
func _free_slot_for_car(car_id: String):
	for slot_id in slots.keys():
		var slot = slots[slot_id]
		if slot.get("car_id") == car_id:
			await repair_slot_service_game.update_slot_status(slot_id, "available")
			print("🔄 Slot libéré: ", slot_id)
			break

func occupy_slot(slot_number: int, car) -> void:
	if not car or not car.car_id:
		push_error("❌ Voiture invalide ou sans car_id")
		return
	
	var success = await repair_slot_service.occupy_slot(slot_number, car.car_id)
	if success:
		# Update the in-memory slots map safely. The key used in `slots` may be the
		# slot `id` from Firebase or another index; don't assume `slot_number` is a
		# direct key. Try to find the correct entry by matching `id` or
		# `slot_number` inside each slot dict, otherwise create a fallback entry.
		var found_key = null
		for k in slots.keys():
			var s = slots[k]
			if s == null:
				continue
			if s.has("id") and int(s.id) == int(slot_number):
				found_key = k
				break
			if s.has("slot_number") and int(s.slot_number) == int(slot_number):
				found_key = k
				break

		if found_key != null:
			slots[found_key]["status"] = "occupied"
			slots[found_key]["car_id"] = car.car_id
		else:
			# fallback: insert/update using slot_number as key
			slots[slot_number] = {"id": slot_number, "status": "occupied", "car_id": car.car_id}

		# sync visual state (spawn car if needed)
		_sync_spawned_cars_with_slots()
	else:
		push_error("❌ Échec occupation slot " + str(slot_number))

func load_slots() -> void:
	var slot_list = await repair_slot_service.get_repair_slots()
	slots.clear()
	for slot in slot_list:
		if slot.has("id"):
			slots[slot.id] = slot

	# After loading slots from Firebase, sync visual cars
	_sync_spawned_cars_with_slots()

func get_free_slot() -> int:
	for id in slots.keys():
		if slots[id].get("status") == "available":
			return id
	return -1

func get_slot(slot_id: int) -> Dictionary:
	return slots.get(slot_id, {})

func is_slot_occupied(slot_id: int) -> bool:
	if not slots.has(slot_id):
		return false
	return slots[slot_id].get("status") == "occupied"
