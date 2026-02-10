extends Control

func _ready() -> void:
	Firebase.Auth.login_succeeded.connect(on_login_succeeded)
	Firebase.Auth.signup_succeeded.connect(on_signup_succeeded)
	Firebase.Auth.login_failed.connect(on_login_failed)
	Firebase.Auth.signup_failed.connect(on_signup_failed)

func _on_log_in_pressed() -> void:
	var email = %Email.text.strip_edges()
	var password = %MDP.text.strip_edges()
	
	if email == "" or password == "":
		%Label.text = "Fenoy tsara ny banga e !"
		return
		
	Firebase.Auth.login_with_email_and_password(email, password)

func _on_signup_pressed() -> void:
	var email = %Email.text.strip_edges()
	var password = %MDP.text.strip_edges() 
	
	print("Tentative Signup avec : ", email, " / Pass : ", password)
	
	if password.length() < 6:
		%Label.text = "Error: MDP trop court (min 6)"
		return
		
	if not email.contains("@"):
		%Label.text = "Error: Email invalide"
		return

	Firebase.Auth.signup_with_email_and_password(email, password)

func on_login_succeeded(auth):
	%Label.text = "Poinsa eeeh!"
	print("Success: ", auth)

func on_login_failed(error_code, message):
	%Label.text = "Login tsy nety: " + str(message)

func on_signup_succeeded(auth):
	%Label.text = "Nety inscription eeeh!"

func on_signup_failed(error_code, message):
	%Label.text = "Inscription tsy nety: " + str(message)
