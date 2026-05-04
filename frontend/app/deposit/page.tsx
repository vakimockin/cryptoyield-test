"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import Decimal from "decimal.js";

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

// utils
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

async function copyToClipboard(value: string) {
  await navigator.clipboard.writeText(value);
}

export default function DepositPage() {
  //  STATE
  const [currency, setCurrency] = useState<Currency>("BTC");

  const [address, setAddress] = useState<DepositAddress | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingDeposits, setLoadingDeposits] = useState(false);
  const [depositsError, setDepositsError] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);

  const hasDeposits = deposits.length > 0;

  // API
  const loadDeposits = useCallback(async () => {
    setLoadingDeposits(true);
    setDepositsError(null);

    try {
      const data = await api<DepositsResponse>(
        "/api/deposits?limit=20&offset=0",
      );
      setDeposits(data.items);
      setTotal(data.total);
    } catch (err) {
      setDepositsError(
        err instanceof Error ? err.message : "Failed to load deposits",
      );
    } finally {
      setLoadingDeposits(false);
    }
  }, []);

  const getAddress = async () => {
    setLoadingAddress(true);
    setAddressError(null);
    setCopied(false);

    try {
      const data = await api<DepositAddress>("/api/deposits/address", {
        method: "POST",
        body: JSON.stringify({ currency }),
      });

      setAddress(data);
    } catch (err) {
      setAddressError(
        err instanceof Error ? err.message : "Failed to get address",
      );
    } finally {
      setLoadingAddress(false);
    }
  };

  const copyAddress = async () => {
    if (!address) return;

    try {
      await copyToClipboard(address.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setAddressError("Copy failed");
    }
  };

  //  EFFECTS

  useEffect(() => {
    loadDeposits();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadDeposits();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [loadDeposits]);

  useEffect(() => {
    const handler = () => {
      setAddress(null);
      setDeposits([]);
      setCopied(false);
      loadDeposits();
    };

    window.addEventListener("cryptoyield:user-changed", handler);
    return () =>
      window.removeEventListener("cryptoyield:user-changed", handler);
  }, [loadDeposits]);

  const refreshLabel = useMemo(
    () => (loadingDeposits ? "Refreshing..." : "Refresh"),
    [loadingDeposits],
  );

  //  UI
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Deposit</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Generate address and track deposits
          </p>
        </div>

        <button
          onClick={loadDeposits}
          disabled={loadingDeposits}
          className="h-10 rounded border px-4 text-sm disabled:opacity-60"
        >
          {refreshLabel}
        </button>
      </div>

      {/* ADDRESS BLOCK */}
      <section className="rounded border bg-white p-4 space-y-4">
        <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
          <select
            value={currency}
            onChange={(e) => {
              setCurrency(e.target.value as Currency);
              setAddress(null);
              setCopied(false);
            }}
            className="h-10 rounded border px-3 text-sm"
          >
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <button
            onClick={getAddress}
            disabled={loadingAddress}
            className="h-10 rounded bg-black text-white text-sm disabled:opacity-60"
          >
            {loadingAddress ? "Generating..." : "Get deposit address"}
          </button>
        </div>

        {address && (
          <div className="rounded border bg-neutral-50 p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">
                {address.currency} address
              </span>
              <button
                onClick={copyAddress}
                className="text-sm border px-3 py-1 rounded"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <p className="font-mono text-sm break-all">{address.address}</p>
          </div>
        )}

        {addressError && (
          <div className="text-red-600 text-sm">{addressError}</div>
        )}
      </section>

      {/* DEPOSITS */}
      <section className="rounded border bg-white overflow-hidden">
        <div className="flex justify-between px-4 py-3 border-b">
          <h2 className="font-semibold">Recent deposits</h2>
          <span className="text-sm text-neutral-500">{total}</span>
        </div>

        {depositsError && (
          <div className="p-4 text-sm text-red-600">{depositsError}</div>
        )}

        {hasDeposits ? (
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-xs text-neutral-500 uppercase">
              <tr>
                <th className="px-4 py-2 text-left">Currency</th>
                <th className="px-4 py-2 text-left">Amount</th>
                <th className="px-4 py-2 text-left">Tx</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Created</th>
              </tr>
            </thead>

            <tbody>
              {deposits.map((d) => {
                const statusStyle =
                  d.status === "confirmed"
                    ? "text-emerald-700"
                    : "text-yellow-600";

                return (
                  <tr key={d.id} className="border-t">
                    <td className="px-4 py-2">{d.currency}</td>
                    <td className="px-4 py-2 font-mono">
                      {new Decimal(d.amount).toFixed()}
                    </td>
                    <td className="px-4 py-2 font-mono" title={d.tx_hash}>
                      {truncateHash(d.tx_hash)}
                    </td>
                    <td className={`px-4 py-2 ${statusStyle}`}>{d.status}</td>
                    <td className="px-4 py-2 text-neutral-500">
                      {formatDate(d.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-6 text-center text-sm text-neutral-500">
            {loadingDeposits ? "Loading..." : "No deposits yet"}
          </div>
        )}
      </section>
    </div>
  );
}
