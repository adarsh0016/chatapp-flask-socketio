# Chat-App Using Flask-SocketIO & Deployed in Heroku

## Introduction
This is a chat application, implemented using Flask-SocketIO with both the database (PostgreSQL) and the app deployed in Heroku. It also has user registration and authentication functionalities and users can create their own chat room, and share it with friends and add them to the chat room.

## Screenshots

## Files in the program
> **application.py**: This is the main app file and contains both the registration/login page logic and the Flask-SocketIO backend for the app.
> **models.py**: Contains Flask-SQLAlchemy models used for user registration and login in application.py
> **wtform_fields.py**: Contains the classes for WTForms/Flask-WTF and the custom validators for the fields
> **Procfile**: file required for Heroku (I used eventlet server).
> **requirements.txt**: list of Python packages installed (also required for Heroku)
> **templates/**: folder with all HTML files
> **static/**: for with all JS scripts and CSS files

## Usage
### Run app
[Here](https://chat99999.herokuapp.com/) you can find the link to the Running application.

### Clone/Modify app
1. Install the required packages.

```bash
pip install -r requirements.txt
```
2. Modify application.py to replace the secret key *(i.e. os.environ.get('SECRET'))* with a secret key of your choice, the database link *(i.e. os.environ.get('DATABASE_URL'))* with the link to your own database, and *(app(run=True))* with *(socketio.run(app, debug=True))* to run it on the socketio local server rather than eventlet server.

    The two lines to be edited in application.py are shown below:
```python
app.secret_key=os.environ.get('SECRET')
app.config['SQLALCHEMY_DATABASE_URI']=os.environ.get('DATABASE_URL')
```

and

```python
app.run(debug=True)
```
with
```python
socketio.run(app, debug=True)
```

## Roadmap
Add message history for every room and add ability to play music in the room