extends Node2D

@export var car_scene: PackedScene = preload("res://scenes/car/car.tscn")
@export var spawn_point: Vector2 = Vector2(300, 200)

func _ready():
	var car = car_scene.instantiate()
	car.global_position = spawn_point
	add_child(car)
