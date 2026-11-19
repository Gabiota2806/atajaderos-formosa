-- Habilitar PostGIS en la base principal y crear base dedicada para Testing
CREATE EXTENSION IF NOT EXISTS postgis;

SELECT 'CREATE DATABASE atajaderos_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'atajaderos_test')\gexec

GRANT ALL PRIVILEGES ON DATABASE atajaderos_test TO atajaderos;

\c atajaderos_test
CREATE EXTENSION IF NOT EXISTS postgis;
