import hashlib

from app.database import db
from flask_login import UserMixin
from sqlalchemy.ext.hybrid import hybrid_property


class User(UserMixin, db.Model):
    """
    Represents a user entity in the database with support for authentication
    and additional metadata.

    This class serves as a model for storing user-related information along with
    a secure mechanism for handling password hashing. It also provides an interface
    for serialization of key user attributes into a dictionary format.

    Attributes:
        id (int): Primary key identifier for the user.
        name (str): The first name of the user. Cannot be null.
        last_name (str): The last name of the user. Cannot be null.
        email (str): The email address of the user. Cannot be null.
        cellphone (str): The cellphone number of the user. Cannot be null.
        type (str): The type of user. Cannot be null.
        profile_img (str): URL or path to the user's profile image. Cannot be null.
        id_img (str): URL or path to the user's ID image. Cannot be null.
        driver_license_img (str): URL or path to the user's driver license image.
                                  Cannot be null.
        contract (str): URL or path to the user's contract document. Cannot be null.
        vehicle_type (str): The type of vehicle associated with the user. Cannot
                            be null.
        created_at (datetime): The timestamp when the user was created. Cannot
                               be null.
        is_deleted (bool): Indicates if the user account is marked as deleted.
                           Cannot be null.
        username (str): The unique username associated with the user. Cannot be null.
        _password_hash (str): Stores the hashed password of the user.

    Methods:
        password_hash: Property that restricts reading the password hash directly.
                       Provides a setter for hashing passwords securely.
        authenticate(password: str): Validates the input password by comparing its
                                      hash to the stored hash.
        to_dict(): Serializes core user data (id and username) to a dictionary.
    """

    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    last_name = db.Column(db.String, nullable=False)
    email = db.Column(db.String, nullable=False)
    cellphone = db.Column(db.String, nullable=False)
    type = db.Column(db.String, nullable=False)
    profile_img = db.Column(db.String, nullable=False)
    id_img = db.Column(db.String, nullable=False)
    student_card_img = db.Column(db.String, nullable=True)   # Carnet de estudiante o empleado
    driver_license_img = db.Column(db.String, nullable=False)
    contract = db.Column(db.String, nullable=True)
    vehicle_type = db.Column(db.String, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False)
    is_deleted = db.Column(db.Boolean, nullable=False)
    is_verified = db.Column(db.Boolean, nullable=False, default=False)  # Verificacion de identidad
    username = db.Column(db.String, nullable=False, unique=True)
    _password_hash = db.Column(db.String)


    @hybrid_property
    def password_hash(self):
        raise AttributeError('Password hashes may not be viewed.')

    @password_hash.setter
    def password_hash(self, password):
        # Generate SHA-256 hash
        self._password_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()

    def authenticate(self, password):
        # Check if the given password matches the stored hash
        return self._password_hash == hashlib.sha256(password.encode('utf-8')).hexdigest()


    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'name': self.name,
            'last_name': self.last_name,
            'email': self.email,
            'cellphone': self.cellphone,
            'type': self.type,
            'profile_img': self.profile_img,
            'id_img': self.id_img,
            'student_card_img': self.student_card_img,
            'driver_license_img': self.driver_license_img,
            'contract': self.contract,
            'vehicle_type': self.vehicle_type,
            'created_at': self.created_at,
            'is_deleted': self.is_deleted,
            'is_verified': self.is_verified,
        }