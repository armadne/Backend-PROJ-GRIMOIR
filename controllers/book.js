const Book = require('../models/Book');

const fs = require('fs');
const jwt = require('jsonwebtoken');


exports.createBook = (req, res, next) => {
  try {
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject._userId;

    if (!req.file) {
      return res.status(400).json({ error: 'Image obligatoire' });
    }

      const book = new Book({
      ...bookObject,
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
      ratings: bookObject.ratings || [],
      averageRating: bookObject.averageRating || 0
    });

    book.save()
      .then(() => res.status(201).json({ message: 'Objet enregistré !' }))
      .catch(error => res.status(400).json({ error }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOneBook = async (req, res, next) => {
  try {
    const bookId = req.params.id;

    const book = await Book.findOne({ _id: bookId });
    if (!book) {
      return res.status(404).json({ message: "Livre introuvable" });
    }

    res.status(200).json(book);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.modifyBook = (req, res, next) => {
   const bookObject = req.file ? {
       ...JSON.parse(req.body.book),
       imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
   } : { ...req.body };
 
   delete bookObject._userId;
   Book.findOne({_id: req.params.id})
       .then((book) => {
           if (book.userId != req.auth.userId) {
               res.status(401).json({ message : 'Not authorized'});
           } else {
               Book.updateOne({ _id: req.params.id}, { ...bookObject, _id: req.params.id})
               .then(() => res.status(200).json({message : 'Objet modifié!'}))
               .catch(error => res.status(401).json({ error }));
           }
       })
       .catch((error) => {
           res.status(400).json({ error });
       });
};


exports.deleteBook = (req, res, next) => {
   Book.findOne({ _id: req.params.id})
       .then(book => {
           if (book.userId != req.auth.userId) {
               res.status(401).json({message: 'Not authorized'});
           } else {
               const filename = book.imageUrl.split('/images/')[1];
               fs.unlink(`images/${filename}`, () => {
                   Book.deleteOne({_id: req.params.id})
                       .then(() => { res.status(200).json({message: 'Objet supprimé !'})})
                       .catch(error => res.status(401).json({ error }));
               });
           }
       })
       .catch( error => {
           res.status(500).json({ error });
       });
};


exports.getAllBooks = (req, res, next) => {
  Book.find().then(
    (books) => {
      res.status(200).json(books);
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error
      });
    }
  );
};



exports.rateBook = async (req, res, next) => {
  try {
    const bookId = req.params.id;
    const userId = req.auth.userId;
    const grade = req.body.rating;

    const book = await Book.findOne({ _id: bookId });

    if (!book) {
      return res.status(404).json({ message: "Livre introuvable" });
    }

   
    const alreadyRated = book.ratings.find(r => r.userId === userId);
    if (alreadyRated) {
      return res.status(400).json({ message: "Vous avez déjà noté ce livre" });
    }

    book.ratings.push({ userId, grade });

    
    const total = book.ratings.reduce((acc, r) => acc + r.grade, 0);
    book.averageRating = total / book.ratings.length;

    await book.save();

    res.status(200).json(book);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



exports.getBestRatedBooks = async (req, res, next) => {
  try {
    const books = await Book.find()
      .sort({ averageRating: -1 }) 
      .limit(3)
      .lean();

    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
