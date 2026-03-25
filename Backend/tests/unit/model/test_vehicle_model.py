"""Tests for the User model"""


from alchemy_mock.mocking import UnifiedAlchemyMagicMock
from ...util import get_unique_license_plate

def test_create_new_vehicle(app, session = UnifiedAlchemyMagicMock()):
    licence_plate = get_unique_license_plate()
    owner_id = '123'
    from app.model.vehicle import Vehicle


    vehicle = Vehicle(license_plate=licence_plate, owner_id=owner_id)
    session.add(vehicle)
    session.commit()

    query = session.query(Vehicle).first()
    assert query.license_plate == licence_plate
    assert query.owner_id == owner_id
    assert query.serialize() == {'id': str(vehicle.id), 'license_plate': licence_plate}
    assert str(query) == '<Vehicle %r>' % (licence_plate)