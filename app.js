var express = require("express"),
    mongoose = require("mongoose"),
    bodyParser = require("body-parser"),
    methodOverride = require("method-override"),
    // for authentication
    passport = require("passport"),
    LocalStrategy = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose"),
    methodOverride = require("method-override");

    // FOR SCHEMAS
    User = require("./models/user");
var app = express();

app.set("view engine", "ejs");
// serve css files from public
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride('_method'));
// MOMENT JS
app.locals.moment = require('moment');

// METHOD OVERRIDE FOR PUT AND DELETE REQUESTS
// we do this to follow the RESTful ROUTES and CRUD pattern
app.use(methodOverride("_method"));

// Connect database
mongoose.connect("mongodb://james:james1@ds147684.mlab.com:47684/health-app", {useNewUrlParser: true});

// secret helps encode and decode the session for authentication
app.use(require("express-session")({
    secret: "mental health app for hackathon",
    resave: false,
    saveUninitialized: false
}));
// you need the below two lines when you want to use passport
app.use(passport.initialize());
app.use(passport.session());
// using the serialize and deserialize as defined by passport
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
passport.use(new LocalStrategy(User.authenticate()));

// GET CURRENT USER
app.use(function(req, res, next){
  res.locals.currentUser = req.user;
  next();
});

// CATEGORY SCHEMA
var categorySchema = new mongoose.Schema({
  title: String,
  image: String,
  members: String,
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post"
    }
  ]
});
var Category = mongoose.model("Category", categorySchema);

// POST SCHEMA
var postSchema = new mongoose.Schema({
  title: String,
  body: String,
  image: String,
  created: {
    type: Date, default: Date.now
  },
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment"
    }
  ],
  author: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    username: String,
    profilePicture: String
  }
});
var Post = mongoose.model("Post", postSchema);

// COMMENTS SCHEMA
var commentSchema = mongoose.Schema({
  text: String,
  created: {
    type: Date,
    default: Date.now
  },
  author: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    username: String,
    profilePicture: String
  }
});
var Comment = mongoose.model("Comment", commentSchema);

// ROUTES
app.get("/", function(req, res){
  res.redirect("home");
});

// RESTFUL ROUTES
// INDEX
app.get("/home", function(req, res){
  Category.find({}, function(err, categories){
    if(err){
      res.redirect("home");
    } else {
      res.render("homePage", {categories: categories});
    }
  });
});

// NEW ROUTE
app.get("/home/new", function(req, res){
  res.render("new");
});

// CREATE ROUTE
app.post("/home", function(req, res){
  Category.create(req.body.category, function(err, newCategory){
    if(err){
      res.render("new");
    } else {
      res.redirect("/home");
    }
  });
});

// SHOW ROUTE
app.get("/home/:id", function(req, res){
  Category.findById(req.params.id).populate("posts").exec(function(err, currCategory){
    if(err){
      res.redirect("/home");
    } else {
      res.render("show", {category: currCategory});
    }
  });
});

// ROUTES FOR CREATING A POST WITHIN A CATEGORY
app.get("/:id/new", function(req, res){
  Category.findById(req.params.id, function(err, currCategory){
    res.render("newPost", {category: currCategory});
  });
});

// POST ROUTE
app.post("/home/:id", function(req, res){
  Category.findById(req.params.id, function(err, category){
    if(err){
      console.log(err);
    } else {
      Post.create(req.body.post, function(err, post){
        if(err){
          console.log(err);
        } else {
          post.author.id = req.user._id;
          post.author.username = req.user.username;
          post.author.profilePicture = req.user.profilePicture;
          post.save();
          category.posts.push(post);
          category.save();
          res.redirect("/home/" + category._id);
        }
      });
    }
  });
});

// AUTH ROUTES
// show sign up form
app.get("/register", function(req, res){
  res.render("register");
});

// handling user sign up
app.post("/register", function(req, res){
  var temp = [
    "https://i.imgur.com/s11FC6a.jpg",
    "https://i.imgur.com/yRL2B75.jpg",
    "https://i.imgur.com/a8x9yNn.jpg",
    "https://i.imgur.com/fbI8YX3.jpg",
    "https://i.imgur.com/doWmlMF.jpg",
    "https://i.imgur.com/jqQbMwv.jpg",
    "https://i.imgur.com/9SV8l8J.jpg",
    "https://i.imgur.com/E3IVuYR.jpg",
    "https://i.imgur.com/p5LMaNO.jpg",
    "https://i.imgur.com/LSxrKkC.jpg",
    "https://i.imgur.com/ZsU18RH.jpg",
    "https://i.imgur.com/jz62sV0.jpg",
    "https://i.imgur.com/y0sVg20.jpg",
    "https://i.imgur.com/3vdlodF.jpg",
    "https://i.imgur.com/8Y9w8K8.jpg",
    "https://i.imgur.com/diyedJ9.jpg",
    "https://i.imgur.com/PZRZJ91.jpg",
    "https://i.imgur.com/0IvBke6.jpg",
    "https://i.imgur.com/IpKxyzP.jpg",
    "https://i.imgur.com/P2un1WU.jpg",
    "https://i.imgur.com/G1zStbw.jpg",
    "https://i.imgur.com/sRUc4h2.jpg"
  ];
  var num = Math.floor((Math.random() * (temp.length - 1)));
  var newUser = new User({
    username: req.body.username,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    profilePicture: temp[num]
  });
  User.register(newUser, req.body.password, function(err, user){
    if(err){
      console.log(err);
      return res.render("register");
    }
    passport.authenticate("local")(req, res, function(){
      res.redirect("/");
    });
  });
});

// LOGIN ROUTES
//render login form
app.get("/login", function(req, res){
  res.render("login");
});

//logout
app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

// login logic
// middleware
app.post("/login", passport.authenticate("local", {
  successRedirect: "/",
  failtureRedirect: "/login"
}), function(req, res){
});

// SHOW POST DETAIL
app.get("/show/:id", function(req, res){
  Post.findById(req.params.id).populate("comments").exec(function(err, post){
    if(err){
      res.redirect("/home");
    } else {
      res.render("showPost", {post: post});
    }
  });
});

// ADD COMMENT TO CURRENT POST
app.post("/show/:id", function(req, res){
  Post.findById(req.params.id, function(err, post){
    if(err){
      console.log(err);
    } else {
      Comment.create(req.body.comment, function(err, comment){
        if(err){
          console.log(err);
        } else {
          comment.author.id = req.user._id;
          comment.author.username = req.user.username;
          comment.author.profilePicture = req.user.profilePicture;
          comment.save();
          post.comments.push(comment);
          post.save();
          res.redirect("/show/" + post._id);
        }
      });
    }
  });
});

// CONTACT COUNSELLORS
app.get("/contact", function(req, res){
  res.render("contact");
});

// CHAT LINK
app.get("/chat", function(req, res){
  res.render("chatbox")
})

// LISTENERS
// HEROKU
app.listen(process.env.PORT || 5000, function(){
  console.log("Heroku server updated.");
});
// LOCALHOST
app.listen(3000, function(){
  console.log("listening on port 3000");
});
