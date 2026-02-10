extends Node

const FIREBASE_URL := "https://garage-s5-projet-default-rtdb.firebaseio.com"

func firebase_get(path: String) -> Variant:
	var req := HTTPRequest.new()
	add_child(req)
	var url := "%s/%s.json" % [FIREBASE_URL, path]
	
	var err := req.request(url)
	if err != OK:
		req.queue_free()
		return null
	
	var result = await req.request_completed
	var response_code = result[1]
	var body = result[3]
	
	req.queue_free()
	
	if response_code != 200:
		push_error("Firebase GET erreur: %d" % response_code)
		return null
	
	var body_string: String = body.get_string_from_utf8()
	return JSON.parse_string(body_string)
func firebase_update(path: String, data: Dictionary) -> bool:
	var req := HTTPRequest.new()
	add_child(req)
	var url := "%s/%s.json" % [FIREBASE_URL, path]
	
	var err := req.request(
		url,
		["Content-Type: application/json"],
		HTTPClient.METHOD_PATCH,
		JSON.stringify(data)
	)
	
	if err != OK:
		req.queue_free()
		return false
	
	var result = await req.request_completed
	var response_code = result[1]
	
	req.queue_free()
	
	return response_code == 200
