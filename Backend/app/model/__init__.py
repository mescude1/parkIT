"""The model layer."""
from app.model.user import User
from app.model.vehicle import Vehicle
from app.model.user_location import UserLocation
from app.model.service import Service
from app.model.contract_metadata import ContractMetadata
from app.model.media_metadata import MediaMetadata

__all__ = ["Model", "User", "Vehicle", "UserLocation", "Service", "ContractMetadata", "MediaMetadata"]

"""This module define all models (persistent objects - PO) of application. Each model
is a subclasses of the Base class (base declarative) from app.model.database module.
The declarative extension in SQLAlchemy allows to define tables and models in one go,
that is in the same class.
"""
from sqlalchemy import inspect

class Model:
    """The Model class declare the serialize() method that is
    supposed to serializes the model data. The Model's subclasses
    can provide a implementation of this method."""

    def serialize(self) -> dict:
        """Serialize the object attributes values into a dictionary."""

        return {
            c.key: getattr(self, c.key)
            for c in inspect(self).mapper.column_attrs

        }

    def remove_session(self):
        """Removes an object from the session its current session."""

        session = inspect(self).session
        if session:
            session.expunge(self)


