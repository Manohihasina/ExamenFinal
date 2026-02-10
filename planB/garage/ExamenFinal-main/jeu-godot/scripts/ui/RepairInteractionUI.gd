extends Control

const RepairSlotServiceGame = preload("res://scripts/services/RepairSlotServiceGame.gd")

@onready var car_label: Label = $Panel/VBoxContainer/CarLabel
@onready var interventions_list_node = $Panel/VBoxContainer/InterventionsList
@onready var start_button: Button = $Panel/VBoxContainer/StartButton
@onready var status_label: Label = $Panel/VBoxContainer/StatusLabel

# Référence au progress manager
var progress_manager: Node
var current_car: Node2D
var current_slot_id: int
var repairs := []
var selected_intervention_index := -1
var repair_slot_service: RepairSlotServiceGame
var pending_queue := []
var intervention_map := {}
var intervention_select: OptionButton

signal repair_started(repair_id: String, intervention_id: int, duration: int)

func _ready():
	repair_slot_service = RepairSlotServiceGame.new()
	add_child(repair_slot_service)
	
	# Initialiser le progress manager
	await get_tree().process_frame
	progress_manager = get_node_or_null("../../RepairProgressManager")
	
	# Ensure we have an OptionButton for intervention selection. If the scene
	# contains an ItemList, hide it and create an OptionButton next to it.
	var vbox = get_node_or_null("Panel/VBoxContainer")
	if vbox == null:
		push_error("RepairInteractionUI: Panel/VBoxContainer introuvable")
	# Try to find an existing OptionButton named 'InterventionSelect'
	intervention_select = vbox.get_node_or_null("InterventionSelect") if vbox else null
	if intervention_select == null:
		# If there is an ItemList, hide it (keep for compatibility) and create OptionButton
		if interventions_list_node and interventions_list_node is ItemList:
			interventions_list_node.hide()
		intervention_select = OptionButton.new()
		intervention_select.name = "InterventionSelect"
		if vbox:
			vbox.add_child(intervention_select)

	# Connect selection signal
	if intervention_select:
		intervention_select.connect("item_selected", Callable(self, "_on_intervention_selected"))
	if start_button:
		start_button.pressed.connect(Callable(self, "_on_start_pressed"))
		start_button.text = "Réparer"
	
	visible = false

func setup_for_car(car: Node2D, slot_id: int):
	current_car = car
	current_slot_id = slot_id
	
	# Afficher les infos de la voiture
	# Display a human-friendly car name: prefer license plate, then brand+model, then id
	var display_name = ""
	if car.get("license_plate") != null and str(car.get("license_plate")) != "":
		display_name = str(car.get("license_plate"))
	elif car.get("brand") != null and car.get("model") != null:
		display_name = str(car.get("brand")) + " " + str(car.get("model"))
	else:
		display_name = str(car.get("car_id"))
	var car_info = "Voiture: " + display_name
	car_label.text = car_info
	
	# Charger les réparations de cette voiture
	_load_car_repairs()

func _load_car_repairs():
	status_label.text = "Chargement des réparations..."
	
	repairs = await repair_slot_service.get_car_repairs(str(current_car.get("car_id")))
	# Clear the option list
	if intervention_select:
		intervention_select.clear()
	elif interventions_list_node and interventions_list_node is ItemList:
		interventions_list_node.clear()
	
	var pending_repairs := []
	for repair in repairs:
		if repair.get("status") == "pending":
			pending_repairs.append(repair)
	
	if pending_repairs.is_empty():
		status_label.text = "Aucune intervention en attente"
		start_button.disabled = true
		return
	
	# Récupérer les détails des interventions
	var interventions = await repair_slot_service.get_interventions()
	intervention_map.clear()
	for intervention in interventions:
		intervention_map[intervention.id] = intervention
	
	for repair in pending_repairs:
		var intervention_id = repair.get("interventionId")
		if intervention_map.has(intervention_id):
			var intervention = intervention_map[intervention_id]
			# Show intervention name + price + duration
			var name = intervention.get("name", "Intervention inconnue")
			var price = intervention.get("price", intervention.get("interventionPrice", 0))
			var dur = intervention.get("duration_seconds", intervention.get("interventionDuration", 60))
			var text = "%s — %s€ (%ss)" % [str(name), str(price), str(dur)]
			var meta = {
				"repair_id": repair.id,
				"intervention_id": intervention_id,
				"duration": dur,
				"intervention_name": name,
				"price": price
			}
			if intervention_select:
				intervention_select.add_item(text)
				intervention_select.set_item_metadata(intervention_select.get_item_count() - 1, meta)
			else:
				# Fallback to ItemList if present
				interventions_list_node.add_item(text)
				interventions_list_node.set_item_metadata(interventions_list_node.get_item_count() - 1, meta)
	
	status_label.text = str(pending_repairs.size()) + " intervention(s) en attente"
	# keep a local ordered queue of pending repairs for sequential execution
	pending_queue.clear()
	for r in pending_repairs:
		pending_queue.append({
			"repair_id": r.id,
			"intervention_id": r.get("interventionId"),
			"duration": r.get("interventionDuration", r.get("duration_seconds", 60))
		})

	# Auto-select first item to make Start button usable without manual selection
	if intervention_select and intervention_select.get_item_count() > 0:
		intervention_select.select(0)
		selected_intervention_index = 0
		start_button.disabled = false
	elif interventions_list_node and interventions_list_node is ItemList and interventions_list_node.get_item_count() > 0:
		interventions_list_node.select(0)
		selected_intervention_index = 0
		start_button.disabled = false

func _on_intervention_selected(index: int):
	print("[RepairUI] intervention selected:", index)
	selected_intervention_index = index
	start_button.disabled = false

func _on_start_pressed():
	print("[RepairUI] _on_start_pressed called, selected index:", selected_intervention_index)
	if selected_intervention_index < 0:
		print("[RepairUI] no selection, ignoring start")
		return
	# Debug: show intervention name
	var item_data = null
	if intervention_select:
		item_data = intervention_select.get_item_metadata(selected_intervention_index)
	elif interventions_list_node and interventions_list_node is ItemList:
		item_data = interventions_list_node.get_item_metadata(selected_intervention_index)
	var inter_id = null
	if item_data and item_data.has("intervention_id"):
		inter_id = item_data["intervention_id"]
	var inter_name = ""
	if inter_id != null and intervention_map.has(inter_id):
		inter_name = str(intervention_map[inter_id].get("name", ""))
	else:
		if intervention_select:
			inter_name = intervention_select.get_item_text(selected_intervention_index)
		elif interventions_list_node and interventions_list_node is ItemList:
			inter_name = interventions_list_node.get_item_text(selected_intervention_index)
	print("[RepairUI] Starting intervention:", inter_name)
	# Start sequential processing from the selected index
	var start_idx = selected_intervention_index
	# disable UI while processing
	start_button.disabled = true
	status_label.text = "Démarrage des interventions..."
	await _process_repairs_queue(start_idx)
	# re-enable and refresh
	start_button.disabled = false
	await _load_and_refresh()

func _load_and_refresh():
	# reload repairs and UI
	await _load_car_repairs()
	return

func _process_repairs_queue(start_index: int) -> void:
	# Process pending_queue sequentially starting at index
	var car_id: String = ""
	if current_car:
		var _tmp = current_car.get("car_id")
		if _tmp != null:
			car_id = str(_tmp)
	print("[RepairUI] _process_repairs_queue starting for car:", car_id, "starting at", start_index)
	for i in range(start_index, pending_queue.size()):
		var entry = pending_queue[i]
		var repair_id = entry["repair_id"]
		var intervention_id = entry["intervention_id"]
		var duration = int(entry["duration"])

		print("[RepairUI] processing repair", repair_id, "intervention", intervention_id, "duration", duration)

		status_label.text = "Démarrage intervention " + str(i+1) + "..."

		# Update Firebase to set in_progress and start tracking
		var ok = await repair_slot_service.start_repair(repair_id, intervention_id, duration)
		if not ok:
			status_label.text = "Erreur démarrage intervention " + str(repair_id)
			continue

		# Start visual tracking
		if progress_manager:
			progress_manager.start_repair_tracking(repair_id, str(car_id), duration)

		# Wait until Firebase marks this repair as completed (poll)
		var completed = false
		while not completed:
			var rep = await repair_slot_service.firebase_service.firebase_get("repairs/" + str(repair_id))
			if rep != null and rep.get("status") == "completed":
				completed = true
				break
			# if rep has started and provides estimated duration, we can also wait by time
			await get_tree().create_timer(1.0).timeout

		# Ensure final normalization update in Firebase
		await repair_slot_service.update_repair_status(repair_id, {"status": "completed", "completedAt": Time.get_datetime_string_from_system()})

		# emit local signal for completion
		repair_started.emit(repair_id, intervention_id, duration)

	status_label.text = "Toutes les interventions terminées"
	# small pause then hide
	await get_tree().create_timer(0.8).timeout
	hide_ui()

func show_ui():
	visible = true

func hide_ui():
	visible = false
	selected_intervention_index = -1
	# Clear selection visuals where possible
	if interventions_list_node and interventions_list_node is ItemList:
		interventions_list_node.deselect_all()
	# OptionButton does not have deselect_all; keep index reset
	start_button.disabled = true

func _input(event):
	if visible and event is InputEventKey and event.keycode == KEY_ESCAPE and event.pressed:
		hide_ui()
		get_viewport().set_input_as_handled()
