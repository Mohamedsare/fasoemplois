import { ImageResponse } from "next/og";

export const alt = "Faso Emplois — Trouvez l'opportunité qui fera avancer votre carrière";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Image de partage par défaut (réseaux sociaux, WhatsApp…)
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#faf6ef",
          color: "#1c1f23",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundImage: "linear-gradient(#ef2b2d 50%, #009e49 50%)",
            }}
          >
            <svg width="44" height="44" viewBox="0 0 64 64">
              <path fill="#fcd116" d="M32 6l6.9 19.8h20.8L42.8 38.1l6.4 19.9L32 45.7 14.8 58l6.4-19.9L4.3 25.8h20.8z" />
            </svg>
          </div>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 700 }}>
            Faso<span style={{ color: "#009e49" }}>Emplois</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.1, maxWidth: 950 }}>
            Trouvez l&apos;opportunité qui fera avancer votre carrière.
          </div>
          <div style={{ fontSize: 30, color: "#5b6470" }}>Offres d&apos;emploi au Burkina Faso · CV en ligne · Candidature simple</div>
        </div>
      </div>
    ),
    size,
  );
}
