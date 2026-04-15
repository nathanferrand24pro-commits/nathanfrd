"use client";

import { useState, useEffect } from "react";

const CATEGORY_LABELS: Record<string, string> = {
  licenciement: "Licenciement",
  "contrat-de-travail": "Contrat de travail",
  discrimination: "Discrimination",
  "duree-du-travail": "Durée du travail",
  "securite-sociale": "Sécu. sociale",
  "negociation-collective": "Négociation collective",
  "sante-travail": "Santé au travail",
  remuneration: "Rémunération",
  "procedure-prudhomale": "Prud'hommes",
  "representation-personnel": "Représentation",
};

interface Subscription {
  id: string;
  email: string;
  keywords: string[];
  active: boolean;
  createdAt: string;
}

export default function AlertesPage() {
  const [email, setEmail] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [customKeywords, setCustomKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{text: string; type: "success" | "error"} | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  useEffect(() => {
    fetch("/api/alerts")
      .then((r) => r.json())
      .then((data: Subscription[]) => setSubscriptions(data));
  }, []);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const custom = customKeywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const keywords = [...selectedCategories, ...custom];

    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, keywords }),
      });

      if (res.ok) {
        const data = await res.json() as Subscription;
        setMessage({ text: "Abonnement enregistré avec succès !", type: "success" });
        setEmail("");
        setSelectedCategories([]);
        setCustomKeywords("");
        setSubscriptions((prev) => {
          const idx = prev.findIndex((s) => s.email === data.email);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = data;
            return updated;
          }
          return [data, ...prev];
        });
      } else {
        const err = await res.json() as { error: string };
        setMessage({ text: err.error ?? "Erreur lors de l'abonnement", type: "error" });
      }
    } catch {
      setMessage({ text: "Erreur réseau", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async (email: string) => {
    await fetch(`/api/alerts?email=${encodeURIComponent(email)}`, {
      method: "DELETE",
    });
    setSubscriptions((prev) =>
      prev.map((s) => (s.email === email ? { ...s, active: false } : s))
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Alertes email
      </h1>
      <p className="text-gray-500 text-sm mb-8">
        Recevez chaque matin un email récapitulatif des nouvelles décisions
        correspondant à vos mots-clés.
      </p>

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          S&apos;abonner aux alertes
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votremail@exemple.fr"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thèmes à surveiller
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleCategory(value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                    selectedCategories.includes(value)
                      ? "bg-blue-800 text-white border-blue-800"
                      : "bg-white text-gray-600 border-gray-200 hover:border-blue-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mots-clés personnalisés{" "}
              <span className="text-gray-400 font-normal">(séparés par des virgules)</span>
            </label>
            <input
              type="text"
              value={customKeywords}
              onChange={(e) => setCustomKeywords(e.target.value)}
              placeholder="harcèlement, inaptitude, forfait jours..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
            />
          </div>

          {message && (
            <div
              className={`px-4 py-3 rounded-lg text-sm ${
                message.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-800 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? "Enregistrement..." : "S'abonner"}
          </button>
        </form>
      </div>

      {/* Current subscriptions */}
      {subscriptions.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Abonnements existants
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {sub.email}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {sub.keywords.length === 0 ? (
                        <span className="text-xs text-gray-400">
                          Toutes les décisions
                        </span>
                      ) : (
                        sub.keywords.map((kw) => (
                          <span
                            key={kw}
                            className="inline-block px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600"
                          >
                            {CATEGORY_LABELS[kw] ?? kw}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        sub.active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {sub.active ? "Actif" : "Désactivé"}
                    </span>
                    {sub.active && (
                      <button
                        onClick={() => handleUnsubscribe(sub.email)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Désabonner
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
