extends Resource
class_name ItemData

@export var name: String = "Nom de l'objet"
@export_multiline var description: String = "Description de l'objet"
@export var icon: Texture2D # L'image qui s'affichera dans le menu
@export var stackable: bool = true # Est-ce qu'on peut en avoir plusieurs dans la même case ?
