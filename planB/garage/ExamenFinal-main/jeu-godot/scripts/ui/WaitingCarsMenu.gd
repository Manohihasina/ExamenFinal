extends Control

const RepairSlotServiceGame = preload("res://scripts/services/RepairSlotServiceGame.gd")
const CarScene = preload("res://scenes/car/car.tscn")

var slots_label: Label
var waiting_label: Label
var option_button: OptionButton
var spawn_button: Button
var refresh_timer: Timer

var repair_slot_service: RepairSlotServiceGame
var cars := []
var slots := []

# Poll interval in seconds
const POLL_INTERVAL := 2.0

func _ready():
	repair_slot_service = RepairSlotServiceGame.new()
	add_child(repair_slot_service)

	# Try to find expected UI nodes; if missing, create a minimal UI so the script still works
	slots_label = get_node_or_null("Panel/VBoxContainer/SlotsLabel")
	waiting_label = get_node_or_null("Panel/VBoxContainer/WaitingLabel")
	option_button = get_node_or_null("Panel/VBoxContainer/CarSelect")
	spawn_button = get_node_or_null("Panel/VBoxContainer/SpawnButton")
	refresh_timer = get_node_or_null("RefreshTimer")

	if slots_label == null or waiting_label == null or option_button == null or spawn_button == null or refresh_timer == null:
		var panel = get_node_or_null("Panel")
		if panel == null:
			panel = Panel.new()
			panel.name = "Panel"
			add_child(panel)

		var vbox = panel.get_node_or_null("VBoxContainer")
		if vbox == null:
			vbox = VBoxContainer.new()
			vbox.name = "VBoxContainer"
			panel.add_child(vbox)

		if slots_label == null:
			slots_label = Label.new()
			slots_label.name = "SlotsLabel"
			vbox.add_child(slots_label)
		if waiting_label == null:
			waiting_label = Label.new()
			waiting_label.name = "WaitingLabel"
			vbox.add_child(waiting_label)
		if option_button == null:
			option_button = OptionButton.new()
			option_button.name = "CarSelect"
			vbox.add_child(option_button)
		if spawn_button == null:
			spawn_button = Button.new()
			spawn_button.name = "SpawnButton"
			spawn_button.text = "Spawner la voiture"
			vbox.add_child(spawn_button)
		if refresh_timer == null:
			refresh_timer = Timer.new()
			refresh_timer.name = "RefreshTimer"
			add_child(refresh_timer)

	option_button.clear()
	spawn_button.disabled = true

	# Position the menu to the right side of the scene (improves readability).
	# This only adjusts Control layout/anchors, not any logic.
	# Anchors: stick to the right and bottom area with a small offset.
	anchor_left = 1.0
	anchor_top = 0.7
	anchor_right = 1.0
	anchor_bottom = 1.0
	offset_right = -20
	offset_top = -260
	offset_left = -460
	offset_bottom = -20

	refresh_timer.wait_time = POLL_INTERVAL
	refresh_timer.one_shot = false
	refresh_timer.start()
	refresh_timer.timeout.connect(_refresh_data)

	option_button.connect("item_selected", Callable(self, "_on_car_selected"))
	spawn_button.connect("pressed", Callable(self, "_on_spawn_pressed"))

	_refresh_data()

func _refresh_data() -> void:
	# Fetch repair slots, cars with repairs and waiting slots
	slots = await repair_slot_service.get_repair_slots()
	# Use grouped repairs API to get cars with their pending/in_progress repairs
	var all_cars = await repair_slot_service.get_cars_with_grouped_repairs()
	var waiting = await repair_slot_service.get_waiting_slots()

	# Count available slots
	var available_count = 0
	for s in slots:
		if s.get("status") == "available":
			available_count += 1

	slots_label.text = "Slots disponibles : %d / 2" % available_count

	# Build a set of car ids that are in repair slots or waiting
	var in_slots := {}
	for s in slots:
		if s.has("car_id") and s.car_id:
			in_slots[str(s.car_id)] = true

	var in_waiting := {}
	for w in waiting:
		if w.has("carId"):
			in_waiting[str(w.carId)] = true

	# Filter cars eligible: have at least one pending repair, not in_slots, not in_waiting
	cars.clear()
	option_button.clear()
	for c in all_cars:
		var cid = str(c.id)
		if in_slots.has(cid):
			continue
		if in_waiting.has(cid):
			continue

		# Ensure the car has at least one pending repair
		var repairs_ok := false
		if c.has("repairs"):
			for r in c.repairs:
				if r.get("status", "pending") == "pending":
					repairs_ok = true
					break
		if not repairs_ok:
			continue

		# Also skip if already spawned in scene
		var spawned := false
		for sc in get_tree().get_nodes_in_group("cars"):
			if str(sc.car_id) == cid:
				spawned = true
				break
		if spawned:
			continue

		cars.append(c)
		var label = "%s – %s %s (%s) [%d repairs]" % [str(c.license_plate), str(c.make), str(c.model), str(c.year if c.has("year") else ""), int(c.repairs_count if c.has("repairs_count") else (c.repairs.size() if c.has("repairs") else 0))]
		option_button.add_item(label)
		option_button.set_item_metadata(option_button.get_item_count() - 1, c)

	waiting_label.text = "Voitures en attente : %d" % cars.size()

	spawn_button.disabled = not (cars.size() > 0 and available_count > 0 and option_button.get_item_count() > 0)

func _on_car_selected(index: int) -> void:
	print("[WaitingMenu] car selected index:", index)
	_update_spawn_button()

func _update_spawn_button() -> void:
	var has_selection = option_button.get_selected() >= 0
	# recompute available slots to be safe
	var available = 0
	for s in slots:
		if s.get("status") == "available":
			available += 1
	spawn_button.disabled = not (has_selection and available > 0)

func _on_spawn_pressed() -> void:
	print("[WaitingMenu] spawn pressed")
	var idx = option_button.get_selected()
	if idx < 0 or idx >= cars.size():
		print("[WaitingMenu] invalid selection idx:", idx)
		return
	var car_data = option_button.get_item_metadata(idx)
	if car_data == null:
		print("[WaitingMenu] no metadata for selected item")
		return

	# Validate again: ensure not spawned and slots available
	var cid = str(car_data.id)
	for sc in get_tree().get_nodes_in_group("cars"):
		if str(sc.car_id) == cid:
			# already spawned
			spawn_button.disabled = true
			return

	var available_slot = -1
	for s in slots:
		if s.get("status") == "available":
			available_slot = s.id
			break

	if available_slot < 0:
		spawn_button.disabled = true
		return

	# Spawn the car: try to call GarageManager if available
	var gm = null
	if get_parent() and get_parent().get_parent() and get_parent().get_parent().has_method("spawn_car_from_menu"):
		gm = get_parent().get_parent()
		gm.spawn_car_from_menu(car_data)
	else:
		# Fallback: instantiate locally using CarScene
		var car = CarScene.instantiate()
		car.car_id = cid
		if car_data.has("brand"):
			car.brand = car_data.brand
		if car_data.has("model"):
			car.model = car_data.model
		if car_data.has("license_plate"):
			car.license_plate = car_data.license_plate
		# Attempt to get spawn_point from parent manager
		var spawn_point = Vector2(300, 200)
		if get_parent() and get_parent().get_parent() and get_parent().get_parent().has("spawn_point"):
			spawn_point = get_parent().get_parent().spawn_point
		car.global_position = spawn_point
		add_child(car)

	# After spawning, refresh local data (car removed from eligible list)
	await _refresh_data()
	print("[WaitingMenu] spawn completed for car:", car_data.id)

func _on_visibility_changed():
	# If hidden/shown, force refresh
	_refresh_data()

func _exit_tree():
	if refresh_timer:
		refresh_timer.stop()
