#!/usr/bin/env bash
# ==============================================================================
# Database Clean Script for Smart Restaurant System
# Can be run from ANY directory (inside or outside the app folder).
# ==============================================================================

set -e

# Locate script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/restaurant-saas/docker-compose.yml" ]; then
    COMPOSE_FILE="$SCRIPT_DIR/restaurant-saas/docker-compose.yml"
elif [ -f "$SCRIPT_DIR/docker-compose.yml" ]; then
    COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
else
    echo "❌ Error: Could not locate docker-compose.yml"
    exit 1
fi

echo "🧹 Cleaning Restaurant Database..."

# Wipe all app data and restart IDs
docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U postgres -d restaurant_saas -c "
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
"

echo "✨ Database successfully cleaned!"
echo "   - Removed all users and sessions"
echo "   - Removed all categories, items, and modifiers"
echo "   - Reset primary key IDs to 1"
echo "   - Schema and migrations preserved"
echo ""
echo "🚀 You can now register a fresh account at http://localhost:5173/register"
