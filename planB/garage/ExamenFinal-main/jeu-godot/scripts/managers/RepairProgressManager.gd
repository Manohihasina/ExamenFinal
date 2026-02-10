extends Node

const RepairSlotServiceGame = preload("res://scripts/services/RepairSlotServiceGame.gd")

@onready var progress_bar_container: HBoxContainer = $UIContainer/ProgressBarContainer

var repair_slot_service: RepairSlotServiceGame
var active_repairs := {}  # repair_id -> {start_time, duration, progress_bar}
var polling_timer: Timer

signal repair_completed(repair_id: String, car_id: String)
signal all_repairs_completed(car_id: String)

func _ready():
	repair_slot_service = RepairSlotServiceGame.new()
	add_child(repair_slot_service)
	
	# Configurer le timer de polling
	polling_timer = Timer.new()
	add_child(polling_timer)
	polling_timer.wait_time = 2.0  # Polling toutes les 2 secondes
	polling_timer.timeout.connect(_poll_repairs)
	polling_timer.start()

# Appelé quand une réparation démarre
func start_repair_tracking(repair_id: String, car_id: String, duration: int):
	# Créer une barre de progression pour cette réparation
	var progress_bar := ProgressBar.new()
	progress_bar.min_value = 0
	# Use duration in seconds as the progress bar max so the bar fills over time
	var dur = int(duration)
	if dur <= 0:
		dur = 60
	progress_bar.max_value = dur
	progress_bar.value = 0
	progress_bar.custom_minimum_size.x = 300
	
	# Ajouter un label pour afficher les infos
	var label := Label.new()
	label.text = "Réparation " + str(repair_id.substr(0, 8)) + "..."
	
	var container := VBoxContainer.new()
	container.name = str(repair_id)
	container.add_child(label)
	container.add_child(progress_bar)

	progress_bar_container.add_child(container)

	# Stocker les infos
	active_repairs[repair_id] = {
		"start_time": Time.get_unix_time_from_system(),
		"duration": dur,
		"progress_bar": progress_bar,
		"label": label,
		"car_id": car_id,
		"container": container
	}
	
	print("🔧 Suivi démarré pour réparation: ", repair_id)

# Polling Firebase pour vérifier l'état des réparations
func _poll_repairs():
	if active_repairs.is_empty():
		return
	
	# Récupérer toutes les réparations depuis Firebase
	var all_repairs = await repair_slot_service.firebase_service.firebase_get("repairs")
	if all_repairs == null:
		return
	
	var repairs_to_remove := []
	
	for repair_id in active_repairs.keys():
		if not all_repairs.has(repair_id):
			continue
		
		var repair_data = all_repairs[repair_id]
		var tracking_info = active_repairs[repair_id]
		
		# Mettre à jour la barre de progression
		if repair_data.get("status") == "in_progress":
			var elapsed = Time.get_unix_time_from_system() - tracking_info.start_time
			var dur2 = int(tracking_info.duration)
			if dur2 <= 0:
				dur2 = 60
			
			# Vérifier si la réparation est terminée (temps écoulé)
			if elapsed >= dur2:
				# Passer la réparation en "completed" dans Firebase
				print("⏰ Temps écoulé pour réparation ", repair_id, " → passage en completed")
				await repair_slot_service.update_repair_status(repair_id, {
					"status": "completed",
					"completedAt": Time.get_unix_time_from_system(),
					"updatedAt": Time.get_datetime_string_from_system()
				})
				# Continuer avec le traitement "completed" ci-dessous
				repair_data.status = "completed"
			
			# Set progress in seconds; clamp to duration
			tracking_info.progress_bar.value = min(dur2, elapsed)

			# Mettre à jour le label avec le temps restant
			var remaining = max(0, dur2 - elapsed)
			tracking_info.label.text = "Réparation " + str(repair_id.substr(0, 8)) + "... (" + str(int(remaining)) + "s)"

			# Détecter mi-parcours et notifier une seule fois
			var halfway_notified = repair_data.get("halfwayNotified", false)
			if not halfway_notified and elapsed >= int(tracking_info.duration / 2.0):
				# Mettre à jour le flag dans Firebase
				await repair_slot_service.update_repair_status(repair_id, {"halfwayNotified": true})
				# Montrer notification si disponible
				var notifs = get_tree().get_nodes_in_group("notification_manager")
				if notifs.size() > 0:
					notifs[0].show_message("Réparation à mi-parcours pour " + str(repair_id.substr(0,8)), 2.5)
		
		elif repair_data.get("status") == "completed":
			# Réparation terminée
			tracking_info.progress_bar.value = int(tracking_info.duration)
			tracking_info.label.text = "Réparation terminée!"
			# Montrer notification de fin
			var notifs = get_tree().get_nodes_in_group("notification_manager")
			if notifs.size() > 0:
				notifs[0].show_message("Réparation terminée: " + str(repair_id.substr(0,8)), 2.5)
			
			repair_completed.emit(repair_id, tracking_info.car_id)
			repairs_to_remove.append(repair_id)
			
			# Vérifier si toutes les réparations de cette voiture sont terminées
			await _check_all_repairs_completed(tracking_info.car_id)
	
	# Nettoyer les réparations terminées
	for repair_id in repairs_to_remove:
		_remove_repair_tracking(repair_id)

# Vérifier si toutes les réparations d'une voiture sont terminées
func _check_all_repairs_completed(car_id: String):
	var car_repairs = await repair_slot_service.get_car_repairs(car_id)
	var all_completed := true
	
	for repair in car_repairs:
		if repair.get("status") != "completed":
			all_completed = false
			break
	
	if all_completed and car_repairs.size() > 0:
		print("✅ Toutes les réparations terminées pour la voiture: ", car_id)
		all_repairs_completed.emit(car_id)

# Supprimer le suivi d'une réparation
func _remove_repair_tracking(repair_id: String):
	if not active_repairs.has(repair_id):
		return
	
	var tracking_info = active_repairs[repair_id]
	tracking_info.container.queue_free()
	active_repairs.erase(repair_id)

# Nettoyer toutes les barres de progression
func clear_all_progress():
	for repair_id in active_repairs.keys():
		_remove_repair_tracking(repair_id)
