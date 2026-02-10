extends Control

@onready var menu_panel: Panel = $MenuPanel
@onready var quit_button: Button = $MenuPanel/VBoxContainer/QuitButton
@onready var resume_button: Button = $MenuPanel/VBoxContainer/ResumeButton

func _ready():
	visible = false
	quit_button.pressed.connect(_on_quit_pressed)
	resume_button.pressed.connect(_on_resume_pressed)

func _input(event):
	if event.is_action_pressed("ui_cancel"):  # Touche Échap
		toggle_menu()

func toggle_menu():
	visible = not visible
	if visible:
		get_tree().paused = true
	else:
		get_tree().paused = false

func _on_quit_pressed():
	get_tree().quit()

func _on_resume_pressed():
	visible = false
	get_tree().paused = false
