#!/usr/bin/env python3
"""Database Clean Script for Smart Restaurant System.

Can be run from ANY directory (inside or outside the app folder).
Usage:
    python clean_db.py
"""

import os
import subprocess
import sys
from pathlib import Path


def find_compose_file() -> Path | None:
    current = Path(__file__).resolve().parent
    candidates = [
        current / "restaurant-saas" / "docker-compose.yml",
        current / "docker-compose.yml",
        current.parent / "restaurant-saas" / "docker-compose.yml",
    ]
    for p in candidates:
        if p.is_file():
            return p
    return None


def clean_database():
    compose_file = find_compose_file()
    if not compose_file:
        print("❌ Error: Could not locate docker-compose.yml")
        sys.exit(1)

    print(f"🧹 Cleaning database using compose file: {compose_file}")

    truncate_sql = """
    TRUNCATE TABLE 
        order_item_addons,
        order_items,
        orders,
        addon_options, 
        addon_groups, 
        menu_items, 
        categories, 
        users, 
        restaurants 
    RESTART IDENTITY CASCADE;
    """

    cmd = [
        "docker", "compose", "-f", str(compose_file),
        "exec", "-T", "postgres",
        "psql", "-U", "postgres", "-d", "restaurant_saas",
        "-c", truncate_sql
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        print("✨ Database successfully cleaned!")
        print("   • Wiped all user accounts and auth sessions")
        print("   • Wiped all categories, items, and modifier groups")
        print("   • Reset all autoincrement primary keys to 1")
        print("   • Preserved table schema and Alembic migrations")
        print("\n🚀 Ready for fresh registration at: http://localhost:5173/register")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to clean database:\n{e.stderr or e.stdout}")
        sys.exit(e.returncode)


if __name__ == "__main__":
    clean_database()
