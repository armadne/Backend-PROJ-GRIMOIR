const Book = require('../models/Book');

const fs = require('fs');


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

    const book = await Book.findOne({ _id: bookId }).lean();
    if (!book) {
      return res.status(404).json({ message: "Livre introuvable" });
    }

   
    const isLogged =
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ");

    let recommendations = [];
    let sectionTitle = "";

    if (isLogged) {
      
      recommendations = await Book.find({
        _id: { $ne: bookId },
        category: book.category, 
      })
        .limit(6)
        .lean();

      sectionTitle = "Livres similaires";

    } else {
      
      recommendations = await Book.find({
        _id: { $ne: bookId },
        author: book.author,
      })
        .limit(6)
        .lean();

      sectionTitle = "Du même auteur";
    }

    
    return res.status(200).json({
      ...book,            
      sectionTitle,       
      recommendations,    
    });

  } catch (error) {
    console.error("Erreur getOneBook:", error);
    return res.status(500).json({ error: error.message });
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



exports.getBestRatingBooks = async (req, res) => {
  try {
    const books = await Book.find()
      .sort({ averageRating: -1 })  
      .limit(3);                    

    res.status(200).json(books);
  } catch (error) {
    res.status(400).json({ error });
  }
};




exports.getSimilarBooks = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID invalide" });
    }

    const book = await Book.findById(id);
    if (!book) return res.status(404).json({ message: "Livre non trouvé" });

    const similarBooks = await Book.find({ 
      genre: book.genre, 
      _id: { $ne: book._id } 
    }).limit(5); 

    res.status(200).json(similarBooks);
  } catch (error) {
    res.status(500).json({ error });
  }
};


exports.getBooksSameAuthor = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID invalide" });
    }

    const book = await Book.findById(id);
    if (!book) return res.status(404).json({ message: "Livre non trouvé" });

    const booksSameAuthor = await Book.find({
      author: book.author,
      _id: { $ne: book._id }
    }).limit(5); 

    res.status(200).json(booksSameAuthor);
  } catch (error) {
    res.status(500).json({ error });
  }
};