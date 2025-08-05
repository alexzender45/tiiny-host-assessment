import React, { useState } from 'react';
import DataGrid from './components/DataGrid';
import FileUpload from './components/FileUpload';
import './App.css';

function App() {
  const [data, setData] = useState(null);
  const [columns, setColumns] = useState([]);

  const handleFileUpload = (parsedData, parsedColumns) => {
    setData(parsedData);
    setColumns(parsedColumns);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Performance Data Grid</h1>
        <p>Upload a CSV file to render a high-performance data grid</p>
      </header>
      
      <main className="app-main">
        {!data ? (
          <FileUpload onFileUpload={handleFileUpload} />
        ) : (
          <DataGrid 
            data={data} 
            columns={columns}
            onReset={() => {
              setData(null);
              setColumns([]);
            }}
          />
        )}
      </main>
    </div>
  );
}

export default App; 