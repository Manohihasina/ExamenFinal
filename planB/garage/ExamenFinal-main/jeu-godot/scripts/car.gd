extends CharacterBody2D

@export var speed := 300
@export var brand: String = ""
@export var model: String = ""
@export var license_plate: String = ""
var driver = null
var is_locked := false
var car_state
var car_id: String

func _physics_process(delta):
	if is_locked:
		velocity = Vector2.ZERO
		return

	if driver:
		var direction = Vector2.ZERO
		direction.x = Input.get_action_strength("ui_right") - Input.get_action_strength("ui_left")
		direction.y = Input.get_action_strength("ui_down") - Input.get_action_strength("ui_up")
		velocity = direction.normalized() * speed
		move_and_slide()
		play_anim(direction)
	
		
func play_anim(dir):
	if dir.y==-1:
		$AnimatedSprite2D.play("n")
	elif dir.y == 1:
		$AnimatedSprite2D.play("s")
	elif dir.x == 1:
		$AnimatedSprite2D.play("e")
	elif dir.x == -1:
		$AnimatedSprite2D.play("w")
	elif dir.x > 0.5 and dir.y < -0.5:
		$AnimatedSprite2D.play("ne")
	elif dir.x > 0.5 and dir.y > 0.5:
		$AnimatedSprite2D.play("se")
	elif dir.x < -0.5 and dir.y < -0.5:
		$AnimatedSprite2D.play("nw")
	elif dir.x < -0.5 and dir.y > 0.5:
		$AnimatedSprite2D.play("sw")
			
# Entrer dans la voiture
func enter_car(car):
	driver = car
	car.controlling_car = self
	car.visible = false

# Sortir de la voiture
func exit_car():
	if not driver:
		return
	driver.visible = true
	driver.global_position = global_position + Vector2(40, 0)
	driver.controlling_car = null
	driver = null
	
func _ready():
	add_to_group("cars")
