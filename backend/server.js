// @ts-nocheck
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = 5000;

/* ===================== MongoDB ===================== */
mongoose
  .connect(
    'mongodb+srv://alimsayyad9786_db_user:yScL3hxiIEQSu1GN@als1.jr8ryyw.mongodb.net/audit_logs'
  )
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

/* ===================== Schema ===================== */
const logSchema = new mongoose.Schema(
  {
    user: { type: String, index: true },
    endpoint: { type: String, index: true },
    method: { type: String, index: true },
    timestamp: { type: Date, index: true },
    fullUrl: { type: String } 
  },
  { versionKey: false }
);

const ApiLog = mongoose.model('ApiLog', logSchema);

/* ===================== Middleware ===================== */
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api/logs')) return next();

  try {
    const user = req.query.user || req.headers['x-user'] || 'anonymous';
    
    await ApiLog.create({
      user: String(user),
      endpoint: req.path, 
      method: req.method,
      timestamp: new Date(),
      fullUrl: req.originalUrl 
    });
  } catch (err) {
    console.error('Log error:', err?.message);
  }

  next();
});

/* ===================== GET LOGS ===================== */
app.get('/api/logs', async (req, res) => {
  try {
    const {
      user,
      endpoint,
      method,
      startDate,
      endDate,
      page = 1,
      limit = 10
    } = req.query;

    const filter = {};

    // If user filter is provided, use it
    if (user && user !== 'anonymous') {
      filter.user = { $regex: String(user), $options: 'i' };
    }

    if (endpoint) {
      filter.endpoint = { $regex: String(endpoint), $options: 'i' };
    }

    if (method) {
      filter.method = String(method).toUpperCase();
    }

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(String(startDate));
      if (endDate) filter.timestamp.$lte = new Date(String(endDate));
    }

    filter.endpoint = { $ne: '/api/logs' };

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Math.min(100, Number(limit))); 
    const skip = (pageNum - 1) * limitNum;

    // Get logs with pagination
    const logs = await ApiLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(); 

    const transformedLogs = logs.map(log => ({
      ...log,
      endpoint: log.endpoint,
      method: log.method,
      displayEndpoint: `${log.endpoint} [${log.method}]`
    }));

    const total = await ApiLog.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      data: transformedLogs,
      total: total,
      page: pageNum,
      limit: limitNum,
      totalPages: totalPages,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ===================== CSV EXPORT ===================== */
app.get('/api/logs/export', async (req, res) => {
  try {
    const { user, endpoint, method, startDate, endDate } = req.query;

    const filter = {};

    if (user && user !== 'anonymous') {
      filter.user = { $regex: String(user), $options: 'i' };
    }

    if (endpoint) {
      filter.endpoint = { $regex: String(endpoint), $options: 'i' };
    }

    if (method) {
      filter.method = String(method).toUpperCase();
    }

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(String(startDate));
      if (endDate) filter.timestamp.$lte = new Date(String(endDate));
    }

    // Exclude audit endpoint logs
    filter.endpoint = { $ne: '/api/logs' };

    const logs = await ApiLog.find(filter).sort({ timestamp: -1 });

    const csvWriter = createCsvWriter({
      path: 'logs.csv',
      header: [
        { id: 'user', title: 'User' },
        { id: 'endpoint', title: 'Endpoint' },
        { id: 'method', title: 'Method' },
        { id: 'timestamp', title: 'Timestamp' },
        { id: 'fullUrl', title: 'Full URL' }
      ]
    });

    await csvWriter.writeRecords(
      logs.map(l => ({
        user: l.user,
        endpoint: l.endpoint,
        method: l.method,
        timestamp: l.timestamp ? l.timestamp.toISOString() : '',
        fullUrl: l.fullUrl || ''
      }))
    );

    res.download('logs.csv');
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'CSV export failed' });
  }
});

/* ===================== ADD TEST ENDPOINTS ===================== */
app.get('/api/users', (req, res) => {
  res.json({ message: 'Users list' });
});

app.post('/api/users', (req, res) => {
  res.json({ message: 'User created' });
});

app.put('/api/users/:id', (req, res) => {
  res.json({ message: 'User updated' });
});

app.delete('/api/users/:id', (req, res) => {
  res.json({ message: 'User deleted' });
});

app.post('/api/login', (req, res) => {
  res.json({ message: 'Login successful' });
});

app.get('/api/orders', (req, res) => {
  res.json({ message: 'Orders list' });
});

app.post('/api/orders', (req, res) => {
  res.json({ message: 'Order created' });
});

app.put('/api/orders/:id', (req, res) => {
  res.json({ message: 'Order updated' });
});

app.delete('/api/orders/:id', (req, res) => {
  res.json({ message: 'Order deleted' });
});

app.get('/api/products', (req, res) => {
  res.json({ message: 'Products list' });
});

app.post('/api/products', (req, res) => {
  res.json({ message: 'Product created' });
});

app.get('/api/customers', (req, res) => {
  res.json({ message: 'Customers list' });
});

app.get('/api/settings', (req, res) => {
  res.json({ message: 'Settings data' });
});

app.get('/api/auth', (req, res) => {
  res.json({ message: 'Auth status' });
});

app.get('/api/dashboard', (req, res) => {
  res.json({ message: 'Dashboard data' });
});

app.get('/api/reports', (req, res) => {
  res.json({ message: 'Reports data' });
});

app.get('/api/notifications', (req, res) => {
  res.json({ message: 'Notifications list' });
});

/* ===================== DELETE ALL LOGS (For Testing) ===================== */
app.delete('/api/logs/clear', async (req, res) => {
  try {
    await ApiLog.deleteMany({});
    res.json({ message: 'All logs cleared' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to clear logs' });
  }
});

/* ===================== GET STATS ===================== */
app.get('/api/logs/stats', async (req, res) => {
  try {
    const totalLogs = await ApiLog.countDocuments({});
    const uniqueUsers = await ApiLog.distinct('user');
    const uniqueEndpoints = await ApiLog.distinct('endpoint');
    
    res.json({
      totalLogs,
      uniqueUsers: uniqueUsers.length,
      uniqueEndpoints: uniqueEndpoints.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

/* ===================== START ===================== */
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);