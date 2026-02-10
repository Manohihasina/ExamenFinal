extends Control

const RepairSlotServiceGame = preload("res://scripts/services/RepairSlotServiceGame.gd")

@onready var slot_list: ItemList = $Panel/VBoxContainer/SlotList
@onready var car_list: ItemList = $Panel/VBoxContainer/CarList
@onready var add_button: Button = $Panel/VBoxContainer/AddButton
@onready var status_label: Label = $Panel/VBoxContainer/StatusLabel

var repair_slot_service: RepairSlotServiceGame
var slots := []
var cars := []
var selected_slot_index := -1
var selected_car_index := -1

signal car_assigned_to_slot(slot_id: int, car_data: Dictionary)

func _ready():
	repair_slot_service = RepairSlotServiceGame.new()
	add_child(repair_slot_service)
	
	# Connecter les signaux
	if slot_list != null:
		if not slot_list.is_connected("item_selected", Callable(self, "_on_slot_selected")):
			slot_list.item_selected.connect(Callable(self, "_on_slot_selected"))
	else:
		push_warning("SlotList introuvable dans GarageComputerUI")

	if car_list != null:
		if not car_list.is_connected("item_selected", Callable(self, "_on_car_selected")):
			car_list.item_selected.connect(Callable(self, "_on_car_selected"))
	else:
		push_warning("CarList introuvable dans GarageComputerUI")

	if add_button != null:
		if not add_button.is_connected("pressed", Callable(self, "_on_add_pressed")):
			add_button.pressed.connect(Callable(self, "_on_add_pressed"))
	else:
		push_warning("AddButton introuvable dans GarageComputerUI")
	
	visible = false
	_refresh_data()

func _refresh_data():
	status_label.text = "Chargement..."
	
	# Charger les slots
	slots = await repair_slot_service.get_repair_slots()
	slot_list.clear()
	for slot in slots:
		var slot_text = "Slot " + str(slot.id) + " - " + str(slot.status)
		if slot.has("car_id") and slot.car_id:
			slot_text += " (Voiture: " + str(slot.car_id) + ")"
		slot_list.add_item(slot_text)
	
	# Charger les voitures en attente
	cars = await repair_slot_service.get_cars_with_grouped_repairs()
	car_list.clear()
	for car in cars:
		var car_text = str(car.make) + " " + str(car.model) + " (" + str(car.license_plate) + ")"
		if car.has("client") and car.client:
			car_text += " - " + str(car.client.name)
		# Ajouter le nombre de réparations
		car_text += " [" + str(car.repairs.size()) + " réparations]"
		car_list.add_item(car_text)
	
	status_label.text = str(slots.size()) + " slots, " + str(cars.size()) + " voitures en attente"

func _on_slot_selected(index: int):
	selected_slot_index = index
	_update_add_button()

func _on_car_selected(index: int):
	selected_car_index = index
	_update_add_button()

func _update_add_button():
	var can_add := selected_slot_index >= 0 and selected_car_index >= 0
	add_button.disabled = not can_add
	
	if can_add:
		var slot = slots[selected_slot_index]
		if slot.get("status") != "available":
			add_button.disabled = true
			status_label.text = "Slot non disponible"

func _on_add_pressed():
	if selected_slot_index < 0 or selected_car_index < 0:
		return
	
	var slot = slots[selected_slot_index]
	var car = cars[selected_car_index]
	
	if slot.get("status") != "available":
		status_label.text = "Slot non disponible!"
		return
	
	status_label.text = "Assignation en cours..."
	
	# Appeler l'API pour occuper le slot
	var result = await repair_slot_service.occupy_slot(slot.id, str(car.id))
	
	if result.has("id"):
		status_label.text = "Voiture assignée au slot " + str(slot.id)
		car_assigned_to_slot.emit(slot.id, car)
		
		# Recharger les données
		await _refresh_data()
		
		# Réinitialiser la sélection
		selected_slot_index = -1
		selected_car_index = -1
		slot_list.deselect_all()
		car_list.deselect_all()
		_update_add_button()
	else:
		status_label.text = "Erreur lors de l'assignation"

func show_ui():
	visible = true
	_refresh_data()

func hide_ui():
	visible = false

func _on_gui_input(event: InputEvent):
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_RIGHT and event.pressed:
		hide_ui()
	
func _input(event):
	if visible and event is InputEventKey and event.keycode == KEY_ESCAPE and event.pressed:
		hide_ui()
		get_viewport().set_input_as_handled()
