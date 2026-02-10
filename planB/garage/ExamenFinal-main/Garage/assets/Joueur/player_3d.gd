extends CharacterBody3D

var nearby_vehicle: VehicleBody3D = null
var is_in_vehicle: bool = false


signal player_entered_vehicle()


@export var item_cle_requise: ItemData 

@onready var drive_label: Label = %DriveLabel

@export_group("Camera")
@export_range(0.0 , 1.0) var joystick_sensitivity := 1.5

@export var inventory_data: InventoryData = preload("res://assets/Joueur/Ressources/player_inventory.tres")

@export_group("Movement")
@export var move_speed := 8.0
@export var acceleration := 20.0
@export var rotation_speed := 12.0
@export var jump_impulse := 12.0

const INVENTORY_UI_SCENE = preload("res://assets/Joueur/Ressources/InventoryUI.tscn")

var inventory_ui: Control = null
var is_inventory_open := false
@onready var world_environment: WorldEnvironment = get_tree().root.find_child("WorldEnvironment", true, false)

@export var boost_anle_vitesse := 2.5
@export var boost_duree := 1.5
var boostV := false
var gachetteLst := ""
var boost_timer := 0.05

var _orientation_cam_input := Vector2.ZERO
var _dernier_mouvement_dir := Vector3.BACK
var _gravite := -30.0

@onready var camera_pivot: Node3D = %CameraPivot
@onready var _camera: Camera3D = %Camera3D
@onready var _skin: Node3D = %SophiaSkin


func _ready():
	process_mode = Node.PROCESS_MODE_ALWAYS
	if drive_label:
		drive_label.visible=false
	
	add_to_group("player")


func _input(event: InputEvent) -> void:
	if event.is_action_pressed("atao_souris"):
		Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	if event.is_action_pressed("ui_cancel"):
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE

	if event is InputEventMouseMotion and Input.get_mouse_mode() == Input.MOUSE_MODE_CAPTURED:
		_orientation_cam_input = event.relative * joystick_sensitivity


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("start"):
		_handle_inventory_toggle()
	if event.is_action_pressed("drive") and nearby_vehicle:
		if item_cle_requise and inventory_data.has_item(item_cle_requise):
			_enter_vehicle(nearby_vehicle)
		else:
			print("C'est fermé ! Vous n'avez pas la clé de la voiture.")
			# Optionnel: Ajoutez ici un son ou une notification UI "Clé Manquante"


func _enter_vehicle(car: VehicleBody3D) -> void:
	player_entered_vehicle.emit()
	
	is_in_vehicle = true

	# Désactivation complète du joueur
	visible = false
	set_physics_process(false)
	set_process_input(false)
	set_collision_layer(0)
	set_collision_mask(0)

	# Désactiver la caméra du joueur
	_camera.current = false

	# Activation voiture
	nearby_vehicle.enter_vehicle(self)


func _on_vehicle_exit():
	is_in_vehicle = false

	# Réactiver le joueur
	visible = true
	set_physics_process(true)
	set_process_input(true)
	set_collision_layer(1)
	set_collision_mask(1)

	# Réactiver la caméra
	_camera.current = true




func _physics_process(delta: float) -> void:
	
	if is_inventory_open:
		return
	
	_handle_boost_system(delta)
	_handle_camera_rotation(delta)
	
	var move_direction := _get_movement_direction()
	
	_apply_movement(delta, move_direction)
	_apply_gravity(delta)
	
	var a_saute := _handle_jump()
	
	move_and_slide()
	
	_handle_skin_rotation(delta, move_direction)
	_update_animations(a_saute)
	
	_check_vehicle_proximity()
	#if nearby_vehicle and Input.is_action_just_pressed("drive"):
		#_enter_vehicle(nearby_vehicle)
	_update_drive_ui()


func _handle_boost_system(delta: float) -> void:
	_update_boost_timer(delta)
	_handle_trigger_boosting()

func _on_vehicle_area_body_entered(body):
	if body.is_in_group("vehicles"):
		nearby_vehicle = body


func _on_vehicle_area_body_exited(body):
	if body == nearby_vehicle:
		nearby_vehicle = null


func _handle_camera_rotation(delta: float) -> void:
	var right_stick := Input.get_vector("look_left", "look_right", "look_up", "look_down")
	_orientation_cam_input += right_stick * joystick_sensitivity * 50.0 * delta
	
	camera_pivot.rotation.x += _orientation_cam_input.y * delta
	camera_pivot.rotation.x = clamp(camera_pivot.rotation.x, -PI/6.0, PI/3.0)
	camera_pivot.rotation.y -= _orientation_cam_input.x * delta
	_orientation_cam_input = Vector2.ZERO


func _get_movement_direction() -> Vector3:
	var raw_input := Input.get_vector("move_left", "move_right", "move_up", "move_down")
	var devant := _camera.global_basis.z
	var droite := _camera.global_basis.x
	var direction := devant * raw_input.y + droite * raw_input.x
	direction.y = 0.0
	return direction.normalized()


func _apply_movement(delta: float, direction: Vector3) -> void:
	var current_move_speed := move_speed
	if boostV:
		current_move_speed *= boost_anle_vitesse
	var current_y := velocity.y
	velocity.y = 0.0
	velocity = velocity.move_toward(direction * current_move_speed, acceleration * delta)
	velocity.y = current_y


func _apply_gravity(delta: float) -> void:
	velocity.y += _gravite * delta


func _handle_jump() -> bool:
	if Input.is_action_just_pressed("jump") and is_on_floor():
		velocity.y += jump_impulse
		return true
	return false


func _handle_skin_rotation(delta: float, direction: Vector3) -> void:
	if direction.length() > 0.2:
		_dernier_mouvement_dir = direction
		
	var angle_direction := Vector3.BACK.signed_angle_to(_dernier_mouvement_dir, Vector3.UP)
	_skin.global_rotation.y = lerp_angle(_skin.rotation.y, angle_direction, rotation_speed * delta)


func _update_animations(a_saute: bool) -> void:
	var ratio_vitesse := 1.0
	if boostV:
		ratio_vitesse = 2.5
	
	var anim_player = _skin.get_node_or_null("AnimationPlayer")
	if anim_player:
		anim_player.speed_scale = ratio_vitesse

	if a_saute:
		_skin.jump()
	elif not is_on_floor() and velocity.y < 0:
		_skin.fall()
	elif is_on_ceiling():
		_skin.wall_slide()
	elif is_on_floor():
		var vitesse_sol := velocity.length()
		if vitesse_sol > 0.0:
			_skin.move()
		else:
			_skin.idle()


func pick_up_item(item_to_add: ItemData) -> bool:
	var success = inventory_data.insert(item_to_add) 
	if success:
		print("Objet ramassé : ", item_to_add.name)
	else:
		print("Inventaire plein, impossible de ramasser : ", item_to_add.name)
	return success


func _update_boost_timer(delta: float) -> void:
	if boostV:
		boost_timer -= delta
		if boost_timer <= 0.1:
			boostV = false


func _handle_trigger_boosting() -> void:
	var gache_G := Input.get_action_strength("trigauche")
	var gache_D := Input.get_action_strength("trigdroite")
	
	if gache_G > 0.7 and gachetteLst != "left":
		if gachetteLst == "right":
			_activate_boost()
		gachetteLst = "left"
	
	if gache_D > 0.7 and gachetteLst != "right":
		if gachetteLst == "left":
			_activate_boost()
		gachetteLst = "right"


func _activate_boost() -> void:
	boostV = true
	boost_timer = boost_duree


func _handle_inventory_toggle():
	if Input.is_action_just_pressed("start"): 
		if is_inventory_open:
			_close_inventory()
		else:
			_open_inventory()


func _open_inventory():
	if inventory_ui == null:
		inventory_ui = INVENTORY_UI_SCENE.instantiate()
		get_tree().root.add_child(inventory_ui)
		inventory_ui.setup_ui(inventory_data)
		get_tree().paused = true
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
		
		if world_environment:
			var env = world_environment.environment
			env.adjustment_enabled = true
			env.adjustment_saturation = 0.5 
			env.adjustment_brightness = 0.6 

	is_inventory_open = true


func _close_inventory():
	if inventory_ui:
		inventory_ui.queue_free() 
		inventory_ui = null
		
	if world_environment:
		var env = world_environment.environment
		env.adjustment_enabled = false
		env.adjustment_saturation = 1.0
		env.adjustment_brightness = 1.0
		
	get_tree().paused = false
	# Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	is_inventory_open = false


func _check_vehicle_proximity() -> void:
	nearby_vehicle = null

	for vehicle in get_tree().get_nodes_in_group("vehicles"):
		if global_position.distance_to(vehicle.global_position) < 1.5:
			nearby_vehicle = vehicle
			break


func _update_drive_ui() -> void:
	if nearby_vehicle and not is_inventory_open:
		drive_label.visible = true
	else:
		drive_label.visible = false



	

# --- UI MESSAGES ---

func show_message(text: String, color: Color = Color.WHITE):
	var label = %MessageLabel
	if label:
		label.text = text
		label.modulate = color
		label.visible = true
		
		# Auto-hide after some time if it's a notification? 
		# No, let the caller handle it or use a separate notification system.
		# But for "Press E", we want it to stay.

func hide_message():
	var label = %MessageLabel
	if label:
		label.visible = false
