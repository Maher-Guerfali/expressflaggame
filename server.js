const express = require('express');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const app = express();
const port = 3000;

app.use(express.json());

// Dummy database for players
let players = [];
let resetTokens = [];

// Email transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com',
        pass: 'your-email-password'
    }
});

// Route for player registration
app.post('/register', async (req, res) => {
    const { email, username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const player = { email, username, password: hashedPassword };
    players.push(player);
    res.status(201).send('Player registered successfully!');
});

// Route for player login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const player = players.find(p => p.email === email);

    if (player && await bcrypt.compare(password, player.password)) {
        res.status(200).send('Login successful!');
    } else {
        res.status(401).send('Invalid credentials!');
    }
});

// Route for requesting password reset
app.post('/request-password-reset', (req, res) => {
    const { email } = req.body;
    const player = players.find(p => p.email === email);

    if (player) {
        const token = uuidv4();
        resetTokens.push({ email, token, expires: Date.now() + 3600000 }); // Token expires in 1 hour

        const resetLink = `http://localhost:${port}/reset-password/${token}`;

        transporter.sendMail({
            from: 'your-email@gmail.com',
            to: email,
            subject: 'Password Reset',
            text: `Click this link to reset your password: ${resetLink}`
        });

        res.status(200).send('Password reset link sent!');
    } else {
        res.status(404).send('Email not found!');
    }
});

// Route for resetting password
app.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
    const resetToken = resetTokens.find(t => t.token === token && t.expires > Date.now());

    if (resetToken) {
        const player = players.find(p => p.email === resetToken.email);
        player.password = await bcrypt.hash(password, 10);
        resetTokens = resetTokens.filter(t => t.token !== token);
        res.status(200).send('Password reset successfully!');
    } else {
        res.status(400).send('Invalid or expired token!');
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
