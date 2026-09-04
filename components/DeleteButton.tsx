"use client";

import { useRouter } from "next/navigation";

// Bouton de suppression générique pour les entrées (sommeil, nutrition…).
export function DeleteButton({ url, label = "Supprimer" }: { url: string; label?: string }) {
  const router = useRouter();
  async function remove() {
    const res = await fetch(url, { method: "DELETE" });
    if (res.ok) router.refresh();
  }
  return (
    <button onClick={remove} className="text-xs font-medium" style={{ color: "#d70015" }}>
      {label}
    </button>
  );
}
