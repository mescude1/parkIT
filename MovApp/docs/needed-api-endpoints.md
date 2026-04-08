# Backend API Endpoints Needed for Profile Screen

This document lists the backend work required to fully support the Profile screen in the mobile app.

---

## 1. Register the `/profile` Blueprint

**File:** `Backend/app/__init__.py` (inside `create_app()`)

**Action:** The profile blueprint already exists at `Backend/app/blueprint/profile.py` but is not registered in the app factory. Add:

```python
from app.blueprint.profile import bp_profile
app.register_blueprint(bp_profile)
```

**Endpoints that become active:**
- `GET /profile/user-profile` — returns authenticated user's profile
- `POST /profile/edit-profile` — updates editable profile fields

---

## 2. `GET /profile/user-profile` (Already Implemented)

**Auth:** JWT Bearer token required

**Response `200`:**
```json
{
  "status": "success",
  "message": "Profile data",
  "user": { /* User object — see API_SCHEMA.md */ }
}
```

No code changes needed — just register the blueprint.

---

## 3. `POST /profile/edit-profile` (Already Implemented — Needs Enhancement)

**Auth:** JWT Bearer token required

**Request body** (all fields optional):
```json
{
  "name": "string",
  "last_name": "string",
  "email": "string",
  "cellphone": "string",
  "profile_img": "string (URL)",
  "id_img": "string (URL)",
  "driver_license_img": "string (URL)",
  "contract": "string (URL)",
  "vehicle_type": "string",
  "password": "string"
}
```

**Current Response `200`:**
```json
{
  "status": "success",
  "message": "Profile updated successfully"
}
```

**Suggested Enhancement:** Return the updated user object so the frontend can sync state without a second request:
```json
{
  "status": "success",
  "message": "Profile updated successfully",
  "user": { /* Updated User object */ }
}
```

To implement, change the return in `edit_profile()`:
```python
return make_response(jsonify({
    'status': 'success',
    'message': 'Profile updated successfully',
    'user': user.to_dict()
}), 200)
```

---

## 4. `GET /profile/services-completed` (NEW — Needs Implementation)

**Auth:** JWT Bearer token required

**Logic:**
```python
@bp_profile.route('/services-completed', methods=['GET'])
@jwt_required()
def services_completed():
    user_id = int(get_jwt_identity())
    count = Service.query.filter(
        db.or_(Service.driver_id == user_id, Service.user_id == user_id),
        Service.is_finished == True,
        Service.is_deleted == False
    ).count()
    return jsonify({"status": "success", "count": count}), 200
```

**Response `200`:**
```json
{
  "status": "success",
  "count": 42
}
```

---

## 5. `GET /profile/rating` (NEW — Needs Implementation + New Model)

**Auth:** JWT Bearer token required

### Requires New Rating Model

Create `Backend/app/model/rating.py`:

```python
from app.database import db
from datetime import datetime

class Rating(db.Model):
    __tablename__ = 'ratings'

    id = db.Column(db.Integer, primary_key=True)
    service_id = db.Column(db.Integer, db.ForeignKey('services.id'), nullable=False)
    rater_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    rated_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    score = db.Column(db.Integer, nullable=False)  # 1-5
    comment = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
```

### Migration

Run `flask db migrate -m "add ratings table"` then `flask db upgrade`.

### Endpoint

```python
from sqlalchemy import func

@bp_profile.route('/rating', methods=['GET'])
@jwt_required()
def user_rating():
    user_id = int(get_jwt_identity())
    result = db.session.query(
        func.avg(Rating.score).label('average'),
        func.count(Rating.id).label('count')
    ).filter(Rating.rated_user_id == user_id).one()

    return jsonify({
        "status": "success",
        "average": round(float(result.average or 0), 1),
        "count": result.count
    }), 200
```

**Response `200`:**
```json
{
  "status": "success",
  "average": 4.3,
  "count": 17
}
```

---

## 6. `POST /profile/rate-service` (NEW — Future Sprint)

**Auth:** JWT Bearer token required

**Request body:**
```json
{
  "service_id": 123,
  "score": 5,
  "comment": "Great service!"
}
```

**Validation:**
- Service must exist and `is_finished == True`
- Authenticated user must be a participant (either `driver_id` or `user_id`)
- No duplicate ratings (one rating per user per service)
- Score must be between 1 and 5

**Response `201`:**
```json
{
  "status": "success",
  "message": "Rating submitted"
}
```

**Error Responses:**
- `400` — missing fields, invalid score, or duplicate rating
- `403` — user is not a participant of this service
- `404` — service not found

---

## Summary

| Priority | Endpoint | Status | Effort |
|----------|----------|--------|--------|
| P0 | Register `/profile` blueprint | Code exists, just register | Minimal |
| P0 | `GET /profile/user-profile` | Already implemented | None |
| P0 | `POST /profile/edit-profile` | Implemented, enhance response | Small |
| P1 | `GET /profile/services-completed` | New endpoint | Small |
| P1 | `GET /profile/rating` | New endpoint + new model + migration | Medium |
| P2 | `POST /profile/rate-service` | New endpoint | Medium |
