'use client';
import { useState, useEffect, useMemo } from 'react';
import { X, TrendingDown, Check, Loader2 } from 'lucide-react';
import { Modal } from '../UI/Modal';
import { useCart } from '@/lib/cart-context';
import { applyCatalogComparison, catalogCartItems, isOnlineProduct } from '@/lib/cart-products';
import { cartKey, type EquivalentResult, storeTitle } from '@/lib/cart-optimization';
import { calculateNetScenarios, parseEstimatedCost, type NetComparison, type NetScenario } from '@/lib/net-savings';

const money = (value: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
const savingsLabel = (value: number) => value > 0 ? `Ahorrás ${money(value)} netos` : value < 0 ? `Cuesta ${money(-value)} más` : 'Mismo costo que tu lista';

export function OptimizationModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { items, clearCart, addItem } = useCart();
  const comparableItems = catalogCartItems(items);
  const onlineItems = items.filter(isOnlineProduct);
  const onlineTotal = onlineItems.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0) / 100;
  const [retry, setRetry] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<{ items: typeof items; results: EquivalentResult[]; metadata?: { sourceDate?: string; stale?: boolean } } | null>(null);
  const [maxVisits, setMaxVisits] = useState<1 | 2 | 3>(2);
  const [visitInput, setVisitInput] = useState('0');
  const [deliveryInput, setDeliveryInput] = useState('0');
  const [selection, setSelection] = useState<{ comparison: NetComparison; id: string } | null>(null);
  const [showAll, setShowAll] = useState(false);
  const visitCost = parseEstimatedCost(visitInput);
  const deliveryCost = onlineItems.length ? parseEstimatedCost(deliveryInput) : 0;
  const results = response?.items === items ? response.results : null;
  const comparison = useMemo(() => results && visitCost !== null && deliveryCost !== null
    ? calculateNetScenarios(results, { maxVisits, visitCost, onlineTotal, deliveryCost }) : null,
  [results, maxVisits, visitCost, onlineTotal, deliveryCost]);
  const selected = comparison && (selection?.comparison === comparison
    ? comparison.scenarios.find(s => s.id === selection.id) : comparison.scenarios[0]);
  const busy = comparableItems.length > 0 && (isLoading || (!results && !error));

  useEffect(() => {
    if (!isOpen || !catalogCartItems(items).length) return;
    const controller = new AbortController();
    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetched = await fetch('/api/products/optimize', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: catalogCartItems(items).map(({ id, quantity }) => ({ id, quantity })) }),
          signal: controller.signal,
        });
        const data = await fetched.json();
        if (!fetched.ok) throw new Error(data.error || 'No se pudieron comparar los precios.');
        if (!controller.signal.aborted) setResponse({ items, results: data.results, metadata: data.metadata });
      } catch (caught) {
        if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : 'No se pudieron comparar los precios.');
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };
    void run();
    return () => controller.abort();
  }, [isOpen, items, retry]);

  function applyScenario() {
    if (!selected || busy || error) return;
    const updated = applyCatalogComparison(items, selected.mapping);
    clearCart();
    updated.forEach(item => addItem(item, item.quantity));
    onClose();
  }
  if (!isOpen) return null;

  function scenarioButton(scenario: NetScenario, index: number) {
    return <button key={scenario.id} type="button" aria-pressed={selected?.id === scenario.id}
      onClick={() => setSelection({ comparison: comparison!, id: scenario.id })}
      className={`w-full rounded-xl border-2 p-4 text-left transition-colors ${selected?.id === scenario.id ? 'border-brand-ink bg-brand-soft' : 'border-line hover:border-brand-ink'}`}>
      <span className="flex items-start justify-between gap-3">
        <span className="font-bold text-ink">{scenario.name}</span>
        {selected?.id === scenario.id && <Check size={20} className="shrink-0 text-brand-ink" aria-hidden="true" />}
      </span>
      <span className="mt-1 block break-words text-xs leading-relaxed text-muted">{scenario.description}</span>
      <span className="mt-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-xl font-bold tabular-nums text-brand-ink">{money(scenario.total)}</span>
        <span className="text-xs font-semibold text-ink">{index === 0 ? 'Menor total estimado' : 'Total estimado'}</span>
      </span>
      <span className="mt-1 block text-xs text-muted">Productos {money(scenario.productTotal)} + gastos estimados {money(scenario.travelCost + scenario.deliveryCost)}</span>
      <span className={`mt-2 block text-sm font-semibold ${scenario.savings > 0 ? 'text-brand-ink' : 'text-ink'}`}>{savingsLabel(scenario.savings)}</span>
    </button>;
  }

  return <Modal open={isOpen} onClose={onClose} titleId="comparison-title">
    <div className="dialog-header">
      <div><h2 id="comparison-title" className="flex items-center gap-2 text-xl font-bold"><TrendingDown className="shrink-0 text-brand-ink" aria-hidden="true" />Comparar mi lista</h2>
        <p className="mt-1 text-sm text-muted">Los mismos productos y cantidades, con tus gastos de compra.</p></div>
      <button aria-label="Cerrar comparación" onClick={onClose} className="icon-button shrink-0"><X size={24} aria-hidden="true" /></button>
    </div>
    <div className="dialog-body space-y-6">
      {!comparableItems.length ? <p role="status">{items.length ? 'Tu lista sólo tiene productos online. Se conservan sin comparar con sucursales SEPA.' : 'Agregá productos a tu lista para comparar.'}</p> : <>
        <fieldset>
          <legend className="mb-3 font-semibold">¿Cómo vas a comprar?</legend>
          <div className={`grid grid-cols-1 gap-4 ${onlineItems.length ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
            <label className="text-sm font-medium">Máximo de sucursales
              <select className="field mt-2" value={maxVisits} onChange={event => setMaxVisits(Number(event.target.value) as 1 | 2 | 3)}>
                <option value="1">1 sucursal</option><option value="2">Hasta 2 sucursales</option><option value="3">Hasta 3 sucursales</option>
              </select>
            </label>
            <label className="text-sm font-medium">Traslado por sucursal ($)
              <input className="field mt-2 tabular-nums" inputMode="decimal" value={visitInput} maxLength={12}
                aria-invalid={visitCost === null} aria-describedby="travel-help expense-error" onChange={event => setVisitInput(event.target.value)} />
            </label>
            {onlineItems.length > 0 && <label className="text-sm font-medium">Envíos online en total ($)
              <input className="field mt-2 tabular-nums" inputMode="decimal" value={deliveryInput} maxLength={12}
                aria-invalid={deliveryCost === null} aria-describedby="online-help expense-error" onChange={event => setDeliveryInput(event.target.value)} />
            </label>}
          </div>
          <p id="travel-help" className="mt-2 text-xs leading-relaxed text-muted">Estimá ida y vuelta por cada sucursal. Se aplica el mismo gasto a cada visita; no calculamos rutas. Si todos los gastos están en $0, el total sólo incluye productos.</p>
          {(visitCost === null || deliveryCost === null) && <p id="expense-error" role="alert" className="mt-2 text-sm text-red-700">Ingresá un gasto entre $0 y $1.000.000, sin separador de miles y con hasta dos decimales. Usá 0 si no tenés ese gasto.</p>}
        </fieldset>
        {onlineItems.length > 0 && <p id="online-help" className="text-sm leading-relaxed text-muted">Átomo online se conserva: {money(onlineTotal)} en productos, más el envío que estimes. Ambos importes se incluyen sin cambios en todas las opciones; el envío no cuenta como visita.</p>}
        {error ? <div role="alert"><p className="text-red-700">{error}</p><button className="button-secondary mt-3" onClick={() => setRetry(value => value + 1)}>Reintentar comparación</button></div> : busy ?
          <div role="status" className="flex items-center justify-center gap-3 py-8 text-muted"><Loader2 className="animate-spin text-brand-ink" aria-hidden="true" />Comparando los mismos productos…</div> : comparison && <>
            <div className="border-y border-line py-4">
              <div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold">Tu lista actual</h3><strong className="tabular-nums">{money(comparison.current.total)}</strong></div>
              <p className="mt-1 text-sm text-muted">{comparison.current.visits} {comparison.current.visits === 1 ? 'sucursal' : 'sucursales'} · Productos {money(comparison.current.productTotal)} + gastos estimados {money(comparison.current.travelCost + comparison.current.deliveryCost)}.</p>
              {comparison.current.visits > maxVisits && <p className="mt-2 text-sm text-amber-800">Tu lista actual supera el límite de visitas elegido.</p>}
            </div>
            <section aria-labelledby="options-title">
              <h3 id="options-title" className="font-semibold">Opciones para completar tu lista</h3>
              <p className="mt-1 text-xs text-muted">Todas las opciones de una sucursal y la combinación de menor total para cada cantidad de visitas permitida.</p>
              <p className="sr-only" role="status">{comparison.scenarios.length ? `Comparación actualizada. ${savingsLabel(comparison.scenarios[0].savings)} con ${comparison.scenarios[0].visits} ${comparison.scenarios[0].visits === 1 ? 'sucursal' : 'sucursales'}.` : 'No hay una combinación completa con este límite de visitas.'}</p>
              {comparison.scenarios.length ? <>
                <div className="mt-3 space-y-3">{comparison.scenarios.slice(0, showAll ? undefined : 3).map(scenarioButton)}</div>
                {comparison.scenarios.length > 3 && <button className="button-secondary mt-3 w-full" onClick={() => setShowAll(value => !value)}>{showAll ? 'Mostrar menos opciones' : `Ver ${comparison.scenarios.length - 3} opciones más`}</button>}
              </> : <div className="mt-3 rounded-xl bg-soft p-4"><p className="font-semibold">No se puede completar la lista en {maxVisits} {maxVisits === 1 ? 'sucursal' : 'sucursales'}.</p><p className="mt-2 text-sm text-muted">No hay precios publicados para todos tus productos en esa cantidad de sucursales. {maxVisits < 3 ? 'Probá aumentando el máximo de visitas.' : 'Revisá los productos de tu lista. Esta versión compara hasta tres sucursales.'} Tu lista se conserva.</p></div>}
            </section>
            {selected && <section aria-labelledby="detail-title">
              <h3 id="detail-title" className="font-semibold">Detalle de la opción elegida</h3>
              <dl className="mt-3 space-y-2 text-sm tabular-nums">
                <div className="flex justify-between gap-3"><dt>Productos SEPA</dt><dd>{money(selected.catalogTotal)}</dd></div>
                {onlineItems.length > 0 && <div className="flex justify-between gap-3"><dt>Productos online conservados</dt><dd>{money(selected.onlineTotal)}</dd></div>}
                <div className="flex justify-between gap-3"><dt>Traslados estimados ({selected.visits} × {money(visitCost!)})</dt><dd>{money(selected.travelCost)}</dd></div>
                {onlineItems.length > 0 && <div className="flex justify-between gap-3"><dt>Envíos estimados</dt><dd>{money(selected.deliveryCost)}</dd></div>}
                <div className="flex justify-between gap-3 border-t border-line pt-2 font-bold"><dt>Total estimado</dt><dd>{money(selected.total)}</dd></div>
              </dl>
              <ul className="mt-4 divide-y divide-line">{results!.map(row => {
                const next = selected.mapping[cartKey(row.original)];
                return <li key={cartKey(row.original)} className="py-3 text-sm">
                  <p className="font-medium break-words">{row.original.name}</p>
                  <p className="mt-1 text-xs text-muted">{storeTitle(next)}</p>
                  {next.store !== row.original.store && <p className="mt-1 text-xs text-muted">Antes: {storeTitle(row.original)}</p>}
                  <p className="mt-2 tabular-nums">{row.original.quantity} × {money(next.price)} = <strong>{money(Math.round(next.price * 100) * row.original.quantity / 100)}</strong></p>
                </li>;
              })}</ul>
            </section>}
            <p className={`text-xs leading-relaxed ${response?.metadata?.stale ? 'text-amber-800' : 'text-muted'}`}>Precios SEPA: {response?.metadata?.sourceDate ? response.metadata.sourceDate.split('-').reverse().join('/') : 'fecha no disponible'}. {response?.metadata?.stale ? 'La fuente está desactualizada; verificá los precios antes de comprar. ' : ''}El ahorro es estimado frente a tu lista actual, usando los mismos gastos por visita. Los precios publicados no confirman stock.</p>
          </>}
      </>}
    </div>
    <div className="dialog-footer flex flex-wrap items-center justify-between gap-3">
      {selected && !busy && !error && <p className={`text-sm font-semibold ${selected.savings > 0 ? 'text-brand-ink' : 'text-ink'}`}>{savingsLabel(selected.savings)}</p>}
      <div className="flex w-full flex-wrap gap-3 sm:w-auto sm:ml-auto">
        <button onClick={onClose} className="button-secondary flex-1 sm:flex-none">Cancelar</button>
        <button onClick={applyScenario} disabled={!selected || busy || !!error || !comparableItems.length} className="button-primary flex-1 sm:flex-none">Usar esta combinación</button>
      </div>
    </div>
  </Modal>;
}
