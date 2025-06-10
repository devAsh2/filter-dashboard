import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import '@testing-library/jest-dom';
import BIDashboard from "./BIDashboard";
import ErrorBoundary from "./ErrorBoundary";
import { DataRow } from "./filter-worker";

// Mock the Web Worker to control it during tests
class MockWorker {
  onmessage: (event: { data: any }) => void = () => {};

  constructor(url: string | URL) {
    // The constructor is called with the URL, we can ignore it for the mock
  }

  postMessage(data: { data: DataRow[]; columns: string[] }) {
    // Simulate worker processing and sending data back
    const { columns, data: rowData } = data;
    const mockIndexedData = {
      status: "complete",
      dataMap: new Map(rowData.map((row: DataRow) => [row.id, row])),
      filterIndex: new Map(
        columns.map((c: string) => [c, new Map([[1, new Set([1])]])])
      ), 
      // Add some mock data to filter
      uniqueValuesPerColumn: new Map(
        columns.map((c: string) => [c, [1, 2, 3]])
      ),
      reverseIndex: new Map(columns.map((c: string) => [c, new Map([[1, 1]])])),
    };
    // Simulate async behavior
    setTimeout(() => this.onmessage({ data: mockIndexedData }), 10);
  }
  terminate() {}
}

// Override the global Worker object for the duration of the tests
(global as any).Worker = MockWorker;

// --- TEST  ---
describe("BIDashboard", () => {
  const mockData: DataRow[] = [
    { id: 1, number: 1, mod3: 1 },
    { id: 2, number: 2, mod3: 2 },
    { id: 3, number: 3, mod3: 0 },
  ];

  test("shows loading state while indexing", () => {
    render(<BIDashboard data={mockData} />);
    expect(screen.getByText(/Indexing 3 rows.../i)).toBeInTheDocument();
  });

  test("renders dashboard after indexing is complete", async () => {
    render(<BIDashboard data={mockData} />);

    // Wait for the worker to finish and the component to re-render
    await waitFor(() => {
      expect(screen.queryByText(/Indexing 3 rows.../i)).not.toBeInTheDocument();
    });

    expect(screen.getByText("BI Dashboard")).toBeInTheDocument();
    expect(screen.getByText(/Data Table \(3 rows\)/i)).toBeInTheDocument();
    expect(screen.getAllByText("number")[0]).toBeInTheDocument();
  });

  test("filters data when an option is selected", async () => {
    render(<BIDashboard data={mockData} />);

    await waitFor(() => {
      expect(screen.getByText(/Data Table \(3 rows\)/i)).toBeInTheDocument();
    });

    // Open the 'number' filter dropdown
    const numberFilterButton = screen.getAllByText("number")[0];
    fireEvent.click(numberFilterButton);

    // Click the checkbox for the value '1'
    const checkbox = await screen.findByRole("checkbox", { name: "1" });
    fireEvent.click(checkbox);

    // Check that the table has updated to show only 1 row
    await waitFor(() => {
      expect(screen.getByText(/Data Table \(1 rows\)/i)).toBeInTheDocument();
    });
  });

  test("displays error boundary fallback UI on component error", () => {
    // Mock a component that throws an error
    const CrashingComponent = () => {
      throw new Error("Test Crash");
    };
    jest.spyOn(console, "error").mockImplementation(() => {}); // Suppress console error

    render(
      <ErrorBoundary fallback={<h2>Crashed!</h2>}>
        <CrashingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText("Crashed!")).toBeInTheDocument();
    (console.error as jest.Mock).mockRestore();
  });
});
