extends Control
class_name SlotUI

# Les noeuds enfants que nous allons mettre à jour
@onready var icon_display: TextureRect = $TextureRect
@onready var amount_label: Label = $Label

var slot_data: InventorySlot = null

func initialize(data: InventorySlot):
	slot_data = data
	slot_data.changed.connect(update_display)
	update_display()

func update_display():
	# Si le slot est vide
	if slot_data.item_data == null or slot_data.quantity == 0:
		icon_display.texture = null
		amount_label.text = ""
	# Si le slot contient un objet
	else:
		# Affiche l'icône de l'ItemData
		icon_display.texture = slot_data.item_data.icon
		
		# Affiche la quantité (seulement si elle est > 1)
		if slot_data.quantity > 1:
			amount_label.text = str(slot_data.quantity)
		else:
			amount_label.text = ""
