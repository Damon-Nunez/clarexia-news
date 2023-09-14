
const express = require("express");
const app = express();
const cors = require('cors')
const pool = require('./db')
const jwt = require('jsonwebtoken'); 
const cookieParser = require('cookie-parser');
app.use(cookieParser());
require('dotenv').config();
app.use(express.json());
app.use(cors())
const crypto = require('crypto');


function generateRefreshToken() {
  // Generate a random refresh token with 64 bytes (512 bits)
  return crypto.randomBytes(64).toString('hex');
}

//expandable 
const verifyUser = (req, res, next) => {
  const secretKey = process.env.ACCESS_TOKEN_SECRET;
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    return res.status(401).json({ Message: "Authentication failed, no token provided" });
  }

  jwt.verify(accessToken, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ Message: "Authentication failed, invalid token" });
    } else {
      req.name = decoded.userId; // Assuming 'userId' is the correct property name
      next();
    }
  });
};
app.get('/', verifyUser, (req, res) => {
  return res.json({ Message: 'Success', name: req.name });
});

app.get('/logout', (req,res) => {
  res.clearCookie('accessToken');
  return res.json({Message:'Success'})
})





//get all users
app.get("/users",async(req,res)=> {
    try {
        const allUsers = await pool.query("SELECT * FROM users");
        res.json(allUsers.rows);
    }catch(err) {
        console.error(err.message)
    }
})

//clear 


//get a single user
app.get("/users/:id",async(req,res) => {
    const {id} = req.params
    try {
        const user = await pool.query("SELECT * FROM users WHERE user_id = $1", [id])

        res.json(user.rows[0])
    }catch(err) {
        console.error(err.message)
    }
})
//clear

//make a user

app.post("/users", async (req, res) => {
    try {
      const { name, email, password } = req.body;
  
      // Insert the user into the database
      const query = 'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING user_id';
      const result = await pool.query(query, [name, email, password]);
  
      // Generate a JWT access token using the secret key from .env
      const userId = result.rows[0].user_id;
      const secretKey = process.env.ACCESS_TOKEN_SECRET;
      const accessToken = jwt.sign({ userId }, secretKey);
  
      // Generate a refresh token
      const refresh_token = generateRefreshToken(); // You need to implement this function
  
      // Store the refresh token in an HTTP-only cookie
      res.cookie('refresh_token', refresh_token, { httpOnly: true });
  
      // Send both the access token and a message as part of the response
      res.json({ message: "User created and logged in successfully", accessToken });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'An error occurred during user registration' });
    }
  });
  

//clear 

//update a user
app.put("/users/:id",async(req,res) => {
    try {
        const {id} = req.params;
        const {password} = req.body

        const updateUser = await pool.query(
      'UPDATE users SET password = $1 WHERE user_id = $2',
      [password, id]
    );
            res.json("Your password has been updated")

    }   catch(err) {
            console.error(err.message)
        }
    
})

//delete a user

app.delete("/users/:id",async (req,res) => {
    try {
        const {id} = req.params;
        const deleteTodo = await pool.query("DELETE FROM users WHERE user_id = $1", [id])
        res.json("Todo was deleted ")
    }
    catch(err) {
        console.error(err.message)
    }
})

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const sql = 'SELECT * FROM users WHERE email = $1 AND password = $2';
  pool.query(sql, [email, password], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (results.rowCount === 1) {
      // User credentials are valid

      // Generate a JWT access token with the user's ID using the correct secret key
      const userId = results.rows[0].user_id; // Assuming 'user_id' is the user's unique identifier
      const secretKey = process.env.ACCESS_TOKEN_SECRET; // Use the access token secret key
      const accessToken = jwt.sign({ userId }, secretKey);

      // Generate a refresh token (implement this function)
      const refresh_token = generateRefreshToken();

      // Set the access token as an HTTP-only cookie
      res.cookie('accessToken', accessToken, { httpOnly: true });

      // Set the refresh token as an HTTP-only cookie
      res.cookie('refresh_token', refresh_token, { httpOnly: true });

      return res.status(200).json({ message: 'Success', accessToken });
    } else {
      // User credentials are invalid
      return res.status(401).json({ error: 'Authentication failed' });
    }
  });
});

  
  app.post('/token', (req, res) => {
    const refresh_token = req.cookies.token;
    console.log('Received Refresh Token:', refresh_token);
  
    // Verify and decode the refresh token using the correct secret key
    try {
      const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);
      console.log('Decoded Token:', decoded);
  
      const userId = decoded.userId;
  
      // Generate a new access token using the access token secret key
      const secretKey = process.env.ACCESS_TOKEN_SECRET; // Use the access token secret key
      const access_token = jwt.sign({ userId }, secretKey);
  
      res.json({ access_token });
    } catch (error) {
      console.error('Token Verification Error:', error);
      return res.status(403).json({ error: 'Invalid refresh token' });
    }
  });
  
  
  

  
app.listen(5000,() => {
    console.log("Server is listening at port 5000")
});