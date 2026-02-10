extends Node3D

# --- VARIABLES ---
var car_id : String = ""
var firebase_data : Dictionary = {}
var is_repairing : bool = false
var repair_duration : float = 0.0
var repair_timer : float = 0.0

# --- COMPOSANTS ---
# On assume que la voiture a un noeud "MeshInstance3D" ou similaire pour l'affichage
# et peut-être un noeud "AnimationPlayer" ou des particules pour l'effet de réparation
@onready var mesh : Node3D = find_child("MeshInstance3D", true, false)
@onready var effects : Node3D = find_child("RepairEffects", true, false) # A créer par l'utilisateur si absent
@onready var label_info : Label3D = find_child("InfoLabel", true, false) # Pour afficher des infos (debug)

# --- VISUELS ---
var progress_bar_bg : Sprite3D = null
var progress_bar_fg : Sprite3D = null

func _ready():
	add_to_group("vehicles")
	_setup_progress_bar()
	_update_visuals()
	
	# IMPORTANT: S'assurer que les corps physiques enfants sont aussi détectables
	_propagate_physics_setup(self)

func _propagate_physics_setup(node):
	for child in node.get_children():
		if child is PhysicsBody3D:
			if not child.is_in_group("vehicles"):
				child.add_to_group("vehicles")
			child.set_meta("car_root", self)
			print("🚗 PhysicsBody configuré: ", child.name)
		
		# Récursion (au cas où il y a des sous-nœuds)
		if child.get_child_count() > 0:
			_propagate_physics_setup(child)

func _setup_progress_bar():
	# Création procédurale d'une barre de progression simple
	# Fond (Rouge/Gris)
	progress_bar_bg = Sprite3D.new()
	progress_bar_bg.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	progress_bar_bg.no_depth_test = true
	progress_bar_bg.fixed_size = true
	progress_bar_bg.pixel_size = 0.005
	progress_bar_bg.position = Vector3(0, 2.5, 0) # Au dessus de la voiture
	
	var img_bg = Image.create(100, 10, false, Image.FORMAT_RGBA8)
	img_bg.fill(Color(0.2, 0.2, 0.2, 0.8))
	var tex_bg = ImageTexture.create_from_image(img_bg)
	progress_bar_bg.texture = tex_bg
	add_child(progress_bar_bg)
	
	# Avant-plan (Vert)
	progress_bar_fg = Sprite3D.new()
	progress_bar_fg.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	progress_bar_fg.no_depth_test = true
	progress_bar_fg.fixed_size = true
	progress_bar_fg.pixel_size = 0.005
	progress_bar_fg.position = Vector3(0, 2.5, 0.01) # Légèrement devant
	
	var img_fg = Image.create(100, 10, false, Image.FORMAT_RGBA8)
	img_fg.fill(Color(0.0, 1.0, 0.0, 0.8))
	var tex_fg = ImageTexture.create_from_image(img_fg)
	progress_bar_fg.texture = tex_fg
	add_child(progress_bar_fg)
	
	# Caché par défaut
	progress_bar_bg.visible = false
	progress_bar_fg.visible = false

func setup(id: String, data: Dictionary):
	car_id = id
	firebase_data = data
	_update_visuals()
	
	if label_info:
		var info = "Car: " + str(data.get("model", "???")) + "\n" + str(data.get("license_plate", ""))
		label_info.text = info

func _process(delta):
	if is_repairing:
		repair_timer += delta
		# Si on veut une barre de progression locale ou autre
		var progress_percent = (repair_timer / repair_duration) * 100.0
		update_progress(progress_percent)

# --- LOGIQUE RÉPARATION ---

func update_progress(percent: float):
	if not is_repairing: return
	
	# Mettre à jour la taille/échelle de la barre verte
	var width = clamp(percent / 100.0, 0.0, 1.0)
	progress_bar_fg.scale = Vector3(width, 1, 1)
	
	# Décaler pour grandir de gauche à droite
	# Largeur totale en unités = 100px * 0.005 = 0.5 unités
	# Demi largeur = 0.25
	var half_total = 0.25
	var offset_x = -half_total + (width * half_total)
	progress_bar_fg.position.x = offset_x

func start_repair(duration: float):
	if is_repairing: return
	
	print("🚗 [Car] Début réparation: ", duration, "s")
	is_repairing = true
	repair_duration = duration
	repair_timer = 0.0
	
	_play_repair_effects(true)
	
	if progress_bar_bg:
		progress_bar_bg.visible = true
		progress_bar_fg.visible = true

func stop_repair():
	if not is_repairing: return
	
	print("🚗 [Car] Fin réparation")
	is_repairing = false
	_play_repair_effects(false)
	
	if progress_bar_bg:
		progress_bar_bg.visible = false
		progress_bar_fg.visible = false

func _play_repair_effects(play: bool):
	if effects:
		effects.visible = play
		# Si c'est un système de particules
		if effects is GPUParticles3D:
			effects.emitting = play
	
	# Exemple d'animation simple
	if mesh:
		if play:
			var tween = create_tween().set_loops()
			tween.tween_property(mesh, "position:y", 0.1, 0.5).as_relative()
			tween.tween_property(mesh, "position:y", -0.1, 0.5).as_relative()
		else:
			pass # Reset handled elsewhere or not needed
	
func update_data(new_data: Dictionary):
	# Vérifier si des champs importants ont changé
	firebase_data = new_data
	# Par exemple si la couleur change via les données
	_update_visuals()

func _update_visuals():
	# Logique pour changer la couleur ou le modèle si supporté
	pass
