import { useEffect, useState } from 'react';

type Escenario = 'cierra' | 'paso';

// Nivel del agua (y del espejo, en coordenadas del SVG) por escenario.
// El agua se mueve con transform: la GPU lo resuelve sin redibujar el resto.
const NIVEL = {
  inicial: { arriba: 250, abajo: 250 },
  cierra: { arriba: 132, abajo: 247 },
  paso: { arriba: 196, abajo: 214 },
};
const TOPE_RECT = 100; // y donde arranca el rect de agua antes de trasladarlo

// Hex fijos: los atributos de presentación SVG (stop-color, fill) no resuelven
// var() de forma confiable. Son los mismos valores que los tokens de index.css.
const C = {
  agua: '#2b6cb0',
  aguaClara: '#5b9bd5',
  tierra: '#8a6b4a',
  tierraClara: '#c9b393',
  tinta: '#0f2a2e',
};

const TEXTO: Record<Escenario, { titulo: string; detalle: string }> = {
  cierra: {
    titulo: 'El terraplén cierra el cauce',
    detalle:
      'El agua se acumula aguas arriba, casi al borde del terraplén, y el riacho queda seco aguas abajo. Con las lluvias de El Niño, ese volumen busca salida.',
  },
  paso: {
    titulo: 'Con vertedero, el agua sigue su curso',
    detalle:
      'El atajadero retiene agua para el campo y deja pasar el escurrimiento. El riacho sigue corriendo aguas abajo.',
  },
};

// Corte longitudinal de un atajadero: el dibujo técnico que explica el problema.
export default function CorteAtajadero() {
  const [escenario, setEscenario] = useState<Escenario>('cierra');
  // Arranca sin agua y la sube una vez al montar: el único movimiento de la landing.
  const [montado, setMontado] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMontado(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const nivel = montado ? NIVEL[escenario] : NIVEL.inicial;
  const abierto = escenario === 'paso';
  const transicion = 'transform 1100ms var(--ease-movimiento)';

  return (
    <figure className="w-full">
      <div className="overflow-hidden rounded-2xl border border-tinta/10 bg-white">
        <svg
          viewBox="0 0 800 300"
          className="block h-auto w-full"
          role="img"
          aria-labelledby="corte-titulo corte-desc"
        >
          <title id="corte-titulo">Corte de un atajadero sobre un riacho</title>
          <desc id="corte-desc">{TEXTO[escenario].detalle}</desc>
          <defs>
            <pattern id="tierra" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="8" height="8" fill={C.tierraClara} />
              <line x1="0" y1="0" x2="0" y2="8" stroke={C.tierra} strokeWidth="1.2" opacity="0.55" />
            </pattern>
            <linearGradient id="agua" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={C.aguaClara} stopOpacity="0.85" />
              <stop offset="1" stopColor={C.agua} stopOpacity="0.95" />
            </linearGradient>
            <clipPath id="cauce">
              <path d="M0 0H800V300H0Z" />
            </clipPath>
          </defs>

          {/* Cielo y referencia de escala */}
          <rect width="800" height="300" fill="#fbfcfc" />
          {[80, 130, 180, 230].map((y) => (
            <line key={y} x1="0" x2="800" y1={y} y2={y} stroke={C.tinta} strokeOpacity="0.05" />
          ))}

          {/* Agua aguas arriba (detrás del terraplén y del suelo) */}
          <g clipPath="url(#cauce)">
            <rect
              x="0"
              y={TOPE_RECT}
              width="420"
              height="220"
              fill="url(#agua)"
              style={{ transform: `translateY(${nivel.arriba - TOPE_RECT}px)`, transition: transicion }}
            />
            {/* Agua aguas abajo */}
            <rect
              x="400"
              y={TOPE_RECT}
              width="400"
              height="220"
              fill="url(#agua)"
              style={{ transform: `translateY(${nivel.abajo - TOPE_RECT}px)`, transition: transicion }}
            />
          </g>

          {/* Lecho del riacho y suelo */}
          <path d="M0 236 C 200 240, 320 246, 400 250 S 640 256, 800 258 V300 H0Z" fill="url(#tierra)" />
          <path d="M0 236 C 200 240, 320 246, 400 250 S 640 256, 800 258" fill="none" stroke={C.tierra} strokeWidth="2" />

          {/* Terraplén */}
          <path d="M318 250 L 382 114 L 438 114 L 502 254 Z" fill="url(#tierra)" stroke={C.tierra} strokeWidth="2" strokeLinejoin="round" />

          {/* Vertedero / alcantarilla: aparece abierto en el escenario "paso" */}
          <g style={{ opacity: abierto ? 1 : 0, transition: 'opacity 400ms ease' }}>
            <rect x="388" y="214" width="44" height="34" rx="4" fill={C.agua} stroke={C.tinta} strokeOpacity="0.5" />
            {[0, 1, 2].map((i) => (
              <path
                key={i}
                d={`M${540 + i * 70} 232 l 14 -6 l -14 -6`}
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </g>

          {/* Nivel de alerta: el agua cerca del coronamiento */}
          <line x1="60" x2="380" y1="124" y2="124" stroke="#dc2626" strokeWidth="1.5" strokeDasharray="6 5" opacity={abierto ? 0.25 : 0.9} style={{ transition: 'opacity 400ms ease' }} />
          <text x="64" y="116" fontSize="13" fill="#b91c1c" opacity={abierto ? 0.35 : 1} style={{ transition: 'opacity 400ms ease' }}>
            Borde libre crítico
          </text>

          {/* Rótulos: la hidrografía va en cursiva azul (convención cartográfica) */}
          {/* El rótulo acompaña al nivel: siempre queda dentro del agua. */}
          <text
            x="64"
            y="0"
            fontSize="18"
            fontStyle="italic"
            fill="white"
            fontWeight="600"
            style={{ transform: `translateY(${Math.min(nivel.arriba + 30, 228)}px)`, transition: transicion }}
          >
            aguas arriba
          </text>
          <text x="610" y="206" fontSize="18" fontStyle="italic" fill={C.agua} fontWeight="600">
            aguas abajo
          </text>
          <text x="410" y="102" fontSize="14" textAnchor="middle" fill={C.tierra} fontWeight="700" style={{ fontStretch: '118%' }}>
            terraplén
          </text>
        </svg>
      </div>

      <figcaption className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div aria-live="polite" className="max-w-xl">
          <p className="text-base font-semibold text-tinta">{TEXTO[escenario].titulo}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{TEXTO[escenario].detalle}</p>
        </div>
        <div className="flex shrink-0 rounded-xl bg-slate-200/70 p-1" role="group" aria-label="Escenario">
          {(['cierra', 'paso'] as Escenario[]).map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEscenario(e)}
              aria-pressed={escenario === e}
              className={`presionable min-h-[44px] rounded-lg px-4 text-sm font-semibold ${
                escenario === e ? 'bg-white text-tinta shadow-sm' : 'text-slate-600 hover:text-tinta'
              }`}
            >
              {e === 'cierra' ? 'Cierra el cauce' : 'Con paso de agua'}
            </button>
          ))}
        </div>
      </figcaption>
    </figure>
  );
}
