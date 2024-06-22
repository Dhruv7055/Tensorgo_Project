const express = require('express');
const app=express();
const auth = require('./routes/auth');

app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/');
  });

app.post('/feedback', (req, res) => {
  const feedback = new Feedback({
    user: req.user.id,
    category: req.body.category,
    rating: req.body.rating,
    comments: req.body.comments,
  });

  feedback.save().then(async (result) => {
    // Post to Frill.co
    await axios.post(`https://api.frill.co/v2/boards/${process.env.FRILL_BOARD_ID}/feedbacks`, {
      content: req.body.comments,
      category: req.body.category,
      rating: req.body.rating,
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.FRILL_API_KEY}`,
      }
    });

    res.status(201).send(result);
  }).catch(err => res.status(400).send(err));
});

app.get('/feedback', (req, res) => {
  Feedback.aggregate([
    { $group: { _id: "$category", avgRating: { $avg: "$rating" }, comments: { $push: "$comments" } } }
  ]).then(results => res.send(results))
    .catch(err => res.status(400).send(err));
});
