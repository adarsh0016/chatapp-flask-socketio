import os
from threading import local
from time import localtime, strftime
from flask import Flask, render_template,url_for,redirect, flash, jsonify, request
from flask_login import LoginManager, login_user, current_user, login_required, logout_user
from flask_socketio import SocketIO, rooms, send, emit, join_room, leave_room
from werkzeug import debug

from wtform_fields import *

from models import *

# configure app
app = Flask(__name__)
#app.secret_key = os.environ.get('SECRET') # for heroku server
app.secret_key = 'SECRET' # for local server

#configure database

#app.config['SQLALCHEMY_DATABASE_URI']=os.environ.get('DATABASE') # for heroku server
app.config['SQLALCHEMY_DATABASE_URI']="postgresql://pqnykeyalyyirw:398593ffcfb96cf52bba2798cc1ed720222ed74cd5edcdcc7a7a37e1da7fc204@ec2-52-23-45-36.compute-1.amazonaws.com:5432/dam6i6c7a0u5i4" # for local server
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

#initialize Flask-SocketIO
socketio = SocketIO(app)

# configure flask login
login = LoginManager(app)
login.init_app(app)

#Global variables
ROOMS =[]   #stores the rooms the current client is in.
room_name = ""  #stores the value to current room of the client.
PRIVATE_ROOMS=[] #a room for every client specific.

#flask login
@login.user_loader
def load_user(id):

    return User.query.get(int(id))  #returns the username and password of the client from users table.
    db.session.remove()

# login page
@app.route("/", methods=['GET', 'POST'])
def login():

    login_form = LoginForm()    #flask login

    # Allow login if validation success
    if login_form.validate_on_submit():
        user_object = User.query.filter_by(username=login_form.username.data).first()   #returns the user_object (ie. id, username, password) of the clinet from the users table.
        db.session.remove()
        login_user(user_object)     #logins in the session
        return redirect(url_for('chat',room_name=""))    #redirecting to the cat page.

    return render_template("login.html", form=login_form)   #renders the login page, passing the login_form values as form variable to html.

#signin page
@app.route("/signin", methods=['GET', 'POST'])
def signin():

    reg_form = RegistrationForm()   #flask login

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
        db.session.remove()

        flash('Registered succesfully. Please login.', 'success')
        return redirect(url_for('login'))   #redireting to the login page.

    return render_template("signin.html", form=reg_form)    #rendering the signin page.

# Create_room page
@app.route("/create_room", methods=['GET', 'POST'])
def create_room():

    # checks if the user is logged in and not just added "/create_room" at the end
    if not current_user.is_authenticated:
        flash('Please login.', 'danger')
        return redirect(url_for('login'))

    ROOMS = []  #initializeing the ROOMS list.
    get_rooms = Rooms.query.filter_by().all()   #getting all the room objects from rooms table.
    db.session.remove()
    for i in get_rooms:
        if i.room not in ROOMS:
            ROOMS.append(i.room)    #adding all the unique room names to the list to display at the rooms section of the chat page.

    if request.method == 'POST':
        if (request.form.get('Room_name', False)):  #if the client has entered something.
            room_name = request.form['Room_name']   #getting the room entered by the client.
            if room_name not in ROOMS:  #checks if the room already exists or not.
                ROOMS.append(room_name)
                #Adding the room name the user connected to, to the database.
                room = Rooms(username =current_user.username, room = room_name, userroom = (current_user.username
                +room_name))
                db.session.add(room)
                db.session.commit()
                db.session.remove()
                return redirect(url_for('chat', room_name = room_name))
            else:   #if the room already exists.
                flash('Room Already Exists!, try another name.', 'danger')
                return redirect(url_for('create_room'))
        elif (request.form.get('join_room_name', False)):   #if the client has entered something.
            room_name = request.form['join_room_name']
            if room_name in ROOMS:  #if room already exists.
                #Adding the room name the user connected to, to the database.
                room = Rooms(username =current_user.username, room = room_name, userroom = (current_user.username+room_name))
                db.session.add(room)
                db.session.commit()
                db.session.remove()

                # current_user.session['room_name'] = room_name
                return redirect(url_for('chat', room_name = room_name))
            else:   #if it did'nt.
                flash('No such room exists, check the room name before entering again!','danger')
                return redirect(url_for('create_room'))

    return render_template('create_room.html', username=current_user.username)

#chat page.
@app.route("/chat", methods=['GET', 'POST'])
def chat():
    room_name = request.args['room_name']
    # checks if the user is logged in and not just added "/chat" at the end
    if not current_user.is_authenticated:
        flash('Please login.', 'danger')
        return redirect(url_for('login'))
    
    #getting all the rooms this user is in from the database.
    user_rooms = Rooms.query.filter_by(username = current_user.username).all()
    db.session.remove()
    user_rooms_list = []

    # creating a list of user_rooms to send to the client.
    for user_room in user_rooms:
        user_rooms_list.append(user_room.room)
    user_rooms_list.reverse()   #reverse it so that the latest room comes in the top.

    return render_template('chat.html', username=current_user.username, user_rooms_list=user_rooms_list, room_name=room_name)

#leave_room page
@app.route("/leave", methods=['GET'])
def leave_room__():
    flash("Join another room.", 'success')
    return redirect(url_for('create_room'))

#logout page
@app.route("/logout", methods=['GET'])
def logout():

    logout_user()
    flash('You have logged out successfully', 'success')
    return redirect(url_for('login'))

#event handler (socketIO): takes the msg and adds time.
@socketio.on('message')
def message(data):

    send({'msg': data['msg'], 'username': data['username'], 'time_stamp': strftime('%b-%d %I:%M%p', localtime())}, room =data['room']) #msg={'msg':msg,'username':username}

    msg_history = Msg_history(username =data['username'], room = data['room'], msg = data['msg'], time = strftime('%b-%d %I: %M%p', localtime()))
    db.session.add(msg_history)
    db.session.commit()
    db.session.remove()

#event handler: join room
@socketio.on('join')
def join(data):
    join_room(data['room'])

    join_room(data['username'])

    send({'name':data['username'], 'msg': data['username'] + " has joined the '" + data['room'] + "' room."}, room=data['room'])

    msg_history_list = []

    msg_history = Msg_history.query.filter_by(room = data['room']).all()
    db.session.remove()
    for each_msg in msg_history:
        msg_history_list.append({'msg': each_msg.msg, 'username': each_msg.username, 'time_stamp': each_msg.time})
    emit('new_join_history', msg_history_list, room = data['username'])

#event handler: leave room
@socketio.on('leave')
def leave(data):
    send({'name': data['username'], 'msg': data['username'] + " has left the '" + data['room'] + "' room."}, room=data['room'])
    leave_room(data['room'])

    leave_room(data['username'])


if __name__ == "__main__":

    #app.run(debug=True) # for heroku server
    socketio.run(app, debug=True)



    ## https://www.youtube.com/watch?v=7EeAZx78P2U
