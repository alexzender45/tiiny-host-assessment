import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import './DataGrid.css';

const DataGrid = ({ data, columns, onReset }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [columnWidths, setColumnWidths] = useState({});
  const [resizing, setResizing] = useState(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [editingCell, setEditingCell] = useState(null); // { rowIndex, columnKey }
  const [editValue, setEditValue] = useState('');
  const [gridData, setGridData] = useState(data);
  const [columnOrder, setColumnOrder] = useState(columns);
  const [filters, setFilters] = useState({});
  const [selectedCell, setSelectedCell] = useState(null); // { rowIndex, columnKey }
  const [draggingColumn, setDraggingColumn] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerPosition, setDatePickerPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const headerRef = useRef(null);
  const filterRowRef = useRef(null);
  const inputRef = useRef(null);
  const datePickerRef = useRef(null);

  // Update grid data when props change
  useEffect(() => {
    setGridData(data);
  }, [data]);

  // Update column order when props change
  useEffect(() => {
    setColumnOrder(columns);
  }, [columns]);

  // Performance: Memoize filtered and sorted data
  const filteredAndSortedData = useMemo(() => {
    let filteredData = gridData;

    // Apply filters
    Object.keys(filters).forEach(columnKey => {
      const filterValue = filters[columnKey].toLowerCase();
      if (filterValue) {
        filteredData = filteredData.filter(row => {
          const cellValue = String(row[columnKey] || '').toLowerCase();
          return cellValue.includes(filterValue);
        });
      }
    });

    // Apply sorting
    if (!sortConfig.key) return filteredData;
    
    return filteredData.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      // Handle different data types for sorting
      const aNum = parseFloat(aVal);
      const bNum = parseFloat(bVal);
      
      if (!isNaN(aNum) && !isNaN(bNum)) {
        // Numeric sorting
        return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
      } else {
        // String sorting
        const comparison = aVal.localeCompare(bVal);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }
    });
  }, [gridData, filters, sortConfig]);

  // Performance: Calculate row height and visible range
  const ROW_HEIGHT = 40;
  const HEADER_HEIGHT = 50;
  const totalHeight = filteredAndSortedData.length * ROW_HEIGHT;
  
  const visibleStart = Math.floor(scrollTop / ROW_HEIGHT);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / ROW_HEIGHT) + 5,
    filteredAndSortedData.length
  );
  
  const visibleData = filteredAndSortedData.slice(visibleStart, visibleEnd);
  const offsetY = visibleStart * ROW_HEIGHT;

  // Performance: Handle scroll with throttling
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  // Handle horizontal scroll synchronization
  const handleHorizontalScroll = useCallback((e) => {
    const scrollLeft = e.target.scrollLeft;
    
    // Sync header scroll
    if (headerRef.current) {
      headerRef.current.scrollLeft = scrollLeft;
    }
    
    // Sync filter row scroll
    if (filterRowRef.current) {
      filterRowRef.current.scrollLeft = scrollLeft;
    }
  }, []);

  // Performance: Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle column sorting
  const handleSort = (columnKey) => {
    setSortConfig(prev => ({
      key: columnKey,
      direction: prev.key === columnKey && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handle column resizing
  const handleResizeStart = (e, columnKey) => {
    e.preventDefault();
    setResizing({ columnKey, startX: e.clientX, startWidth: columnWidths[columnKey] || 150 });
  };

  const handleResizeMove = useCallback((e) => {
    if (!resizing) return;
    
    const deltaX = e.clientX - resizing.startX;
    const newWidth = Math.max(100, Math.min(300, resizing.startWidth + deltaX));
    
    setColumnWidths(prev => ({
      ...prev,
      [resizing.columnKey]: newWidth
    }));
  }, [resizing]);

  const handleResizeEnd = useCallback(() => {
    setResizing(null);
  }, []);

  useEffect(() => {
    if (resizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [resizing, handleResizeMove, handleResizeEnd]);

  // Column reordering functions
  const handleColumnDragStart = (e, columnKey) => {
    e.preventDefault();
    setDraggingColumn(columnKey);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleColumnDragOver = (e, columnKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleColumnDrop = (e, targetColumnKey) => {
    e.preventDefault();
    if (!draggingColumn || draggingColumn === targetColumnKey) return;

    setColumnOrder(prev => {
      const newOrder = [...prev];
      const dragIndex = newOrder.indexOf(draggingColumn);
      const dropIndex = newOrder.indexOf(targetColumnKey);
      
      newOrder.splice(dragIndex, 1);
      newOrder.splice(dropIndex, 0, draggingColumn);
      
      return newOrder;
    });
    
    setDraggingColumn(null);
  };

  // Filter functions
  const handleFilterChange = (columnKey, value) => {
    setFilters(prev => ({
      ...prev,
      [columnKey]: value
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  // Keyboard navigation functions
  const moveSelection = (direction) => {
    if (!selectedCell) {
      // Start with first visible cell
      setSelectedCell({ rowIndex: 0, columnKey: columnOrder[0] });
      return;
    }

    const { rowIndex, columnKey } = selectedCell;
    const currentColIndex = columnOrder.indexOf(columnKey);
    
    let newRowIndex = rowIndex;
    let newColIndex = currentColIndex;

    switch (direction) {
      case 'up':
        newRowIndex = Math.max(0, rowIndex - 1);
        break;
      case 'down':
        newRowIndex = Math.min(visibleData.length - 1, rowIndex + 1);
        break;
      case 'left':
        newColIndex = Math.max(0, currentColIndex - 1);
        break;
      case 'right':
        newColIndex = Math.min(columnOrder.length - 1, currentColIndex + 1);
        break;
    }

    setSelectedCell({
      rowIndex: newRowIndex,
      columnKey: columnOrder[newColIndex]
    });
  };

  const handleKeyDown = (e) => {
    if (editingCell) {
      // Handle editing mode
      if (e.key === 'Enter') {
        e.preventDefault();
        saveEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
      }
      return;
    }

    // Handle navigation mode
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        moveSelection('up');
        break;
      case 'ArrowDown':
        e.preventDefault();
        moveSelection('down');
        break;
      case 'ArrowLeft':
        e.preventDefault();
        moveSelection('left');
        break;
      case 'ArrowRight':
        e.preventDefault();
        moveSelection('right');
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedCell) {
          const { rowIndex, columnKey } = selectedCell;
          const actualRowIndex = visibleStart + rowIndex;
          const value = filteredAndSortedData[actualRowIndex][columnKey];
          startEditing(rowIndex, columnKey, value);
        }
        break;
      case 'Tab':
        e.preventDefault();
        moveSelection(e.shiftKey ? 'left' : 'right');
        break;
    }
  };

  // Add keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, editingCell, visibleData, columnOrder, visibleStart, filteredAndSortedData]);

  // Date picker functions
  const isDateValue = (value) => {
    const dateValue = new Date(value);
    return !isNaN(dateValue.getTime()) && value.includes('-');
  };

  const formatDateForInput = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  const handleDateChange = (e) => {
    setEditValue(e.target.value);
  };

  const handleDatePickerToggle = (e) => {
    e.preventDefault();
    if (showDatePicker) {
      setShowDatePicker(false);
    } else {
      const rect = e.target.getBoundingClientRect();
      setDatePickerPosition({
        x: rect.left,
        y: rect.bottom + 5
      });
      setShowDatePicker(true);
    }
  };

  const handleDateSelect = (dateString) => {
    setEditValue(dateString);
    setShowDatePicker(false);
  };

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showDatePicker && datePickerRef.current && !datePickerRef.current.contains(e.target)) {
        setShowDatePicker(false);
      }
    };

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDatePicker]);

  // Inline editing functions
  const startEditing = (rowIndex, columnKey, value) => {
    setEditingCell({ rowIndex, columnKey });
    setEditValue(value);
    setShowDatePicker(false);
    // Focus input on next render
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 0);
  };

  const saveEdit = () => {
    if (!editingCell) return;

    const { rowIndex, columnKey } = editingCell;
    const actualRowIndex = visibleStart + rowIndex;
    
    setGridData(prev => {
      const newData = [...prev];
      newData[actualRowIndex] = {
        ...newData[actualRowIndex],
        [columnKey]: editValue
      };
      return newData;
    });

    setEditingCell(null);
    setEditValue('');
    setShowDatePicker(false);
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
    setShowDatePicker(false);
  };

  // Handle clicks outside to save
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (editingCell && inputRef.current && !inputRef.current.contains(e.target) && !datePickerRef.current?.contains(e.target)) {
        saveEdit();
      }
    };

    if (editingCell) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [editingCell]);

  // Custom cell renderer for different data types
  const renderCell = (value, columnKey, rowIndex) => {
    const isEditing = editingCell && 
                     editingCell.rowIndex === rowIndex && 
                     editingCell.columnKey === columnKey;
    
    const isSelected = selectedCell && 
                      selectedCell.rowIndex === rowIndex && 
                      selectedCell.columnKey === columnKey;

    if (isEditing) {
      // Check if it's a date cell
      if (isDateValue(value)) {
        return (
          <div className="date-edit-container">
            <input
              ref={inputRef}
              type="date"
              value={formatDateForInput(editValue)}
              onChange={handleDateChange}
              onKeyDown={handleKeyDown}
              onBlur={saveEdit}
              className="cell-input date-input"
              autoFocus
            />
            <button
              className="date-picker-toggle"
              onClick={handleDatePickerToggle}
              title="Open date picker"
            >
              📅
            </button>
            {showDatePicker && (
              <div
                ref={datePickerRef}
                className="date-picker-popup"
                style={{
                  left: `${datePickerPosition.x}px`,
                  top: `${datePickerPosition.y}px`
                }}
              >
                <div className="date-picker-header">
                  <button onClick={() => setShowDatePicker(false)}>×</button>
                </div>
                <div className="date-picker-content">
                  <input
                    type="date"
                    value={formatDateForInput(editValue)}
                    onChange={handleDateChange}
                    className="date-picker-input"
                  />
                  <div className="date-picker-actions">
                    <button onClick={() => handleDateSelect(editValue)}>OK</button>
                    <button onClick={() => setShowDatePicker(false)}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }

      // Regular text/number input
      return (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={saveEdit}
          className="cell-input"
          autoFocus
        />
      );
    }

    // Check if it's a date
    const dateValue = new Date(value);
    if (!isNaN(dateValue.getTime()) && value.includes('-')) {
      return (
        <span 
          className={`cell-date cell-editable ${isSelected ? 'cell-selected' : ''}`}
          onClick={() => startEditing(rowIndex, columnKey, value)}
          title="Click to edit (date picker available)"
        >
          {dateValue.toLocaleDateString()}
        </span>
      );
    }
    
    // Check if it's a number
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && value.trim() !== '') {
      return (
        <span 
          className={`cell-number cell-editable ${isSelected ? 'cell-selected' : ''}`}
          onClick={() => startEditing(rowIndex, columnKey, value)}
          title="Click to edit"
        >
          {numValue.toLocaleString()}
        </span>
      );
    }
    
    // Default text rendering
    return (
      <span 
        className={`cell-text cell-editable ${isSelected ? 'cell-selected' : ''}`}
        title={`${value} (Click to edit)`}
        onClick={() => startEditing(rowIndex, columnKey, value)}
      >
        {value}
      </span>
    );
  };

  return (
    <div className="data-grid-container">
      <div className="grid-header">
        <h2>Data Grid ({filteredAndSortedData.length.toLocaleString()} rows)</h2>
        <div className="header-controls">
          <span className="edit-hint">💡 Click any cell to edit | Use arrow keys to navigate | 📅 for dates</span>
          <button className="clear-filters-btn" onClick={clearFilters}>
            Clear Filters
          </button>
          <button className="reset-btn" onClick={onReset}>
            Upload New File
          </button>
        </div>
      </div>
      
      <div className="grid-wrapper">
        {/* Filter Row */}
        <div className="filter-row" ref={filterRowRef} onScroll={handleHorizontalScroll}>
          {columnOrder.map((column) => {
            const width = columnWidths[column] || 150;
            return (
              <div
                key={column}
                className="filter-cell"
                style={{ width: `${width}px` }}
              >
                <input
                  type="text"
                  placeholder={`Filter ${column}...`}
                  value={filters[column] || ''}
                  onChange={(e) => handleFilterChange(column, e.target.value)}
                  className="filter-input"
                />
              </div>
            );
          })}
        </div>

        {/* Fixed Header */}
        <div className="grid-header-row" ref={headerRef} onScroll={handleHorizontalScroll}>
          {columnOrder.map((column, index) => {
            const width = columnWidths[column] || 150;
            return (
              <div
                key={column}
                className={`header-cell ${draggingColumn === column ? 'dragging' : ''}`}
                style={{ width: `${width}px` }}
                draggable
                onDragStart={(e) => handleColumnDragStart(e, column)}
                onDragOver={(e) => handleColumnDragOver(e, column)}
                onDrop={(e) => handleColumnDrop(e, column)}
              >
                <div className="header-content">
                  <button
                    className={`sort-btn ${sortConfig.key === column ? `sort-${sortConfig.direction}` : ''}`}
                    onClick={() => handleSort(column)}
                  >
                    {column}
                    <span className="sort-icon">
                      {sortConfig.key === column ? 
                        (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'
                      }
                    </span>
                  </button>
                  <div
                    className="resize-handle"
                    onMouseDown={(e) => handleResizeStart(e, column)}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Virtualized Body */}
        <div
          ref={containerRef}
          className="grid-body"
          onScroll={(e) => {
            handleScroll(e);
            handleHorizontalScroll(e);
          }}
        >
          <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
            <div
              className="virtual-content"
              style={{
                transform: `translateY(${offsetY}px)`,
                height: `${visibleData.length * ROW_HEIGHT}px`
              }}
            >
              {visibleData.map((row, index) => (
                <div
                  key={visibleStart + index}
                  className="grid-row"
                  style={{ height: `${ROW_HEIGHT}px` }}
                >
                  {columnOrder.map((column) => {
                    const width = columnWidths[column] || 150;
                    return (
                      <div
                        key={column}
                        className="grid-cell"
                        style={{ width: `${width}px` }}
                      >
                        {renderCell(row[column], column, index)}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataGrid; 