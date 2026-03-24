import hashlib

from app.database import db
from flask_login import UserMixin
from sqlalchemy.ext.hybrid import hybrid_property


class User(UserMixin, db.Model):
    """Represents a user entity in the database.

    Tipos de usuario:
        - valet:   conductor que provee el servicio. Requiere id_img, driver_license_img, valet_code.
        - cliente: propietario del vehiculo. Requiere id_img, institutional_email.
    """

    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    last_name = db.Column(db.String, nullable=False)
    email = db.Column(db.String, nullable=False)
    cellphone = db.Column(db.String, nullable=False)
    type = db.Column(db.String, nullable=False)               # 'valet' | 'cliente'
    profile_img = db.Column(db.String, nullable=True)
    id_img = db.Column(db.String, nullable=True)              # Cedula — requerida para ambos tipos
    driver_license_img = db.Column(db.String, nullable=True)  # Licencia — solo valets
    contract = db.Column(db.String, nullable=True)
    vehicle_type = db.Column(db.String, nullable=True)        # Solo valets
    created_at = db.Column(db.DateTime, nullable=False)
    is_deleted = db.Column(db.Boolean, nullable=False)
    is_verified = db.Column(db.Boolean, nullable=False, default=False)
    valet_code = db.Column(db.String, nullable=True, unique=True)           # Solo valets: VAL-00123
    institutional_email = db.Column(db.String, nullable=True, unique=True)  # Solo clientes
    institutional_email_verified = db.Column(db.Boolean, nullable=True, default=False)
    username = db.Column(db.String, nullable=False, unique=True)
    _password_hash = db.Column(db.String)

    @hybrid_property
    def password_hash(self):
        raise AttributeError('Password hashes may not be viewed.')

    @password_hash.setter
    def password_hash(self, password):
        self._password_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()

    def authenticate(self, password):
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
            'driver_license_img': self.driver_license_img,
            'contract': self.contract,
            'vehicle_type': self.vehicle_type,
            'created_at': self.created_at,
            'is_deleted': self.is_deleted,
            'is_verified': self.is_verified,
            'valet_code': self.valet_code,
            'institutional_email': self.institutional_email,
            'institutional_email_verified': self.institutional_email_verified,
        }