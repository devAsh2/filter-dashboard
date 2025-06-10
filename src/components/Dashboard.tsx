import { useState, useEffect } from "react";
import BIDashboard from "./BIDashboard";
import { loadCSVData, getDatasetInfo } from "../utils/dataLoader";
import { DataRow } from "./filter-worker"; 

// --- TYPE DEFINITIONS ---
interface DataInfo {
  rowCount: number;
  columnCount: number;
}

const Dashboard = () => {
  const [data, setData] = useState<DataRow[]>([]);
  const [dataset, setDataset] = useState<string>("small-dataset.csv");
  const [loading, setLoading] = useState<boolean>(false);
  const [dataInfo, setDataInfo] = useState<DataInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      setDataInfo(null);
      setData([]); // Clear old data immediately

      try {
        // Assuming loadCSVData will return an array of DataRow or similar structure
        const csvData = await loadCSVData(dataset);

        if (csvData.length === 0) {
          throw new Error(`No data found in ${dataset}`);
        }

        // The loaded data should conform to the DataRow type
        setData(csvData as DataRow[]);
        setDataInfo(getDatasetInfo(csvData));
      } catch (err: any) {
        console.error("Error loading data:", err);
        setError(`Failed to load ${dataset}: ${err.message}`);
        setData([]);
        setDataInfo(null);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [dataset]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header with dataset controls */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Filter Optimization Dashboard
              </h1>
              <p className="text-gray-600">
                Test dashboard performance with different dataset sizes
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label
                  htmlFor="dataset-select"
                  className="text-sm font-medium text-gray-700">
                  Dataset:
                </label>
                <select
                  id="dataset-select"
                  value={dataset}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setDataset(e.target.value)
                  }
                  disabled={loading}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="small-dataset.csv">Small CSV Dataset</option>
                  <option value="large-dataset.csv">Large CSV Dataset</option>
                </select>
              </div>

              {dataInfo && (
                <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md border border-gray-200">
                  <span className="font-medium">
                    {dataInfo.rowCount.toLocaleString()}
                  </span>{" "}
                  rows ×
                  <span className="font-medium"> {dataInfo.columnCount}</span>{" "}
                  columns
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="text-sm text-red-800">
                <strong>Error:</strong> {error}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="p-4 sm:p-6 lg:p-8">
        {/* The loading state is now handled inside BIDashboard, but we can keep one here for the initial CSV load */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading dataset...</p>
            </div>
          </div>
        ) : (
          // Pass the loaded data to BIDashboard.
          <BIDashboard data={data} />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
