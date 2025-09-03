# Meqenet API Python Examples

This directory contains Python examples for integrating with the Meqenet API.

## Prerequisites

```bash
# Install required packages
pip install requests python-dotenv

# For async support
pip install aiohttp

# For type hints (optional)
pip install typing-extensions
```

## Quick Start

```python
from meqenet_client import MeqenetAPI

# Initialize client
client = MeqenetAPI(
    base_url="https://api.meqenet.et/v1",
    language="en"  # or "am" for Amharic
)

# Authenticate
client.login("user@example.com", "password")

# Make API calls
profile = client.get_current_user()
```

## Examples

1. **authentication.py** - User registration, login, and token management
2. **payments.py** - Payment processing and transaction management
3. **bnpl.py** - BNPL loan application and management
4. **merchants.py** - Merchant onboarding and API key management
5. **meqenet_client.py** - Complete API client implementation

## Running Examples

```bash
# Run specific example
python authentication.py

# With environment variables
API_BASE_URL=http://localhost:3000/api/v1 python authentication.py
```

## Environment Variables

Create a `.env` file:

```env
API_BASE_URL=https://api.meqenet.et/v1
API_LANGUAGE=en
TEST_EMAIL=test@example.com
TEST_PASSWORD=SecurePassword123!
```

## Error Handling

All examples include proper error handling for:

- Network errors
- Authentication failures
- Validation errors (bilingual)
- Rate limiting
- NBE compliance errors

## Type Hints

The examples include type hints for better IDE support and code clarity:

```python
from typing import Optional, Dict, Any

def make_payment(
    amount: float,
    payment_method: str,
    merchant_id: str
) -> Dict[str, Any]:
    ...
```

## Async Support

For high-performance applications, async examples are provided:

```python
import asyncio
from meqenet_async import MeqenetAsyncAPI

async def main():
    async with MeqenetAsyncAPI() as client:
        await client.login("user@example.com", "password")
        profile = await client.get_current_user()

asyncio.run(main())
```

## Testing

```bash
# Run tests
pytest test_meqenet_client.py

# With coverage
pytest --cov=meqenet_client test_meqenet_client.py
```

## Support

For more information, see the main API documentation or contact the development team.
