import { useEffect, useState } from 'react';

export type Tema = 'claro' | 'oscuro';
const CLAVE = 'atajaderos_tema';

// Preferencia guardada; la primera vez, la del sistema operativo.
function temaInicial(): Tema {
  try {
    const guardado = localStorage.getItem(CLAVE);
    if (guardado === 'claro' || guardado === 'oscuro') return guardado;
  } catch {
    // storage bloqueado: se usa la preferencia del sistema
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
}

export function useTema() {
  const [tema, setTema] = useState<Tema>(temaInicial);

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE, tema);
    } catch {
      // sin persistencia: el tema dura lo que dure la pestaña
    }
    // Color de la barra del navegador en el celular.
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', tema === 'oscuro' ? '#0b1416' : '#0f766e');
    return () => {
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#0f766e');
    };
  }, [tema]);

  const alternar = () => setTema((t) => (t === 'oscuro' ? 'claro' : 'oscuro'));
  return { tema, alternar };
}
