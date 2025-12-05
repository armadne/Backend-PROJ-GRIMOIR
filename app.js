const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const path = require('path');

const stuffRoutes = require('./routes/book');
const userRoutes = require('./routes/user');

mongoose.connect('mongodb+srv://grimoir:grimoir@cluster-grimoir.xfqkilm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster-Grimoir',
  { useNewUrlParser: true,
    useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

const app = express();

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(express.json());

app.use('/api/stuff', stuffRouter);
app.use('/api/auth', userRoutes);



module.exports = app;