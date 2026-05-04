"use client";

import { useEffect, useState } from "react";

const SEED_USERS = [
  { id: "11111111-1111-1111-1111-111111111111", label: "Alice" },
  { id: "22222222-2222-2222-2222-222222222222", label: "Bob" },
];

const STORAGE_KEY = "cryptoyield_user_id";

export function UserSwitcher() {
  const [userId, setUserId] = useState<string>(SEED_USERS[0].id);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) setUserId(stored);
  }, []);

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    setUserId(v);
    window.localStorage.setItem(STORAGE_KEY, v);
    window.dispatchEvent(new Event("cryptoyield:user-changed"));
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-neutral-500">Acting as:</span>
      <select
        value={userId}
        onChange={onChange}
        className="border rounded px-2 py-1 bg-white"
      >
        {SEED_USERS.map((u) => (
          <option key={u.id} value={u.id}>
            {u.label}
          </option>
        ))}
      </select>
    </label>
  );
}
