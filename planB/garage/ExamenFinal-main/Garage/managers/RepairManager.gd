extends Node

# --- NŒUDS ---
@onready var timer := $Timer

# --- VARIABLES ---
var game_server: Node = null
var zones_reparation: Array = []
var reparation_active: Dictionary = {}  # Pour compatibilité
var reparations_par_zone: Dictionary = {}  # zone_id -> repair data (support parallel)



func _ready():
	game_server = $"/root/GameServer"
	
	if game_server == null:
		push_error("GameServer non trouvé !")
		return
	
	print("RepairManager initialisé")
	
	game_server.donnees_mises_a_jour.connect(_sur_donnees_mises_a_jour)
	game_server.slots_reparation_maj.connect(_sur_slots_maj)
	
	# On attend un frame pour laisser le temps aux zones de se charger si besoin
	await get_tree().process_frame
	
	# Fallback recherche manuelle si pas d'auto-enregistrement
	if zones_reparation.is_empty():
		_trouver_zones_reparation()

func register_zone(zone: Node):
	if not zone in zones_reparation:
		zones_reparation.append(zone)
		print("✅ Zone enregistrée dans RepairManager: ", zone.name, " (ID: ", zone.id_reparation_cible, ")")
		
		# Si on a déjà des données, on met à jour la zone tout de suite
		if not AppState.interventions_disponibles.is_empty():
			zone._verifier_etat(AppState.interventions_disponibles)

func _trouver_zones_reparation():
	# Méthode de secours
	var scene_root = get_tree().root.get_child(0)
	_find_zones_recursive(scene_root)
	
	print("Zones de réparation trouvées (scan manuel): ", zones_reparation.size())

func _find_zones_recursive(node: Node):
	if node is Area3D and node.has_method("obtenir_etat"):
		if not node in zones_reparation:
			zones_reparation.append(node)
			print("  → Zone trouvée: ", node.id_reparation_cible)
	
	for child in node.get_children():
		_find_zones_recursive(child)


func _sur_slots_maj(slots_data):
	# Les slots contiennent l'info "quel véhicule est là" et son status
	# ex: { "1": { "car_id": "...", "status": "occupied" } }
	var safe_data = _safe_dict(slots_data)
	
	print("RepairManager: Reçu slots data: ", safe_data.keys())
	
	for slot_id in safe_data.keys():
		var slot_info = safe_data[slot_id]
		# On transforme ça en format "interventions_disponibles" pour la zone
		# La zone attend { "status": "waiting" } ou similaire pour activer le bouton
		
		# Logique ID
		var zone_cible = _trouver_zone_par_id_flexible(slot_id)
		if zone_cible:
			# Si le slot est occupé, on considère que c'est "en attente" de réparation (ou déjà en cours)
			var status = slot_info.get("status", "available")
			var car_id = slot_info.get("car_id", "")
			
			if status == "occupied" and car_id != "":
				# On injecte les données pour que la zone active le bouton
				# On préserve les données existantes si possible
				var fake_repair_data = {
					"status": "waiting", # Force le status "waiting" pour activer le bouton
					"car_id": car_id,
					"duration": slot_info.get("duration", 5.0) # Durée par défaut ou depuis config
				}
				
				# IMPORTANT: Si une vraie réparation est DÉJÀ en cours (via l'autre signal), ne pas écraser
				if not zone_cible.reparation_en_cours:
					zone_cible._verifier_etat({ slot_id: fake_repair_data })
			elif status == "available":
				zone_cible.reinitialiser_zone()

func _trouver_zone_par_id_flexible(id_chercher: String) -> Node:
	for zone in zones_reparation:
		# Test 1: ID exact
		if zone.id_reparation_cible == id_chercher:
			return zone
		# Test 2: ID numérique (repair_1 == 1)
		if zone.id_reparation_cible == "repair_" + id_chercher:
			return zone
		# Test 3: ID inverse (1 == repair_1)
		if id_chercher == "repair_" + zone.id_reparation_cible: # peu probable mais bon
			return zone
	return null


func _sur_donnees_mises_a_jour(toutes_les_reparations):
	var safe_data = _safe_dict(toutes_les_reparations)
	AppState.interventions_disponibles = safe_data
	
	# NE PAS appeler _verifier_etat ici avec les réparations car cela écrase l'état des slots !
	# Les zones écouteront directement les mises à jour de réparations si nécessaire.
	
	_rechercher_reparation_active(safe_data)

func _rechercher_reparation_active(reparations: Dictionary):
	reparation_active.clear()
	
	for repair_id in reparations.keys():
		var data = reparations[repair_id]
		
		# Sécurité: vérifier si c'est bien un dictionnaire
		if typeof(data) != TYPE_DICTIONARY:
			continue
			
		if data.get("status") == "in_progress":
			reparation_active = {
				"id": repair_id,
				"data": data,
				"start_time": data.get("start_timestamp", 0),
				"duration": data.get("duration", 0.0),
				"progression": data.get("progression", 0)
			}
			print(" Réparation active détectée: ", repair_id)
			break

# Note: La progression est gérée directement par RepairZone._on_timer_tick()
# RepairManager ne fait que du tracking en lecture seule via _rechercher_reparation_active()

func _afficher_notification(message: String):
	"""Affiche une notification à l'écran"""
	var notification = get_node_or_null("/root/MainScene/UI/Notification")
	if notification and notification.has_method("show_message"):
		notification.show_message(message, 3.0)

# --- FONCTIONS PUBLIQUES ---

func obtenir_zones_actives() -> Array:
	var actives = []
	for zone in zones_reparation:
		var etat = zone.obtenir_etat()
		if etat.get("reparation_en_cours", false):
			actives.append(etat)
	return actives

func obtenir_zone_par_id(zone_id: String) -> Node:
	for zone in zones_reparation:
		if zone.id_reparation_cible == zone_id:
			return zone
	return null

func lancer_reparation_zone(zone_id: String):
	var zone = obtenir_zone_par_id(zone_id)
	if zone:
		# 1. Déclencher l'action dans la zone (envoie à Firebase)
		if zone.has_method("_declencher_action"):
			zone._declencher_action()
		
		# 2. Force le démarrage local immédiat pour le Feedback
		# On crée une réparation active fictive temporaire en attendant le retour Firebase
		var repair_data = {
			"id": zone_id,
			"data": { "status": "in_progress", "duration": zone.duree_prevue },
			"start_time": Time.get_unix_time_from_system(),
			"duration": zone.duree_prevue,
			"progression": 0
		}
		
		reparation_active = repair_data
		reparations_par_zone[zone_id] = repair_data
		
		print("🚀 Réparation forcée localement pour: ", zone_id)
		


func terminer_reparation_zone(zone_id: String):
	var zone = obtenir_zone_par_id(zone_id)
	if zone and zone.has_method("terminer_reparation"):
		zone.terminer_reparation()
	
	# Nettoyer le tracking
	if reparations_par_zone.has(zone_id):
		reparations_par_zone.erase(zone_id)

func obtenir_reparations_en_cours() -> Array:
	"""Retourne toutes les réparations en cours de toutes les zones"""
	var result = []
	for zone in zones_reparation:
		if zone.reparation_en_cours:
			result.append({
				"zone_id": zone.id_reparation_cible,
				"voiture_id": zone.voiture_id_actuelle if "voiture_id_actuelle" in zone else "",
				"tache_courante": zone.taches_a_reparer[zone.tache_courante_index] if zone.tache_courante_index < zone.taches_a_reparer.size() else {},
				"progression": zone.progression_actuelle
			})
	return result

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
