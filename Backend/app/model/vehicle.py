from sqlalchemy import ForeignKey

from app.database import db
from app.model.base import Model


class Vehicle(Model, db.Model):
    """
    Columns:
        id (integer, primary key, auto-incremented): Unique identifier for the vehicle.
        license_plate (string, unique, not null): Unique license plate number of the vehicle.
        owner_id (integer, foreign key, not null): The ID of the vehicle's owner, referencing the User table.
        make (string, not null): The manufacturer of the vehicle (e.g., Toyota, Ford).
        model (string, not null): The specific model of the vehicle (e.g., Corolla, Mustang).
        year (integer, not null): The manufacturing year of the vehicle.
        color (string, nullable): The color of the vehicle.
        registration_date (datetime, nullable): The vehicle's registration date.

    Attributes:
        license_plate (str): Vehicle's license plate number.
        owner_id (int): ID of the vehicle's owner.
        make (str): Vehicle's manufacturer.
        model (str): Vehicle's model name.
        year (int): Vehicle's manufacturing year.
        color (str): The color of the vehicle.
        registration_date (datetime): The vehicle's registration date.
    """

    __tablename__ = 'vehicles'

    id = db.Column(db.Integer, primary_key=True)
    model = db.Column(db.String, nullable=False)
    brand = db.Column(db.String, nullable=False)
    license_plate = db.Column(db.String, nullable=False)
    year = db.Column(db.Integer, nullable=False)
    vehicle_img = db.Column(db.String, nullable=False)
    proof_insurance_img = db.Column(db.String, nullable=False)
    property_card = db.Column(db.String, nullable=False)
    owner = db.Column(db.Integer, ForeignKey('users.id'), nullable=False)
    type = db.Column(db.String, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False)
    is_deleted = db.Column(db.Boolean, nullable=False)

    def __repr__(self):
        return '<Vehicle %r>' % self.license_plate

    def to_dict(self):
        return {
            'id': self.id,
            'license_plate': self.license_plate,
            'owner_id': self.owner_id,
            'make': self.make,
            'model': self.model,
            'year': self.year,
            'color': self.color,
            'registration_date': self.registration_date,
        }
