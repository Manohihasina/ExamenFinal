extends CharacterBody2D

@export var speed := 100
var player_state
var controlling_car = null  # La voiture que le joueur conduit

# Références aux UI (seront initialisées plus tard)
var computer_ui: Control
var repair_ui: Control
var garage_manager: Node

func _physics_process(delta):
	if controlling_car:
		# Si on conduit une voiture, on ne bouge pas le joueur mais la voiture
		if Input.is_action_just_pressed("interact"):
			controlling_car.exit_car()
		return  # pas de déplacement du joueur
	else:
		# Déplacement du joueur
		var direction = Input.get_vector("left", "right", "up", "down")
		velocity = direction * speed
		move_and_slide()
		
		# Animation
		if direction == Vector2.ZERO:
			player_state = "idle"
		else:
			player_state = "walking"
		play_anim(direction)
		
		# Vérifier si le joueur veut entrer dans une voiture proche
		if Input.is_action_just_pressed("interact"):
			var car = get_nearby_car()
			if car:
				interact_with_car(car)
			
			# Vérifier si le joueur veut utiliser l'ordinateur
			var computer = get_nearby_computer()
			if computer:
				if computer_ui:
					computer_ui.show_ui()
			
			# Vérifier si le joueur veut interagir avec une voiture immobilisée
			var locked_car = get_nearby_locked_car()
			if locked_car:
				show_repair_ui(locked_car)

func _ready():
	# Initialiser les références après que la scène soit chargée
	await get_tree().process_frame
	computer_ui = get_node("../UI/GarageComputerUI")
	repair_ui = get_node("../UI/RepairInteractionUI")
	garage_manager = get_node("..")

func play_anim(dir):
			$AnimatedSprite2D.play("w-walk")
		elif dir.x > 0.5 and dir.y < -0.5:
			$AnimatedSprite2D.play("ne-walk")
		elif dir.x > 0.5 and dir.y > 0.5:
			$AnimatedSprite2D.play("se-walk")
		elif dir.x < -0.5 and dir.y < -0.5:
			$AnimatedSprite2D.play("nw-walk")
		elif dir.x < -0.5 and dir.y > 0.5:
			$AnimatedSprite2D.play("sw-walk")

# Entrer dans la voiture
func interact_with_car(car):
	car.enter_car(self)

# Cherche une voiture proche (50 pixels)
func get_nearby_car():
	var cars = get_tree().get_nodes_in_group("cars")
	for car in cars:
		if car.global_position.distance_to(global_position) < 50:
			return car
	return null

# Cherche l'ordinateur proche
func get_nearby_computer():
	# Supposons qu'on a un noeud "Computer" dans le garage
	var computers = get_tree().get_nodes_in_group("computers")
	for computer in computers:
		if computer.global_position.distance_to(global_position) < 60:
			return computer
	return null

# Cherche une voiture immobilisée (vérouillée) proche
func get_nearby_locked_car():
	var cars = get_tree().get_nodes_in_group("cars")
	for car in cars:
		if car.has("is_locked") and car.is_locked:
			if car.global_position.distance_to(global_position) < 60:
				return car
	return null

# Affiche l'UI de réparation pour une voiture
func show_repair_ui(car):
	if not repair_ui:
		return
	
	# Trouver dans quel slot est cette voiture
	var slot_id = -1
	var slots = get_tree().get_nodes_in_group("repair_slots")
	for slot in slots:
		if slot.has("current_car") and slot.current_car == car:
			slot_id = slot.slot_number
			break
	
	if slot_id >= 0:
		repair_ui.setup_for_car(car, slot_id)
		repair_ui.show_ui()
