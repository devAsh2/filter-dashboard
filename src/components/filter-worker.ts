// Define the structure of our data and the worker messages for type safety
export interface DataRow {
  id: number;
  number: number;
  [key: string]: number; // Allows for dynamic keys like mod3, mod4 etc.
}

interface WorkerInput {
  data: DataRow[];
  columns: string[];
}

// Listen for messages from the main thread
self.onmessage = (event: MessageEvent<WorkerInput>) => {
  const { data, columns } = event.data;

  if (!data || data.length === 0) {
    self.postMessage({
      status: "error",
      message: "No data received by worker.",
    });
    return;
  }

  // Create a fast lookup map for IDs to row objects
  const dataMap = new Map<number, DataRow>(data.map((row) => [row.id, row]));

  // Create the main filter index: Map<Column, Map<Value, Set<ID>>>
  const filterIndex = new Map<string, Map<number, Set<number>>>();
  columns.forEach((col) => filterIndex.set(col, new Map()));

  // Create a map to hold all unique values for each column
  const uniqueValuesPerColumn = new Map<string, Set<number>>();
  columns.forEach((col) => uniqueValuesPerColumn.set(col, new Set()));

  // Create a reverse index: Map<Column, Map<ID, Value>>
  const reverseIndex = new Map<string, Map<number, number>>();
  columns.forEach((col) => reverseIndex.set(col, new Map()));

  // Populate the indexes by iterating through the data once
  for (const row of data) {
    for (const col of columns) {
      const value = row[col];
      uniqueValuesPerColumn.get(col)!.add(value);

      const colIndex = filterIndex.get(col)!;
      if (!colIndex.has(value)) {
        colIndex.set(value, new Set());
      }
      colIndex.get(value)!.add(row.id);

      // Populate the reverse index
      reverseIndex.get(col)!.set(row.id, value);
    }
  }

  // Sort the unique values for consistent display in dropdowns
  const sortedUniqueValues = new Map<string, number[]>();
  uniqueValuesPerColumn.forEach((valueSet, col) => {
    sortedUniqueValues.set(
      col,
      Array.from(valueSet).sort((a, b) => a - b)
    );
  });

  // Send the computed indexes back to the main thread
  self.postMessage({
    status: "complete",
    dataMap,
    filterIndex,
    uniqueValuesPerColumn: sortedUniqueValues,
    reverseIndex,
  });
};
