extends Area3D

const ROT_SPEED = 120.0

@export var item_data: ItemData 

func _ready() -> void:
	if not body_entered.is_connected(_on_body_entered):
		body_entered.connect(_on_body_entered)


func _process(delta: float) -> void:
	rotate_y(deg_to_rad(ROT_SPEED * delta))


func _on_body_entered(body: Node3D) -> void:
	
	if body is CharacterBody3D:
		var character_script = body as CharacterBody3D
		var picked_up = character_script.pick_up_item(item_data)
		if picked_up:
			queue_free() 
