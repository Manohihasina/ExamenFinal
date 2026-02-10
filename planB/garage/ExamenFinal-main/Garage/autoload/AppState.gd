extends Node

# --- VARIABLES D'ÉTAT ---
var commande_id: String = ""
var interventions_disponibles: Dictionary = {}
var intervention_active: String = ""
var progression: int = 0
var status: String = "en_attente"

# --- SIGNAUX ---
signal etat_mis_a_jour
signal commande_changee(nouvelle_commande)
signal progression_changee(nouvelle_progression)
signal status_changee(nouveau_status)

# --- INITIALISATION ---
func _ready():
	# S'enregistrer dans un groupe pour être facilement trouvable
	add_to_group("app_state")
	print("📱 AppState initialisé")

# --- SETTERS AVEC SIGNAL ---
func set_commande_id(value: String):
	if commande_id != value:
		commande_id = value
		emit_signal("commande_changee", value)
		emit_signal("etat_mis_a_jour")

func set_interventions_disponibles(value: Dictionary):
	interventions_disponibles = value
	emit_signal("etat_mis_a_jour")

func set_intervention_active(value: String):
	if intervention_active != value:
		intervention_active = value
		emit_signal("etat_mis_a_jour")

func set_progression(value: int):
	if progression != value:
		progression = clamp(value, 0, 100)
		emit_signal("progression_changee", progression)
		emit_signal("etat_mis_a_jour")

func set_status(value: String):
	if status != value:
		status = value
		emit_signal("status_changee", status)
		emit_signal("etat_mis_a_jour")

# --- MÉTHODES UTILITAIRES ---
func est_en_cours() -> bool:
	return status == "en_cours"

func est_termine() -> bool:
	return status == "termine"

func obtenir_statut_texte() -> String:
	match status:
		"en_attente":
			return "En attente de commande"
		"connecte":
			return "Connecté au serveur"
		"en_cours":
			return "Réparation en cours"
		"termine":
			return "Réparation terminée"
		"deconnecte":
			return "Déconnecté"
		"erreur_connexion":
			return "Erreur de connexion"
		_:
			return "Statut inconnu"

func obtenir_progression_pourcentage() -> String:
	return str(progression) + "%"

func reinitialiser():
	"""Réinitialise l'état de l'application"""
	commande_id = ""
	interventions_disponibles = {}
	intervention_active = ""
	progression = 0
	status = "en_attente"
	emit_signal("etat_mis_a_jour")
	print("🔄 AppState réinitialisé")

func to_dictionary() -> Dictionary:
	"""Convertit l'état en dictionnaire pour le stockage"""
	return {
		"commande_id": commande_id,
		"interventions_disponibles": interventions_disponibles,
		"intervention_active": intervention_active,
		"progression": progression,
		"status": status
	}

func from_dictionary(data: Dictionary):
	"""Charge l'état depuis un dictionnaire"""
	if "commande_id" in data:
		commande_id = data["commande_id"]
	if "interventions_disponibles" in data:
		interventions_disponibles = data["interventions_disponibles"]
	if "intervention_active" in data:
		intervention_active = data["intervention_active"]
	if "progression" in data:
		progression = data["progression"]
	if "status" in data:
		status = data["status"]
	emit_signal("etat_mis_a_jour")
