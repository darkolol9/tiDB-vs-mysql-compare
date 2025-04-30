const express = require('express');
const router = express.Router();
const tidbPool = require('../db');
const mysqlPool = require('../db-mysql');

// Helper function to execute query on both databases
async function executeOnBoth(pool1, pool2, query, params) {
  const [result1] = await pool1.execute(query, params);
  const [result2] = await pool2.execute(query, params);
  return [result1, result2];
}

// Helper function to safely format numbers
function safeFormatNumber(value, decimals = 2) {
  if (value === null || value === undefined) return 'N/A';
  const num = parseFloat(value);
  return isNaN(num) ? 'N/A' : num.toFixed(decimals);
}

// Get statistics from both databases
router.get('/statistics', async (req, res) => {
  try {
    // Helper function to get table statistics
    async function getTableStats(pool, tableName) {
      if (tableName === 'users') {
        const [rows] = await pool.execute(`
          SELECT 
            COUNT(*) as row_count,
            COUNT(DISTINCT id) as unique_ids,
            COUNT(DISTINCT email) as unique_emails
          FROM users
        `);
        return rows[0];
      } else if (tableName === 'todos') {
        const [rows] = await pool.execute(`
          SELECT 
            COUNT(*) as row_count,
            COUNT(DISTINCT id) as unique_ids,
            COUNT(DISTINCT user_id) as unique_users,
            COUNT(DISTINCT completed) as completion_states,
            COUNT(DISTINCT title) as unique_titles
          FROM todos
        `);
        return rows[0];
      }
    }

    // Get statistics for both databases
    const [tidbUsersStats, mysqlUsersStats] = await Promise.all([
      getTableStats(tidbPool, 'users'),
      getTableStats(mysqlPool, 'users')
    ]);

    const [tidbTodosStats, mysqlTodosStats] = await Promise.all([
      getTableStats(tidbPool, 'todos'),
      getTableStats(mysqlPool, 'todos')
    ]);

    // Now that we have the stats, generate the HTML
    res.write(`<html>
      <head>
        <style>
          pre {
            background-color: #1e1e1e;
            color: #d4d4d4;
            padding: 10px;
            border-radius: 5px;
            font-family: 'Consolas', 'Monaco', monospace;
            margin: 10px 0;
            overflow-x: auto;
          }
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            background-color: #f5f5f5;
          }
          .container {
            padding: 20px;
          }
          h1, h2 {
            color: #333;
            margin-top: 0;
          }
          p {
            margin: 10px 0;
          }
          .table-stats {
            background-color: #fff;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          }
          .table-stats h3 {
            color: #2c3e50;
            border-bottom: 2px solid #eee;
            padding-bottom: 5px;
            margin-top: 0;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
          }
          .stat-row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
            padding: 5px;
            background-color: #f8f9fa;
            border-radius: 3px;
          }
          .stat-label {
            font-weight: bold;
            color: #666;
          }
          .stat-value {
            color: #2c3e50;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Database Performance Comparison</h1>
          
          <h2>Table Statistics</h2>
          <div class="stats-grid">
            <div class="table-stats">
              <h3>Users Table (TiDB)</h3>
              <div class="stat-row">
                <span class="stat-label">Total Rows:</span>
                <span class="stat-value">${tidbUsersStats.row_count.toLocaleString()}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Unique IDs:</span>
                <span class="stat-value">${tidbUsersStats.unique_ids.toLocaleString()}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Unique Emails:</span>
                <span class="stat-value">${tidbUsersStats.unique_emails.toLocaleString()}</span>
              </div>
            </div>

            <div class="table-stats">
              <h3>Users Table (MySQL)</h3>
              <div class="stat-row">
                <span class="stat-label">Total Rows:</span>
                <span class="stat-value">${mysqlUsersStats.row_count.toLocaleString()}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Unique IDs:</span>
                <span class="stat-value">${mysqlUsersStats.unique_ids.toLocaleString()}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Unique Emails:</span>
                <span class="stat-value">${mysqlUsersStats.unique_emails.toLocaleString()}</span>
              </div>
            </div>

            <div class="table-stats">
              <h3>Todos Table (TiDB)</h3>
              <div class="stat-row">
                <span class="stat-label">Total Rows:</span>
                <span class="stat-value">${tidbTodosStats.row_count.toLocaleString()}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Unique IDs:</span>
                <span class="stat-value">${tidbTodosStats.unique_ids.toLocaleString()}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Unique Users:</span>
                <span class="stat-value">${tidbTodosStats.unique_users.toLocaleString()}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Unique Titles:</span>
                <span class="stat-value">${tidbTodosStats.unique_titles.toLocaleString()}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Completion States:</span>
                <span class="stat-value">${tidbTodosStats.completion_states}</span>
              </div>
            </div>

            <div class="table-stats">
              <h3>Todos Table (MySQL)</h3>
              <div class="stat-row">
                <span class="stat-label">Total Rows:</span>
                <span class="stat-value">${mysqlTodosStats.row_count.toLocaleString()}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Unique IDs:</span>
                <span class="stat-value">${mysqlTodosStats.unique_ids.toLocaleString()}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Unique Users:</span>
                <span class="stat-value">${mysqlTodosStats.unique_users.toLocaleString()}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Unique Titles:</span>
                <span class="stat-value">${mysqlTodosStats.unique_titles.toLocaleString()}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Completion States:</span>
                <span class="stat-value">${mysqlTodosStats.completion_states}</span>
              </div>
            </div>
          </div>

          <h2>Performance Tests</h2>`);

    // Helper function to measure query performance
    async function measureQueryPerformance(pool, query, params = []) {
      const startTime = process.hrtime();
      await pool.execute(query, params);
      const [seconds, nanoseconds] = process.hrtime(startTime);
      return (seconds * 1000) + (nanoseconds / 1000000); // Convert to milliseconds
    }

    // Helper function to format query for display
    function formatQuery(query) {
      return query.replace(/\s+/g, ' ').trim();
    }

    // Simple SELECT performance
    const simpleSelectQuery = 'SELECT * FROM todos LIMIT 100';
    const [tidbSimpleSelect, mysqlSimpleSelect] = await Promise.all([
      measureQueryPerformance(tidbPool, simpleSelectQuery),
      measureQueryPerformance(mysqlPool, simpleSelectQuery)
    ]);

    res.write(`<h2>1. Simple SELECT Performance</h2>`);
    res.write(`<pre>${formatQuery(simpleSelectQuery)}</pre>`);
    res.write(`<p>TiDB:  ${tidbSimpleSelect.toFixed(2)}ms<br>`);
    res.write(`MySQL: ${mysqlSimpleSelect.toFixed(2)}ms<br>`);
    res.write(`Difference: ${(mysqlSimpleSelect - tidbSimpleSelect).toFixed(2)}ms (${((mysqlSimpleSelect - tidbSimpleSelect) / mysqlSimpleSelect * 100).toFixed(2)}%)</p>`);

    // COUNT performance
    const countQuery = 'SELECT COUNT(*) FROM todos';
    const [tidbCount, mysqlCount] = await Promise.all([
      measureQueryPerformance(tidbPool, countQuery),
      measureQueryPerformance(mysqlPool, countQuery)
    ]);

    res.write(`<h2>2. COUNT Query Performance</h2>`);
    res.write(`<pre>${formatQuery(countQuery)}</pre>`);
    res.write(`<p>TiDB:  ${tidbCount.toFixed(2)}ms<br>`);
    res.write(`MySQL: ${mysqlCount.toFixed(2)}ms<br>`);
    res.write(`Difference: ${(mysqlCount - tidbCount).toFixed(2)}ms (${((mysqlCount - tidbCount) / mysqlCount * 100).toFixed(2)}%)</p>`);

    // JOIN performance
    const joinQuery = `
      SELECT u.first_name, u.last_name, COUNT(t.id) as todo_count 
      FROM users u 
      JOIN todos t ON u.id = t.user_id 
      GROUP BY u.id 
      LIMIT 100
    `;
    const [tidbJoin, mysqlJoin] = await Promise.all([
      measureQueryPerformance(tidbPool, joinQuery),
      measureQueryPerformance(mysqlPool, joinQuery)
    ]);

    res.write(`<h2>3. JOIN Query Performance</h2>`);
    res.write(`<pre>${formatQuery(joinQuery)}</pre>`);
    res.write(`<p>TiDB:  ${tidbJoin.toFixed(2)}ms<br>`);
    res.write(`MySQL: ${mysqlJoin.toFixed(2)}ms<br>`);
    res.write(`Difference: ${(mysqlJoin - tidbJoin).toFixed(2)}ms (${((mysqlJoin - tidbJoin) / mysqlJoin * 100).toFixed(2)}%)</p>`);

    // Complex query performance (aggregation with filtering)
    const complexQuery = `
      SELECT 
        AVG(todo_count) as avg_todos,
        MAX(todo_count) as max_todos,
        MIN(todo_count) as min_todos
      FROM (
        SELECT COUNT(*) as todo_count 
        FROM todos 
        WHERE completed = 1 
        GROUP BY user_id
      ) as counts
    `;
    const [tidbComplex, mysqlComplex] = await Promise.all([
      measureQueryPerformance(tidbPool, complexQuery),
      measureQueryPerformance(mysqlPool, complexQuery)
    ]);

    res.write(`<h2>4. Complex Query Performance</h2>`);
    res.write(`<pre>${formatQuery(complexQuery)}</pre>`);
    res.write(`<p>TiDB:  ${tidbComplex.toFixed(2)}ms<br>`);
    res.write(`MySQL: ${mysqlComplex.toFixed(2)}ms<br>`);
    res.write(`Difference: ${(mysqlComplex - tidbComplex).toFixed(2)}ms (${((mysqlComplex - tidbComplex) / mysqlComplex * 100).toFixed(2)}%)</p>`);

    // Batch performance (multiple queries)
    const batchQueries = [
      'SELECT COUNT(*) FROM users',
      'SELECT COUNT(*) FROM todos',
      'SELECT COUNT(*) FROM todos WHERE completed = 1',
      'SELECT COUNT(*) FROM todos WHERE completed = 0'
    ];

    res.write(`<h2>5. Batch Performance</h2>`);
    res.write(`<p>Queries:</p>`);
    batchQueries.forEach((query, index) => {
      res.write(`<pre>${index + 1}. ${formatQuery(query)}</pre>`);
    });

    const tidbBatchStart = process.hrtime();
    for (const query of batchQueries) {
      await tidbPool.execute(query);
    }
    const [tidbBatchSeconds, tidbBatchNanos] = process.hrtime(tidbBatchStart);
    const tidbBatchTime = (tidbBatchSeconds * 1000) + (tidbBatchNanos / 1000000);

    const mysqlBatchStart = process.hrtime();
    for (const query of batchQueries) {
      await mysqlPool.execute(query);
    }
    const [mysqlBatchSeconds, mysqlBatchNanos] = process.hrtime(mysqlBatchStart);
    const mysqlBatchTime = (mysqlBatchSeconds * 1000) + (mysqlBatchNanos / 1000000);

    res.write(`<p>Total Time:<br>`);
    res.write(`TiDB:  ${tidbBatchTime.toFixed(2)}ms<br>`);
    res.write(`MySQL: ${mysqlBatchTime.toFixed(2)}ms<br>`);
    res.write(`Difference: ${(mysqlBatchTime - tidbBatchTime).toFixed(2)}ms (${((mysqlBatchTime - tidbBatchTime) / mysqlBatchTime * 100).toFixed(2)}%)</p>`);

    // Parallel query performance
    const parallelQueries = [
      'SELECT COUNT(*) FROM users',
      'SELECT COUNT(*) FROM todos',
      'SELECT COUNT(*) FROM todos WHERE completed = 1',
      'SELECT COUNT(*) FROM todos WHERE completed = 0'
    ];

    res.write(`<h2>6. Parallel Query Performance</h2>`);
    res.write(`<p>Queries:</p>`);
    parallelQueries.forEach((query, index) => {
      res.write(`<pre>${index + 1}. ${formatQuery(query)}</pre>`);
    });

    const tidbParallelStart = process.hrtime();
    await Promise.all(parallelQueries.map(query => tidbPool.execute(query)));
    const [tidbParallelSeconds, tidbParallelNanos] = process.hrtime(tidbParallelStart);
    const tidbParallelTime = (tidbParallelSeconds * 1000) + (tidbParallelNanos / 1000000);

    const mysqlParallelStart = process.hrtime();
    await Promise.all(parallelQueries.map(query => mysqlPool.execute(query)));
    const [mysqlParallelSeconds, mysqlParallelNanos] = process.hrtime(mysqlParallelStart);
    const mysqlParallelTime = (mysqlParallelSeconds * 1000) + (mysqlParallelNanos / 1000000);

    res.write(`<p>Total Time (Parallel Execution):<br>`);
    res.write(`TiDB:  ${tidbParallelTime.toFixed(2)}ms<br>`);
    res.write(`MySQL: ${mysqlParallelTime.toFixed(2)}ms<br>`);
    res.write(`Difference: ${(mysqlParallelTime - tidbParallelTime).toFixed(2)}ms (${((mysqlParallelTime - tidbParallelTime) / mysqlParallelTime * 100).toFixed(2)}%)</p>`);

    // Large result set performance
    const largeResultQuery = `
      SELECT t.*, u.first_name, u.last_name 
      FROM todos t 
      JOIN users u ON t.user_id = u.id 
      ORDER BY t.created_at DESC 
      LIMIT 1000
    `;

    res.write(`<h2>7. Large Result Set Performance</h2>`);
    res.write(`<pre>${formatQuery(largeResultQuery)}</pre>`);

    const [tidbLargeResult, mysqlLargeResult] = await Promise.all([
      measureQueryPerformance(tidbPool, largeResultQuery),
      measureQueryPerformance(mysqlPool, largeResultQuery)
    ]);

    res.write(`<p>TiDB:  ${tidbLargeResult.toFixed(2)}ms<br>`);
    res.write(`MySQL: ${mysqlLargeResult.toFixed(2)}ms<br>`);
    res.write(`Difference: ${(mysqlLargeResult - tidbLargeResult).toFixed(2)}ms (${((mysqlLargeResult - tidbLargeResult) / mysqlLargeResult * 100).toFixed(2)}%)</p>`);

    res.write(`</body></html>`);
    res.end();
  } catch (error) {
    console.error('Error getting statistics:', error);
    res.write(`<html><body><h1>Error</h1><pre>Failed to get statistics: ${error.message}</pre></body></html>`);
    res.end();
  }
});

// Create a new todo
router.post('/', async (req, res) => {
  try {
    const { title, description, user_id } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const [tidbResult, mysqlResult] = await executeOnBoth(
      tidbPool,
      mysqlPool,
      'INSERT INTO todos (title, description, completed, user_id) VALUES (?, ?, ?, ?)',
      [title, description || '', false, user_id || null]
    );

    res.status(201).json({
      tidb_id: tidbResult.insertId,
      mysql_id: mysqlResult.insertId,
      title,
      description: description || '',
      completed: false,
      user_id: user_id || null
    });
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// Populate database with random todos
router.get('/populate', async (req, res) => {
  try {
    const totalUsers = 1000;
    const totalTodos = 1000000;
    const batchSize = 200;
    const batches = totalTodos / batchSize;
    const startTime = Date.now();
    let lastLogTime = startTime;

    // Function to generate random user
    const generateRandomUser = () => {
      const firstNames = ['John', 'Jane', 'Michael', 'Emily', 'David', 'Sarah', 'Robert', 'Jennifer', 'William', 'Lisa'];
      const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
      const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'example.com'];
      const separators = ['', '.', '_', '-'];
      const numbers = ['', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
      
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const separator = separators[Math.floor(Math.random() * separators.length)];
      const number = numbers[Math.floor(Math.random() * numbers.length)];
      const timestamp = Date.now().toString(36);
      const randomString = Math.random().toString(36).substring(2, 5);
      
      const email = `${firstName.toLowerCase()}${separator}${lastName.toLowerCase()}${number}${randomString}${timestamp}@${domains[Math.floor(Math.random() * domains.length)]}`;
      
      return [firstName, lastName, email];
    };

    // Function to generate random todo
    const generateRandomTodo = (userId) => {
      const titles = [
        'Complete project',
        'Review code',
        'Write documentation',
        'Fix bug',
        'Add feature',
        'Test functionality',
        'Update dependencies',
        'Optimize performance',
        'Refactor code',
        'Deploy application'
      ];
      const descriptions = [
        'This is a high priority task',
        'Needs to be done by end of week',
        'Blocked by another task',
        'Waiting for review',
        'In progress',
        'Almost complete',
        'Needs testing',
        'Ready for deployment',
        'Requires approval',
        'Low priority'
      ];
      
      return {
        title: `${titles[Math.floor(Math.random() * titles.length)]} ${Math.floor(Math.random() * 1000)}`,
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
        completed: Math.random() > 0.5,
        user_id: userId
      };
    };

    // Function to generate batch of users
    const generateUserBatch = (size) => {
      const users = [];
      for (let i = 0; i < size; i++) {
        users.push(generateRandomUser());
      }
      return users;
    };

    // Function to generate batch of todos
    const generateBatch = (size, userIds) => {
      const todos = [];
      for (let i = 0; i < size; i++) {
        const userId = userIds[Math.floor(Math.random() * userIds.length)];
        const todo = generateRandomTodo(userId);
        todos.push([todo.title, todo.description, todo.completed, todo.user_id]);
      }
      return todos;
    };

    // Function to format elapsed time
    const formatElapsedTime = (ms) => {
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    };

    res.write(`<html><body><h1>Populating Both Databases</h1><pre>`);
    
    // First, create users in both databases
    res.write(`Creating ${totalUsers} random users in both databases...\n`);
    const userBatchSize = 100;
    const userBatches = totalUsers / userBatchSize;
    const tidbUserIds = [];
    const mysqlUserIds = [];

    for (let i = 0; i < userBatches; i++) {
      const userBatch = generateUserBatch(userBatchSize);
      const placeholders = userBatch.map(() => '(?, ?, ?)').join(',');
      const values = userBatch.flat();
      
      // Insert users into TiDB
      await tidbPool.execute(
        `INSERT INTO users (first_name, last_name, email) VALUES ${placeholders}`,
        values
      );

      // Insert users into MySQL
      await mysqlPool.execute(
        `INSERT INTO users (first_name, last_name, email) VALUES ${placeholders}`,
        values
      );

      // Get the inserted user IDs from TiDB
      const [tidbRows] = await tidbPool.execute(
        `SELECT id FROM users ORDER BY id DESC LIMIT ${userBatchSize}`
      );
      tidbUserIds.push(...tidbRows.map(row => row.id));

      // Get the inserted user IDs from MySQL
      const [mysqlRows] = await mysqlPool.execute(
        `SELECT id FROM users ORDER BY id DESC LIMIT ${userBatchSize}`
      );
      mysqlUserIds.push(...mysqlRows.map(row => row.id));

      if ((i + 1) % 10 === 0) {
        res.write(`Created ${((i + 1) * userBatchSize).toLocaleString()} users in both databases\n`);
      }
    }

    res.write(`\nStarting to populate ${totalTodos.toLocaleString()} todos in both databases...\n`);
    
    // Now create todos in both databases
    for (let i = 0; i < batches; i++) {
      const tidbBatch = generateBatch(batchSize, tidbUserIds);
      const mysqlBatch = generateBatch(batchSize, mysqlUserIds);
      
      const tidbPlaceholders = tidbBatch.map(() => '(?, ?, ?, ?)').join(',');
      const mysqlPlaceholders = mysqlBatch.map(() => '(?, ?, ?, ?)').join(',');
      
      const tidbValues = tidbBatch.flat();
      const mysqlValues = mysqlBatch.flat();
      
      // Insert todos into TiDB
      await tidbPool.execute(
        `INSERT INTO todos (title, description, completed, user_id) VALUES ${tidbPlaceholders}`,
        tidbValues
      );

      // Insert todos into MySQL
      await mysqlPool.execute(
        `INSERT INTO todos (title, description, completed, user_id) VALUES ${mysqlPlaceholders}`,
        mysqlValues
      );

      if ((i + 1) % 100 === 0) {
        const currentTime = Date.now();
        const totalElapsed = currentTime - startTime;
        const sinceLast = currentTime - lastLogTime;
        const todosInserted = (i + 1) * batchSize;
        const percentComplete = ((todosInserted / totalTodos) * 100).toFixed(2);
        const insertRate = (5000 / (sinceLast / 1000)).toFixed(2);
        
        const progressMessage = `Progress: ${todosInserted.toLocaleString()} / ${totalTodos.toLocaleString()} todos (${percentComplete}%) | ` +
          `Rate: ${insertRate} todos/sec | ` +
          `Elapsed: ${formatElapsedTime(totalElapsed)}`;
        
        console.log(progressMessage);
        res.write(progressMessage + '\n');
        lastLogTime = currentTime;
      }
    }

    const totalElapsed = Date.now() - startTime;
    const finalMessage = `\nPopulation completed successfully!\n` +
      `Created ${totalUsers.toLocaleString()} users in both databases\n` +
      `Created ${totalTodos.toLocaleString()} todos in both databases\n` +
      `Total time: ${formatElapsedTime(totalElapsed)}`;
    console.log(finalMessage);
    res.write(finalMessage + '</pre></body></html>');
    res.end();
  } catch (error) {
    console.error('Error populating databases:', error);
    res.write(`<html><body><h1>Error</h1><pre>Failed to populate databases: ${error.message}</pre></body></html>`);
    res.end();
  }
});

module.exports = router; 