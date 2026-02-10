extends Node3D

# Ce script gère la zone de paiement avec suivi des positions occupées.
# Le GarageManager place les voitures ici après que toutes leurs réparations soient terminées.

@export var max_capacity : int = 5
@export var spacing : float = 4.0 # Espace entre les voitures

# Liste des positions disponibles (calculées ou placées manuellement)
var spawn_points : Array = []

# Tracking des voitures dans la zone : { car_id: position_index }
var occupied_positions : Dictionary = {}

# --- SIGNAUX ---
signal voiture_ajoutee(car_id, position_index)
signal voiture_retiree(car_id)
signal zone_pleine


# --- UI & INTERACTION ---
var ui_layer : CanvasLayer = null
var ui_panel : Panel = null
var ui_list : ItemList = null
var detection_area : Area3D = null

func _ready():
	# Si on a des enfants Marker3D, on les utilise comme points de spawn
	for child in get_children():
		if child is Marker3D or (child is Node3D and child.get_script() == null):
			spawn_points.append(child)
	
	_setup_detection_area()
	_setup_ui()
	
	# Auto-refresh UI when waiting slots change
	if GameServer:
		GameServer.zone_paiement_maj.connect(_on_payment_data_updated)
	
	print("PaymentZone prête. Points de spawn: ", spawn_points.size(), " | Capacité max: ", max_capacity)

func _on_payment_data_updated(_data):
	if ui_layer and ui_layer.visible:
		_update_ui_list()

func _setup_detection_area():
	# Création d'une zone de détection si elle n'existe pas
	detection_area = Area3D.new()
	detection_area.name = "PlayerDetection"
	add_child(detection_area)
	
	var shape = CollisionShape3D.new()
	var box = BoxShape3D.new()
	box.size = Vector3(10, 4, 10) # Taille approximative de la zone
	shape.shape = box
	detection_area.add_child(shape)
	
	detection_area.body_entered.connect(_on_body_entered)
	detection_area.body_exited.connect(_on_body_exited)
	
	# Collision Mask: Player est généralement sur le layer 2 ou masque 2. On scanne tout pour être sûr.
	detection_area.collision_mask = 0b11111111 # Tous les layers

func _setup_ui():
	ui_layer = CanvasLayer.new()
	ui_layer.visible = false
	add_child(ui_layer)
	
	ui_panel = Panel.new()
	ui_panel.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	ui_panel.size = Vector2(500, 400)
	ui_layer.add_child(ui_panel)
	
	var title = Label.new()
	title.text = "ZONE DE PAIEMENT - VÉHICULES EN ATTENTE"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.position = Vector2(0, 10)
	title.size = Vector2(500, 30)
	ui_panel.add_child(title)
	
	ui_list = ItemList.new()
	ui_list.position = Vector2(20, 50)
	ui_list.size = Vector2(460, 300)
	ui_panel.add_child(ui_list)
	
	var close_hint = Label.new()
	close_hint.text = "Sortez de la zone pour fermer"
	close_hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	close_hint.position = Vector2(0, 360)
	close_hint.size = Vector2(500, 30)
	ui_panel.add_child(close_hint)

func _on_body_entered(body):
	if body.name == "Player" or body.is_in_group("player"):
		print("👤 Joueur entré dans la zone de paiement.")
		_update_ui_list()
		ui_layer.visible = true

func _on_body_exited(body):
	if body.name == "Player" or body.is_in_group("player"):
		ui_layer.visible = false

func _update_ui_list():
	ui_list.clear()
	var waiting_slots = GameServer.cache_waiting_slots
	
	var count = 0
	for key in waiting_slots.keys():
		var data = waiting_slots[key]
		if typeof(data) == TYPE_DICTIONARY:
			var car_id = str(data.get("carId", "Inconnu"))
			var client_id = str(data.get("clientId", "Inconnu"))
			var item_text = "Voiture: " + car_id + " | Client: " + client_id
			ui_list.add_item(item_text)
			count += 1
			
	if count == 0:
		ui_list.add_item("Aucune voiture en attente de paiement.")

func is_full() -> bool:
	"""Vérifie si la zone est pleine"""
	return occupied_positions.size() >= max_capacity

func get_occupied_count() -> int:
	"""Nombre de voitures actuellement dans la zone"""
	return occupied_positions.size()

func occupy_position(car_id: String) -> int:
	"""Réserve la prochaine position libre pour une voiture. Retourne l'index (-1 si plein)."""
	# Vérifier si la voiture est déjà dans la zone
	if car_id in occupied_positions:
		return occupied_positions[car_id]
	
	# Vérifier la capacité
	if is_full():
		print("Zone de paiement pleine! Impossible d'ajouter: ", car_id)
		zone_pleine.emit()
		return -1
	
	var used_indices = occupied_positions.values()
	var next_index = 0
	while next_index in used_indices:
		next_index += 1
	
	occupied_positions[car_id] = next_index
	voiture_ajoutee.emit(car_id, next_index)
	print(" Voiture ", car_id, " placée en position ", next_index, " (", get_occupied_count(), "/", max_capacity, ")")
	return next_index

func release_position(car_id: String):
	"""Libère la position d'une voiture payée"""
	if car_id in occupied_positions:
		var index = occupied_positions[car_id]
		occupied_positions.erase(car_id)
		voiture_retiree.emit(car_id)
		print(" Position ", index, " libérée pour voiture ", car_id, " (", get_occupied_count(), "/", max_capacity, ")")
	else:
		print(" Voiture ", car_id, " pas trouvée dans la zone de paiement")

func get_position_for_car(car_id: String) -> Vector3:
	"""Retourne la position 3D d'une voiture déjà dans la zone"""
	if car_id in occupied_positions:
		return get_next_available_position(occupied_positions[car_id])
	return Vector3.ZERO

func get_next_available_position(index: int) -> Vector3:
	if spawn_points.size() > 0:
		return spawn_points[index % spawn_points.size()].global_position
	
	return global_position + Vector3(index * spacing, 0, 0)
