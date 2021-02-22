require('dotenv').config();
const express = require('express');
const layouts = require('express-ejs-layouts');
const session = require('express-session');
const passport = require('./config/ppConfig'); //
const flash = require('connect-flash');
const multer = require('multer')
const cloudinary = require('cloudinary')
const db = require('./models')
const methodOverride = require('method-override')



//uploader for images, make a uploads folder
const uploads = multer({dest: './uploads'})

const app = express();
app.set('view engine', 'ejs');

// Session 
const SECRET_SESSION = process.env.SECRET_SESSION;
const isLoggedIn = require('./middleware/isLoggedIn');
const { response } = require('express');
const user = require('./models/user');
const { post } = require('./controllers/auth');

// MIDDLEWARE
app.use(require('morgan')('dev'));
app.use(express.urlencoded({ extended: false }));//access req.body
app.use(express.static(__dirname + '/public'));
app.use(layouts);
app.use(methodOverride('_method'))


// Session Middleware

// secret: What we actually will be giving the user on our site as a session cookie
// resave: Save the session even if it's modified, make this false
// saveUninitialized: If we have a new session, we save it, therefore making that true

const sessionObject = {
  secret: SECRET_SESSION,
  resave: false,
  saveUninitialized: true
}
app.use(session(sessionObject));
// Passport
app.use(passport.initialize()); // Initialize passport
app.use(passport.session()); // Add a session
// Flash 
app.use(flash());
app.use((req, res, next) => {
  console.log(res.locals);
  res.locals.alerts = req.flash();
  res.locals.currentUser = req.user;
  next();
});

// Controllers
app.use('/auth', require('./controllers/auth'));


app.get('/', (req, res) => {
  res.render('index');
});

app.get('/profile', isLoggedIn, (req, res) => {
  const { id, name, email } = req.user.get();
  req.user.getPosts()
    .then(allPosts =>{
      console.log(allPosts)
      res.render('profile', { allPosts: allPosts,id, name, email});
        console.log(allPosts)
    })
})

 
 
app.get('/newsFeed', isLoggedIn, (req, res) => {
  db.post.findAll({
    include: [db.user]
  })
  .then(postArray =>{
    console.log(postArray[0])
    res.render('newsFeed', {posts: postArray});
  })
});
    

 
//first we have to upload the file into the folder then we have access to the file
app.post('/newsFeed', uploads.single('inputFile'), (req, res) =>{//pass in the uploads folder//allows us to bring in a single file
  //greab uploaded file
  const image = req.file.path
  console.log(image)//should show in terminal upload
  //upload to image to cloudinary
  cloudinary.uploader.upload(image, (result) =>{//first parameter is the file// next one is what happens after file uploaded//we are getting back a result
      console.log(result)//result comeback from cloudinary//should get an object back in terminal//I get the url inside the object
      db.post.create({
       nameOfTruck: req.body.nameOfTruck,
       city: req.body.city,
       description: req.body.description,
       img: result.url,
       
      })
      .then(newPost =>{
        req.user.addPost(newPost)
        console.log(req.user)
        res.redirect('newsFeed')
      })
    })


})

app.delete('/profile/:index', async(req, res) => {
  try {
    await db.post.destroy({
      where: {
        id: req.params.index
      }
    })
    res.redirect('/profile');
  } catch(e) {
    console.log(e.message)
  }
})





const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🎧 You're listening to the smooth sounds of port ${PORT} 🎧`);
});

module.exports = server;




