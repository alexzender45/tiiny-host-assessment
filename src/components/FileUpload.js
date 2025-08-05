import React, { useRef } from 'react';
import './FileUpload.css';

const FileUpload = ({ onFileUpload }) => {
  const fileInputRef = useRef(null);

  const parseCSV = (text) => {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(header => header.trim());
    
    const data = lines.slice(1).map((line, index) => {
      const values = line.split(',').map(value => value.trim());
      const row = {};
      headers.forEach((header, i) => {
        row[header] = values[i] || '';
      });
      return row;
    }).filter(row => Object.values(row).some(value => value !== ''));

    return { data, columns: headers };
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const { data, columns } = parseCSV(text);
      onFileUpload(data, columns);
    };
    reader.readAsText(file);
  };

  const handleSampleFile = async () => {
    try {
      const response = await fetch('https://dev-test-csv.tiiny.co/SampleCSVFile_556kb.csv');
      const text = await response.text();
      const { data, columns } = parseCSV(text);
      onFileUpload(data, columns);
    } catch (error) {
      console.error('Error loading sample file:', error);
      alert('Failed to load sample file. Please try uploading your own CSV file.');
    }
  };

  return (
    <div className="file-upload">
      <div className="upload-container">
        <h2>Upload CSV File</h2>
        <p>Select a CSV file to render in the performance data grid</p>
        
        <div className="upload-options">
          <div className="upload-option">
            <h3>Upload Your File</h3>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <button 
              className="upload-btn"
              onClick={() => fileInputRef.current.click()}
            >
              Choose CSV File
            </button>
          </div>
          
          <div className="upload-option">
            <h3>Try Sample Data</h3>
            <p>Load the provided sample CSV file</p>
            <button 
              className="sample-btn"
              onClick={handleSampleFile}
            >
              Load Sample File
            </button>
          </div>
        </div>
        
        <div className="upload-info">
          <h4>Features:</h4>
          <ul>
            <li>✓ Fixed header with sortable columns</li>
            <li>✓ Resizable columns with constraints</li>
            <li>✓ Custom cell rendering for different data types</li>
            <li>✓ Optimized for 10,000+ rows</li>
            <li>✓ Smooth scrolling performance</li>
            <li>✓ Responsive design</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FileUpload; 