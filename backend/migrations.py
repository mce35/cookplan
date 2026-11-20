"""Database migrations"""
from sqlalchemy import text, inspect
from sqlalchemy.orm import Session
from database import engine, SessionLocal
import models
import auth
import os
from text_search import normalize_search_text

def run_migrations():
    """Run pending database migrations"""
    try:
        with engine.begin() as connection:
            # sqlite3's legacy transaction mode does not automatically begin
            # transactions for DDL. Start one explicitly so schema changes and
            # their data backfills commit or roll back together.
            if connection.dialect.name == 'sqlite':
                connection.exec_driver_sql('BEGIN IMMEDIATE')

            # Check if planning table exists
            inspector = inspect(connection)
            tables = inspector.get_table_names()
            
            if 'planning' in tables:
                # Check if note column exists in planning table
                planning_columns = [col['name'] for col in inspector.get_columns('planning')]
                
                if 'note' not in planning_columns:
                    # Add note column if it doesn't exist
                    connection.execute(text('ALTER TABLE planning ADD COLUMN note VARCHAR'))
                    print("Migration: Added 'note' column to planning table")

            if 'ingredients' in tables:
                ingredient_columns = [col['name'] for col in inspector.get_columns('ingredients')]

                if 'stock' not in ingredient_columns:
                    connection.execute(text('ALTER TABLE ingredients ADD COLUMN stock INTEGER DEFAULT 0'))
                    print("Migration: Added 'stock' column to ingredients table")

                if 'normalized_name' not in ingredient_columns:
                    connection.execute(text("ALTER TABLE ingredients ADD COLUMN normalized_name VARCHAR NOT NULL DEFAULT ''"))
                    print("Migration: Added 'normalized_name' column to ingredients table")
                    # Populate the new column once for ingredients that predate it.
                    ingredients = connection.execute(text('SELECT id, name FROM ingredients')).all()
                    for ingredient_id, name in ingredients:
                        connection.execute(
                            text('UPDATE ingredients SET normalized_name = :normalized WHERE id = :id'),
                            {'normalized': normalize_search_text(name), 'id': ingredient_id}
                        )

                connection.execute(text(
                    'CREATE INDEX IF NOT EXISTS ix_ingredients_normalized_name ON ingredients (normalized_name)'
                ))
    except Exception as e:
        print(f"Migration warning: {e}")
        # Migrations may fail if table doesn't exist yet, which is fine
        # The table will be created by create_all() after this

def initialize_default_user():
    """Create default user if it doesn't exist"""
    db = SessionLocal()
    try:
        # Check if any user exists
        existing_user = db.query(models.User).first()
        if not existing_user:
            # Get credentials from environment or use defaults
            default_username = os.getenv("DEFAULT_USERNAME", "admin")
            default_password = os.getenv("DEFAULT_PASSWORD", "admin")
            
            # Create default user
            user = models.User(
                username=default_username,
                hashed_password=auth.hash_password(default_password)
            )
            db.add(user)
            db.commit()
            print(f"Created default user: {default_username}")
            print("IMPORTANT: Please change the password after first login!")
    except Exception as e:
        print(f"Error creating default user: {e}")
    finally:
        db.close()


