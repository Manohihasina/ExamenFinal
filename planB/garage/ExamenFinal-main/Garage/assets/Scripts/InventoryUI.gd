extends Control
class_name InventoryUI

# Chemin vers la scène de la case d'inventaire (Utilisation de votre chemin)
const SLOT_UI_SCENE = preload("res://assets/Joueur/Ressources/slot_ui.tscn") 

@export var player_inventory: InventoryData # Le fichier de données de l'inventaire du joueur
@onready var slot_container = $Panel/SlotContainer # Chemin d'accès à votre GridContainer

# Cette fonction est appelée par le joueur lors de l'ouverture du menu.
func setup_ui(inventory_data_ref: InventoryData):
	# 1. Nettoyer l'ancienne interface si elle existait (pour éviter les doublons)
	for child in slot_container.get_children():
		child.queue_free()
		
	# 2. Garder une référence à l'inventaire du joueur
	player_inventory = inventory_data_ref
	
	# 3. Connexion au signal de mise à jour globale de l'inventaire
	# On s'assure de ne pas connecter le signal plusieurs fois
	if not player_inventory.inventory_updated.is_connected(_on_inventory_updated):
		player_inventory.inventory_updated.connect(_on_inventory_updated)
	
	# 4. Créer l'interface pour chaque slot de données
	for slot_data in player_inventory.slots:
		var slot_ui = SLOT_UI_SCENE.instantiate()
		slot_container.add_child(slot_ui)
		
		# On passe l'objet de données InventorySlot à l'UI pour qu'elle l'affiche
		slot_ui.initialize(slot_data)

# Fonction appelée par le signal inventory_updated (ajout/retrait d'objet)
func _on_inventory_updated():
	print("Inventaire UI mis à jour globalement.")
	# Le rafraîchissement des icônes individuelles est géré par les SlotUI eux-mêmes
	# grâce à l'écoute du signal 'changed' de InventorySlot.gd.
	pass
