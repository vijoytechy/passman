const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const passport = require('passport');
const flash = require('connect-flash');
const session = require('express-session');
const multer = require('multer');
const path = require('path');

const app = express();

// Passport Config
require('./config/passport')(passport);

// DB Config
const db = require('./config/keys').mongoURI;

// Connect to MongoDB
mongoose
  .connect(
    db,
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads');
  },
  filename: (req, file, cb) => {
    console.log(file);
    Date.prototype.monthNames = [
      "January", "February", "March",
      "April", "May", "June",
      "July", "August", "September",
      "October", "November", "December"
    ];

    Date.prototype.getMonthName = function () {
      return this.monthNames[this.getMonth()];
    };
    Date.prototype.getShortMonthName = function () {
      return this.getMonthName().substr(0, 3);
    };

    // usage:

    var d = new Date();
    cb(null, d.getShortMonthName() + d.getTime() + path.extname(file.originalname));
  }
});
const fileFilter = (req, file, cb) => {
  if (file.mimetype == 'text/csv') {
    cb(null, true);
  } else {
    cb(null, false);
  }
}
const upload = multer({ storage: storage, fileFilter: fileFilter });


// Express body parser
app.use(express.urlencoded({ extended: true }));




// Express session
app.use(
  session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

// Routes
app.use('/', require('./routes/index.js'));
app.use('/users', require('./routes/users.js'));
app.use('/manage', require('./routes/genpass'));


//Upload route
app.post('/upload', upload.single('csv'), (req, res) => {
  try {
    req.flash('success_msg', 'File uploaded Successfully !');
    res.redirect('/manage/loadcsv');
  } catch (error) {
    console.error(error);
  }
});
const PORT = process.env.PORT || 3000;

app.listen(PORT, console.log(`Server started on port ${PORT}`));
