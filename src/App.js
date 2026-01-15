// @ts-nocheck
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import ReactPaginate from 'react-paginate';
import './App.css';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE'];

// Predefined endpoints for dropdown
const ENDPOINTS = [
  '/api/users',
  '/api/login',
  '/api/orders',
  '/api/products',
  '/api/customers',
  '/api/settings',
  '/api/auth',
  '/api/dashboard',
  '/api/reports',
  '/api/notifications'
];

// For Vercel deployment, use relative path if no backend
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

function App() {
  const [logs, setLogs] = useState([]);
  const [userFilter, setUserFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalLogs, setTotalLogs] = useState(0);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [testUser, setTestUser] = useState('');
  const [testEndpoint, setTestEndpoint] = useState('');
  const [testMethod, setTestMethod] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Wrap fetchLogs with useCallback to avoid re-creating on every render
  const fetchLogs = useCallback(async (pageNumber = 0) => {
    try {
      setLoading(true);

      const params = {
        page: pageNumber + 1,
        limit: limit,
      };

      if (userFilter) params.user = userFilter;

      const apiUrl = API_BASE_URL ? `${API_BASE_URL}/api/logs` : '';
      
      if (!apiUrl) {
        // Demo mode - generate fake data
        setIsDemoMode(true);
        const mockData = generateMockData();
        setLogs(mockData.data);
        setTotalLogs(mockData.total);
        setTotalPages(mockData.totalPages);
        setPage(pageNumber);
        return;
      }

      const res = await axios.get(apiUrl, {
        params,
        headers: { 'x-user': testUser }
      });

      setIsDemoMode(false);
      setLogs(res.data.data);
      setTotalLogs(res.data.total);
      setTotalPages(res.data.totalPages);
      setPage(pageNumber);
    } catch (error) {
      console.error('Error fetching logs:', error);
      // Use mock data as fallback
      setIsDemoMode(true);
      const mockData = generateMockData();
      setLogs(mockData.data);
      setTotalLogs(mockData.total);
      setTotalPages(mockData.totalPages);
    } finally {
      setLoading(false);
    }
  }, [limit, userFilter, testUser]);

  // Generate mock data for demo
  const generateMockData = () => {
    const mockLogs = [];
    for (let i = 1; i <= 50; i++) {
      mockLogs.push({
        _id: `mock_${i}`,
        user: `user${Math.floor(Math.random() * 5) + 1}`,
        endpoint: ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)],
        method: HTTP_METHODS[Math.floor(Math.random() * HTTP_METHODS.length)],
        timestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
        fullUrl: ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)] + '?page=' + (Math.floor(i/10) + 1)
      });
    }
    
    const startIndex = page * limit;
    const paginatedLogs = mockLogs.slice(startIndex, startIndex + limit);
    
    return {
      data: paginatedLogs,
      total: mockLogs.length,
      totalPages: Math.ceil(mockLogs.length / limit)
    };
  };

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const simulateApiCall = async () => {
    if (!testEndpoint || !testMethod) {
      alert('Please select endpoint and method');
      return;
    }

    if (!API_BASE_URL) {
      // Demo mode - add a mock log entry
      const newLog = {
        _id: `sim_${Date.now()}`,
        user: testUser || 'demo_user',
        endpoint: testEndpoint,
        method: testMethod,
        timestamp: new Date().toISOString(),
        fullUrl: `${testEndpoint}?user=${testUser}&simulated=true`
      };
      
      setLogs(prev => [newLog, ...prev.slice(0, limit - 1)]);
      setTotalLogs(prev => prev + 1);
      alert(`✅ Simulated: ${testMethod} ${testEndpoint}`);
      return;
    }

    try {
      const config = {
        headers: { 'x-user': testUser }
      };

      const queryParams = new URLSearchParams();
      queryParams.append('user', testUser);
      queryParams.append('simulated', 'true');

      const randomParams = ['page=1', 'limit=10', 'search=test', 'sort=desc', 'filter=active'];
      const randomParam = randomParams[Math.floor(Math.random() * randomParams.length)];
      queryParams.append('additional', randomParam.split('=')[0]);

      const queryString = queryParams.toString();

      if (testMethod === 'GET') {
        await axios.get(`${API_BASE_URL}${testEndpoint}?${queryString}`, config);
      } else if (testMethod === 'POST') {
        await axios.post(`${API_BASE_URL}${testEndpoint}?${queryString}`, {}, config);
      } else if (testMethod === 'PUT') {
        await axios.put(`${API_BASE_URL}${testEndpoint}?${queryString}`, {}, config);
      } else if (testMethod === 'DELETE') {
        await axios.delete(`${API_BASE_URL}${testEndpoint}?${queryString}`, config);
      }

      alert(`✅ API Call Successful: ${testMethod} ${testEndpoint}`);
      fetchLogs(0);
    } catch (error) {
      console.error('API call failed:', error);
      alert('❌ API call failed. Running in demo mode.');
      
      // Add demo log entry
      const newLog = {
        _id: `demo_${Date.now()}`,
        user: testUser || 'demo_user',
        endpoint: testEndpoint,
        method: testMethod,
        timestamp: new Date().toISOString(),
        fullUrl: `${testEndpoint}?user=${testUser}&simulated=true`
      };
      
      setLogs(prev => [newLog, ...prev.slice(0, limit - 1)]);
      setTotalLogs(prev => prev + 1);
    }
  };

  const handlePageClick = (data) => {
    fetchLogs(data.selected);
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchLogs(0);
  };

  const handleRefresh = () => {
    fetchLogs(page);
  };

  const clearFilters = () => {
    setUserFilter('');
    setTestUser('');
    setTestEndpoint('');
    setTestMethod('');
    fetchLogs(0);
  };

  const exportCSV = () => {
    // Create CSV content
    const headers = ['User', 'Endpoint', 'Method', 'Timestamp', 'URL'];
    const csvContent = [
      headers.join(','),
      ...logs.map(log => [
        `"${log.user}"`,
        `"${log.endpoint}"`,
        `"${log.method}"`,
        `"${new Date(log.timestamp).toLocaleString()}"`,
        `"${log.fullUrl || log.endpoint}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    alert(`📊 Exported ${logs.length} logs to CSV`);
  };

  return (
    <div className="container">
      <h1>Audit Logging Dashboard</h1>
      
      {/* Demo mode notice */}
      {isDemoMode && (
        <div className="demo-notice">
          🚀 <strong>Demo Mode</strong> - Showing sample data
        </div>
      )}

      {/* Simulation Controls */}
      <div className="simulation-controls">
        <h3>📡 API Calls</h3>
        <div className="simulation-row">
          <div className="input-group">
            <label>Username: </label>
            <input
              type="text"
              placeholder="Enter username"
              value={testUser}
              onChange={(e) => setTestUser(e.target.value)}
              className="input"
            />
          </div>

          <div className="input-group">
            <label>Endpoint: </label>
            <select
              value={testEndpoint}
              onChange={(e) => setTestEndpoint(e.target.value)}
              className="input"
            >
              <option value="">Select Endpoint </option>
              {ENDPOINTS.map((endpoint) => (
                <option key={endpoint} value={endpoint}>
                  {endpoint}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Method: </label>
            <select
              value={testMethod}
              onChange={(e) => setTestMethod(e.target.value)}
              className="input"
            >
              <option value="">Select Method</option>
              {HTTP_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn simulate-btn"
            onClick={simulateApiCall}
            disabled={!testEndpoint || !testMethod}
          >
            🚀 Call API
          </button>

          <button
            className="btn refresh-btn"
            onClick={handleRefresh}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="filter-section">
        <h3>🔍 Filter Logs</h3>
        <form onSubmit={handleFilterSubmit} className="filter-form">
          <div className="filter-row">
            <div className="input-group">
              <label>Filter by User: </label>
              <input
                type="text"
                placeholder="Enter username to filter"
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="input"
              />
            </div>

            <div className="button-group">
              <button type="submit" className="btn filter-btn">
                🔍 Filter
              </button>

              <button 
                type="button" 
                className="btn clear-btn"
                onClick={clearFilters}
                disabled={!userFilter && !testUser && !testEndpoint && !testMethod}
              >
                🗑️ Clear Filters
              </button>

              <button type="button" className="btn export-btn" onClick={exportCSV}>
                📊 Export CSV
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Loading audit logs...</p>
        </div>
      ) : (
        <>
          <div className="table-header">
            <h3>📋 Audit Logs (Total: {totalLogs} records)</h3>
            <div className="table-info">
              <span>Showing {logs.length} of {totalLogs} records | Page {page + 1} of {totalPages}</span>
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th width="20%">👤 User</th>
                  <th width="40%">🔗 Endpoint</th>
                  <th width="15%">⚡ Method</th>
                  <th width="25%">🕐 Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="no-data">
                      📭 No audit logs found. Try simulating API calls above.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id} className="log-row">
                      <td>
                        <span className="user-badge">{log.user}</span>
                      </td>
                      <td>
                        <div className="endpoint-display">
                          <span className="endpoint-path">
                            {log.endpoint}
                          </span>
                          <div className="endpoint-tooltip">
                            Full URL: {log.fullUrl || `${log.endpoint}`}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`method-badge method-${log.method.toLowerCase()}`}>
                          {log.method}
                        </span>
                      </td>
                      <td>
                        <div className="timestamp">
                          {new Date(log.timestamp).toLocaleDateString('en-GB')}
                          <br />
                          <small>{new Date(log.timestamp).toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}</small>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <div className="pagination-wrapper">
                <ReactPaginate
                  previousLabel="← Previous"
                  nextLabel="Next →"
                  pageCount={totalPages}
                  onPageChange={handlePageClick}
                  containerClassName="pagination"
                  pageClassName="page-item"
                  pageLinkClassName="page-link"
                  previousClassName="page-item prev-item"
                  previousLinkClassName="page-link prev-link"
                  nextClassName="page-item next-item"
                  nextLinkClassName="page-link next-link"
                  breakClassName="page-item break-item"
                  breakLinkClassName="page-link break-link"
                  activeClassName="active"
                  forcePage={page}
                  marginPagesDisplayed={2}
                  pageRangeDisplayed={5}
                />
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Footer */}
      <div className="footer">
        <small>
          {API_BASE_URL 
            ? `Backend: ${API_BASE_URL}` 
            : 'Demo Mode - Mock Data'}
        </small>
      </div>
    </div>
  );
}

export default App;
