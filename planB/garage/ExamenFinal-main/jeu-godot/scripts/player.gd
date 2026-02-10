extends CharacterBody2D

@export var speed := 100
var player_state
var controlling_car = null  # La voiture que le joueur conduit

# Références aux UI (seront initialisées plus tard)
var computer_ui: Control
var repair_ui: Control
var garage_manager: Node

func _ready():
	# Initialiser les références après que la scène soit chargée
	await get_tree().process_frame
	computer_ui = get_node_or_null("../../UI/GarageComputerUI")
	if computer_ui == null:
		push_warning("GarageComputerUI introuvable depuis player")
	repair_ui = get_node_or_null("../../UI/RepairInteractionUI")
	if repair_ui == null:
		push_warning("RepairInteractionUI introuvable depuis player")
	garage_manager = get_node_or_null("../..")

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

func play_anim(dir):
	if player_state == "idle":
		$AnimatedSprite2D.play("idle")
	elif player_state == "walking":
		if dir.y==-1:
			$AnimatedSprite2D.play("n-walk")
		elif dir.y == 1:
			$AnimatedSprite2D.play("s-walk")
		elif dir.x == 1:
			$AnimatedSprite2D.play("e-walk")
		elif dir.x == -1:
			$AnimatedSprite2D.play("w-walk")
		elif dir.x > 0.5 and dir.y < -0.5:
			$AnimatedSprite2D.play("ne-walk")
		elif dir.x > 0.5 and dir.y > 0.5:
			$AnimatedSprite2D.play("se-walk")
		elif dir.x < -0.5 and dir.y < -0.5:
			$AnimatedSprite2D.play("nw-walk")
		elif dir.x < -0.5 and dir.y > 0.5:
			$AnimatedSprite2D.play("sw-walk")

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
		if "is_locked" in car and car.is_locked:
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
		# 'slot' is a Node; use safe get() to access potential exported vars set by the slot script
		var cur = null
		# Using get() is safe even if the property isn't present
		cur = slot.get("current_car")
		if cur == car:
			slot_id = slot.get("slot_number") if slot.has_method("get") else slot.slot_number
			break
	
	if slot_id >= 0:
		repair_ui.setup_for_car(car, slot_id)
		repair_ui.show_ui()
