extends Node

const API_BASE_URL = "http://127.0.0.1:8000/api"

func _ready():
	pass

# Appel HTTP générique
func _make_request(method: String, endpoint: String, data: Dictionary = {}) -> Variant:
	var http := HTTPRequest.new()
	add_child(http)
	var url = API_BASE_URL + "/" + endpoint
	var headers := ["Content-Type: application/json"]
	var err
	
	match method:
		"GET":
			err = http.request(url, headers)
		"POST":
			err = http.request(url, headers, HTTPClient.METHOD_POST, JSON.stringify(data))
		"PUT":
			err = http.request(url, headers, HTTPClient.METHOD_PUT, JSON.stringify(data))
		"DELETE":
			err = http.request(url, headers, HTTPClient.METHOD_DELETE)
		_:
			push_error("Méthode HTTP non supportée: " + method)
			http.queue_free()
			return null
	
	if err != OK:
		push_error("Erreur requête HTTP: " + str(err))
		http.queue_free()
		return null
	
	var result = await http.request_completed
	http.queue_free()
	
	var response_code = result[1]
	var body = result[3]
	
	if response_code >= 200 and response_code < 300:
		if body.get_string_from_utf8().is_empty():
			return {}
		var json = JSON.new()
		var parse_result = json.parse(body.get_string_from_utf8())
		if parse_result != OK:
			push_error("Erreur parsing JSON")
			return null
		return json.data
	else:
		push_error("Erreur API: " + str(response_code) + " " + body.get_string_from_utf8())
		return null

# Cars with repairs (voitures en attente)
func get_cars_with_repairs() -> Array:
	var result = await _make_request("GET", "clients/cars-with-repairs")
	if result == null:
		return []
	if result.has("data") and typeof(result.data) == TYPE_ARRAY:
		return result.data
	return []

# Slots
func occupy_slot(slot_id: int, car_id: String) -> Dictionary:
	var data = {"car_id": car_id}
	var result = await _make_request("POST", "slots/" + str(slot_id) + "/occupy", data)
	if result == null:
		return {}
	if result.has("slot"):
		return result.slot
	return {}

func free_slot(slot_id: int) -> Dictionary:
	var result = await _make_request("POST", "slots/" + str(slot_id) + "/free")
	if result == null:
		return {}
	if result.has("slot"):
		return result.slot
	return {}

func update_slot_status(slot_id: int, status: String) -> bool:
	var data = {"status": status}
	var result = await _make_request("PUT", "slots/" + str(slot_id), data)
	return result != null

# Interventions
func get_interventions() -> Array:
	var result = await _make_request("GET", "interventions")
	if result == null:
		return []
	if typeof(result) == TYPE_ARRAY:
		return result
	return []
