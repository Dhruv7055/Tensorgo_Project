const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const axios = require('axios');
const bodyParser = require('body-parser');
const auth = require('./routes/auth');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
mongoose.connect('mongodb://localhost:27017/mydatabase');


// Passport setup
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, (token, tokenSecret, profile, done) => {
  done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

app.use(session({ secret: 'secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// User authentication
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
  res.redirect('/');
});

// Feedback Schema
const feedbackSchema = new mongoose.Schema({
  category: String,
  rating: Number,
  comments: String,
  user: Object
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

// Feedback submission
app.post('/feedback', (req, res) => {
  const feedback = new Feedback({ ...req.body, user: req.user });
  feedback.save().then(() => {
    axios.post('https://api.frill.co/v1/feedbacks', feedback, {
      headers: {
        'Authorization': `Bearer ${process.env.FRILL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })
    .then(() => res.json({ message: 'Feedback submitted and synced with Frill.co' }))
    .catch(err => res.status(500).json({ message: 'Error syncing with Frill.co', error: err.message }));
  });
});

// Aggregated feedback retrieval
app.get('/feedback/:category', (req, res) => {
  Feedback.find({ category: req.params.category }).then(feedbacks => res.json(feedbacks));
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
