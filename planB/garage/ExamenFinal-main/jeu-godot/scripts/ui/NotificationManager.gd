extends Control

# Minimal notification manager: affiche des messages temporaires dans l'UI
func _ready() -> void:
	custom_minimum_size = Vector2(300, 0)
	anchor_right = 1.0
	anchor_bottom = 0.0

	# Make this node discoverable by managers for global notifications
	add_to_group("notification_manager")

func show_message(text: String, duration: float = 2.0) -> void:
	var lbl := Label.new()
	lbl.text = text
	lbl.add_theme_color_override("font_color", Color.WHITE)
	lbl.custom_minimum_size = Vector2(260, 20)


	# Style background
	var bg := ColorRect.new()
	bg.color = Color(0, 0, 0, 0.6)
	bg.custom_minimum_size = Vector2(300, 30)

	var cont := MarginContainer.new()
	cont.add_child(bg)
	cont.add_child(lbl)
	# Position the notification container; MarginContainer may not expose
	# margin_left/top properties in this runtime, so use `position` instead.
	cont.position = Vector2(10, 10)
	cont.modulate = Color(1, 1, 1, 0)

	# store duration as metadata so hide scheduler can read it if needed
	cont.set_meta("notif_duration", duration)

	add_child(cont)

	# Fade in, then schedule hide
	var tween = create_tween()
	tween.tween_property(cont, "modulate:a", 1.0, 0.15)
	await tween.finished
	# call the async scheduler without awaiting so it runs independently
	call_deferred("_schedule_hide", cont, duration)

func _schedule_hide(cont: Node, duration: float) -> void:
	var t = Timer.new()
	t.wait_time = duration
	t.one_shot = true
	add_child(t)
	t.start()
	await t.timeout
	var tween = create_tween()
	tween.tween_property(cont, "modulate:a", 0.0, 0.2)
	await tween.finished
	if is_instance_valid(cont):
		cont.queue_free()
