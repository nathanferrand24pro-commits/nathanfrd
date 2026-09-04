"use client";

import { useRouter } from "next/navigation";

// Bouton de suppression générique pour les entrées (sommeil, nutrition…).
// Demande toujours confirmation avant l'appel API ; cible tactile >= 44px.
export function DeleteButton({
  url,
  label = "Supprimer",
  message = "Supprimer ?",
}: {
  url: string;
  label?: string;
  message?: string;
}) {
  const router = useRouter();

  async function remove() {
    if (!confirm(message)) return;
    const res = await fetch(url, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  return (
    <button
      onClick={remove}
      className="text-xs font-medium py-2.5 px-3 min-h-[44px]"
      style={{ color: "var(--fit-danger)" }}
    >
      {label}
    </button>
  );
}
