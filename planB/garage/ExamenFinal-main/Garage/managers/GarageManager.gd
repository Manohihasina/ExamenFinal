extends Node

# --- EXPORTS ---
# --- EXPORTS ---
@export var car_scene : PackedScene = preload("res://assets/Voiture/voitureClient.tscn") # Scène VoitureClient par défaut
@export var payment_zone_node : Node3D # Glisser le noeud "PaymentZone" ici

# --- REFS ---
var game_server : Node = null
var repair_zones_map : Dictionary = {}
var active_cars : Dictionary = {} # { car_id: Node3D_Car }

# --- DATA ---
var current_repair_scan : Dictionary = {}
var current_payment_scan : Dictionary = {}
var current_repairs_status : Dictionary = {}

func _ready():
	game_server = $"/root/GameServer" # Assurez-vous que l'autoload est bien nommé GameServer
	if not game_server:
		push_error("GameServer introuvable!")
		return
	
	# Trouver les zones de réparation
	# On cherche les nodes qui ont le script RepairZone
	_find_zones_recursive(get_tree().root)
	
	if not payment_zone_node:
		print("⚠️ PaymentZone non assignée dans l'inspecteur, recherche automatique...")
		_find_payment_zone_recursive(get_tree().root)
		
	# Trouver les voitures déjà présentes (placées dans l'éditeur)
	_find_existing_cars_recursive(get_tree().root)
	
	# Connecter les signaux
	game_server.donnees_mises_a_jour.connect(_on_repairs_updated) # Réparations
	game_server.slots_reparation_maj.connect(_on_repair_slots_maj) # Slots réparations
	game_server.zone_paiement_maj.connect(_on_payment_zone_maj) # Zone paiement
	
	print(" GarageManager prêt. Zones trouvées: ", repair_zones_map.keys())
	if payment_zone_node:
		print("PaymentZone trouvée: ", payment_zone_node.name)
	else:
		push_error("❌ PaymentZone introuvable !")

func _find_zones_recursive(node: Node):
	# REMPLACEMENT de _find_repair_zones pour nommage plus clair
	for child in node.get_children():
		var is_repair_zone = false
		
		# 1. Vérification par script (méthode Duck Typing)
		if child.has_method("obtenir_etat"):
			is_repair_zone = true
			
		# 2. Vérification par nom (Fallback)
		elif "Zone" in child.name and ("Repair" in child.name or "Repar" in child.name):
			# Optionnel: on pourrait logguer ici
			pass
		
		if is_repair_zone:
			_register_zone(child)
		
		if child.get_child_count() > 0:
			_find_zones_recursive(child)

func _find_payment_zone_recursive(node: Node):
	if payment_zone_node: return
	
	for child in node.get_children():
		if child.name == "PaymentZone" or child.has_method("occupy_position"):
			payment_zone_node = child
			return
		
		if child.get_child_count() > 0:
			_find_payment_zone_recursive(child)

func _register_zone(child: Node):
	if "id_reparation_cible" in child:
		var id_zone = child.id_reparation_cible
		var slot_id = _extract_slot_id(id_zone)
		
		# Si pas d'ID dans la propriété, on essaie le nom du node
		if slot_id == -1:
			slot_id = _extract_slot_id(child.name)
		
		if slot_id != -1:
			repair_zones_map[str(slot_id)] = child
			# print(" Zone enregistrée: Slot ", slot_id, " (ID: ", id_zone, " | Node: ", child.name, " | Pos: ", child.global_position, ")")
		else:
			print(" Zone trouvée mais impossible de déterminer le Slot ID: ", id_zone)
	else:
		print(" Zone trouvée (script ok) mais pas d'id_reparation_cible: ", child.name)

func _find_existing_cars_recursive(node: Node):
	# Si le nœud est une voiture (groupe vehicles ou script Car.gd)
	if node.is_in_group("vehicles") or node.has_method("start_repair"):
		# Tenter de récupérer son ID
		var c_id = ""
		if "car_id" in node and node.car_id != "":
			c_id = node.car_id
		elif node.has_meta("car_id"):
			c_id = node.get_meta("car_id")
		
		# Si on trouve un ID, on l'enregistre
		if c_id != "":
			active_cars[c_id] = node
			print("🚙 Voiture existante trouvée: ", c_id, " (", node.name, ")")
		else:
			# Voiture sans ID (décor ?) -> On pourrait la supprimer si on veut être strict
			# node.queue_free()
			pass
	
	for child in node.get_children():
		_find_existing_cars_recursive(child)

func _extract_slot_id(zone_id_str: String) -> int:
	# Extrait "1" de "repair_1" ou "ZoneRepair1" ou "2.0"
	var regex = RegEx.new()
	regex.compile("(\\d+)")
	var result = regex.search(zone_id_str)
	if result:
		return int(result.get_string())
	return -1

# --- HANDLERS ---

func _on_repair_slots_maj(slots_data):
	# slots_data est un TABLEAU ou un DICTIONNAIRE depuis Firebase
	# Structure type: { "1": { "car_id": "...", "status": "occupied" }, "2": ... }
	current_repair_scan = _safe_dict(slots_data)
	_sync_cars()

func _on_payment_zone_maj(waiting_data):
	# Structure type: { "push_id": { "carId": "...", "status": "waiting_payment" }, ... }
	current_payment_scan = _safe_dict(waiting_data)
	_sync_cars()

func _on_repairs_updated(repairs_data):
	current_repairs_status = _safe_dict(repairs_data)
	_update_car_animations()

# --- SYNC LOGIC ---

func _sync_cars():
	if not car_scene:
		push_warning("⚠️ Pas de Car Scene assignée au GarageManager!")
		return

	var active_car_ids_in_firebase = []
	
	# 1. Gérer les slots de réparation
	var repair_scan_safe = _safe_dict(current_repair_scan)
	for slot_key in repair_scan_safe.keys():
		var slot = repair_scan_safe[slot_key]
		# Sécurité absolue
		if typeof(slot) != TYPE_DICTIONARY:
			print("⚠️ Slot ignored (not a dict): ", slot)
			continue
		
		var car_id = str(slot.get("car_id", ""))
		var status = slot.get("status", "available")
		
		if car_id == "" or car_id == "null" or status == "available":
			continue
			
		active_car_ids_in_firebase.append(car_id)
		# Trouver la position cible
		var target_pos = Vector3.ZERO
		
		# Robustesse: si slot_number est 2.0, str() donne "2.0", mais notre map a "2"
		var raw_slot_num = slot.get("slot_number", slot_key)
		var slot_num = str(int(float(str(raw_slot_num)))) # "2.0" -> 2.0 -> 2 -> "2"
		
		# Fallback: si conversion échoue (ex: "repair_1"), on essaie d'extraire
		if slot_num == "0" and str(raw_slot_num) != "0":
			slot_num = str(_extract_slot_id(str(raw_slot_num)))
			
		if slot_num in repair_zones_map:
			var zone = repair_zones_map[slot_num]
			target_pos = zone.global_position
			# Debug précis de la position
			# print("🎯 Cible spawn voiture (Slot ", slot_num, "): ", target_pos)
		else:
			print("⚠️ Slot inconnu dans la MAP: ", slot_num, " (Raw: ", raw_slot_num, ")")
			print("   Map keys: ", repair_zones_map.keys())
			continue
			
		# Ajustement hauteur pour éviter le clip au sol
		# On utilise la position Y de la zone comme base. 
		# Si la zone est un Area3D au sol (Y=0), on ajoute un peu.
		# Si la zone est déjà surélevée, on garde.
		if target_pos.y < 0.1:
			target_pos.y += 0.7
		
		_spawn_or_move_car(car_id, target_pos, slot)

	# 2. Gérer la zone de paiement (avec gestion de capacité)
	var payment_scan_safe = _safe_dict(current_payment_scan)
	for key in payment_scan_safe.keys():
		var waiting_item = payment_scan_safe[key]
		
		if typeof(waiting_item) != TYPE_DICTIONARY:
			continue
		
		var car_id = str(waiting_item.get("carId", ""))
		
		if car_id == "" or car_id == "null": continue
		
		active_car_ids_in_firebase.append(car_id)
		
		var target_pos = Vector3.ZERO
		
		if payment_zone_node:
			if payment_zone_node.has_method("occupy_position"):
				var pos_index = payment_zone_node.occupy_position(car_id)
				if pos_index != -1:
					target_pos = payment_zone_node.get_next_available_position(pos_index)
				else:
					# Zone pleine
					continue 
			else:
				# Fallback simple
				target_pos = payment_zone_node.global_position + Vector3(active_car_ids_in_firebase.size() * 4.0, 0, 0)
		else:
			print("Pas de PaymentZone pour spawner ", car_id)
			continue
		
		_spawn_or_move_car(car_id, target_pos, waiting_item, true)

	var cars_to_remove = []
	for car_id in active_cars.keys():
		if not car_id in active_car_ids_in_firebase:
			cars_to_remove.append(car_id)
	
	for car_id in cars_to_remove:
		_despawn_car(car_id)

func _spawn_or_move_car(car_id: String, target_pos: Vector3, data: Dictionary, is_payment: bool = false):
	var car_node = null
	
	if car_id in active_cars:
		# Voiture existe déjà, on la déplace si besoin
		car_node = active_cars[car_id]
		if car_node.global_position.distance_to(target_pos) > 0.05:
			# print("Correction position voiture ", car_id, " : ", car_node.global_position, " -> ", target_pos)
			car_node.global_position = target_pos
	else:
		
		car_node = car_scene.instantiate()
		add_child(car_node)
		car_node.global_position = target_pos
		active_cars[car_id] = car_node
		
		# Setup initial
		if car_node.has_method("setup"):
			car_node.setup(car_id, data)
	
	# Update data if needed
	if car_node and car_node.has_method("update_data"):
		car_node.update_data(data)

func _despawn_car(car_id: String):
	if car_id in active_cars:
		var car_node = active_cars[car_id]
		active_cars.erase(car_id)
		car_node.queue_free()
		
		# Libérer la position dans la zone de paiement si applicable
		if payment_zone_node and payment_zone_node.has_method("release_position"):
			payment_zone_node.release_position(car_id)
		
		print("🗑️ Voiture supprimée: ", car_id)

func _update_car_animations():
	# Scanne les réparations actives et déclenche les animations
	# current_repairs_status structure: { "repair_key": { "carId": "...", "status": "in_progress", ... } }
	
	# D'abord, on reset l'état de réparation de toutes les voitures (ou on le gère finement)
	# Simplification: on parcourt les réparations actives.
	
	var repairing_cars = []
	var repairs_safe = _safe_dict(current_repairs_status)
	
	for repair_key in repairs_safe.keys():
		var repair = repairs_safe[repair_key]
		
		if typeof(repair) != TYPE_DICTIONARY:
			continue
		
		var car_id = str(repair.get("carId", ""))
		var status = repair.get("status", "")
		
		if car_id in active_cars:
			var car_node = active_cars[car_id]
			if status == "in_progress":
				if car_node.has_method("start_repair"):
					var duration = repair.get("interventionDuration", 10.0)
					car_node.start_repair(duration)
					
					var progress = repair.get("progression", 0)
					if car_node.has_method("update_progress"):
						car_node.update_progress(progress)
						
					repairing_cars.append(car_id)
	
	# Arrêter les autres
	for car_id in active_cars.keys():
		if not car_id in repairing_cars:
			var car_node = active_cars[car_id]
			if car_node.has_method("stop_repair"):
				car_node.stop_repair()

func _safe_dict(data) -> Dictionary:
	if data is Dictionary:
		return data
	elif data is Array:
		var dict = {}
		for i in range(data.size()):
			if data[i] != null:
				dict[str(i)] = data[i]
		return dict
	return {}
