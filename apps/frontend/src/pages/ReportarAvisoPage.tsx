import MapaSelectorPunto, { Punto } from '@/components/MapaSelectorPunto';
import PrototypeBanner from '@/components/PrototypeBanner';
import {
  ApiError,
  AvisoPayload,
  enviarAviso,
  MIN_CARACTERES_DESCRIPCION,
  validarAviso,
} from '@/lib/api';
import {
  encolarAviso,
  EVENTO_COLA,
  fotoADataUrl,
  leerCola,
  ResultadoSincronizacion,
  sincronizarCola,
} from '@/lib/offlineQueue';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  CameraIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  MapPinIcon,
  SignalIcon,
  SignalSlashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const DEPARTAMENTOS = [
  'Bermejo',
  'Formosa',
  'Laishí',
  'Matacos',
  'Patiño',
  'Pilagás',
  'Pilcomayo',
  'Pirané',
  'Ramón Lista',
];

type Resultado =
  | { tipo: 'enviado'; codigo: string }
  | { tipo: 'encolado' };

const CLASE_INPUT =
  'min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20';

function MensajeError({ mensaje }: { mensaje?: string }) {
  if (!mensaje) return null;
  return (
    <p className="mt-1.5 flex items-start gap-1 text-sm text-red-700">
      <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      {mensaje}
    </p>
  );
}

function textoPendientes(n: number): string {
  return n === 1
    ? '1 aviso pendiente de envío (sin conexión)'
    : `${n} avisos pendientes de envío (sin conexión)`;
}

export default function ReportarAvisoPage() {
  const [punto, setPunto] = useState<Punto | null>(null);
  const [nombre, setNombre] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [cuenca, setCuenca] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [reportadoPor, setReportadoPor] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);

  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  const [gps, setGps] = useState<'inactivo' | 'buscando' | 'error'>('inactivo');
  const [errorGps, setErrorGps] = useState<string | null>(null);

  const [enLinea, setEnLinea] = useState(navigator.onLine);
  const [pendientes, setPendientes] = useState(() => leerCola().length);
  const [sincro, setSincro] = useState<ResultadoSincronizacion | null>(null);
  const [sincronizando, setSincronizando] = useState(false);
  const inputFotoRef = useRef<HTMLInputElement>(null);

  const sincronizar = useCallback(async () => {
    if (!leerCola().length) return;
    setSincronizando(true);
    try {
      setSincro(await sincronizarCola());
    } finally {
      setSincronizando(false);
    }
  }, []);

  // Estado de red + reenvío automático al reconectarse.
  useEffect(() => {
    const alConectar = () => {
      setEnLinea(true);
      void sincronizar();
    };
    const alDesconectar = () => setEnLinea(false);
    const alCambiarCola = () => setPendientes(leerCola().length);
    window.addEventListener('online', alConectar);
    window.addEventListener('offline', alDesconectar);
    window.addEventListener(EVENTO_COLA, alCambiarCola);
    if (navigator.onLine) void sincronizar();
    return () => {
      window.removeEventListener('online', alConectar);
      window.removeEventListener('offline', alDesconectar);
      window.removeEventListener(EVENTO_COLA, alCambiarCola);
    };
  }, [sincronizar]);

  useEffect(() => {
    if (!foto) {
      setVistaPrevia(null);
      return;
    }
    const url = URL.createObjectURL(foto);
    setVistaPrevia(url);
    return () => URL.revokeObjectURL(url);
  }, [foto]);

  const usarGps = () => {
    if (!('geolocation' in navigator)) {
      setGps('error');
      setErrorGps('Este navegador no permite usar el GPS. Marcá el punto en el mapa.');
      return;
    }
    setGps('buscando');
    setErrorGps(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPunto({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setGps('inactivo');
        setErrores(({ ubicacion: _, ...resto }) => resto);
      },
      (err) => {
        setGps('error');
        setErrorGps(
          err.code === err.PERMISSION_DENIED
            ? 'No diste permiso para usar tu ubicación. Podés marcar el punto en el mapa.'
            : 'No pudimos obtener tu ubicación. Marcá el punto en el mapa.',
        );
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const elegirFoto = (archivo: File | undefined) => {
    if (!archivo) return;
    if (!archivo.type.startsWith('image/')) {
      setErrores((e) => ({ ...e, foto: 'El archivo tiene que ser una imagen.' }));
      return;
    }
    setErrores(({ foto: _, ...resto }) => resto);
    setFoto(archivo);
  };

  const reiniciar = () => {
    setPunto(null);
    setNombre('');
    setDepartamento('');
    setCuenca('');
    setDescripcion('');
    setFoto(null);
    setErrores({});
    setErrorServidor(null);
    setResultado(null);
    window.scrollTo({ top: 0 });
  };

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setErrorServidor(null);

    const payload: AvisoPayload = {
      nombre_referencia: nombre.trim(),
      latitud: punto?.lat ?? NaN,
      longitud: punto?.lon ?? NaN,
      departamento,
      cuenca_riacho: cuenca.trim() || 'A determinar',
      descripcion_aviso: descripcion.trim(),
      reportado_por: reportadoPor.trim() || undefined,
    };

    const nuevosErrores = validarAviso(payload);
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length) {
      document
        .getElementById(`campo-${Object.keys(nuevosErrores)[0]}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setEnviando(true);
    const guardarOffline = async () => {
      encolarAviso(payload, foto ? await fotoADataUrl(foto) : null);
      setResultado({ tipo: 'encolado' });
    };

    try {
      if (!navigator.onLine) {
        await guardarOffline();
      } else {
        const creado = await enviarAviso(payload, foto);
        setResultado({ tipo: 'enviado', codigo: creado.codigo_unico });
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        // Validación del backend: no se encola, se corrige. Los datos quedan cargados.
        setErrorServidor(error.message);
      } else {
        await guardarOffline();
      }
    } finally {
      setEnviando(false);
    }
  };

  const restantes = Math.max(0, MIN_CARACTERES_DESCRIPCION - descripcion.trim().length);

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-slate-50 text-slate-900">
      <PrototypeBanner />

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-2 px-4 py-3">
          <Link
            to="/"
            className="inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            Inicio
          </Link>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
              enLinea ? 'bg-green-50 text-green-800' : 'bg-amber-100 text-amber-900'
            }`}
            role="status"
          >
            {enLinea ? (
              <SignalIcon className="h-4 w-4" aria-hidden="true" />
            ) : (
              <SignalSlashIcon className="h-4 w-4" aria-hidden="true" />
            )}
            {enLinea ? 'Con conexión' : 'Sin conexión'}
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-5">
        {(pendientes > 0 || sincro) && (
          <section
            aria-live="polite"
            className="mb-5 space-y-2 rounded-lg border border-slate-200 bg-white p-3 text-sm"
          >
            {pendientes > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 font-semibold text-amber-900">
                  <SignalSlashIcon className="h-4 w-4" aria-hidden="true" />
                  {textoPendientes(pendientes)}
                </p>
                <button
                  type="button"
                  onClick={() => void sincronizar()}
                  disabled={sincronizando}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-300 px-3 font-medium text-slate-700 hover:bg-slate-50"
                >
                  <ArrowPathIcon
                    className={`h-4 w-4 ${sincronizando ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                  Sincronizar pendientes ahora
                </button>
              </div>
            )}
            {sincro && sincro.confirmados.length > 0 && (
              <p className="text-green-800">
                Enviados al reconectarse: {sincro.confirmados.join(', ')}
              </p>
            )}
            {sincro?.rechazados.map((r) => (
              <p key={r.aviso.id} className="text-red-700">
                Un aviso guardado fue rechazado ({r.motivo}). Cargalo de nuevo con
                los datos corregidos.
              </p>
            ))}
          </section>
        )}

        {resultado ? (
          <section className="rounded-xl border border-slate-200 bg-white p-6 text-center">
            <CheckCircleIcon
              className={`mx-auto h-12 w-12 ${
                resultado.tipo === 'enviado' ? 'text-teal-700' : 'text-amber-600'
              }`}
              aria-hidden="true"
            />
            {resultado.tipo === 'enviado' ? (
              <>
                <h1 className="mt-3 text-xl font-semibold">Aviso recibido</h1>
                <p className="mt-2 text-sm text-slate-600">
                  Quedó registrado con el código
                </p>
                <p className="mt-1 font-mono text-lg font-semibold">{resultado.codigo}</p>
                <p className="mt-3 text-sm text-slate-600">
                  Figura como <strong>sin validar</strong> hasta que un inspector lo
                  verifique en el lugar.
                </p>
              </>
            ) : (
              <>
                <h1 className="mt-3 text-xl font-semibold">Aviso guardado en el teléfono</h1>
                <p className="mt-2 text-sm text-slate-600">
                  No hay conexión ahora. Se va a enviar solo cuando vuelva la señal;
                  no hace falta que lo cargues de nuevo.
                </p>
              </>
            )}
            <button
              type="button"
              onClick={reiniciar}
              className="mt-5 min-h-[48px] w-full rounded-lg bg-teal-700 px-4 font-semibold text-white hover:bg-teal-800"
            >
              Enviar otro aviso
            </button>
          </section>
        ) : (
          <form onSubmit={enviar} noValidate className="space-y-5">
            <div>
              <h1 className="text-2xl font-semibold">Avisar un posible bloqueo</h1>
              <p className="mt-1 text-sm text-slate-600">
                Si ves un atajadero que corta el paso del agua en un riacho, contanos
                dónde está. Un inspector lo va a verificar en el lugar.
              </p>
            </div>

            <fieldset id="campo-ubicacion" className="space-y-2">
              <legend className="text-sm font-semibold">¿Dónde está?</legend>
              <button
                type="button"
                onClick={usarGps}
                disabled={gps === 'buscando'}
                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg border border-teal-700 bg-white px-4 font-semibold text-teal-800 hover:bg-teal-50"
              >
                <MapPinIcon className="h-5 w-5" aria-hidden="true" />
                {gps === 'buscando' ? 'Buscando tu ubicación…' : 'Usar mi ubicación'}
              </button>
              {errorGps && <p className="text-sm text-amber-900">{errorGps}</p>}
              <p className="text-xs text-slate-500">O tocá el mapa en el lugar exacto.</p>
              <MapaSelectorPunto
                punto={punto}
                onElegir={(p) => {
                  setPunto(p);
                  setErrores(({ ubicacion: _, ...resto }) => resto);
                }}
              />
              {punto && (
                <p className="font-mono text-xs text-slate-600">
                  {punto.lat.toFixed(5)}, {punto.lon.toFixed(5)}
                </p>
              )}
              <MensajeError mensaje={errores.ubicacion} />
            </fieldset>

            <div id="campo-nombre_referencia">
              <label htmlFor="nombre" className="mb-1 block text-sm font-semibold">
                ¿Cómo se conoce el lugar?
              </label>
              <input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Paraje El Colorado, cruce RP 24"
                className={CLASE_INPUT}
              />
              <MensajeError mensaje={errores.nombre_referencia} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div id="campo-departamento">
                <label htmlFor="depto" className="mb-1 block text-sm font-semibold">
                  Departamento
                </label>
                <select
                  id="depto"
                  value={departamento}
                  onChange={(e) => setDepartamento(e.target.value)}
                  className={CLASE_INPUT}
                >
                  <option value="">Elegí uno</option>
                  {DEPARTAMENTOS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <MensajeError mensaje={errores.departamento} />
              </div>
              <div>
                <label htmlFor="cuenca" className="mb-1 block text-sm font-semibold">
                  Riacho o arroyo <span className="font-normal text-slate-500">(si lo sabés)</span>
                </label>
                <input
                  id="cuenca"
                  value={cuenca}
                  onChange={(e) => setCuenca(e.target.value)}
                  placeholder="Riacho He-Hé"
                  className={CLASE_INPUT}
                />
              </div>
            </div>

            <div id="campo-descripcion_aviso">
              <label htmlFor="desc" className="mb-1 block text-sm font-semibold">
                ¿Qué ves?
              </label>
              <textarea
                id="desc"
                rows={4}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="El riacho no corre desde hace dos semanas y hay un terraplén nuevo."
                className={`${CLASE_INPUT} py-2`}
              />
              <p className="mt-1 text-xs text-slate-500">
                {restantes > 0
                  ? `Faltan ${restantes} caracteres como mínimo.`
                  : 'Listo.'}
              </p>
              <MensajeError mensaje={errores.descripcion_aviso} />
            </div>

            <div>
              <span className="mb-1 block text-sm font-semibold">
                Foto <span className="font-normal text-slate-500">(opcional)</span>
              </span>
              <input
                ref={inputFotoRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(e) => elegirFoto(e.target.files?.[0])}
              />
              {vistaPrevia ? (
                <div className="relative">
                  <img
                    src={vistaPrevia}
                    alt="Foto adjunta al aviso"
                    className="max-h-64 w-full rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFoto(null);
                      if (inputFotoRef.current) inputFotoRef.current.value = '';
                    }}
                    className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow"
                    aria-label="Quitar foto"
                  >
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => inputFotoRef.current?.click()}
                  className="flex min-h-[96px] w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  <CameraIcon className="h-7 w-7" aria-hidden="true" />
                  Sacar o elegir una foto
                </button>
              )}
              <MensajeError mensaje={errores.foto} />
            </div>

            <div>
              <label htmlFor="quien" className="mb-1 block text-sm font-semibold">
                Tu nombre o teléfono <span className="font-normal text-slate-500">(opcional)</span>
              </label>
              <input
                id="quien"
                value={reportadoPor}
                onChange={(e) => setReportadoPor(e.target.value)}
                placeholder="Por si el inspector necesita consultarte"
                className={CLASE_INPUT}
              />
            </div>

            {errorServidor && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
                <p className="font-semibold">El aviso no se pudo registrar</p>
                <p className="mt-1">{errorServidor}</p>
                <p className="mt-1">Tus datos siguen cargados: corregilos y volvé a enviar.</p>
              </div>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="min-h-[52px] w-full rounded-lg bg-teal-700 px-4 text-base font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
            >
              {enviando ? 'Enviando…' : 'Enviar aviso'}
            </button>
            <p className="text-center text-xs text-slate-500">
              Sin conexión, el aviso se guarda en el teléfono y se envía solo al
              recuperar la señal.
            </p>
          </form>
        )}
      </main>
    </div>
  );
}
