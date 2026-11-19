import { useMemo } from 'react';

// Curvas de nivel generadas de forma determinística (siempre el mismo dibujo):
// anillos irregulares alrededor de dos "lomas", como en una carta topográfica.
function anillo(cx: number, cy: number, r: number, fase: number): string {
  const pasos = 48;
  const puntos = Array.from({ length: pasos }, (_, i) => {
    const t = (i / pasos) * Math.PI * 2;
    const deformacion =
      1 + 0.12 * Math.sin(3 * t + fase) + 0.07 * Math.sin(5 * t - fase * 1.7) + 0.04 * Math.cos(7 * t + fase);
    return [cx + Math.cos(t) * r * deformacion, cy + Math.sin(t) * r * 0.78 * deformacion];
  });
  // Curva suave cerrada: punto medio entre vértices como destino de cada cuadrática.
  const medio = (a: number[], b: number[]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const inicio = medio(puntos[pasos - 1], puntos[0]);
  let d = `M${inicio[0].toFixed(1)} ${inicio[1].toFixed(1)}`;
  puntos.forEach((p, i) => {
    const m = medio(p, puntos[(i + 1) % pasos]);
    d += ` Q${p[0].toFixed(1)} ${p[1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`;
  });
  return `${d}Z`;
}

export default function CurvasDeNivel({ className = '' }: { className?: string }) {
  const curvas = useMemo(() => {
    const lista: { d: string; maestra: boolean }[] = [];
    for (let i = 1; i <= 14; i++) lista.push({ d: anillo(170, 210, i * 34, i * 0.45), maestra: i % 5 === 0 });
    for (let i = 1; i <= 9; i++) lista.push({ d: anillo(560, 640, i * 30, 2 + i * 0.6), maestra: i % 5 === 0 });
    return lista;
  }, []);

  return (
    <svg viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      {curvas.map((c, i) => (
        <path
          key={i}
          d={c.d}
          fill="none"
          stroke="#5eead4"
          strokeOpacity={c.maestra ? 0.32 : 0.14}
          strokeWidth={c.maestra ? 1.6 : 1}
        />
      ))}
      {/* Un riacho cruzando la carta, rotulado en cursiva azul */}
      <path
        d="M-20 470 C 80 430, 150 520, 250 488 S 400 400, 470 452 S 580 540, 640 500"
        fill="none"
        stroke="#7cb4e8"
        strokeWidth="3"
        strokeLinecap="round"
        strokeOpacity="0.75"
      />
      <text x="300" y="440" fill="#9cc7ee" fontSize="15" fontStyle="italic" fontWeight="600" transform="rotate(-6 300 440)">
        riacho
      </text>
    </svg>
  );
}
