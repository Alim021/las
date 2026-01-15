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

// Use environment variable for API URL or default to localhost for development
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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

  // Wrap fetchLogs with useCallback to avoid re-creating on every render
  const fetchLogs = useCallback(async (pageNumber = 0) => {
    try {
      setLoading(true);

      const params = {
        page: pageNumber + 1,
        limit: limit,
      };

      if (userFilter) params.user = userFilter;

      const res = await axios.get(`${API_BASE_URL}/api/logs`, {
        params,
        headers: { 'x-user': testUser }
      });

      setLogs(res.data.data);
      setTotalLogs(res.data.total);
      setTotalPages(res.data.totalPages);
      setPage(pageNumber);
    } catch (error) {
      console.error('Error fetching logs:', error);
      // For demo purposes, show sample data if backend is not available
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock data for development');
        const mockData = {
          data: [
            { _id: '1', user: 'demo_user', endpoint: '/api/users', method: 'GET', timestamp: new Date().toISOString(), fullUrl: '/api/users?page=1' },
            { _id: '2', user: 'admin', endpoint: '/api/login', method: 'POST', timestamp: new Date(Date.now() - 3600000).toISOString(), fullUrl: '/api/login' },
            { _id: '3', user: 'test_user', endpoint: '/api/products', method: 'GET', timestamp: new Date(Date.now() - 7200000).toISOString(), fullUrl: '/api/products?category=electronics' },
          ],
          total: 3,
          totalPages: 1
        };
        setLogs(mockData.data);
        setTotalLogs(mockData.total);
        setTotalPages(mockData.totalPages);
      }
    } finally {
      setLoading(false);
    }
  }, [limit, userFilter, testUser]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const simulateApiCall = async () => {
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

      fetchLogs(0); // Refresh logs and go to first page
    } catch (error) {
      console.error('API call failed:', error);
      // For demo, simulate success even if backend is down
      if (process.env.NODE_ENV === 'development') {
        alert(`Simulated API call to ${testEndpoint} with ${testMethod} method`);
        fetchLogs(0);
      }
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

  // Added: clearFilters function to fix the unused variable warning
  const clearFilters = () => {
    setUserFilter('');
    setTestUser('');
    setTestEndpoint('');
    setTestMethod('');
    fetchLogs(0);
  };

  const exportCSV = async () => {
    try {
      const params = {};
      if (userFilter) params.user = userFilter;

      const queryString = new URLSearchParams(params).toString();
      const url = `${API_BASE_URL}/api/logs/export?${queryString}`;

      const response = await axios.get(url, {
        responseType: 'blob',
        headers: { 'x-user': testUser }
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = 'audit_logs.csv';
      link.click();
    } catch (error) {
      console.error('CSV export failed:', error);
      // For demo, create a dummy CSV
      if (process.env.NODE_ENV === 'development') {
        const csvContent = "data:text/csv;charset=utf-8,User,Endpoint,Method,Timestamp\n" +
          "demo_user,/api/users,GET," + new Date().toISOString() + "\n" +
          "admin,/api/login,POST," + new Date().toISOString() + "\n";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'audit_logs_demo.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  return (
    <div className="container">
      <h1>Audit Logging Dashboard</h1>
      
      {/* Development notice */}
      {process.env.NODE_ENV === 'development' && (
        <div className="dev-notice">
          🔧 Development Mode: Using mock data for demonstration
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
            className="btn simulate-btn"
            onClick={handleRefresh}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Simple Filter Form - Only User Filter */}
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

              {/* Added: Clear Filters button that uses the clearFilters function */}
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

      {/* Logs Table - 4 Columns */}
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
                      📭 No audit logs found. {process.env.NODE_ENV === 'development' ? 'Try simulating API calls above.' : 'The backend might be offline.'}
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
      
      {/* Footer with API info */}
      <div className="footer">
        <small>API Base URL: {API_BASE_URL}</small>
      </div>
    </div>
  );
}

export default App;
