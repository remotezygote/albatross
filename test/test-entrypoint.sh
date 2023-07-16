#!/bin/bash

set -e

pg_ctlcluster 15 main start

echo "Setting up database"
sudo -u postgres psql -q -c "CREATE DATABASE $DATABASE_NAME;" && echo -e " ✔ Database created"
sudo -u postgres psql -q -c "ALTER ROLE postgres WITH PASSWORD '$DATABASE_NAME' LOGIN;" && echo -e " ✔ Database user set up"
echo -e " ✔ Done!"

exec $@
