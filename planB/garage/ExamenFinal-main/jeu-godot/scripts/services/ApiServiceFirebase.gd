extends Node

const FIREBASE_URL = "https://garage-s5-projet-default-rtdb.firebaseio.com"

func _ready():
	pass

# GET depuis Firebase
func firebase_get(path: String) -> Variant:
	var http := HTTPRequest.new()
	add_child(http)
	var url = FIREBASE_URL + "/" + path + ".json"
	var err = http.request(url)
	if err != OK:
		http.queue_free()
		return null
	
	var result = await http.request_completed
	http.queue_free()
	
	var response_code = result[1]
	var body = result[3]
	
	if response_code == 200:
		var json = JSON.new()
		var parse_result = json.parse(body.get_string_from_utf8())
		if parse_result != OK:
			return null
		return json.data
	else:
		push_error("Firebase GET error: " + str(response_code))
		return null

# PATCH (update) depuis Firebase
func firebase_update(path: String, data: Dictionary) -> bool:
	var http := HTTPRequest.new()
	add_child(http)
	var url = FIREBASE_URL + "/" + path + ".json"
	var headers = ["Content-Type: application/json"]
	var err = http.request(url, headers, HTTPClient.METHOD_PATCH, JSON.stringify(data))
	if err != OK:
		http.queue_free()
		return false
	
	var result = await http.request_completed
	http.queue_free()
	
	var response_code = result[1]
	return response_code == 200

# POST (créer) depuis Firebase
func firebase_post(path: String, data: Dictionary) -> String:
	var http := HTTPRequest.new()
	add_child(http)
	var url = FIREBASE_URL + "/" + path + ".json"
	var headers = ["Content-Type: application/json"]
	var err = http.request(url, headers, HTTPClient.METHOD_POST, JSON.stringify(data))
	if err != OK:
		http.queue_free()
		return ""
	
	var result = await http.request_completed
	http.queue_free()
	
	var response_code = result[1]
	var body = result[3]
	
	if response_code == 200:
		var json = JSON.new()
		var parse_result = json.parse(body.get_string_from_utf8())
		if parse_result == OK and json.data.has("name"):
			return json.data.name
	return ""

# DELETE depuis Firebase
func firebase_delete(path: String) -> bool:
	var http := HTTPRequest.new()
	add_child(http)
	var url = FIREBASE_URL + "/" + path + ".json"
	var err = http.request(url, [], HTTPClient.METHOD_DELETE)
	if err != OK:
		http.queue_free()
		return false
	
	var result = await http.request_completed
	http.queue_free()
	
	var response_code = result[1]
	return response_code == 200
