extends Area3D
class_name CollectibleCoin 

const ROT_SPEED = 120.0 # Vitesse en degrés par seconde (j'ai mis 120 pour que ce soit visible)

# Variable ESSENTIELLE : Permet de glisser la ressource 'piece_dor.tres' dans l'Inspecteur
@export var item_data: ItemData 


func _ready() -> void:
	# Assurez-vous d'avoir bien connecté le signal body_entered de votre Area3D 
	# soit manuellement dans l'éditeur (Onglet 'Nœud'), soit par code comme ici:
	if not body_entered.is_connected(_on_body_entered):
		body_entered.connect(_on_body_entered)


func _process(delta: float) -> void:
	# Utilisation de delta pour une rotation indépendante du framerate
	rotate_y(deg_to_rad(ROT_SPEED * delta))


func _on_body_entered(body: Node3D) -> void:
	# On vérifie si le corps entrant est une instance de votre CharacterBody3D
	if body is CharacterBody3D:
		var character_script = body as CharacterBody3D
		
		# 1. On tente de ramasser l'objet en appelant la fonction du joueur.
		# On lui passe la ressource de donnée que nous avons chargée via l'Inspecteur.
		var picked_up = character_script.pick_up_item(item_data)
		
		# 2. Si la fonction renvoie VRAI (l'objet a été ajouté)
		if picked_up:
			# On détruit la pièce du monde 3D
			queue_free() 
		# Si 'picked_up' est FAUX, cela signifie que l'inventaire est plein, 
		# donc on ne détruit pas la pièce (elle reste au sol).
