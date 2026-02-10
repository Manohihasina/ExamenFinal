extends Area2D

@export var slot_number := 1
var occupied := false
var current_car 

func _on_body_entered(body):
	if body.name == "Car":
		print("⏳ Voiture en attente de paiement")

func lock_car(car):
	occupied = true
	current_car = car
	car.is_locked = true
	car.global_position = global_position
	print("🚗 Voiture verrouillée sur slot", slot_number)
