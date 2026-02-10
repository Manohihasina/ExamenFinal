extends Area2D

func _ready():
	add_to_group("computers")

func _on_computer_body_entered(body):
	if body.is_in_group("player"):
		print("💻 Joueur près de l'ordinateur")
