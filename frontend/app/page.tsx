export default function Home() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">CryptoYield Test Task</h1>
      <p className="text-neutral-600">
        Open{" "}
        <a href="/deposit" className="text-blue-600 underline">
          /deposit
        </a>{" "}
        to start.
      </p>
      <p className="text-sm text-neutral-500">
        Switch the active user via the dropdown in the top-right.
      </p>
    </div>
  );
}
