import Papa from "papaparse";
import { DataRow } from "../components/filter-worker"; // Import the shared data structure

// Type for the information derived from a dataset
export interface DatasetInfo {
  rowCount: number;
  columnCount: number;
  columns: string[];
}

/**
 * Loads and parses a CSV file from the public/data directory.
 * @param {string} filename 
 * @returns {Promise<DataRow[]>} 
 */
export const loadCSVData = async (filename: string): Promise<DataRow[]> => {
  try {
    const response = await fetch(`/data/${filename}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const csvText = await response.text();

    // The <DataRow> generic tells PapaParse what structure we expect for each row.
    const result = Papa.parse<DataRow>(csvText, {
      header: true, // Assumes the first row is the header
      skipEmptyLines: true, // Skips empty lines in the CSV
      dynamicTyping: true, // Automatically converts numbers and booleans
    });

    if (result.errors.length > 0) {
      console.warn("CSV parsing warnings:", result.errors);
      // You could choose to throw an error here if parsing errors are critical
    }

    // Ensure that every row has an 'id' property. If the CSV doesn't have one,
    // we can add it here based on the row index.
    const sanitizedData = result.data.map((row, index) => ({
      ...row,
      id: row.id ?? index + 1, // Use existing id or create one
    }));

    return sanitizedData;
  } catch (error) {
    console.error(`Error loading or parsing ${filename}:`, error);
    // Return an empty array on failure so the UI can handle it gracefully
    return [];
  }
};

/**
 * Calculates basic information about the dataset.
 * @param {DataRow[]} data 
 * @returns {DatasetInfo} 
 */
export const getDatasetInfo = (data: DataRow[]): DatasetInfo => {
  const rowCount = data.length;
  const columns = rowCount > 0 ? Object.keys(data[0]) : [];
  const columnCount = columns.length;

  return {
    rowCount,
    columnCount,
    columns,
  };
};



