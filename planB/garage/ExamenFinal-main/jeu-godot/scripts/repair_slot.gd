extends Area2D

@export var slot_number := 1
@export var garage_manager_path: NodePath

var garage_manager
var occupied := false
var current_car

func _ready():
	# Chercher le GarageManager dans la scène parente
	garage_manager = get_node_or_null("../../")
	if garage_manager == null:
		push_error("GarageManager non trouvé pour le slot " + str(slot_number))
	
	# Ajouter ce slot au groupe pour le retrouver
	add_to_group("repair_slots")

func _on_body_entered(body):
	if occupied:
		return

	if body.is_in_group("cars"):
		lock_car(body)

func _on_body_exited(body):
	# Libérer le slot quand une voiture sort (normalement ne devrait pas arriver)
	if body == current_car:
		occupied = false
		current_car = null

func lock_car(car):
	if occupied:
		return

	occupied = true
	current_car = car
	car.is_locked = true
	car.global_position = global_position

	await garage_manager.occupy_slot(slot_number, car)

	print("🚗 Slot", slot_number, "occupé par", car.car_id)
