import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  createContext,
  useContext,
  useRef,
  CSSProperties,
} from "react";
import { Search, ChevronDown, X, Filter } from "lucide-react";
import { FixedSizeList as List } from "react-window";
import ErrorBoundary from "./ErrorBoundary"; 
import { DataRow } from "./filter-worker"; 

// --- TYPE DEFINITIONS ---
interface IndexedData {
  dataMap: Map<number, DataRow>;
  filterIndex: Map<string, Map<number, Set<number>>>;
  uniqueValuesPerColumn: Map<string, number[]>;
  reverseIndex: Map<string, Map<number, number>>;
}

interface FilterContextType extends IndexedData {
  filters: Record<string, Set<number>>;
  updateFilter: (column: string, values: Set<number>) => void;
  clearFilter: (column: string) => void;
  clearAllFilters: () => void;
  numericColumns: string[];
}

const FilterContext = createContext<FilterContextType | null>(null);

// --- MultiSelect Component (   UI Virtualization) ---
interface MultiSelectProps {
  column: string;
  label: string;
  availableValues: number[];
  selectedValues: Set<number>;
  onSelectionChange: (values: Set<number>) => void;
}

const MultiSelect = ({
  label,
  availableValues,
  selectedValues,
  onSelectionChange,
}: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleToggle = useCallback(
    (value: number) => {
      const newSelected = new Set(selectedValues);
      newSelected.has(value)
        ? newSelected.delete(value)
        : newSelected.add(value);
      onSelectionChange(newSelected);
    },
    [selectedValues, onSelectionChange]
  );

  const filteredValues = useMemo(() => {
    if (!searchTerm) return availableValues;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return availableValues.filter((value) =>
      value.toString().toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [availableValues, searchTerm]);

  const handleSelectAll = () => {
    onSelectionChange(
      selectedValues.size === filteredValues.length
        ? new Set()
        : new Set(filteredValues)
    );
  };

  const OptionRow = ({
    index,
    style,
  }: {
    index: number;
    style: CSSProperties;
  }) => {
    const value = filteredValues[index];
    return (
      <div style={style}>
        <label className="flex items-center w-full h-full px-3 py-2 hover:bg-gray-50 cursor-pointer">
          <input
            type="checkbox"
            checked={selectedValues.has(value)}
            onChange={() => handleToggle(value)}
            className="mr-2"
          />
          <span className="text-sm truncate">{value}</span>
        </label>
      </div>
    );
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-w-[200px] px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
        <div className="flex items-center justify-between">
          <span className="truncate">
            {label} {selectedValues.size > 0 && `(${selectedValues.size})`}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="p-2 border-b border-gray-200">
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-800">
              {selectedValues.size === filteredValues.length
                ? "Deselect All"
                : "Select All"}
            </button>
          </div>
          <List
            height={240}
            itemCount={filteredValues.length}
            itemSize={36}
            width={"100%"}>
            {OptionRow}
          </List>
        </div>
      )}
    </div>
  );
};

// --- DataTable Component ---
const DataTable = ({ data }: { data: DataRow[] }) => {
  
  const [currentPage, setCurrentPage] = useState(1);
  const [scrollTop, setScrollTop] = useState(0);
  const rowsPerPage = 100;
  const visibleRows = 20;
  const rowHeight = 40;

  const totalPages = Math.ceil(data.length / rowsPerPage);
  const currentPageData = data.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  const startIndex = Math.floor(scrollTop / rowHeight);
  const endIndex = Math.min(startIndex + visibleRows, currentPageData.length);
  const visibleData = currentPageData.slice(startIndex, endIndex);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) =>
    setScrollTop(e.currentTarget.scrollTop);
  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  const getCellAlignment = (value: unknown) =>
    typeof value === "number" ? "text-right" : "text-left";

  useEffect(() => {
    setCurrentPage(1);
    setScrollTop(0);
  }, [data]);

  return (
    <div className="relative z-10 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Data Table ({data.length.toLocaleString()} rows)
        </h3>
      </div>
      <div
        className="overflow-auto"
        style={{ maxHeight: `${visibleRows * rowHeight}px` }}
        onScroll={handleScroll}>
        <table className="min-w-full border-collapse">
          <colgroup>
            {columns.map((col) => (
              <col key={col} />
            ))}
          </colgroup>
          <thead className="table-header">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className={`sticky top-0 z-10 bg-gray-100 px-6 py-3 text-xs font-medium
                     text-gray-500 uppercase tracking-wider border border-b-2 border-blue-400 ${getCellAlignment(
                    data[0]?.[col]
                  )}`}>
                  {col.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr style={{ height: `${startIndex * rowHeight}px` }} />
            {visibleData.map((row) => (
              <tr key={row.id}>
                {columns.map((col) => (
                  <td
                    key={col}
                    className={`px-6 py-3 whitespace-nowrap text-sm text-gray-900 bg-white border
                       border-blue-400 ${getCellAlignment(
                      row[col]
                    )}`}>
                    {row[col]}
                  </td>
                ))}
              </tr>
            ))}
            <tr
              style={{
                height: `${(currentPageData.length - endIndex) * rowHeight}px`,
              }}
            />
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing page {currentPage} of {totalPages} (rows{" "}
          {((currentPage - 1) * rowsPerPage + 1).toLocaleString()}-
          {Math.min(currentPage * rowsPerPage, data.length).toLocaleString()} of{" "}
          {data.length.toLocaleString()})
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm bg-white border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50">
            Previous
          </button>
          <button
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm bg-white border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50">
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

// --- FilterPanel Component ---
const FilterPanel = () => {
  const context = useContext(FilterContext);
  if (!context) return null;
  const {
    filters,
    updateFilter,
    clearFilter,
    clearAllFilters,
    filterIndex,
    uniqueValuesPerColumn,
    numericColumns,
    reverseIndex,
  } = context;

  const getAvailableValues = useCallback(
    (targetColumn: string) => {
      const otherActiveFilters = Object.entries(filters).filter(
        ([key, selected]) => key !== targetColumn && selected.size > 0
      );
      const allPossibleValues = uniqueValuesPerColumn.get(targetColumn) || [];
      if (otherActiveFilters.length === 0) return allPossibleValues;

      let eligibleIds: Set<number> | null = null;
      for (const [column, selectedValues] of otherActiveFilters) {
        const idsForThisFilter = new Set<number>();
        const columnMap = filterIndex.get(column)!;
        for (const value of selectedValues) {
          const ids = columnMap.get(value);
          if (ids) {
            for (const id of ids) idsForThisFilter.add(id);
          }
        }
        if (eligibleIds === null) {
          eligibleIds = idsForThisFilter;
        } else {
          const newIds = new Set<number>();
          const [smallerSet, largerSet] =
            eligibleIds.size < idsForThisFilter.size
              ? [eligibleIds, idsForThisFilter]
              : [idsForThisFilter, eligibleIds];
          for (const id of smallerSet) {
            if (largerSet.has(id)) newIds.add(id);
          }
          eligibleIds = newIds;
        }
        if (eligibleIds.size === 0) break;
      }

      if (!eligibleIds || eligibleIds.size === 0) return [];

      const finalValues = new Set<number>();
      const targetReverseIndex = reverseIndex.get(targetColumn)!;
      for (const id of eligibleIds) {
        finalValues.add(targetReverseIndex.get(id)!);
      }

      const finalArray = Array.from(finalValues);
      finalArray.sort((a, b) => a - b);
      return finalArray;
    },
    [filters, filterIndex, uniqueValuesPerColumn, reverseIndex]
  );

  const hasActiveFilters = Object.values(filters).some(
    (values) => values.size > 0
  );

  return (
    <div className="relative z-20 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Filter className="w-5 h-5 mr-2" />
          Filters
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-red-600 hover:text-red-800 flex items-center">
            <X className="w-4 h-4 mr-1" />
            Clear All
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {numericColumns.map((column) => {
          const availableValues = getAvailableValues(column);
          const selectedValues = filters[column] || new Set();
          return (
            <div key={column} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 capitalize">
                  {column.replace("mod", "Mod")}
                </label>
                {selectedValues.size > 0 && (
                  <button
                    onClick={() => clearFilter(column)}
                    className="text-xs text-red-600 hover:text-red-800">
                    Clear
                  </button>
                )}
              </div>
              <MultiSelect
                column={column}
                label={column}
                availableValues={availableValues}
                selectedValues={selectedValues}
                onSelectionChange={(values) => updateFilter(column, values)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- Main BIDashboard Component ---
const BIDashboard = ({ data = [] }: { data: DataRow[] }) => {
  const [isIndexing, setIsIndexing] = useState(true);
  const [indexedData, setIndexedData] = useState<IndexedData | null>(null);
  const [filters, setFilters] = useState<Record<string, Set<number>>>({});
  const numericColumns = useRef<string[]>([]);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (data.length > 0) {
      setIsIndexing(true);
      if (workerRef.current) workerRef.current.terminate();

      // The `?worker` suffix is a Vite-specific syntax to handle web workers
      const worker = new Worker(
        new URL("./filter-worker.ts?worker", import.meta.url)
      );
      workerRef.current = worker;

      worker.onmessage = (event: MessageEvent) => {
        const { status, message, ...rest } = event.data;
        if (status === "complete") setIndexedData(rest as IndexedData);
        else console.error("Worker error:", message);
        setIsIndexing(false);
      };

      const cols = Object.keys(data[0]).filter(
        (key) => typeof data[0][key] === "number" && key !== "id"
      );
      numericColumns.current = cols;
      worker.postMessage({ data, columns: cols });

      const initialFilters: Record<string, Set<number>> = {};
      cols.forEach((column) => {
        initialFilters[column] = new Set();
      });
      setFilters(initialFilters);

      return () => {
        worker.terminate();
      };
    } else {
      setIsIndexing(false);
      setIndexedData(null);
    }
  }, [data]);

  const filteredData = useMemo(() => {
    if (!indexedData || isIndexing || !data) return [];
    const activeFilters = Object.entries(filters).filter(
      ([, selected]) => selected.size > 0
    );
    if (activeFilters.length === 0) return data;

    let eligibleIds: Set<number> | null = null;
    for (const [column, selectedValues] of activeFilters) {
      const idsForThisFilter = new Set<number>();
      const columnMap = indexedData.filterIndex.get(column)!;
      for (const value of selectedValues) {
        const ids = columnMap.get(value);
        if (ids) {
          for (const id of ids) idsForThisFilter.add(id);
        }
      }
      if (eligibleIds === null) {
        eligibleIds = idsForThisFilter;
      } else {
        const newIds = new Set<number>();
        const [smallerSet, largerSet] =
          eligibleIds.size < idsForThisFilter.size
            ? [eligibleIds, idsForThisFilter]
            : [idsForThisFilter, eligibleIds];
        for (const id of smallerSet) {
          if (largerSet.has(id)) newIds.add(id);
        }
        eligibleIds = newIds;
      }
      if (eligibleIds.size === 0) break;
    }

    if (!eligibleIds || eligibleIds.size === 0) return [];

    const result: DataRow[] = [];
    for (const id of eligibleIds) {
      result.push(indexedData.dataMap.get(id)!);
    }
    return result;
  }, [data, filters, indexedData, isIndexing]);

  const updateFilter = useCallback(
    (column: string, values: Set<number>) =>
      setFilters((p) => ({ ...p, [column]: values })),
    []
  );
  const clearFilter = useCallback(
    (column: string) => setFilters((p) => ({ ...p, [column]: new Set() })),
    []
  );
  const clearAllFilters = useCallback(
    () =>
      setFilters((p) =>
        Object.keys(p).reduce((acc, key) => ({ ...acc, [key]: new Set() }), {})
      ),
    []
  );

  if (isIndexing) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">
            Indexing {data.length.toLocaleString()} rows...
          </p>
          <p className="text-gray-500">
            This may take a moment for large datasets.
          </p>
        </div>
      </div>
    );
  }

  const filterContextValue: FilterContextType | null = indexedData
    ? {
        filters,
        updateFilter,
        clearFilter,
        clearAllFilters,
        ...indexedData,
        numericColumns: numericColumns.current,
      }
    : null;

  if (!filterContextValue) {
    return (
      <div className="p-4 text-center">
        No data available or failed to index.
      </div>
    );
  }

  return (
    <FilterContext.Provider value={filterContextValue}>
      <div className="min-h-screen p-4 bg-gray-50">
        <div className="max-w-full mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-1">
              BI Dashboard
            </h1>
            <p className="text-lg text-gray-600">
              High-Performance Interactive Filtering
            </p>
          </div>
          <ErrorBoundary fallback={<h2>Could not display filters.</h2>}>
            <FilterPanel />
          </ErrorBoundary>
          <ErrorBoundary fallback={<h2>Could not display data table.</h2>}>
            <DataTable data={filteredData} />
          </ErrorBoundary>
        </div>
      </div>
    </FilterContext.Provider>
  );
};

export default BIDashboard;
