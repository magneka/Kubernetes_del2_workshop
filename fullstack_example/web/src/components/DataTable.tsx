import { useMemo, useState, type Key, type ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  /** Value used for sorting and filtering; defaults to row[key]. */
  value?: (row: T) => string | number | null | undefined;
  align?: 'left' | 'right';
  sortable?: boolean;
}

interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => Key;
  actions?: (row: T) => ReactNode;
  filterPlaceholder?: string;
  toolbar?: ReactNode;
  itemLabel?: string;
  emptyText?: string;
  pageSizes?: number[];
  initialSort?: { key: string; dir: 1 | -1 };
}

function cellValue<T>(col: Column<T>, row: T): string | number | null | undefined {
  if (col.value) return col.value(row);
  const v = (row as unknown as Record<string, unknown>)[col.key];
  return typeof v === 'number' || typeof v === 'string' ? v : v == null ? v : String(v);
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  actions,
  filterPlaceholder = 'Filtrer…',
  toolbar,
  itemLabel = 'rader',
  emptyText = 'Ingen treff',
  pageSizes = [5, 10],
  initialSort,
}: DataTableProps<T>) {
  const [filter, setFilter] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(initialSort?.key ?? null);
  const [sortDir, setSortDir] = useState<1 | -1>(initialSort?.dir ?? 1);
  const [pageSize, setPageSize] = useState(pageSizes[0] ?? 10);
  const [page, setPage] = useState(1);

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    let out = q
      ? rows.filter((r) => columns.some((c) => String(cellValue(c, r) ?? '').toLowerCase().includes(q)))
      : rows.slice();
    const col = columns.find((c) => c.key === sortKey);
    if (col) {
      out = out.sort((a, b) => {
        let x = cellValue(col, a) ?? '';
        let y = cellValue(col, b) ?? '';
        if (typeof x === 'string' && typeof y === 'string') {
          return x.localeCompare(y, 'nb', { sensitivity: 'base', numeric: true }) * sortDir;
        }
        if (typeof x !== typeof y) {
          x = String(x);
          y = String(y);
        }
        return x < y ? -sortDir : x > y ? sortDir : 0;
      });
    }
    return out;
  }, [rows, columns, filter, sortKey, sortDir]);

  const pages = Math.max(1, Math.ceil(visible.length / pageSize));
  const current = Math.min(page, pages);
  const slice = visible.slice((current - 1) * pageSize, current * pageSize);
  const colSpan = columns.length + (actions ? 1 : 0);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(key);
      setSortDir(1);
    }
  };

  return (
    <>
      <div className="table-toolbar">
        <div className="header-search" style={{ display: 'flex' }}>
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          <input
            type="search"
            placeholder={filterPlaceholder}
            aria-label="Filtrer tabell"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="grow" />
        {toolbar}
        {pageSizes.length > 1 && (
        <select
          className="form-select"
          aria-label="Rader per side"
          style={{ width: 'auto', padding: '10px 40px 10px 14px', fontSize: 'var(--fs-2)' }}
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
        >
          {pageSizes.map((n) => (
            <option key={n} value={n}>
              {n} per side
            </option>
          ))}
        </select>
        )}
      </div>

      <div className="table-wrap">
        <table className="tbl striped hoverable">
          <thead>
            <tr>
              {columns.map((c) => {
                const sortable = c.sortable !== false;
                const icon =
                  sortKey === c.key ? (sortDir === 1 ? 'fa-solid fa-sort-up' : 'fa-solid fa-sort-down') : 'fa-solid fa-sort';
                return (
                  <th
                    key={c.key}
                    style={{ textAlign: c.align ?? 'left', cursor: sortable ? 'pointer' : 'default' }}
                    onClick={sortable ? () => toggleSort(c.key) : undefined}
                    aria-sort={sortKey === c.key ? (sortDir === 1 ? 'ascending' : 'descending') : undefined}
                  >
                    {c.header}
                    {sortable && <i className={icon} aria-hidden="true" />}
                  </th>
                );
              })}
              {actions && (
                <th style={{ textAlign: 'right', cursor: 'default' }}>
                  <span style={{ color: 'var(--muted)' }}>Handlinger</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td colSpan={colSpan} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                  {emptyText}
                </td>
              </tr>
            ) : (
              slice.map((row) => (
                <tr key={rowKey(row)}>
                  {columns.map((c) => (
                    <td key={c.key} style={{ textAlign: c.align ?? 'left' }}>
                      {c.render ? c.render(row) : (cellValue(c, row) ?? '')}
                    </td>
                  ))}
                  {actions && (
                    <td>
                      <div className="util-row" style={{ justifyContent: 'flex-end', flexWrap: 'nowrap', gap: 'var(--sp-2)' }}>
                        {actions(row)}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="pagination">
          <span style={{ marginRight: 'auto', color: 'var(--muted)', fontSize: 'var(--fs-1)' }}>
            {visible.length} {itemLabel}
          </span>
          <button type="button" disabled={current === 1} onClick={() => setPage(current - 1)} aria-label="Forrige side">
            <i className="fa-solid fa-chevron-left" />
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <button
              type="button"
              key={n}
              className={n === current ? 'active' : undefined}
              aria-current={n === current ? 'page' : undefined}
              onClick={() => setPage(n)}
            >
              {n}
            </button>
          ))}
          <button type="button" disabled={current === pages} onClick={() => setPage(current + 1)} aria-label="Neste side">
            <i className="fa-solid fa-chevron-right" />
          </button>
        </div>
      </div>
    </>
  );
}
