extends VehicleBody3D

var driver: Node = null
@export var is_driving: bool = false

@onready var interaction_timer: Timer = %Timer
@onready var interaction_ui: CanvasLayer = $CanvasLayer
@onready var progress_bar: TextureProgressBar = $CanvasLayer/TextureProgressBar

@onready var viewport_container: SubViewportContainer = $SubViewportContainer


@export var interaction_duration := 3.0

var interaction_active := false


# --- Variables Moteur & Freins ---
var accelraTeur : float = 0.0
var directionVam : float = 0.0
var force_freinage_base : float = 40.0 

@export_group("Puissance & Freinage")
@export var vitesse_max = 50.0
@export var acceleration = 120.0
var vitesseLinear: float = 0.0

@export_group("Audio")
@export var engine_sound : AudioStreamPlayer3D
var engine_rev :float = 0.8 

@export_group("Volant")
@export var volant_sensi = 8.0
@export var max_angle_braquage = 0.65

@export_group("Stabilité")
@export var influence_roulage: float = 0.5 
var anti_bascule: Vector3
var downforce : Vector3
@export var force_antiBascule :float = 35.0
@export var aerodynamic_force : float = 50.0

@export_group("Pneus")
@export var pneu_gauche_devant : VehicleWheel3D
@export var pneu_droite_devant : VehicleWheel3D
@export var pneu_gauche_arriere : VehicleWheel3D
@export var pneu_droite_arriere : VehicleWheel3D

@export_group("Suspension")
@export var friction_pneu : float = 10.5
@export var susp_stiff : float = 180.0

@export_group("Camera")
@export_range(0.0, 5.0) var joystick_sensitivity := 2.0
@export var vitesse_rotation_camera : float = 4.5
@export var delai_camera_recul : float = 2.0 # pour le délai mitodika
var _reverse_delay_timer : float = 0.0 

# Variables Camera
var _mouse_input := Vector2.ZERO
var _rotation_camera_h := 0.0
var _rotation_camera_v := 0.0

@onready var camera_pivot: Node3D = $CameraPivot
@onready var spring_arm: SpringArm3D = $CameraPivot/SpringArm3D
@onready var camera3d : Camera3D = $CameraPivot/SpringArm3D/Camera3D

# -------------------------------------------------------------
# FONCTIONS DE BASE
# -------------------------------------------------------------
func start_interaction():
	if interaction_active:
		return

	interaction_active = true
	interaction_timer.wait_time = interaction_duration
	progress_bar.max_value = interaction_duration
	progress_bar.value = 0
	progress_bar.visible = true

	interaction_timer.start()




func _ready() -> void:
	add_to_group("vehicles")
	
	
	if interaction_timer ==null or progress_bar ==null:
		push_error("Introuvable zalah")
		return
		
	interaction_timer.one_shot = true
	interaction_timer.timeout.connect(_on_interaction_vita)
	
	progress_bar.visible = false
	progress_bar.min_value = 0
	progress_bar.max_value = interaction_duration
	
	_rotation_camera_v = -15.0
	camera_pivot.set_as_top_level(true)
	_rotation_camera_h = global_rotation_degrees.y
	
	if engine_sound:
		engine_sound.pitch_scale = engine_rev

func _input(event: InputEvent) -> void:
	if event.is_action_pressed("atao_souris"):
		Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	if event.is_action_pressed("ui_cancel"):
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE

	if event is InputEventMouseMotion and Input.get_mouse_mode() == Input.MOUSE_MODE_CAPTURED:
		_mouse_input = event.relative * 0.15



func _physics_process(delta: float) -> void:
	if interaction_active:
		progress_bar.value = interaction_timer.wait_time \
			- interaction_timer.time_left

	_update_progress_position()
	
	if not is_driving:
		steering = move_toward(steering, 0.0, delta * volant_sensi)
		brake = 0.5  
		engine_force = 0.0
		return
	
	
	vitesseLinear = linear_velocity.length()
	_gestion_moteur_et_freins(delta)
	_gerer_camera(delta)
	_anti_roll()
	
	
	for pneu in [pneu_gauche_devant, pneu_droite_devant, pneu_gauche_arriere, pneu_droite_arriere]:
		if pneu:
			pneu.wheel_friction_slip = friction_pneu
			pneu.suspension_stiffness = susp_stiff
			pneu.wheel_roll_influence = influence_roulage
	
	directionVam = Input.get_action_strength("mivily_droite") - Input.get_action_strength("mivily_gauche")
	var target_steering = -directionVam * max_angle_braquage
	steering = move_toward(steering, target_steering, delta * volant_sensi)
	
	son_acceleration(delta)
	

func _update_progress_position():
	var cam = get_viewport().get_camera_3d()
	if cam and progress_bar:
		var world_pos = global_position + Vector3.UP * 2.2
		var screen_pos = cam.unproject_position(world_pos)
		progress_bar.rect_position = screen_pos - progress_bar.rect_size / 2



func _on_interaction_vita():
	interaction_active = false
	progress_bar.visible = false
	print(" Intervention terminée")



func _gestion_moteur_et_freins(delta):
	var input_accelerer = Input.get_action_strength("accelerer")
	var input_freiner = Input.get_action_strength("freiner")
	var input_frein_main = Input.get_action_strength("freinMain")

	accelraTeur = input_accelerer - input_freiner

	var is_commanding_reverse = input_freiner > 0.1 and input_accelerer < 0.1
	if is_commanding_reverse:
		_reverse_delay_timer += delta
	else:
		_reverse_delay_timer = 0.0

	if input_frein_main > 0.05:
		brake = force_freinage_base * 5.0 * input_frein_main
		engine_force = 0.0
		accelraTeur = 0.0
		return 

	brake = 0.0 

	var speed_factor = 1.0 - min(vitesseLinear / vitesse_max , 1.0) 
	 
	engine_force = accelraTeur * acceleration * speed_factor

# -------------------------------------------------------------
# GESTION CAMÉRA (AVEC DÉLAI DE RECUL)
# -------------------------------------------------------------
		

func _gerer_camera(delta: float) -> void:
	camera_pivot.global_position = global_position
	
	var right_stick := Input.get_vector("look_left", "look_right", "look_up", "look_down")
	var is_using_stick = right_stick.length() > 0.1
	var is_using_mouse = _mouse_input.length() > 0.01


	var should_look_backward = _reverse_delay_timer >= delai_camera_recul and (not is_using_stick and not is_using_mouse)
	
	# ----------------------------------------------------------------------
	# 1. CAMÉRA SUIT LA MARCHE ARRIÈRE (Déclenché par le timer)
	# ----------------------------------------------------------------------
	if should_look_backward:
		var target_yaw_rad = global_rotation.y + deg_to_rad(180.0)
		_rotation_camera_h = rad_to_deg(target_yaw_rad)
		_rotation_camera_v = lerp(_rotation_camera_v, -15.0, delta * vitesse_rotation_camera * 2.0)
	
	# ----------------------------------------------------------------------
	# 2. CONTRÔLE MANUEL (Souris / Joystick) 
	# ----------------------------------------------------------------------
	elif is_using_stick:
		var rotation_speed = 120.0 * joystick_sensitivity
		_rotation_camera_h -= right_stick.x * rotation_speed * delta
		_rotation_camera_v -= right_stick.y * rotation_speed * delta
		_mouse_input = Vector2.ZERO
	elif is_using_mouse:
		_rotation_camera_h -= _mouse_input.x * joystick_sensitivity
		_rotation_camera_v -= _mouse_input.y * joystick_sensitivity
		_mouse_input = _mouse_input.move_toward(Vector2.ZERO, delta * 5.0)
	
	
	else:
		var current_yaw_rad = deg_to_rad(_rotation_camera_h)
		var car_yaw_rad = global_rotation.y
		var new_yaw_rad = lerp_angle(current_yaw_rad, car_yaw_rad, vitesse_rotation_camera * 1.0 * delta)
		_rotation_camera_h = rad_to_deg(new_yaw_rad)
		_rotation_camera_v = lerp(_rotation_camera_v, -15.0, delta * vitesse_rotation_camera)
	
	
	_rotation_camera_v = clamp(_rotation_camera_v, -45.0, 15.0)
	
	var target_rotation_y = deg_to_rad(_rotation_camera_h)
	
	camera_pivot.global_rotation.y = lerp_angle(camera_pivot.global_rotation.y, target_rotation_y, vitesse_rotation_camera * 2.0 * delta)
	camera_pivot.global_rotation.x = 0.0
	camera_pivot.global_rotation.z = 0.0
	
	spring_arm.rotation_degrees.x = lerp(spring_arm.rotation_degrees.x, _rotation_camera_v, vitesse_rotation_camera * 2.0 * delta)
	spring_arm.rotation_degrees.z = 0.0


func _anti_roll() : 
	anti_bascule =-global_transform.basis.z * global_rotation.z * force_antiBascule * vitesse_max 
	apply_torque(anti_bascule) 

	downforce =-global_transform.basis.y * global_rotation.y * aerodynamic_force 
	apply_central_force(downforce) 
	 
	
func son_acceleration(delta):
	if !engine_sound.playing:
		engine_sound.play()
	
	var idle_pitch = 0.8
	var max_pitch = 2.4
	
	var speed_ratio = clamp(vitesseLinear / (vitesse_max * 1.1), 0.0, 1.0)
	var target_rev = lerp(idle_pitch, max_pitch, speed_ratio)
	
	if accelraTeur > 0.1:
		target_rev += 0.15
	elif brake > 0.1:
		target_rev -= 0.15 
	
	engine_rev = lerp(engine_rev, target_rev, delta * 6.0)
	engine_rev = clamp(engine_rev, 0.5, 3.0)
	engine_sound.pitch_scale = engine_rev
	
	
func _unhandled_input(event: InputEvent) -> void:
	if is_driving and event.is_action_pressed("exit"):
		_exit_vehicle()
	if is_driving and event.is_action_pressed("exit_vehicle"):
		_exit_vehicle()	




func enter_vehicle(player: Node) -> void:
	if is_driving:
		return

	driver = player
	await  get_tree().process_frame
	await get_tree().process_frame
	is_driving = true

	driver.visible = false
	driver.set_physics_process(false)

	if driver.has_method("set_process_input"):
		driver.set_process_input(false)

	driver.global_position = global_position




func _exit_vehicle() -> void:
	if not is_driving:
		return

	is_driving = false

	if driver:
		driver.visible = true

		driver.set_physics_process(true)
		driver.set_process(true)
		driver.set_process_input(true)

		var root := get_tree().current_scene
		driver.reparent(root)

		driver.global_transform.origin = global_transform.origin + Vector3(1, 0, 0)

		driver = null

	engine_force = 0.0
	brake = 1.0
