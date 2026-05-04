"""Mock blockchain address generator.

Patterns mimic real-world formats but addresses are NOT cryptographically valid:
    BTC:  bc1q + 32 hex chars
    ETH:  0x   + 40 hex chars
    USDT: T    + 33 alphanumeric chars  (TRC-20)

In production this would derive an address from a master xpub via BIP32.
"""
import secrets
import string

SUPPORTED_CURRENCIES = {"BTC", "ETH", "USDT"}


def generate_address(currency: str) -> str:
    if currency == "BTC":
        return "bc1q" + secrets.token_hex(16)
    if currency == "ETH":
        return "0x" + secrets.token_hex(20)
    if currency == "USDT":
        alphabet = string.ascii_letters + string.digits
        return "T" + "".join(secrets.choice(alphabet) for _ in range(33))
    raise ValueError(f"Unsupported currency: {currency}")
