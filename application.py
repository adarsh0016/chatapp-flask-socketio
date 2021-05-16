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
app.secret_key = os.environ.get('SECRET')

#configure database
app.config['SQLALCHEMY_DATABASE_URI']=os.environ.get('DATABASE')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

#initialize Flask-SocketIO
socketio = SocketIO(app)

# configure flask login
login = LoginManager(app)
login.init_app(app)

ROOMS =[]

room_name = ""

@login.user_loader
def load_user(id):

    return User.query.get(int(id))

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

@app.route("/create_room", methods=['GET', 'POST'])
def create_room():

    ROOMS = []
    get_rooms = Rooms.query.filter_by().all()
    for i in get_rooms:
        if i.room not in ROOMS:
            ROOMS.append(i.room)


    if not current_user.is_authenticated:
        flash('Please login.', 'danger')
        return redirect(url_for('login'))
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

    return render_template('create_room.html', username=current_user.username)

@app.route("/chat", methods=['GET', 'POST'])
def chat():
    if not current_user.is_authenticated:
        flash('Please login.', 'danger')
        return redirect(url_for('login'))
    
    #getting all the rooms this user is in from the database.
    user_rooms = Rooms.query.filter_by(username = current_user.username).all()
    user_rooms_list = []

    # creating a list of user_rooms to send to the client.
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
    global room_name

    # resetting it to "". for better understamding peep chat.
    room_name=""

    logout_user()
    flash('You have logged out successfully', 'success')
    return redirect(url_for('login'))

#event handler (socketIO)
@socketio.on('message')
def message(data):

    send({'msg': data['msg'], 'username': data['username'], 'time_stamp': strftime('%b-%d %I: %M%p', localtime())}, room =data['room'])

@socketio.on('join')
def join(data):
    join_room(data['room'])

    send({'name':data['username'], 'msg': data['username'] + " has joined the '" + data['room'] + "' room."}, room=data['room'])

    #Adding the room name the user connected to, to the database.
    room = Rooms(username = data['username'], room = data['room'], userroom = (data['username']+data['room']))
    if Rooms.query.filter_by(userroom=(data['username']+data['room'])).first() is None:
        db.session.add(room)
        db.session.commit()

@socketio.on('leave')
def leave(data):
    send({'name': data['username'], 'msg': data['username'] + " has left the '" + data['room'] + "' room."}, room=data['room'])
    leave_room(data['room'])


if __name__ == "__main__":

    app.run(debug=True)



    ## https://www.youtube.com/watch?v=7EeAZx78P2U
