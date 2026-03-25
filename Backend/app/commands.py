import click
from datetime import datetime
from flask.cli import with_appcontext


def register_commands(app):
    """Add commands to the line command input.

    Parameters:
        app (flask.app.Flask): The application instance.
    """

    app.cli.add_command(create_admin_command)


@click.command('create-admin')
@click.argument('username')
@click.argument('password')
@click.argument('email')
@with_appcontext
def create_admin_command(username: str, password: str, email: str) -> None:
    """Create an admin user.
    e.g.: flask create-admin admin secret admin@parkit.com
    """

    from app.model.user import User
    from app.database import db

    if User.query.filter_by(username=username).first():
        click.echo(f"Error: username '{username}' already exists.")
        return

    user = User(
        username=username,
        name="Admin",
        last_name="User",
        email=email,
        cellphone="",
        type="admin",
        profile_img="",
        id_img="",
        driver_license_img="",
        contract="",
        vehicle_type="",
        created_at=datetime.utcnow(),
        is_deleted=False,
    )
    user.password_hash = password

    db.session.add(user)
    db.session.commit()
    click.echo(f"Admin user '{username}' created successfully.")
