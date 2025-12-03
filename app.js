const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const stuffRoutes = require('./routes/book');


mongoose.connect('mongodb+srv://grimoir:grimoir@cluster-grimoir.xfqkilm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster-Grimoir',
  { useNewUrlParser: true,
    useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

const app = express();


app.use(express.json());

app.use('/api/stuff', stuffRouter);



module.exports = app;