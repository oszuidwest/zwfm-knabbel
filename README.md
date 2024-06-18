# ZuidWest FM Knabbel
Knabbel uses AI models from OpenAI to automatically rephrase articles into spoken language suitable for radio news bulletins.

## How to run this:
- Set-up a Coolify server
- Create a new project from the public git repository
- Setup a MariaDB or MySQL-database
- Fill in the env variables
  
```
APP_DEBUG=true
APP_ENV=production
APP_KEY=
APP_URL=https://knabbel.zuidwestfm.nl
AZURE_CLIENT_ID=
AZURE_CLIENT_SECRET=
AZURE_REDIRECT_URI=$COOLIFY_FQDN/auth/callback
AZURE_TENANT_ID=
DB_CONNECTION=mysql
DB_DATABASE=
DB_HOST=
DB_PASSWORD=
DB_PORT=3306
DB_USERNAME=
OPENAI_API_KEY=
OPENAI_MODEL=
```

- Run `php artisan migrate --force` to create the DB
- Create a GitHub webhook with a secret for automatisch deployment (it's a x-www-form-urlencoded hook)