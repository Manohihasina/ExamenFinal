extends Area3D

# --- PROPRIÉTÉS EXPORTÉES ---
@export var id_reparation_cible : String = "repair_3"
@export var zone_display_name : String = "Zone de réparation"
@export var activation_key : String = "confirmer" 
@export var highlight_material : Material
@export var default_material : Material

# --- VARIABLES ---
var joueur_present : bool = false
var peut_reparer_localement : bool = false
var duree_prevue : float = 10.0
var reparation_en_cours : bool = false
var progression_actuelle : int = 0

# --- VARIABLES TÂCHES PROCÉDURALES ---
var voiture_id_actuelle : String = ""
var taches_a_reparer : Array = []  # Liste des interventions depuis Firebase
var tache_courante_index : int = 0
var tache_start_time : float = 0.0
var tache_duration : float = 0.0
var timer_reparation : Timer = null


# --- RÉFÉRENCES ---
var game_server : Node = null
var repair_manager : Node = null
var mesh_instance : MeshInstance3D = null
var ui_indicator : Node3D = null
# UI 3D
var etiquette_3d: Label3D = null
var progress_bar_3d : TextureProgressBar = null
var progress_label_3d : Label = null
var sprite_3d : Sprite3D = null

# UI 2D (Sélection Voiture)
var ui_layer: CanvasLayer = null
var ui_camera_list: ItemList = null
var ui_panel: Panel = null
var selected_car_id_temp: String = ""

# --- SIGNAL ---
signal reparation_demarree(zone_id, duree)
signal reparation_terminee(zone_id)
signal joueur_dans_zone(joueur, zone_id, peut_reparer)
signal etat_zone_change(zone_id, etat, progression)

func _ready():
	
	game_server = $"/root/GameServer"
	repair_manager = $"/root/RepairManager" if has_node("/root/RepairManager") else null
	
	mesh_instance = _trouver_mesh_instance()
	ui_indicator = $Indicator if has_node("Indicator") else null
	
	body_entered.connect(_on_entree)
	body_exited.connect(_on_sortie)
	
	# Timer pour mise à jour progression en temps réel
	timer_reparation = Timer.new()
	timer_reparation.wait_time = 0.5
	timer_reparation.one_shot = false
	timer_reparation.timeout.connect(_on_timer_tick)
	add_child(timer_reparation)

	if game_server:
		# CORRECTION: On doit écouter les slots (structure repair_slots) et non les réparations (repairs)
		# pour que id_reparation_cible ("repair_1" -> "1") fonctionne.
		game_server.slots_reparation_maj.connect(_verifier_etat)
		# NOUVEAU: On écoute aussi les mises à jour des réparations pour rafraîchir les tâches
		game_server.donnees_mises_a_jour.connect(_on_global_repairs_update)
	else:
		push_warning(" GameServer non trouvé pour SlotReparation: ", id_reparation_cible)
	
	# DEBUG: Forcer la détection de tous les layers
	collision_mask = 0xFFFFFFFF
	
	# Auto-enregistrement auprès du Manager
	if repair_manager and repair_manager.has_method("register_zone"):
		repair_manager.register_zone(self)
	
	# Initialisation avec le cache existant (si disponible)
	if game_server and not game_server.cache_repair_slots.is_empty():
		_verifier_etat(game_server.cache_repair_slots)
	
	_update_apparence()
	_setup_collision()
	_setup_3d_ui()
	_setup_ui_selection() # Nouvelle UI 2D
	
	print("Zone de réparation prête: ", id_reparation_cible)


func _process(delta):
	# Démarrer la réparation (si en cours et joueur présent)
	if joueur_present and not reparation_en_cours and peut_reparer_localement and not taches_a_reparer.is_empty():
		if Input.is_action_just_pressed("confirmer"):
			_declencher_action()
	
	# PROPOSITION D'APPEL DE VÉHICULE (si zone vide)
	elif joueur_present and not reparation_en_cours and voiture_id_actuelle == "":
		if Input.is_action_just_pressed("confirmer"):
			_ouvrir_ui_selection()


func _setup_3d_ui():
	# Création d'un Viewport pour le rendu UI 2D en 3D
	var viewport = SubViewport.new()
	viewport.size = Vector2(300, 100) # Agrandissement pour meilleure résolution
	viewport.transparent_bg = true
	viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	add_child(viewport)
	
	# Conteneur UI
	var container = Control.new()
	container.custom_minimum_size = viewport.size
	viewport.add_child(container)
	
	# Fond
	var bg = ColorRect.new()
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	bg.color = Color(0, 0, 0, 0.7) # Un peu plus sombre
	container.add_child(bg)
	
	# Barre de progression
	progress_bar_3d = TextureProgressBar.new()
	progress_bar_3d.custom_minimum_size = Vector2(280, 80) # Plus grand
	progress_bar_3d.position = Vector2(10, 50)
	progress_bar_3d.value = 0
	progress_bar_3d.nine_patch_stretch = true # Permet de redimensionner proprement
	progress_bar_3d.texture_under = _create_colored_texture(Color(0.2, 0.2, 0.2), Vector2(280, 40))
	progress_bar_3d.texture_progress = _create_colored_texture(Color.GREEN, Vector2(280, 40))
	container.add_child(progress_bar_3d)
	
	# Label
	progress_label_3d = Label.new()
	progress_label_3d.position = Vector2(5, 5)
	progress_label_3d.custom_minimum_size = Vector2(290, 40)
	progress_label_3d.text = "En attente..."
	progress_label_3d.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	progress_label_3d.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	progress_label_3d.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	progress_label_3d.add_theme_font_size_override("font_size", 24) # Plus grand texte
	container.add_child(progress_label_3d)
	
	sprite_3d = Sprite3D.new()
	sprite_3d.texture = viewport.get_texture()
	sprite_3d.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	sprite_3d.position = Vector3(0, 3.5, 0) # Plus haut pour être au dessus des gros véhicules
	sprite_3d.pixel_size = 0.005 # Ajustement échelle
	sprite_3d.no_depth_test = true # RENDU PAR DESSUS TOUT (important pour visibilité)
	sprite_3d.render_priority = 10 # Priorité d'affichage
	sprite_3d.visible = false
	add_child(sprite_3d)

func _create_colored_texture(color: Color, size: Vector2) -> ImageTexture:
	var image = Image.create(size.x, size.y, false, Image.FORMAT_RGBA8)
	image.fill(color)
	return ImageTexture.create_from_image(image)

func _trouver_mesh_instance() -> MeshInstance3D:
	for child in get_children():
		if child is MeshInstance3D:
			return child
		var mesh = child.get_node_or_null("MeshInstance3D") as MeshInstance3D
		if mesh:
			return mesh
	return null

func _setup_collision():
	collision_layer = 2  
	collision_mask = 1  

func _verifier_etat(donnees_globales: Dictionary):
	# print("Zone ", id_reparation_cible, " vérifie état. Clés dispos: ", donnees_globales.keys())
	
	var ma_data = {}
	
	# 1. Essayer avec l'ID exact (ex: "repair_1")
	if donnees_globales.has(id_reparation_cible):
		ma_data = donnees_globales[id_reparation_cible]
	
	# 2. Essayer avec l'ID numérique (ex: "1" si id_reparation_cible est "repair_1")
	elif id_reparation_cible.begins_with("repair_"):
		var numeric_id = id_reparation_cible.replace("repair_", "")
		if donnees_globales.has(numeric_id):
			ma_data = donnees_globales[numeric_id]
	
	if ma_data.is_empty():
		peut_reparer_localement = false
		reparation_en_cours = false
		_update_apparence()
		return

	var status = ma_data.get("status", "")
	
	duree_prevue = ma_data.get("duration", 10.0)
	
	
	if ma_data.has("car_id") and ma_data["car_id"] != "" and ma_data["car_id"] != voiture_id_actuelle:
		print("🔄 Synchro Serveur: Véhicule ", ma_data["car_id"], " détecté dans zone ", id_reparation_cible)
		print("   -> Tâches à charger depuis DB pour: ", ma_data["car_id"])
		voiture_id_actuelle = ma_data["car_id"]
		_charger_taches_pour_voiture(voiture_id_actuelle)
	
	match status:
		"pending", "waiting":
			peut_reparer_localement = true
			reparation_en_cours = false
			progression_actuelle = 0
			
			# IMPORTANT: Recharger les tâches si elles sont vides ou si le statut vient de changer
			# Cela corrige le bug "Aucune tâche à effectuer" si l'update arrive après l'entrée
			if voiture_id_actuelle != "" and game_server:
				taches_a_reparer = game_server.obtenir_reparations_voiture(voiture_id_actuelle)
				# Filtrer terminées
				taches_a_reparer = taches_a_reparer.filter(func(t): return t.status != "completed")
				if taches_a_reparer.size() > 0:
					tache_courante_index = 0
					_afficher_liste_taches()
		
		"in_progress":
			peut_reparer_localement = false
			reparation_en_cours = true
			progression_actuelle = ma_data.get("progression", 0)
		
		"completed", "finished":
			peut_reparer_localement = false
			reparation_en_cours = false
			progression_actuelle = 100
		
		_:
			# Fallback: Si on a des tâches chargées, on autorise quand même (pour éviter le blocage "Status: available")
			if not taches_a_reparer.is_empty() and tache_courante_index < taches_a_reparer.size():
				peut_reparer_localement = true
				reparation_en_cours = false
				print("⚠️ Force active: Status '", status, "' mais tâches présentes.")
			else:
				peut_reparer_localement = false
				reparation_en_cours = false
	
	_update_apparence()
	
	_mettre_a_jour_appstate(ma_data)
	
	etat_zone_change.emit(id_reparation_cible, status, progression_actuelle)
	
	# Vérification physique si des véhicules sont déjà là (cas du spawn direct)
	_check_overlapping_vehicles()

func _check_overlapping_vehicles():
	# Si un véhicule est déjà dedans physiquement mais que le serveur ne le sait pas
	# ou pour initialiser l'état local
	var bodies = get_overlapping_bodies()
	print(" Zone ", id_reparation_cible, " (Pos: ", global_position, ") check overlaps: ", bodies.size(), " corps trouvés.")
	
	for body in bodies:
		print("   -> Corps: ", body.name, " | Groupes: ", body.get_groups())
		if body.is_in_group("vehicles"):
			# On simule l'entrée pour déclencher la logique
			_on_entree(body)



func _on_global_repairs_update(data):
	"""Appelé quand Firebase envoie une mise à jour des réparations (tâches)"""
	# Si on a un véhicule identifié, on recharge ses tâches pour être sûr d'avoir les dernières infos
	if voiture_id_actuelle != "":
		# print("🔄 Mise à jour globale repairs reçue -> Re-check tâches pour ", voiture_id_actuelle)
		_charger_taches_pour_voiture(voiture_id_actuelle)


func _mettre_a_jour_appstate(data: Dictionary):
	if not AppState:
		return
	
	if data.get("status") == "in_progress" and AppState.intervention_active == id_reparation_cible:
		AppState.progression = data.get("progression", 0)
		AppState.status = "en_cours"

func _update_apparence():
	if not mesh_instance:
		return
	
	if reparation_en_cours:
		mesh_instance.material_override = highlight_material if highlight_material else null
		_set_indicator_color(Color.YELLOW)
	elif peut_reparer_localement:
		mesh_instance.material_override = highlight_material if highlight_material else null
		_set_indicator_color(Color.GREEN)
	else:
		mesh_instance.material_override = default_material
		_set_indicator_color(Color.RED)
	
	if sprite_3d:
		# Visible si une voiture est présente (permanence) OU si on propose une action (appel voiture)
		var show = (voiture_id_actuelle != "") or (joueur_present and peut_reparer_localement) or (joueur_present and voiture_id_actuelle == "")
		if voiture_id_actuelle != "":
			sprite_3d.visible = true
		else:
			sprite_3d.visible = joueur_present and not reparation_en_cours

func _set_indicator_color(color: Color):
	if ui_indicator and ui_indicator.has_method("set_color"):
		ui_indicator.set_color(color)

func _on_entree(body: Node):
	if body.is_in_group("player"):
		joueur_present = true
		_update_status_message()
		joueur_dans_zone.emit(body, id_reparation_cible, peut_reparer_localement)
		set_process_input(true)
		
		# Force check au cas où le véhicule est déjà là mais non détecté
		_check_overlapping_vehicles()
		
		# Afficher les tâches si une voiture est présente
		if not taches_a_reparer.is_empty():
			_afficher_liste_taches()
			
		# SYNC AppState: Si une réparation tourne déjà ici, on informe le HUD global
		if reparation_en_cours and tache_courante_index < taches_a_reparer.size():
			var tache = taches_a_reparer[tache_courante_index]
			AppState.commande_id = id_reparation_cible
			AppState.intervention_active = str(tache.id)
			AppState.status = "en_cours"
			AppState.progression = progression_actuelle
		
	elif body.is_in_group("vehicles"):
		print(" Véhicule détecté dans zone: ", id_reparation_cible, " | Body: ", body.name)
		
		var car_id = ""
		
		# 1. Essayer d'obtenir l'ID directement
		if "car_id" in body:
			car_id = body.car_id
		elif body.get("car_id"):
			car_id = body.get("car_id")
			
		# 2. Essayer via le lien méta (défini par Car.gd)
		if car_id == "" and body.has_meta("car_root"):
			var root = body.get_meta("car_root")
			if root and "car_id" in root:
				car_id = root.car_id
				
		# 3. Essayer via le parent (Fallback)
		if car_id == "" and body.get_parent() and "car_id" in body.get_parent():
			car_id = body.get_parent().car_id
		
		# Sécurité: Ne pas mettre à jour si l'ID est vide
		if car_id == "" or car_id == null:
			print(" ID Véhicule introuvable sur le corps ", body.name)
			return


		voiture_id_actuelle = car_id
		
		# Utiliser la méthode centralisée
		_charger_taches_pour_voiture(voiture_id_actuelle)


func _on_sortie(body: Node):
	if body.is_in_group("player"):
		joueur_present = false
		_cacher_message()
		set_process_input(false)
		
		# Clear AppState pour éviter que le HUD affiche des infos d'une zone quittée
		if AppState.commande_id == id_reparation_cible:
			AppState.status = "en_attente"
			AppState.progression = 0
		
	elif body.is_in_group("vehicles"):
		print(" Véhicule sorti de zone: ", id_reparation_cible)
		
		# Désactivé pour l'instant pour éviter les disparitions accidentelles
		# lors des petits mouvements physiques ou bugs de collision
		pass
		# if game_server and game_server.est_connecte:
		# 	game_server.mettre_a_jour_slot(id_reparation_cible, {
		# 		"status": "available",
		# 		"car_id": ""
		# 	})

func _update_status_message():
	if reparation_en_cours and tache_courante_index < taches_a_reparer.size():
		var tache = taches_a_reparer[tache_courante_index]
		var remaining = max(0, tache_duration - (Time.get_unix_time_from_system() - tache_start_time))
		_afficher_message("En cours :  " + tache.interventionName + " - " + str(progression_actuelle) + "% (" + str(int(remaining)) + "s)", Color.YELLOW)
	elif peut_reparer_localement and taches_a_reparer.size() > 0:
		var tache = taches_a_reparer[tache_courante_index] if tache_courante_index < taches_a_reparer.size() else {}
		var nom = tache.get("interventionName", "Réparation")
		var controls_hint = ""
		if taches_a_reparer.size() > 1:
			controls_hint = " [U/I Choisir]"
		_afficher_message("Appuyez sur [E] pour: " + nom + controls_hint, Color.GREEN)
	elif joueur_present and not reparation_en_cours and voiture_id_actuelle == "":
		_afficher_message("[E] Faire entrer voiture", Color.CYAN)
	elif peut_reparer_localement:
		_afficher_message("Appuyez sur [E] pour réparer", Color.GREEN)
	else:
		if voiture_id_actuelle != "":
			if taches_a_reparer.is_empty():
				_afficher_message("Véhicule " + voiture_id_actuelle.left(4) + ".. - Aucune réparation requise", Color.ORANGE)
			else:
				_afficher_message("Zone indisponible (En attente)", Color.RED)
		else:
			_afficher_message("Zone indisponible (Besoin d'un véhicule)", Color.RED)

func _input(event: InputEvent):
	if not joueur_present:
		return
	
	# Gestion de la sélection des tâches (U / I)
	# Uniquement si on a des tâches et qu'aucune réparation n'est en cours
	if peut_reparer_localement and not reparation_en_cours and not taches_a_reparer.is_empty():
		if event is InputEventKey and event.pressed:
			if event.keycode == KEY_U:
				_changer_selection_tache(-1)
			elif event.keycode == KEY_I:
				_changer_selection_tache(1)

	# L'action "confirmer" (E) est gérée dans _process pour la fluidité, 
	# ou ici si on préfère. _process appelle _declencher_action() qui utilise tache_courante_index.

func _changer_selection_tache(direction: int):
	var old_index = tache_courante_index
	tache_courante_index += direction
	
	# Bouclage ou blocage ? Blocage aux extrémités c'est mieux pour une liste
	tache_courante_index = clamp(tache_courante_index, 0, taches_a_reparer.size() - 1)
	
	if old_index != tache_courante_index:
		# Mettre à jour l'affichage
		_afficher_liste_taches()
		_update_status_message()
		print("Selection tâche: ", tache_courante_index)

func _declencher_action():
	"""Correspond à handleStartRepair() dans SlotsPage.tsx du frontend"""
	if not game_server or not game_server.est_connecte:
		_afficher_message("Erreur de connexion", Color.RED)
		return
	
	# Vérifier qu'il y a des tâches à traiter
	if taches_a_reparer.is_empty() or tache_courante_index >= taches_a_reparer.size():
		_afficher_message("Aucune tâche à effectuer", Color.RED)
		return
	
	var tache = taches_a_reparer[tache_courante_index]
	var repair_id = str(tache.id)
	var intervention_id = int(tache.get("interventionId", 0))
	var duration = float(tache.interventionDuration)
	
	print("Démarrage tâche: ", tache.interventionName, " (ID: ", intervention_id, ", ", duration, "s)")
	
	peut_reparer_localement = false
	reparation_en_cours = true
	progression_actuelle = 0
	
	# Activer UI 3D
	if sprite_3d:
		sprite_3d.visible = true
	if progress_label_3d:
		progress_label_3d.text = tache.interventionName
	if progress_bar_3d:
		progress_bar_3d.value = 0
		
	tache_start_time = Time.get_unix_time_from_system()
	tache_duration = duration
	
	# Mettre à jour AppState (global) uniquement si joueur présent
	if joueur_present:
		AppState.commande_id = id_reparation_cible
		AppState.intervention_active = repair_id
		AppState.status = "en_cours"
		AppState.progression = 0
	
	# Envoyer à Firebase - exactement comme handleStartRepair() du frontend
	game_server.demarrer_reparation_tache(repair_id, intervention_id, duration)
	
	# Démarrer le timer (comme startRepairTracking() du frontend)
	timer_reparation.start()
	
	reparation_demarree.emit(id_reparation_cible, duration)
	
	_afficher_message("⏳ " + tache.interventionName + " démarrée!", Color.GREEN)
	
	_update_apparence()


func _on_timer_tick():
	"""Appelé toutes les 0.5s pendant une réparation"""
	if not reparation_en_cours:
		timer_reparation.stop()
		return
	
	if tache_courante_index >= taches_a_reparer.size():
		timer_reparation.stop()
		return
	
	var tache = taches_a_reparer[tache_courante_index]
	var elapsed = Time.get_unix_time_from_system() - tache_start_time
	var progress = int((elapsed / tache_duration) * 100.0)
	progress = clamp(progress, 0, 100)
	
	if progress != progression_actuelle:
		progression_actuelle = progress
		
		# Mise à jour 3D locale
		if progress_bar_3d:
			progress_bar_3d.value = progress
		
		# Mise à jour AppState (Global) uniquement si le joueur est là
		if joueur_present:
			AppState.progression = progress
		
		# Mise à jour Firebase
		game_server.mettre_a_jour_progression(tache.id, progress)
		
		# Notification à 50%
		if progress >= 50 and not tache.get("halfwayNotified", false):
			game_server.marquer_notification_envoyee(tache.id, "halfway")
			tache["halfwayNotified"] = true
			print("Notification mi-parcours envoyée pour: ", tache.interventionName)
		
		if joueur_present:
			_update_status_message()
	
	# Tâche terminée
	if progress >= 100:
		_terminer_tache_courante()

func _terminer_tache_courante():
	"""Termine la tâche courante et passe à la suivante"""
	if tache_courante_index >= taches_a_reparer.size():
		return
	
	var tache = taches_a_reparer[tache_courante_index]
	print(" Tâche terminée: ", tache.interventionName)
	
	# Terminer dans Firebase
	game_server.terminer_tache_reparation(tache.id)
	
	# Passer à la tâche suivante
	tache_courante_index += 1
	
	if tache_courante_index < taches_a_reparer.size():
		# Il reste des tâches
		reparation_en_cours = false
		peut_reparer_localement = true
		timer_reparation.stop()
		
		var prochaine = taches_a_reparer[tache_courante_index]
		_afficher_message("Terminé! Suivant: " + prochaine.interventionName, Color.GREEN)
	else:
		# Toutes les tâches sont terminées
		_toutes_taches_terminees()

func _toutes_taches_terminees():
	"""Appelé quand toutes les tâches sont terminées — envoie la voiture vers le paiement"""
	print("🎉 Toutes les réparations terminées pour la voiture: ", voiture_id_actuelle)
	
	timer_reparation.stop()
	reparation_en_cours = false
	peut_reparer_localement = false
	progression_actuelle = 100
	
	if joueur_present:
		AppState.status = "termine"
		AppState.progression = 100
	
	reparation_terminee.emit(id_reparation_cible)
	
	if sprite_3d:
		sprite_3d.visible = false
	
	_afficher_message("🎉 Toutes les réparations terminées!", Color.GREEN)
	_update_apparence()
	
	# --- TRANSITION VERS PAIEMENT (comme moveToWaitingSlots du frontend) ---
	if game_server and game_server.est_connecte and voiture_id_actuelle != "":
		# 1. Calculer le prix total
		var total_price : float = 0.0
		var interventions_list : Array = []
		for t in taches_a_reparer:
			total_price += float(t.get("interventionPrice", 0))
			interventions_list.append({
				"id": t.id,
				"name": t.interventionName,
				"price": t.get("interventionPrice", 0)
			})
		
		# 2. Récupérer le clientId depuis les réparations Firebase
		var client_id = ""
		for repair_id in game_server.cache_reparations.keys():
			var repair_data = game_server.cache_reparations[repair_id]
			if typeof(repair_data) == TYPE_DICTIONARY and repair_data.get("carId", "") == voiture_id_actuelle:
				client_id = str(repair_data.get("userId", ""))
				break
		
		# 3. Construire les données waiting_slots (même structure que le frontend)
		var waiting_slot_data = {
			"carId": voiture_id_actuelle,
			"clientId": client_id,
			"interventions": interventions_list,
			"totalPrice": total_price,
			"createdAt": Time.get_datetime_string_from_system(),
			"status": "waiting_payment"
		}
		
		print("💰 Envoi vers waiting_slots: ", voiture_id_actuelle, " | Prix total: ", total_price)
		game_server.ajouter_au_waiting_slots(waiting_slot_data)
		
		# 4. Libérer le slot de réparation
		game_server.liberer_slot_reparation(id_reparation_cible)
	else:
		print("⚠️ Impossible d'envoyer vers paiement: connexion absente ou voiture_id vide")
	
	# Réinitialiser pour la prochaine voiture
	taches_a_reparer.clear()
	tache_courante_index = 0
	voiture_id_actuelle = ""

func _afficher_liste_taches():
	"""Affiche la liste des tâches à effectuer"""
	if taches_a_reparer.is_empty():
		return
	
	var message = "📋 Réparations (" + str(taches_a_reparer.size()) + "):\n"
	
	# On affiche une fenêtre autour de la sélection
	var start_idx = max(0, tache_courante_index - 1)
	var end_idx = min(taches_a_reparer.size(), start_idx + 3)
	
	for i in range(start_idx, end_idx):
		var t = taches_a_reparer[i]
		var prefix = "👉 " if i == tache_courante_index else "   "
		message += prefix + t.interventionName + " (" + str(t.interventionDuration) + "s)\n"
	
	if start_idx > 0:
		message = "...\n" + message.trim_prefix(" Réparations (" + str(taches_a_reparer.size()) + "):\n")
	if end_idx < taches_a_reparer.size():
		message += "   ..."
	
	print(message)
	_afficher_message(message.strip_edges(), Color.CYAN)


func terminer_reparation():
	if not reparation_en_cours:
		return
	
	print("Réparation terminée manuellement: ", id_reparation_cible)
	
	reparation_en_cours = false
	progression_actuelle = 100
	
	if game_server and game_server.est_connecte:
		game_server.terminer_reparation(id_reparation_cible)
	
	AppState.status = "termine"
	AppState.progression = 100
	
	reparation_terminee.emit(id_reparation_cible)
	
	_update_apparence()
	
	_afficher_message("Réparation terminée!", Color.GREEN)

func _afficher_message(message: String, couleur: Color = Color.WHITE):
	print("💬 ", message)
	
	# 1. Essayer d'afficher sur le joueur s'il est présent
	if joueur_present:
		# On cherche le joueur dans les overlapping bodies ou on garde une ref
		# L'optimisation serait de garder une ref dans _on_entree
		for body in get_overlapping_bodies():
			if body.is_in_group("player") and body.has_method("show_message"):
				body.show_message(message, couleur)
				return
	
	# 2. Fallback: UI globale (si existe)
	var ui_label = get_node_or_null("/root/MainScene/UI/MessageLabel")
	if ui_label:
		ui_label.text = message
		ui_label.modulate = couleur

func _cacher_message():
	"""Cache le message affiché"""
	# 1. Sur le joueur
	for body in get_overlapping_bodies():
		if body.is_in_group("player") and body.has_method("hide_message"):
			body.hide_message()
	
	# 2. Global
	var ui_label = get_node_or_null("/root/MainScene/UI/MessageLabel")
	if ui_label:
		ui_label.text = ""

# --- FONCTIONS UTILITAIRES ---

func obtenir_etat() -> Dictionary:
	"""Retourne l'état actuel de la zone"""
	return {
		"zone_id": id_reparation_cible,
		"nom": zone_display_name,
		"joueur_present": joueur_present,
		"peut_reparer": peut_reparer_localement,
		"reparation_en_cours": reparation_en_cours,
		"progression": progression_actuelle,
		"duree_prevue": duree_prevue
	}

func reinitialiser_zone():
	peut_reparer_localement = false
	reparation_en_cours = false
	joueur_present = false
	progression_actuelle = 0
	
	if sprite_3d:
		sprite_3d.visible = false
	
	_update_apparence()
	_cacher_message()
	
	print("Zone réinitialisée: ", id_reparation_cible)

func _charger_taches_pour_voiture(car_id: String):
	if not game_server:
		return

	# Récupérer les tâches de réparation depuis Firebase
	var all_tasks = game_server.obtenir_reparations_voiture(car_id)
	var total_count = all_tasks.size()
	
	# Filtrer uniquement les tâches non terminées
	taches_a_reparer = all_tasks.filter(func(t): return t.status != "completed")
	var active_count = taches_a_reparer.size()
	
	print("📋 (Serveur) Tâches pour ", car_id, ": ", active_count, " actives / ", total_count, " total.")
	
	if active_count < total_count:
		print("    ", (total_count - active_count), " tâches ignorées car 'completed'.")
	
	if taches_a_reparer.size() > 0:
		peut_reparer_localement = true
		tache_courante_index = 0
		_afficher_liste_taches()
		
		# Si le joueur est déjà là, on met à jour le message
		if joueur_present:
			_update_status_message()
	else:
		peut_reparer_localement = false
		if taches_a_reparer.is_empty():
			_afficher_message("Aucune tâche trouvée (Vérifiez Firebase/Admin)", Color.ORANGE)
		else:
			_afficher_message("Toutes réparations terminées", Color.GREEN)
	
	_update_apparence()

func _ouvrir_ui_selection():
	if not game_server: return
	
	# Récupérer les voitures en attente
	var voitures = game_server.obtenir_voitures_en_attente()
	
	if voitures.is_empty():
		_afficher_message("Aucune voiture en attente.", Color.ORANGE)
		return
	
	# Remplir la liste
	ui_camera_list.clear()
	for v in voitures:
		var text = "Client: " + v["client_id"] + " (" + str(v["taches"].size()) + " tâches)"
		# On stocke le car_id en metadonnées
		var idx = ui_camera_list.add_item(text)
		ui_camera_list.set_item_metadata(idx, v["car_id"])
	
	ui_layer.visible = true
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	
	# Mettre en pause le joueur (optionnel, selon implémentation Player)
	# get_tree().paused = true 

func _on_valider_entree_voiture():
	var selected_items = ui_camera_list.get_selected_items()
	if selected_items.is_empty():
		return
	
	var idx = selected_items[0]
	var car_id = ui_camera_list.get_item_metadata(idx)
	
	print("Sélection voiture : ", car_id, " -> Zone ", id_reparation_cible)
	
	# Assigner via GameServer
	game_server.assigner_voiture_slot(car_id, id_reparation_cible)
	
	_fermer_ui_selection()
	_afficher_message("Voiture appelée...", Color.GREEN)

func _fermer_ui_selection():
	ui_layer.visible = false
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	# get_tree().paused = false

func _setup_ui_selection():
	# Création dynamique de l'UI pour éviter de toucher au .tscn
	ui_layer = CanvasLayer.new()
	ui_layer.visible = false
	add_child(ui_layer)
	
	ui_panel = Panel.new()
	ui_panel.custom_minimum_size = Vector2(500, 400) # Un peu plus grand
	# Centrage automatique via les ancres
	ui_panel.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	ui_layer.add_child(ui_panel)
	
	var label = Label.new()
	label.text = "FAIRE ENTRER UNE VOITURE"
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.position = Vector2(0, 10)
	label.size = Vector2(500, 40) # Match panel width
	label.add_theme_font_size_override("font_size", 24)
	ui_panel.add_child(label)
	
	ui_camera_list = ItemList.new()
	ui_camera_list.position = Vector2(20, 60)
	ui_camera_list.size = Vector2(460, 250)
	ui_panel.add_child(ui_camera_list)
	
	var btn_valider = Button.new()
	btn_valider.text = "FAIRE ENTRER"
	btn_valider.position = Vector2(260, 330)
	btn_valider.size = Vector2(220, 50)
	btn_valider.pressed.connect(_on_valider_entree_voiture)
	ui_panel.add_child(btn_valider)
	
	var btn_annuler = Button.new()
	btn_annuler.text = "ANNULER"
	btn_annuler.position = Vector2(20, 330)
	btn_annuler.size = Vector2(220, 50)
	btn_annuler.pressed.connect(_fermer_ui_selection)
	ui_panel.add_child(btn_annuler)

func _notification(what):
	if what == NOTIFICATION_PREDELETE:
		if game_server:
			if game_server.slots_reparation_maj.is_connected(_verifier_etat):
				game_server.slots_reparation_maj.disconnect(_verifier_etat)
			if game_server.donnees_mises_a_jour.is_connected(_on_global_repairs_update):
				game_server.donnees_mises_a_jour.disconnect(_on_global_repairs_update)
