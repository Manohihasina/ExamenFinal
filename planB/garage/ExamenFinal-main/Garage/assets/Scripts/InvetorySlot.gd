extends Resource
class_name InventorySlot

# ON NE DÉCLARE PAS DE SIGNAL "changed" ICI
# (Car la classe Resource en possède déjà un par défaut)

@export var item_data: ItemData:
	set(value):
		item_data = value
		# On utilise la fonction native de Godot pour dire "cette ressource a changé"
		emit_changed() 

@export var quantity: int = 0:
	set(value):
		quantity = value
		# Idem ici
		emit_changed()
