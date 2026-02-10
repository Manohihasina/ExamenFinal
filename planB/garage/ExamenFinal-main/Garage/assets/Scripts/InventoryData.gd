extends Resource
class_name InventoryData

# Signal émis après chaque ajout ou modification réussie de l'inventaire
signal inventory_updated 

@export var slots: Array[InventorySlot]

# Fonction utilitaire pour vérifier si un item est possédé
func has_item(target_item: ItemData) -> bool:
	if target_item == null:
		return false
		
	for slot in slots:
		if slot.item_data == target_item:
			return true
	return false

# Fonction pour ajouter un objet dans le sac
func insert(item: ItemData) -> bool:
	if item == null:
		return false
		
	# Vérification initiale pour la cause de l'erreur "Nil" passée
	if item.stackable:
		for slot in slots:
			if slot.item_data != null and slot.item_data == item:
				slot.quantity += 1 
				inventory_updated.emit() 
				return true
	
	for slot in slots:
		if slot.item_data == null:
			slot.item_data = item
			slot.quantity = 1
			inventory_updated.emit() 
			return true
			
	print("Inventaire plein !")
	return false
