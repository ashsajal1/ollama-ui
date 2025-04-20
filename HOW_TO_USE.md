# How to Use Ollama UI

This guide will help you set up and run the Ollama UI application with PostgreSQL and Prisma.

## Prerequisites

- Node.js (Latest LTS version recommended)
- PostgreSQL installed on your system
- pnpm package manager
- Ollama installed and running

## Setup Instructions

### 1. Install PostgreSQL

#### On Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

#### On macOS (using Homebrew):
```bash
brew install postgresql
brew services start postgresql
```

### 2. Create Database and User

1. Access PostgreSQL command prompt:
```bash
sudo -u postgres psql
```

2. Create a new database and user (adjust values as needed):
```sql
CREATE DATABASE sajal;
CREATE USER postgres WITH ENCRYPTED PASSWORD '1213';
GRANT ALL PRIVILEGES ON DATABASE sajal TO postgres;
```

3. Exit PostgreSQL prompt:
```sql
\q
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory (if not already present):
```
DATABASE_URL="postgresql://postgres:1213@localhost:5432/sajal"
```

### 4. Install Dependencies

```bash
pnpm install
```

### 5. Initialize Prisma

```bash
# Generate Prisma Client
pnpm prisma generate

# Run database migrations
pnpm prisma migrate dev
```

## Running the Application

1. Start the development server:
```bash
pnpm dev
```

2. Open your browser and navigate to `http://localhost:3000`

## Database Schema

The application uses the following schema:

### Chat Model
- `id`: Unique identifier (UUID)
- `name`: Chat name
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp
- `messages`: Relationship to Message model

### Message Model
- `id`: Unique identifier (UUID)
- `content`: Message content
- `role`: Message role (system/user/assistant)
- `chatId`: Reference to parent Chat
- `createdAt`: Creation timestamp

## Common Commands

### Prisma Database Operations
```bash
# View database in Prisma Studio
pnpm prisma studio

# Reset database
pnpm prisma migrate reset

# Create new migration after schema changes
pnpm prisma migrate dev

# Apply migrations in production
pnpm prisma migrate deploy
```

## Troubleshooting

### Common Database Issues

1. If you can't connect to the database:
   - Check if PostgreSQL service is running
   - Verify database credentials in `.env`
   - Ensure PostgreSQL is listening on port 5432

2. If migrations fail:
   - Check if database exists
   - Ensure user has proper permissions
   - Try resetting migrations with `pnpm prisma migrate reset`

### Support

For more help or to report issues, please visit our GitHub repository's Issues section.