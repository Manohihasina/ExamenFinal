extends Node

const FirebaseService = preload("res://scripts/firebase/FirebaseService.gd")
var firebase_service: FirebaseService

func _ready():
	firebase_service = FirebaseService.new()
	add_child(firebase_service)

func get_repair_slots() -> Array:
	var data = await firebase_service.firebase_get("repair_slots")
	if data == null:
		return []

	# Accept either dictionary (keyed by id) or array
	var slots: Array = []
	if typeof(data) == TYPE_ARRAY:
		for i in range(data.size()):
			var slot = data[i]
			if slot and (typeof(slot) == TYPE_DICTIONARY or typeof(slot) == TYPE_OBJECT):
				if slot.has("id"):
					slots.append(slot)
				else:
					slot["id"] = i
					slots.append(slot)
	else:
		# dictionary
		for key in data.keys():
			var slot = data[key]
			if typeof(slot) == TYPE_DICTIONARY:
				slot["id"] = int(key)
				slots.append(slot)

	return slots

func occupy_slot(slot_id: int, car_id: String) -> bool:
	var success = await firebase_service.firebase_update(
		"repair_slots/%d" % slot_id,
		{
			"car_id": car_id,
			"status": "occupied",
			"updated_at": Time.get_datetime_string_from_system()
		}
	)
	return success

func free_slot(slot_id: int) -> bool:
	var success = await firebase_service.firebase_update(
		"repair_slots/%d" % slot_id,
		{
			"car_id": null,
			"status": "available",
			"updated_at": Time.get_datetime_string_from_system()
		}
	)
	return success
