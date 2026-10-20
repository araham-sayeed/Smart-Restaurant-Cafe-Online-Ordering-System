Project Structure

restaurant-saas/
├── docker-compose.yml
├── .env.example
├── README.md
│
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app entry
│   │   ├── core/              # config.py, security.py, redis.py
│   │   ├── db/                # session.py, base.py
│   │   ├── models/            # SQLAlchemy models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── api/
│   │   │   ├── deps.py        # auth + tenant dependencies
│   │   │   └── routes/        # auth.py, menu.py, orders.py,
│   │   │                      # payments.py, kitchen.py, admin.py
│   │   ├── services/          # order_service.py, stripe_service.py
│   │   └── utils/
│   ├── alembic/
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
│
└── frontend/
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx            # routes
    │   ├── api/               # axios client + endpoint functions
    │   ├── components/        # ui/ (Button, Modal), menu/, cart/
    │   ├── pages/
    │   │   ├── store/         # Menu, Cart, Checkout, OrderTracking
    │   │   ├── kitchen/       # LiveQueue
    │   │   └── admin/         # Dashboard, MenuBuilder, Settings
    │   ├── hooks/             # useCart, useOrderStream (SSE)
    │   ├── store/             # Zustand state (cart, auth)
    │   ├── utils/
    │   └── index.css          # Tailwind directives
    ├── tailwind.config.js
    ├── package.json
    └── Dockerfile

Color theme for frontend

colors: {
  sand:    '#F4EBE2',
  terra:   { DEFAULT: '#C98B74', dark: '#A66A55' },
  olive:   '#8A8F6A',
  ink:     '#443A35',
}