require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const bookRoutes = require('./routes/book');
const userRoutes = require('./routes/user');

const app = express();

// Middleware pour gérer CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization'
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS'
  );
  next();
});


app.use('/images', express.static(path.join(__dirname, 'images')));


app.use(express.json());


app.use('/api/books', bookRoutes);
app.use('/api/auth', userRoutes);


mongoose.connect(
  'mongodb+srv://grimoir:grimoir@cluster-grimoir.xfqkilm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster-Grimoir',
  { useNewUrlParser: true, useUnifiedTopology: true }
)
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

module.exports = app;
