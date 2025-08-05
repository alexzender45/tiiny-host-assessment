# Performance Data Grid Component

A high-performance React data grid component designed to efficiently render large CSV files with smooth scrolling and responsive design.

## Features

### Core Requirements ✅
- **Fixed/Sticky Header**: Header row remains visible while scrolling
- **Sortable Columns**: Click column headers to sort (ascending/descending)
- **Resizable Columns**: Drag column edges to resize (100px-300px constraints)
- **Custom Cell Rendering**: 
  - Numbers: Right-aligned with green color and number formatting
  - Dates: Formatted as localized date strings
  - Text: Standard text rendering with ellipsis for overflow
- **Performance Optimizations**:
  - Virtual scrolling for 10,000+ rows
  - Memoized sorting calculations
  - Efficient scroll event handling
  - Responsive window resize handling

### Stretch Goals (Future Enhancements)
- [ ] Inline cell editing
- [ ] Column reordering
- [ ] Basic filtering functionality
- [ ] Keyboard navigation

## Technical Implementation

### Performance Optimizations

1. **Virtual Scrolling**: Only renders visible rows + buffer
   - Calculates visible range based on scroll position
   - Uses CSS transform for smooth positioning
   - Maintains scroll position accurately

2. **Memoized Sorting**: 
   - Uses `useMemo` to avoid recalculation on every render
   - Handles both numeric and string sorting
   - Preserves original data integrity

3. **Efficient Event Handling**:
   - Throttled scroll events
   - Optimized resize handlers
   - Cleanup of event listeners

4. **CSS Performance**:
   - `will-change` properties for GPU acceleration
   - Hardware-accelerated transforms
   - Minimal DOM manipulation

### Data Type Detection

The grid automatically detects and renders different data types:
- **Numbers**: Parsed with `parseFloat()`, right-aligned, green color
- **Dates**: Detected by date format, localized display
- **Text**: Default rendering with overflow handling

### Responsive Design

- Adapts to window resize events
- Mobile-friendly column sizing
- Flexible layout system

## Getting Started

### Installation

```bash
npm install
npm start
```

### Usage

1. **Upload CSV File**: Click "Choose CSV File" to upload your own data
2. **Load Sample Data**: Click "Load Sample File" to test with provided dataset
3. **Interact with Grid**:
   - Click column headers to sort
   - Drag column edges to resize
   - Scroll to navigate through data

### Sample Data

The application includes access to a sample CSV file:
`https://dev-test-csv.tiiny.co/SampleCSVFile_556kb.csv`

## Project Structure

```
src/
├── components/
│   ├── DataGrid.js      # Main grid component with virtual scrolling
│   ├── DataGrid.css     # Grid styles and performance optimizations
│   ├── FileUpload.js    # CSV file upload and parsing
│   └── FileUpload.css   # Upload component styles
├── App.js               # Main application component
├── App.css              # Application styles
├── index.js             # React entry point
└── index.css            # Global styles
```

## Performance Benchmarks

- **Rendering**: Handles 10,000+ rows smoothly
- **Scrolling**: 60fps smooth scrolling
- **Memory**: Efficient memory usage with virtual scrolling
- **Responsive**: Adapts to window resize without performance degradation

## Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## Development Notes

### Key Performance Considerations

1. **Virtual Scrolling Implementation**:
   ```javascript
   const visibleStart = Math.floor(scrollTop / ROW_HEIGHT);
   const visibleEnd = Math.min(
     visibleStart + Math.ceil(containerHeight / ROW_HEIGHT) + 5,
     sortedData.length
   );
   ```

2. **Memoized Sorting**:
   ```javascript
   const sortedData = useMemo(() => {
     // Sorting logic with type detection
   }, [data, sortConfig]);
   ```

3. **Efficient Cell Rendering**:
   ```javascript
   const renderCell = (value, columnKey) => {
     // Type detection and custom rendering
   };
   ```

### Future Enhancements

- Add keyboard navigation (arrow keys, enter, tab)
- Implement inline editing with validation
- Add column filtering with search
- Support for column reordering via drag & drop
- Export functionality (CSV, Excel)
- Row selection and bulk operations

## License

This project is created for the Tiiny Host assessment.