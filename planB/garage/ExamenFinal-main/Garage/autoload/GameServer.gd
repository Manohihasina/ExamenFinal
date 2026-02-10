extends Node

var firebase_config = {
	
}
# ----- Utilisateur permanent antsika ------ #
const ADMIN_EMAIL = "loadtorque@intern.com"
const ADMIN_PASS = "JEUGARAGE5"

# --- SIGNAUX ---
signal donnees_mises_a_jour(toutes_les_reparations)
signal slots_reparation_maj(slots_data)
signal zone_paiement_maj(waiting_data)
signal reparations_voiture_maj(car_id, repairs_list)

# --- VARIABLES ---
var db_ref : FirebaseDatabaseReference = null
var cache_reparations : Dictionary = {} 
var est_connecte : bool = false


var _reconnect_timer = null
const RECONNECT_DELAY = 5.0 # Tentative toutes les 5 secondes si déconnecté

func _ready():
	print("--- INITIALISATION DU SERVEUR ---")
	
	# Setup Timer redémarrage
	_reconnect_timer = Timer.new()
	if _reconnect_timer == null:
		print("ERREUR CRITIQUE: Timer.new() a retourné null!")
		return
		
	_reconnect_timer.wait_time = RECONNECT_DELAY
	_reconnect_timer.one_shot = true
	_reconnect_timer.timeout.connect(_tentative_connexion)
	add_child(_reconnect_timer)
	
	Firebase.Auth.login_succeeded.connect(_sur_connexion_ok)
	Firebase.Auth.login_failed.connect(_sur_connexion_echec)
	
	_tentative_connexion()

func _tentative_connexion():
	if est_connecte: return
	print("📡 Tentative de connexion à Firebase...")
	Firebase.Auth.login_with_email_and_password(ADMIN_EMAIL, ADMIN_PASS)

func _sur_connexion_ok(auth):
	print("✅ Connecté en Admin. ID: ", auth.localid)
	est_connecte = true
	
	# Stop le timer si il tournait
	_reconnect_timer.stop()
	
	# Ecoute des réparations actives
	db_ref = Firebase.Database.get_database_reference("repairs")
	db_ref.new_data_update.connect(_sur_mise_a_jour_firebase)
	
	# Ecoute des slots de réparation
	var repair_slots_ref = Firebase.Database.get_database_reference("repair_slots")
	repair_slots_ref.new_data_update.connect(_sur_mise_a_jour_slots_reparation)
	
	# Ecoute de la zone de paiement
	var waiting_slots_ref = Firebase.Database.get_database_reference("waiting_slots")
	waiting_slots_ref.new_data_update.connect(_sur_mise_a_jour_zone_paiement)

func _sur_connexion_echec(code, msg):
	print("❌ Erreur connexion Auth: ", msg)
	print("🔄 Nouvelle tentative dans ", RECONNECT_DELAY, " secondes...")
	est_connecte = false
	_reconnect_timer.start()

func _sur_mise_a_jour_firebase(resource):
	if resource.data == null: 
		return

	if resource.key == "" or resource.key == "/":
		# Mise à jour complète
		cache_reparations = _safe_dict(resource.data)
	else:
		# Mise à jour partielle (ex: "repair_id" ou "repair_id/status")
		var keys = resource.key.split("/")
		var repair_id = keys[0]
		
		# S'assurer que l'entrée existe
		if not cache_reparations.has(repair_id):
			cache_reparations[repair_id] = {}
			
		if keys.size() == 1:
			# Update de l'objet entier
			cache_reparations[repair_id] = resource.data
		else:
			# Update d'une propriété
			var property = keys[1]
			if cache_reparations[repair_id] is Dictionary:
				cache_reparations[repair_id][property] = resource.data
	
	print("🔥 Firebase Update (Repairs): ", resource.key)
	donnees_mises_a_jour.emit(cache_reparations)
	_verifier_consistance_donnees()

var cache_repair_slots : Dictionary = {}
var cache_waiting_slots : Dictionary = {}

func _sur_mise_a_jour_slots_reparation(resource):
	if resource.data == null: return
	
	if resource.key == "" or resource.key == "/":
		cache_repair_slots = _safe_slots_dict(resource.data)
		print("📦 Cache Slots Init: ", cache_repair_slots.keys())
	else:
		if typeof(cache_repair_slots) != TYPE_DICTIONARY:
			cache_repair_slots = _safe_slots_dict(cache_repair_slots)
			
		var keys = resource.key.split("/")
		var raw_id = keys[0]
		var slot_id = raw_id
		if not slot_id.begins_with("repair_"):
			slot_id = "repair_" + raw_id
		
		if not cache_repair_slots.has(slot_id):
			cache_repair_slots[slot_id] = {}
			
		if keys.size() == 1:
			if resource.data == null:
				cache_repair_slots.erase(slot_id)
			else:
				cache_repair_slots[slot_id] = resource.data
		else:
			var property = keys[1]
			if not (cache_repair_slots[slot_id] is Dictionary):
				cache_repair_slots[slot_id] = {}
			cache_repair_slots[slot_id][property] = resource.data
	
	emit_signal("slots_reparation_maj", cache_repair_slots)
	_verifier_consistance_donnees()

func _safe_slots_dict(data) -> Dictionary:
	var raw = _safe_dict(data)
	var standardized = {}
	for k in raw.keys():
		var new_k = str(k)
		if not new_k.begins_with("repair_"):
			new_k = "repair_" + new_k
		standardized[new_k] = raw[k]
	return standardized

func _sur_mise_a_jour_zone_paiement(resource):
	if resource.data == null: return
	
	if resource.key == "" or resource.key == "/":
		cache_waiting_slots = _safe_dict(resource.data)
	else:
		var keys = resource.key.split("/")
		var item_id = keys[0]
		
		if not cache_waiting_slots.has(item_id):
			cache_waiting_slots[item_id] = {}
			
		if keys.size() == 1:
			cache_waiting_slots[item_id] = resource.data
		else:
			var property = keys[1]
			if cache_waiting_slots[item_id] is Dictionary:
				cache_waiting_slots[item_id][property] = resource.data

	emit_signal("zone_paiement_maj", cache_waiting_slots)
	_verifier_consistance_donnees()

func _verifier_consistance_donnees():
	"""
	Vérifie l'intégrité des slots de réparation.
	1. Si une voiture a fini TOUTES ses réparations -> Vers paiement + Libérer slot.
	2. Si une voiture est dans un slot mais n'existe plus dans 'repairs' -> Libérer slot (orpheline).
	"""
	if cache_repair_slots.is_empty():
		return

	# Ne pas abuser des logs si rien ne change, mais ici on est en debug mode
	# print("🔍 Vérification consistance données...")
	
	# 1. Scanner les réparations pour connaître l'état de chaque voiture
	var car_status_map = {} # car_id -> {total, completed, price, interventions, userId}
	
	for rid in cache_reparations.keys():
		var r = cache_reparations[rid]
		if typeof(r) != TYPE_DICTIONARY: continue
		var cid = str(r.get("carId", ""))
		if cid == "" or cid == "null": continue
		
		if not car_status_map.has(cid):
			car_status_map[cid] = {"total": 0, "completed": 0, "price": 0.0, "interventions": [], "userId": str(r.get("userId", ""))}
			
		car_status_map[cid].total += 1
		car_status_map[cid].price += float(r.get("interventionPrice", 0))
		car_status_map[cid].interventions.append({
			"id": rid,
			"name": r.get("interventionName", "?"),
			"price": r.get("interventionPrice", 0)
		})
		
		if r.get("status") == "completed":
			car_status_map[cid].completed += 1
	
	# 2. Scanner les slots pour détecter les incohérences
	var cars_in_waiting = []
	for wid in cache_waiting_slots.keys():
		var w = cache_waiting_slots[wid]
		if typeof(w) == TYPE_DICTIONARY and w.has("carId"):
			cars_in_waiting.append(str(w.carId))
			
	for slot_id in cache_repair_slots.keys():
		var s = cache_repair_slots[slot_id]
		if typeof(s) != TYPE_DICTIONARY: continue
		
		var s_car_id = str(s.get("car_id", ""))
		if s_car_id == "" or s_car_id == "null": continue
		
		# A. Cas de la voiture terminée
		if car_status_map.has(s_car_id):
			var data = car_status_map[s_car_id]
			if data.total > 0 and data.total == data.completed:
				if not s_car_id in cars_in_waiting:
					print("🚨 AUTO-FIX: Voiture ", s_car_id, " terminée mais bloquée dans Slot ", slot_id)
					var waiting_data = {
						"carId": s_car_id,
						"clientId": data.userId,
						"interventions": data.interventions,
						"totalPrice": data.price,
						"createdAt": Time.get_datetime_string_from_system(),
						"status": "waiting_payment"
					}
					ajouter_au_waiting_slots(waiting_data)
				
				liberer_slot_reparation(slot_id)
		
		# B. Cas de la voiture "orpheline" (dans un slot mais aucune réparation associée en DB)
		# Cela arrive si on a supprimé les réparations manuellement ou bug d'assignation
		else:
			# Petite sécurité: on attend que cache_reparations soit chargé avant de crier "orpheline"
			# Normalement l'auth garantit que si on a slots on a repairs, mais bon.
			if not cache_reparations.is_empty():
				print("🚨 AUTO-FIX: Voiture ", s_car_id, " orpheline dans Slot ", slot_id, " (Aucune réparation en DB)")
				liberer_slot_reparation(slot_id)

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


# --- FONCTIONS D'ACTION ---

func lancer_reparation(repair_id: String, duree: float):
	if not est_connecte: 
		print("Pas de connexion, action impossible.")
		return

	print("Envoi ordre réparation pour: ", repair_id)
	
	#-------Notif realtime anle fanamboarana---------#
	var path = "repairs/" + repair_id
	var ref_specifique = Firebase.Database.get_database_reference(path)
	
	var data_update = {
		"status": "in_progress",
		"start_timestamp": Time.get_unix_time_from_system(),
		"duration": duree
	}
	ref_specifique.update("", data_update)

func terminer_reparation(repair_id: String):
	var path = "repairs/" + repair_id
	var ref_specifique = Firebase.Database.get_database_reference(path)
	ref_specifique.update("", {"status": "completed"})


func mettre_a_jour_progression(repair_id: String, progression: int):
	"""Met à jour la progression d'une réparation"""
	if not est_connecte: 
		print(" Pas de connexion, mise à jour impossible.")
		return

	print("📈 Mise à jour progression pour ", repair_id, ": ", progression, "%")
	
	var path = "repairs/" + repair_id
	var ref_specifique = Firebase.Database.get_database_reference(path)
	
	var data_update = {
		"progression": progression,
		"last_update": Time.get_unix_time_from_system()
	}
	ref_specifique.update("", data_update)

func mettre_a_jour_slot(slot_id: String, data: Dictionary):
	if not est_connecte: 
		print("Pas de connexion, MAJ slot impossible.")
		return

	print("💾 Mise à jour Slot ", slot_id, ": ", data)
	
	var path = "repair_slots/" + slot_id
	var ref = Firebase.Database.get_database_reference(path)
	ref.update("", data)

# --- NOUVELLES FONCTIONS POUR RÉPARATIONS PROCÉDURALES ---

func obtenir_reparations_voiture(car_id: String) -> Array:
	"""Récupère toutes les réparations associées à une voiture depuis le cache"""
	var repairs = []
	
	print("🔍 GameServer: Chasse aux réparations pour car_id: ", car_id, " | Cache Size: ", cache_reparations.size())
	for repair_id in cache_reparations.keys():
		var repair_data = cache_reparations[repair_id]
		# print("   - Checking repair: ", repair_id, " -> CarID: ", repair_data.get("carId", "N/A"))
		if typeof(repair_data) == TYPE_DICTIONARY:
			if repair_data.get("carId", "") == car_id:
				print("   ✅ MATCH Found: ", repair_id, " | Status: ", repair_data.get("status", "pending"))
				repairs.append({
					"id": repair_id,
					"interventionName": repair_data.get("interventionName", "Réparation"),
					"interventionDuration": repair_data.get("interventionDuration", 60),
					"interventionPrice": repair_data.get("interventionPrice", 0),
					"status": repair_data.get("status", "pending"),
					"startedAt": repair_data.get("startedAt", 0),
					"halfwayNotified": repair_data.get("halfwayNotified", false),
					"completedNotified": repair_data.get("completedNotified", false)
				})
	
	# Trier par statut: pending d'abord, puis in_progress, puis completed
	repairs.sort_custom(func(a, b):
		var order = {"pending": 0, "in_progress": 1, "completed": 2}
		return order.get(a.status, 3) < order.get(b.status, 3)
	)
	
	return repairs

func demarrer_reparation_tache(repair_id: String, intervention_id: int, duration: float):
	"""Démarre une tâche de réparation spécifique (appelé pour chaque intervention)"""
	if not est_connecte: 
		print("❌ Pas de connexion, démarrage impossible.")
		return
	
	print("🚀 Démarrage tâche réparation: ", repair_id, " (IntID: ", intervention_id, ") durée: ", duration, "s")
	
	var path = "repairs/" + repair_id
	var ref_specifique = Firebase.Database.get_database_reference(path)
	
	var data_update = {
		"status": "in_progress",
		"startedAt": int(Time.get_unix_time_from_system() * 1000), # Timestamp en ms comme le frontend
		"updatedAt": Time.get_datetime_string_from_system()
	}
	ref_specifique.update("", data_update)

func marquer_notification_envoyee(repair_id: String, type: String):
	"""Marque qu'une notification a été envoyée (halfwayNotified ou completedNotified)"""
	if not est_connecte: return
	
	var path = "repairs/" + repair_id
	var ref_specifique = Firebase.Database.get_database_reference(path)
	
	var data_update = {}
	if type == "halfway":
		data_update["halfwayNotified"] = true
	elif type == "completed":
		data_update["completedNotified"] = true
	
	data_update["updatedAt"] = Time.get_datetime_string_from_system()
	ref_specifique.update("", data_update)
	print("📧 Notification marquée: ", type, " pour ", repair_id)

func terminer_tache_reparation(repair_id: String):
	"""Termine une tâche de réparation et marque completedNotified"""
	if not est_connecte: return
	
	print("✅ Tâche terminée: ", repair_id)
	
	var path = "repairs/" + repair_id
	var ref_specifique = Firebase.Database.get_database_reference(path)
	
	var data_update = {
		"status": "completed",
		"completedNotified": true,
		"completedAt": Time.get_datetime_string_from_system(),
		"updatedAt": Time.get_datetime_string_from_system()
	}
	ref_specifique.update("", data_update)

func ajouter_au_waiting_slots(data: Dictionary):
	"""Ajoute une voiture terminée dans waiting_slots (comme moveToWaitingSlots du frontend)"""
	if not est_connecte:
		print("Pas de connexion, ajout waiting_slots impossible.")
		return
	
	print("💰 Ajout INSTANTANÉ voiture aux waiting_slots: ", data.get("carId", "?"))
	
	# 1. Mise à jour PREDICTIVE pour GarageManager
	var fake_id = "temp_" + str(Time.get_ticks_msec())
	cache_waiting_slots[fake_id] = data
	emit_signal("zone_paiement_maj", cache_waiting_slots)
	
	# 2. Envoi réel
	var ref = Firebase.Database.get_database_reference("waiting_slots")
	ref.push(data)

func liberer_slot_reparation(slot_id: String):
	"""Libère un slot de réparation (status: available, car_id: vide)"""
	if not est_connecte:
		return
	
	var path_id = slot_id
	if not path_id.begins_with("repair_"):
		path_id = "repair_" + slot_id
	
	print("🔓 Libération INSTANTANÉE du slot: ", path_id)
	
	# 1. Mise à jour PREDICTIVE
	cache_repair_slots[path_id] = {
		"status": "available",
		"car_id": ""
	}
	emit_signal("slots_reparation_maj", cache_repair_slots)
	
	# 2. Envoi réel
	var path = "repair_slots/" + path_id
	var ref = Firebase.Database.get_database_reference(path)
	ref.update("", {
		"status": "available",
		"car_id": ""
	})

func obtenir_voitures_en_attente() -> Array:
	"""
	Retourne la liste des voitures qui ont des réparations 'pending' ou 'in_progress'
	mais qui ne sont PAS encore dans un slot de réparation ou en attente de paiement.
	"""
	var cars_map = {}
	
	# 1. Scanner toutes les réparations
	for repair_id in cache_reparations.keys():
		var data = cache_reparations[repair_id]
		if typeof(data) != TYPE_DICTIONARY: continue
		
		var car_id = str(data.get("carId", ""))
		if car_id == "" or car_id == "null": continue
		
		# Initialiser si pas encore vu
		if not cars_map.has(car_id):
			cars_map[car_id] = {
				"car_id": car_id,
				"client_id": str(data.get("userId", "Inconnu")),
				"taches": [],
				"has_active_work": false
			}
		
		# Ajouter la tâche
		var task_name = data.get("interventionName", "Intervention")
		cars_map[car_id]["taches"].append(task_name)
		
		var status = data.get("status", "pending")
		if status == "pending" or status == "in_progress":
			cars_map[car_id]["has_active_work"] = true
	
	# 2. Filtrer les voitures déjà dans un slot de réparation
	var known_car_ids_in_slots = []
	for slot_id in cache_repair_slots.keys():
		var slot_data = cache_repair_slots[slot_id]
		if typeof(slot_data) == TYPE_DICTIONARY:
			var cid = str(slot_data.get("car_id", ""))
			if cid != "" and cid != "null":
				known_car_ids_in_slots.append(cid)
	
	# 3. Filtrer les voitures déjà en attente de paiement
	for pay_id in cache_waiting_slots.keys():
		var pay_data = cache_waiting_slots[pay_id]
		if typeof(pay_data) == TYPE_DICTIONARY:
			var cid = str(pay_data.get("carId", ""))
			if cid != "" and cid != "null":
				known_car_ids_in_slots.append(cid)
	
	# 4. Construire la liste finale
	var final_list = []
	for car_id in cars_map.keys():
		var info = cars_map[car_id]
		# On garde seulement si elle a du travail actif ET pas déjà placée
		if info["has_active_work"] and not car_id in known_car_ids_in_slots:
			final_list.append(info)
			
	return final_list

func assigner_voiture_slot(car_id: String, slot_id: String):
	"""Assigne une voiture à un slot de réparation spécifique"""
	if not est_connecte: return
	
	# Utiliser l'ID complet "repair_X"
	var path_id = slot_id
	if not path_id.begins_with("repair_"):
		path_id = "repair_" + slot_id
	
	print("🚀 Assignation INSTANTANÉE voiture ", car_id, " -> Slot ", path_id)
	
	# 1. Mise à jour PREDICTIVE (Optimistic UI)
	# On met à jour le cache local tout de suite pour que le jeu réagisse sans attendre Firebase
	var new_data = {
		"car_id": car_id,
		"status": "occupied",
		"updated_at": Time.get_unix_time_from_system()
	}
	
	cache_repair_slots[path_id] = new_data
	emit_signal("slots_reparation_maj", cache_repair_slots)
	
	# 2. Envoi à Firebase
	var path = "repair_slots/" + path_id
	var ref = Firebase.Database.get_database_reference(path)
	
	ref.update("", new_data)
