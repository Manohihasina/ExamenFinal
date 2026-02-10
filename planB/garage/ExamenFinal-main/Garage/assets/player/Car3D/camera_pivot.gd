extends CharacterBody3D

@export_group("Camera")
@export_range(0.0 , 1.0) var joystick_sensitivity := 1.5

@export_group("Movememnt")
@export var move_speed := 8.0
@export var acceleration :=20.0
@export var rotation_speed := 12.0
@export var jump_impulse := 12.0

#CONTROLE BOOST
@export var boost_anle_vitesse := 2.5
@export var boost_duree:= 1.5
var boostV:= false
var gachetteLst := ""
var boost_timer := 0.05
#section						#

var _orientation_cam_input := Vector2.ZERO
var _dernier_mouvement_dir := Vector3.BACK
var _gravite := -30.0     # Force de la gravite

@onready var camera_pivot: Node3D = %CameraPivot
@onready var _camera:Camera3D = %Camera3D
@onready var _skin :SophiaSkin = %SophiaSkin

func _input(event: InputEvent) -> void:
	# Activation / désactivation souris
	if event.is_action_pressed("atao_souris"):
		Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	if event.is_action_pressed("ui_cancel"):
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE


	# Mouvement caméra
	if event is InputEventMouseMotion and Input.get_mouse_mode() == Input.MOUSE_MODE_CAPTURED:
		_orientation_cam_input = event.relative * joystick_sensitivity

func _physics_process(delta: float) -> void:
	
	_update_boost_timer(delta)
	_handle_trigger_boosting()
	
	
	var right_stick := Input.get_vector("look_left","look_right","look_up","look_down")
	
	_orientation_cam_input = right_stick * joystick_sensitivity * 50.0 *delta
	# Rotation verticale
	camera_pivot.rotation.x += _orientation_cam_input.y * delta
	camera_pivot.rotation.x = clamp(camera_pivot.rotation.x, -PI/6.0, PI/3.0)

	# Rotation horizontale
	camera_pivot.rotation.y -= _orientation_cam_input.x * delta
	
	# Reset input
	_orientation_cam_input = Vector2.ZERO
	
	var raw_input :=Input.get_vector("move_left","move_right" , "move_up" , "move_down")
	var devant := _camera.global_basis.z
	var droite := _camera.global_basis.x
	
	var move_direction := devant * raw_input.y + droite * raw_input.x
	move_direction.y=0.0
	move_direction = move_direction.normalized()
	
	###Vitesse avec BOOST 
	var current_move_speed = move_speed
	if boostV:
		current_move_speed *= boost_anle_vitesse
	
	#Initialisation variable mouvement axe Y
	var velicityY := velocity.y             
	velocity.y = 0.0
	velocity= velocity.move_toward(move_direction * current_move_speed, acceleration*delta)
	velocity.y = velicityY + _gravite * delta    #Application de la gravité
	
	
	#Systeme de saut
	var sauteV := Input.is_action_just_pressed("jump") and is_on_floor()
	if sauteV:
		velocity.y += jump_impulse
	
	move_and_slide()
	
	if move_direction.length() > 0.2:
		_dernier_mouvement_dir = move_direction
		
	var angle_direction := Vector3.BACK.signed_angle_to(_dernier_mouvement_dir , Vector3.UP)
	_skin.global_rotation.y = lerp_angle(_skin.rotation.y , angle_direction ,  rotation_speed * delta)
	
	
	#Gestion Animation du personnage
	#Saut
	if sauteV:
		_skin.jump()
	elif not is_on_floor() and velocity.y <0:
		_skin.fall()
	elif is_on_ceiling():
		_skin.wall_slide()
	#Deplacement au sol
	elif is_on_floor():
		var vitesse_sol := velocity.length()
		if vitesse_sol >0.0:
			_skin.move()
		else:
			_skin.idle()
			
			
func _update_boost_timer(delta: float) -> void:
	if boostV:
		boost_timer-= delta
		if boost_timer <= 0.1:
			boostV = false
			
func _handle_trigger_boosting() -> void:
	var gache_G = Input.get_action_strength("trigauche")
	var gache_D = Input.get_action_strength("trigdroite")
	
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
		
	
	
	
	
