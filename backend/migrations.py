"""Database migrations"""
from sqlalchemy import text, inspect
from sqlalchemy.orm import Session
from database import engine, SessionLocal
import models
import auth
import os

def run_migrations():
    """Run pending database migrations"""
    try:
        with engine.begin() as connection:
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


