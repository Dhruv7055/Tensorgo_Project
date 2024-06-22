// src/App.jsx
import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

function App() {
  const [user, setUser] = useState(null);
  const [feedback, setFeedback] = useState({ category: '', rating: '', comments: '' });
  const [feedbackData, setFeedbackData] = useState({});

  const handleLoginSuccess = (response) => {
    setUser(response.profileObj);
    axios.post.cors('/auth/google', { token: response.credential }).then(res => console.log(res));
  };

  const handleLoginFailure = (response) => {
    console.log('Login failed:', response);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFeedback(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('/feedback', feedback).then(res => {
      console.log(res.data);
    });
  };

  useEffect(() => {
    axios.get('/feedback/Product Features').then(res => {
      setFeedbackData(prevState => ({ ...prevState, 'Product Features': res.data }));
    });
    axios.get('/feedback/Product Pricing').then(res => {
      setFeedbackData(prevState => ({ ...prevState, 'Product Pricing': res.data }));
    });
    axios.get('/feedback/Product Usability').then(res => {
      setFeedbackData(prevState => ({ ...prevState, 'Product Usability': res.data }));
    });
  }, []);

  return (
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
      <div>
        <h1>Customer Feedback Platform</h1>
        {!user ? (
          <GoogleLogin
            onSuccess={handleLoginSuccess}
            onError={handleLoginFailure}
          />
        ) : (
          <div>
            <form onSubmit={handleSubmit}>
              <select name="category" onChange={handleChange}>
                <option value="Product Features">Product Features</option>
                <option value="Product Pricing">Product Pricing</option>
                <option value="Product Usability">Product Usability</option>
              </select>
              <input type="number" name="rating" onChange={handleChange} />
              <textarea name="comments" onChange={handleChange}></textarea>
              <button type="submit">Submit Feedback</button>
            </form>
            <div>
              <h2>Aggregated Feedback</h2>
              {Object.keys(feedbackData).map(key => (
                <div key={key}>
                  <h3>{key}</h3>
                  <ul>
                    {feedbackData[key].map((item, index) => (
                      <li key={index}>{item.comments} - {item.rating}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
