"""Database migrations"""
from sqlalchemy import text, inspect
from sqlalchemy.orm import Session
from database import engine

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

