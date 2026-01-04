const Book = require('../models/Book');
const fs = require('fs');
const path = require('path');


exports.createBook = async (req, res, next) => {
  try {
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject._userId;

    
    const imageUrl = req.file
      ? `${req.protocol}://${req.get('host')}/images/${path.basename(req.file.path)}`
      : `${req.protocol}://${req.get('host')}/images/default.webp`;

    const book = new Book({
      ...bookObject,
      userId: req.auth.userId,
      imageUrl,
      ratings: bookObject.ratings || [],
      averageRating: bookObject.averageRating || 0
    });

    await book.save();
    res.status(201).json({ message: 'Livre enregistré !', book });
  } catch (err) {
    console.error('Erreur création livre:', err);
    res.status(500).json({ error: err.message });
  }
};


exports.modifyBook = async (req, res, next) => {
  try {
    const bookObject = req.file
      ? {
          ...JSON.parse(req.body.book),
          imageUrl: `${req.protocol}://${req.get('host')}/images/${path.basename(req.file.path)}`
        }
      : { ...req.body };

    delete bookObject._userId;

    const book = await Book.findOne({ _id: req.params.id });
    if (!book) return res.status(404).json({ message: 'Livre introuvable' });
    if (book.userId !== req.auth.userId) return res.status(401).json({ message: 'Not authorized' });

    await Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id });
    res.status(200).json({ message: 'Objet modifié !' });
  } catch (err) {
    console.error('Erreur modification livre:', err);
    res.status(500).json({ error: err.message });
  }
};


exports.deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id });
    if (!book) return res.status(404).json({ message: 'Livre introuvable' });
    if (book.userId !== req.auth.userId) return res.status(401).json({ message: 'Non autorisé' });

    const filename = book.imageUrl.split('/images/')[1];
    fs.unlink(path.join('images', filename), () => {}); 
    await Book.deleteOne({ _id: req.params.id });

    res.status(200).json({ message: 'Objet supprimé !' });
  } catch (err) {
    console.error('Erreur suppression livre:', err);
    res.status(500).json({ error: err.message });
  }
};


exports.getOneBook = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id });
    if (!book) return res.status(404).json({ message: 'Livre introuvable' });
    res.status(200).json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getAllBooks = async (req, res, next) => {
  try {
    const books = await Book.find();
    res.status(200).json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.rateBook = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id });
    if (!book) return res.status(404).json({ message: 'Livre introuvable' });

    const alreadyRated = book.ratings.find(r => r.userId === req.auth.userId);
    if (alreadyRated) return res.status(400).json({ message: 'Vous avez déjà noté ce livre' });

    book.ratings.push({ userId: req.auth.userId, grade: req.body.rating });
    book.averageRating = book.ratings.reduce((acc, r) => acc + r.grade, 0) / book.ratings.length;

    await book.save();
    res.status(200).json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getBestRatedBooks = async (req, res, next) => {
  try {
    const books = await Book.find().sort({ averageRating: -1 }).limit(3).lean();
    res.status(200).json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
