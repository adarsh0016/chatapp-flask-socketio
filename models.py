from enum import unique
from operator import truediv
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin

db = SQLAlchemy()

class User(UserMixin, db.Model):
    """ User model """

    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(25), unique=True, nullable=False)
    password = db.Column(db.String(), nullable=False)
    
class Rooms(UserMixin, db.Model):
    """ rooms model """

    __tablename__ = "rooms"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(25), nullable=False)
    room = db.Column(db.String(), nullable=False)
    userroom = db.Column(db.String(), unique=True, nullable=False)


class Msg_history(UserMixin, db.Model):
    """ msg_history model """

    __tablename__ = "msg_history"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(25), nullable=False)
    room = db.Column(db.String(), nullable=False)
    msg = db.Column(db.String(), nullable=False)
    time = db.Column(db.String(), nullable=False)