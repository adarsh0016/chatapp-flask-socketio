import os
from threading import local
from time import localtime, strftime
from flask import Flask, render_template,url_for,redirect, flash, request
from flask_login import LoginManager, login_user, current_user, login_required, logout_user
from flask_socketio import SocketIO, rooms, send, emit, join_room, leave_room

from wtform_fields import *

from models import *

# configure app
app = Flask(__name__)
app.secret_key = "scerte"

#configure database
app.config['SQLALCHEMY_DATABASE_URI']="postgresql://pqnykeyalyyirw:398593ffcfb96cf52bba2798cc1ed720222ed74cd5edcdcc7a7a37e1da7fc204@ec2-52-23-45-36.compute-1.amazonaws.com:5432/dam6i6c7a0u5i4"
db = SQLAlchemy(app)

#initialize Flask-SocketIO
socketio = SocketIO(app)

# configure flask login
login = LoginManager(app)
login.init_app(app)

ROOMS = []
room_name = ""

@login.user_loader
def load_user(id):

    return User.query.get(int(id))

@app.route("/signin", methods=['GET', 'POST'])
def signin():

    reg_form = RegistrationForm()

    # updated databse if validation success
    if reg_form.validate_on_submit():
        username = reg_form.username.data
        password = reg_form.password.data

        #hash password
        hashed_pswd = pbkdf2_sha256.hash(password)

        # add user into db
        user = User(username=username, password=hashed_pswd)
        db.session.add(user)
        db.session.commit()

        flash('Registered succesfully. Please login.', 'success')
        return redirect(url_for('login'))

    return render_template("signin.html", form=reg_form)

@app.route("/", methods=['GET', 'POST'])
def login():

    login_form = LoginForm()

    # Allow login if validation success
    if login_form.validate_on_submit():
        user_object = User.query.filter_by(username=login_form.username.data).first()
        login_user(user_object)
        return redirect(url_for('chat'))

        return "Not logged in!"

    return render_template("login.html", form=login_form)

@app.route("/create_room", methods=['GET', 'POST'])
def create_room():
    global room_name
    if request.method == 'POST':
        if (request.form.get('Room_name', False)):
            room_name = request.form['Room_name']
            if room_name not in ROOMS:
                ROOMS.append(room_name)
                return redirect(url_for('chat'))
            else:
                flash('Room Already Exists!, try another name.', 'danger')
                return redirect(url_for('create_room'))
        elif (request.form.get('join_room_name', False)):
            room_name = request.form['join_room_name']
            if room_name in ROOMS:
                return redirect(url_for('chat'))
            else:
                flash('No such room exists, check the room name before entering again!','danger')
                return redirect(url_for('create_room'))

    return render_template('create_room.html')

@app.route("/chat", methods=['GET', 'POST'])
def chat():
    #if not current_user.is_authenticated:
    #    flash('Please login.', 'danger')
    #    return redirect(url_for('login'))
    
    #getting all the rooms this user is in
    user_rooms = Rooms.query.filter_by(username = current_user.username).all()
    user_rooms_list = []
    for user_room in user_rooms:
        user_rooms_list.append(user_room.room)
    if room_name not in user_rooms_list:
        user_rooms_list.append(room_name)
    user_rooms_list.reverse()

    return render_template('chat.html', username=current_user.username, user_rooms_list=user_rooms_list)

@app.route("/leave", methods=['GET'])
def leave_room__():
    flash("Join another room.", 'success')
    return redirect(url_for('create_room'))

@app.route("/logout", methods=['GET'])
def logout():
    logout_user()
    flash('You have logged out successfully', 'success')
    return redirect(url_for('login'))

#event handler (socketIO)
@socketio.on('message')
def message(data):

    print(f"\n\n{data}\n\n")
    send({'msg': data['msg'], 'username': data['username'], 'time_stamp': strftime('%b-%d %I: %M%p', localtime())}, room =data['room'])

@socketio.on('join')
def join(data):
    join_room(data['room'])

    send({'msg': data['username'] + " has joined the '" + data['room'] + "' room."}, room=data['room'])

    #Adding the room name the user connected to, to the database.
    room = Rooms(username = data['username'], room = data['room'], userroom = (data['username']+data['room']))
    db.session.add(room)
    db.session.commit()

@socketio.on('leave')
def leave(data):
    send({'msg': data['username'] + " has left the '" + data['room'] + "' room."}, room=data['room'])
    leave_room(data['room'])


if __name__ == "__main__":

    socketio.run(app, debug=True)



    ## https://www.youtube.com/watch?v=7EeAZx78P2U

    # joining and leaving message not showing every time.