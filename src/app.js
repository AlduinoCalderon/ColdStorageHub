// ... otros imports y configuraciones ...

// La ruta debe ser así:
app.use('/api/warehouses', require('./api/mysql/routes/warehouse.routes'));

// NO así:
// app.use('/api/mysql/warehouses', require('./api/mysql/routes/warehouse.routes')); 