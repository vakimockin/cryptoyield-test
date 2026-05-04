"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { api } from "@/lib/api";

type Currency = "BTC" | "ETH" | "USDT";

type DepositAddress = {
  address: string;
  currency: Currency;
  created_at: string;
};

type Deposit = {
  id: string;
  currency: Currency;
  amount: string;
  tx_hash: string;
  status: string;
  created_at: string;
  confirmed_at: string | null;
};

type DepositsResponse = {
  items: Deposit[];
  total: number;
};

const CURRENCIES: Currency[] = ["BTC", "ETH", "USDT"];

function truncateHash(value: string): string {
  if (value.length <= 18) return value;
  return `${value.slice(0, 10)}...${value.slice(-6)}`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

async function copyToClipboard(value: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
    return;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();

    try {
      const copied = document.execCommand("copy");
      if (!copied) {
        throw new Error("Copy command was rejected");
      }
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

export default function DepositPage() {
  const [currency, setCurrency] = useState<Currency>("BTC");
  const [depositAddresses, setDepositAddresses] = useState<
    Partial<Record<Currency, DepositAddress>>
  >({});
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [loadingDeposits, setLoadingDeposits] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasDeposits = deposits.length > 0;
  const depositAddress = depositAddresses[currency] ?? null;
  const refreshLabel = useMemo(
    () => (loadingDeposits ? "Refreshing..." : "Refresh"),
    [loadingDeposits],
  );

  const loadDeposits = useCallback(async () => {
    setLoadingDeposits(true);
    setError(null);
    try {
      const data = await api<DepositsResponse>("/api/deposits?limit=20&offset=0");
      setDeposits(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load deposits");
    } finally {
      setLoadingDeposits(false);
    }
  }, []);

  useEffect(() => {
    void loadDeposits();

    function onUserChanged() {
      setDepositAddresses({});
      setCopied(false);
      void loadDeposits();
    }

    window.addEventListener("cryptoyield:user-changed", onUserChanged);
    return () => window.removeEventListener("cryptoyield:user-changed", onUserChanged);
  }, [loadDeposits]);

  async function getAddress() {
    setLoadingAddress(true);
    setCopied(false);
    setError(null);
    try {
      const data = await api<DepositAddress>("/api/deposits/address", {
        method: "POST",
        body: JSON.stringify({ currency }),
      });
      setDepositAddresses((current) => ({
        ...current,
        [data.currency]: data,
      }));
      await loadDeposits();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get deposit address");
    } finally {
      setLoadingAddress(false);
    }
  }

  async function copyAddress() {
    if (!depositAddress) return;
    setError(null);
    try {
      await copyToClipboard(depositAddress.address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Copy failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Deposit</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Generate a user-specific address and track confirmed deposits.
          </p>
        </div>
        <button
          type="button"
          onClick={loadDeposits}
          disabled={loadingDeposits}
          className="h-10 rounded border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {refreshLabel}
        </button>
      </div>

      <section className="rounded border border-neutral-200 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-[180px_1fr] sm:items-end">
          <label className="space-y-1 text-sm">
            <span className="font-medium text-neutral-700">Currency</span>
            <select
              value={currency}
              onChange={(event) => {
                setCurrency(event.target.value as Currency);
                setCopied(false);
              }}
              className="h-10 w-full rounded border border-neutral-300 bg-white px-3 text-sm"
            >
              {CURRENCIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={getAddress}
            disabled={loadingAddress}
            className="h-10 rounded bg-neutral-900 px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingAddress ? "Generating..." : "Get deposit address"}
          </button>
        </div>

        {depositAddress ? (
          <div className="mt-4 rounded border border-neutral-200 bg-neutral-50 p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-neutral-700">
                {depositAddress.currency} address
              </span>
              <button
                type="button"
                onClick={copyAddress}
                className="h-8 rounded border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-800"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="break-all font-mono text-sm text-neutral-900">
              {depositAddress.address}
            </p>
          </div>
        ) : null}
      </section>

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded border border-neutral-200 bg-white">
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <h2 className="text-base font-semibold">Recent deposits</h2>
          <span className="text-sm text-neutral-500">{total} total</span>
        </div>

        {hasDeposits ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Currency</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Tx hash</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {deposits.map((deposit) => (
                  <tr key={deposit.id}>
                    <td className="px-4 py-3 font-medium">{deposit.currency}</td>
                    <td className="px-4 py-3 font-mono">{deposit.amount}</td>
                    <td className="px-4 py-3 font-mono" title={deposit.tx_hash}>
                      {truncateHash(deposit.tx_hash)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                        {deposit.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {formatDate(deposit.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-sm text-neutral-500">
            {loadingDeposits ? "Loading deposits..." : "No deposits yet"}
          </div>
        )}
      </section>
    </div>
  );
}
