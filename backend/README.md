# ToldYou Backend

## Quick start

1. Copy `.env.example` to `.env`
2. Install dependencies:

```powershell
pip install -r requirements.txt
```

3. Run the API:

```powershell
uvicorn app.main:app --reload
```

4. Open:

- API docs: `http://127.0.0.1:8000/docs`
- Healthcheck: `http://127.0.0.1:8000/health`

## Default admin

- Username: value from `ADMIN_USERNAME`
- Password: value from `ADMIN_PASSWORD`

The first startup auto-creates the admin account and default site configs.
