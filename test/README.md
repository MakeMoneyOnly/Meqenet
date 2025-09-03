# E2E Test Environment Documentation

This directory contains configurations and scripts for the End-to-End (E2E) testing environment.

## Database Encryption

To enhance security and comply with FinTech standards, the E2E test database uses `pgcrypto` for
at-rest encryption of sensitive data, such as the `faydaIdHash` in the `User` table.

### How it Works

1.  **`pgcrypto` Extension**: The PostgreSQL container is initialized with the `pgcrypto` extension
    enabled. This is done via the `test/db/init/01-enable-pgcrypto.sql` script.

2.  **Symmetric Key Encryption**: The seed script (`scripts/seed.ts`) uses symmetric key encryption
    (AES-256) to encrypt sensitive data before storing it in the database.

3.  **Encryption Key Management**: The encryption key is managed via an environment variable
    `E2E_DB_ENCRYPTION_KEY`. This key must be at least 32 characters long.

### Setup

1.  **Create a `.env` file**: Create a `.env` file in the root of the project.

2.  **Set the encryption key**: Add the following line to your `.env` file, replacing the
    placeholder with a secure, 32+ character key:

    ```
    E2E_DB_ENCRYPTION_KEY=your-super-secret-and-long-encryption-key
    ```

This key will be used by the seed script to encrypt the data and will be available to the services
if they need to decrypt it.
