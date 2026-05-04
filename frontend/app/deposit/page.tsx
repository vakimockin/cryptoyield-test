"use client";

// TODO(candidate):
//   - currency selector (BTC / ETH / USDT)
//   - "Get deposit address" button → call POST /api/deposits/address, show address with Copy button
//   - deposits table (currency, amount, tx_hash truncated, status, created_at)
//   - keep the table fresh (polling vs manual refresh — your choice, justify in README)

export default function DepositPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Deposit</h1>
      <p className="text-neutral-600">
        Implement the deposit flow here. See the assignment PDF for the spec.
      </p>
    </div>
  );
}
