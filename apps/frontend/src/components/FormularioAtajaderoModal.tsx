import MapaSelectorPunto, { Punto } from '@/components/MapaSelectorPunto';
import Modal from '@/components/Modal';
import { ApiError, crearAtajadero, validarAtajadero } from '@/lib/api';
import { DEPARTAMENTOS_FORMOSA, ETIQUETA_EMPLAZAMIENTO } from '@/lib/dominio';
import {
  AtajaderoCreate,
  AtajaderoDetail,
  CategoriaDato,
  TipoEmplazamiento,
} from '@/types';
import { ExclamationCircleIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { FormEvent, useState } from 'react';

const CLASE_INPUT =
  'min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20';

function MensajeError({ mensaje }: { mensaje?: string }) {
  if (!mensaje) return null;
  return (
    <p className="mt-1 flex items-start gap-1 text-sm text-red-700">
      <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      {mensaje}
    </p>
  );
}

interface FormularioAtajaderoModalProps {
  onCerrar: () => void;
  onCreado: (atajadero: AtajaderoDetail) => void;
}

// Alta autenticada (POST /api/atajaderos). El estado no se pregunta: por la
// máquina de estados toda alta entra "sin validar" y el estado técnico lo
// asigna la primera inspección presencial.
export default function FormularioAtajaderoModal({ onCerrar, onCreado }: FormularioAtajaderoModalProps) {
  const [punto, setPunto] = useState<Punto | null>(null);
  const [nombre, setNombre] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [cuenca, setCuenca] = useState('');
  const [emplazamiento, setEmplazamiento] = useState<TipoEmplazamiento>('a_determinar');
  const [categoria, setCategoria] = useState<CategoriaDato>('SIMULADO');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    const payload: AtajaderoCreate = {
      nombre_referencia: nombre.trim(),
      latitud: punto?.lat ?? NaN,
      longitud: punto?.lon ?? NaN,
      departamento,
      cuenca_riacho: cuenca.trim(),
      tipo_emplazamiento: emplazamiento,
      categoria_dato: categoria,
    };
    const nuevos = validarAtajadero(payload);
    setErrores(nuevos);
    setErrorServidor(null);
    if (Object.keys(nuevos).length) return;

    setGuardando(true);
    try {
      onCreado(await crearAtajadero(payload));
    } catch (err) {
      // 422 (validación) o 409 (código duplicado): se muestra y no se pierde nada.
      setErrorServidor(
        err instanceof ApiError
          ? `${err.status === 409 ? 'Código duplicado' : 'Datos inválidos'}: ${err.message}`
          : 'No se pudo guardar. Revisá la conexión e intentá de nuevo.',
      );
    } finally {
      setGuardando(false);
    }
  };

  const editarCoordenada = (eje: 'lat' | 'lon', valor: string) => {
    const n = Number(valor.replace(',', '.'));
    setPunto((p) => ({ lat: p?.lat ?? NaN, lon: p?.lon ?? NaN, [eje]: n }));
  };

  return (
    <Modal
      ancho="lg"
      onCerrar={onCerrar}
      titulo={<h2 className="text-lg font-semibold text-slate-900">Alta de atajadero</h2>}
      pie={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCerrar}
            className="min-h-[44px] rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="form-alta-atajadero"
            disabled={guardando}
            className="min-h-[44px] rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
          >
            {guardando ? 'Guardando…' : 'Dar de alta'}
          </button>
        </div>
      }
    >
      <form id="form-alta-atajadero" onSubmit={enviar} noValidate className="space-y-4 p-4 sm:p-5">
        <p className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
          <LockClosedIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          El código único (ATJ-FSA-NNNN) se asigna al guardar y no cambia nunca. El atajadero
          entra como <strong>sin validar</strong> hasta la primera inspección presencial.
        </p>

        <div>
          <label htmlFor="alta-nombre" className="mb-1 block text-sm font-semibold">
            Nombre de referencia
          </label>
          <input
            id="alta-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Cruce RP 24 · Riacho El Porteño"
            className={CLASE_INPUT}
          />
          <MensajeError mensaje={errores.nombre_referencia} />
        </div>

        <fieldset>
          <legend className="mb-1 text-sm font-semibold">Ubicación</legend>
          <MapaSelectorPunto punto={punto && Number.isFinite(punto.lat) && Number.isFinite(punto.lon) ? punto : null} onElegir={setPunto} />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label className="block text-xs text-slate-600">
              Latitud
              <input
                inputMode="decimal"
                value={punto && Number.isFinite(punto.lat) ? String(punto.lat) : ''}
                onChange={(e) => editarCoordenada('lat', e.target.value)}
                placeholder="-25.05"
                className={`${CLASE_INPUT} mt-1 font-mono`}
              />
            </label>
            <label className="block text-xs text-slate-600">
              Longitud
              <input
                inputMode="decimal"
                value={punto && Number.isFinite(punto.lon) ? String(punto.lon) : ''}
                onChange={(e) => editarCoordenada('lon', e.target.value)}
                placeholder="-59.55"
                className={`${CLASE_INPUT} mt-1 font-mono`}
              />
            </label>
          </div>
          <MensajeError mensaje={errores.ubicacion} />
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="alta-depto" className="mb-1 block text-sm font-semibold">
              Departamento
            </label>
            <select id="alta-depto" value={departamento} onChange={(e) => setDepartamento(e.target.value)} className={CLASE_INPUT}>
              <option value="">Elegí uno</option>
              {DEPARTAMENTOS_FORMOSA.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <MensajeError mensaje={errores.departamento} />
          </div>
          <div>
            <label htmlFor="alta-cuenca" className="mb-1 block text-sm font-semibold">
              Riacho / cuenca
            </label>
            <input
              id="alta-cuenca"
              value={cuenca}
              onChange={(e) => setCuenca(e.target.value)}
              placeholder="Riacho El Porteño"
              className={CLASE_INPUT}
            />
            <MensajeError mensaje={errores.cuenca_riacho} />
          </div>
          <div>
            <label htmlFor="alta-empl" className="mb-1 block text-sm font-semibold">
              Emplazamiento
            </label>
            <select
              id="alta-empl"
              value={emplazamiento}
              onChange={(e) => setEmplazamiento(e.target.value as TipoEmplazamiento)}
              className={CLASE_INPUT}
            >
              {(Object.keys(ETIQUETA_EMPLAZAMIENTO) as TipoEmplazamiento[]).map((t) => (
                <option key={t} value={t}>
                  {ETIQUETA_EMPLAZAMIENTO[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="alta-cat" className="mb-1 block text-sm font-semibold">
              Categoría del dato
            </label>
            <select
              id="alta-cat"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as CategoriaDato)}
              className={CLASE_INPUT}
            >
              <option value="SIMULADO">SIMULADO (demo)</option>
              <option value="OBSERVADO">OBSERVADO</option>
              <option value="REFERENCIA">REFERENCIA</option>
            </select>
          </div>
        </div>

        {errorServidor && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <p className="font-semibold">No se pudo dar de alta</p>
            <p className="mt-1">{errorServidor}</p>
          </div>
        )}
      </form>
    </Modal>
  );
}
